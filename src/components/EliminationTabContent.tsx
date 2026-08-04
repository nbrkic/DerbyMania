import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../lib/auth-context';
import { supabase } from '../lib/supabase';
import { Dropdown } from './Dropdown';
import { BASKETBALL_SPORT_NAMES } from '../lib/positions';
import { BracketSkeleton } from './Skeleton';
import { ScheduleSection, addMinutesToClock, type ScheduleItem } from './MatchSchedule';

type TournamentInfo = {
  id: string;
  owner_id: string;
  format: string;
  status: string;
  start_time: string | null;
  match_duration_minutes: number;
  period_duration_minutes: number;
  sports: { name: string } | null;
};

type GroupTeam = {
  id: string;
  name: string;
  crest_url: string | null;
  crest_position_x: number;
  crest_position_y: number;
};

type BracketMatch = {
  id: string;
  round: number;
  bracket_slot: number;
  team_a_id: string | null;
  team_b_id: string | null;
  team_a_goals: number;
  team_b_goals: number;
  status: 'pending' | 'in_progress' | 'finished';
  is_bye: boolean;
  winner_team_id: string | null;
};

type RosterPlayer = { id: string; full_name: string | null };

type MatchEventType = 'assist' | 'save' | 'yellow_card' | 'red_card' | 'rebound';
type MatchEvent = { id: string; match_id: string; team_id: string; player_id: string; event_type: MatchEventType };

function eventTypeLabel(type: MatchEventType) {
  if (type === 'assist') return 'Asistencija';
  if (type === 'save') return 'Odbrana';
  if (type === 'yellow_card') return 'Žuti karton';
  if (type === 'rebound') return 'Skok';
  return 'Crveni karton';
}

type TimelineEntryKind = 'goal' | MatchEventType;

type TimelineEntry = {
  id: string;
  team_id: string;
  playerName: string;
  kind: TimelineEntryKind;
  points: number;
  created_at: string;
};

function nextPowerOfTwo(n: number) {
  let p = 1;
  while (p < n) p *= 2;
  return p;
}

function standardBracketOrder(size: number): number[] {
  let order = [1, 2];
  while (order.length < size) {
    const n = order.length * 2 + 1;
    const next: number[] = [];
    for (const seed of order) next.push(seed, n - seed);
    order = next;
  }
  return order;
}

function roundLabel(round: number, totalRounds: number) {
  const fromEnd = totalRounds - round;
  if (fromEnd === 0) return 'Finale';
  if (fromEnd === 1) return 'Polufinale';
  if (fromEnd === 2) return 'Četvrtfinale';
  if (fromEnd === 3) return 'Osmina finala';
  if (fromEnd === 4) return 'Šesnaestina finala';
  return `Runda ${round}`;
}

function BallIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5 8.2 10.2l1.5 4.5h4.6l1.5-4.5Z" strokeLinejoin="round" />
      <path d="M12 3v4.5M6.2 8l2 2.2M17.8 8l-2 2.2M9.7 14.7 8 19M14.3 14.7 16 19" strokeLinecap="round" />
    </svg>
  );
}

function BasketballIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3v18M3 12h18" />
      <path d="M5.3 5.3c2.4 2.4 2.4 11 0 13.4M18.7 5.3c-2.4 2.4-2.4 11 0 13.4" />
    </svg>
  );
}

function AssistIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M4 16c4-6 8-8 12-8" />
      <path d="M12 5l4 3-4 3" />
    </svg>
  );
}

function GloveIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M7 11V6a2 2 0 1 1 4 0v4" />
      <path d="M11 10V5a2 2 0 1 1 4 0v5" />
      <path d="M15 10.5V7a2 2 0 1 1 4 0v7c0 3.3-2.7 6-6 6h-2c-2.8 0-5-2.2-5-5v-3.5c0-.9.7-1.6 1.6-1.6.9 0 1.4.7 1.4 1.6" />
    </svg>
  );
}

function CardIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className}>
      <rect x="6" y="3" width="12" height="18" rx="1.5" fill="currentColor" />
    </svg>
  );
}

function ReboundIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M4 8h16" />
      <path d="M8 15l4-7 4 7" />
    </svg>
  );
}

function TeamBadge({ team, className }: { team: GroupTeam; className?: string }) {
  return (
    <div className={className ?? 'w-6 h-6 rounded-full overflow-hidden bg-ink-700 ring-1 ring-red-500/30 shrink-0 flex items-center justify-center'}>
      {team.crest_url ? (
        <img src={team.crest_url} alt="" className="w-full h-full object-cover" style={{ objectPosition: `${team.crest_position_x}% ${team.crest_position_y}%` }} />
      ) : (
        <span className="font-display text-paper-500">{team.name[0]?.toUpperCase()}</span>
      )}
    </div>
  );
}

function EventPicker({ roster, onPick, idPrefix, icon, placeholder, accentClass }: {
  roster: RosterPlayer[];
  onPick: (playerId: string) => void | Promise<void>;
  idPrefix: string;
  icon: ReactNode;
  placeholder: string;
  accentClass: string;
}) {
  const [selectedId, setSelectedId] = useState('');
  if (!roster.length) return null;
  return (
    <div className="w-full max-w-[10.5rem] mt-1.5 relative">
      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none">{icon}</span>
      <Dropdown
        id={idPrefix}
        value={selectedId}
        onChange={(playerId) => { onPick(playerId); setSelectedId(''); }}
        placeholder={placeholder}
        options={roster.map((p) => ({ value: p.id, label: p.full_name || 'Igrač' }))}
        triggerClassName={`w-full pl-8 pr-3 py-1.5 text-[11px] uppercase tracking-widest border ${accentClass} transition-colors flex items-center justify-between gap-2 overflow-hidden`}
      />
    </div>
  );
}

function timelineEntryIcon(kind: TimelineEntryKind, isBasketball: boolean) {
  if (kind === 'goal') return isBasketball ? <BasketballIcon className="w-3.5 h-3.5 text-red-400 shrink-0" /> : <BallIcon className="w-3.5 h-3.5 text-red-400 shrink-0" />;
  if (kind === 'assist') return <AssistIcon className="w-3.5 h-3.5 text-paper-400 shrink-0" />;
  if (kind === 'save') return <GloveIcon className="w-3.5 h-3.5 text-paper-400 shrink-0" />;
  if (kind === 'rebound') return <ReboundIcon className="w-3.5 h-3.5 text-paper-400 shrink-0" />;
  if (kind === 'yellow_card') return <CardIcon className="w-3 h-3.5 text-yellow-400 shrink-0" />;
  return <CardIcon className="w-3 h-3.5 text-red-400 shrink-0" />;
}

function timelineEntryLabel(entry: TimelineEntry, isBasketball: boolean) {
  if (entry.kind === 'goal') {
    if (isBasketball) return `${entry.points} ${entry.points === 1 ? 'poen' : 'poena'}`;
    return 'Gol';
  }
  return eventTypeLabel(entry.kind);
}

function MatchTimeline({ entries, loading, teamA, teamB, isBasketball }: {
  entries: TimelineEntry[]; loading: boolean; teamA: GroupTeam; teamB: GroupTeam; isBasketball: boolean;
}) {
  if (loading) return <p className="text-xs text-paper-500 px-5 py-4">Učitavanje…</p>;
  if (!entries.length) return <p className="text-xs text-paper-500 px-5 py-4">Nema zabeleženih dešavanja na ovoj utakmici.</p>;
  return (
    <div className="flex flex-col divide-y divide-ink-800">
      {entries.map((entry) => {
        const team = entry.team_id === teamA.id ? teamA : teamB;
        return (
          <div key={entry.id} className="flex items-center gap-2.5 px-5 py-2.5">
            {timelineEntryIcon(entry.kind, isBasketball)}
            <TeamBadge team={team} className="w-5 h-5 rounded-full overflow-hidden bg-ink-700 ring-1 ring-red-500/30 shrink-0 flex items-center justify-center" />
            <span className="text-xs text-paper-100 truncate flex-1 min-w-0">{entry.playerName}</span>
            <span className="text-[10px] uppercase tracking-widest text-paper-500 shrink-0 whitespace-nowrap">{timelineEntryLabel(entry, isBasketball)}</span>
          </div>
        );
      })}
    </div>
  );
}

function TrophyIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M8 4h8v4.5a4 4 0 0 1-4 4 4 4 0 0 1-4-4V4Z" />
      <path d="M8 5H5.5a2 2 0 0 0 0 4H7" />
      <path d="M16 5h2.5a2 2 0 0 1 0 4H17" />
      <path d="M12 12.5V16" />
      <path d="M9.5 20h5" />
      <path d="M10.2 16.5h3.6l.6 3.5h-4.8l.6-3.5Z" />
    </svg>
  );
}

const CONFETTI_COLORS = ['bg-red-400', 'bg-red-300', 'bg-paper-100', 'bg-red-600'];

function ChampionBanner({ champion }: { champion: GroupTeam }) {
  const confetti = useMemo(() =>
    Array.from({ length: 44 }, (_, i) => ({
      id: i, left: Math.random() * 100, delay: Math.random() * 0.7,
      duration: 2 + Math.random() * 1.6, width: 4 + Math.random() * 5,
      height: 8 + Math.random() * 8, rotate: Math.random() * 360,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    })), []);
  return (
    <div className="relative mb-14 overflow-hidden bg-ink-900 border border-red-500/40">
      <div className="absolute inset-0 opacity-[0.07] pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(135deg, var(--paper-100) 0, var(--paper-100) 1px, transparent 1px, transparent 28px)', WebkitMaskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)', maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)' }} />
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {confetti.map((c) => (
          <span key={c.id} className={`confetti-piece absolute top-0 ${c.color}`} style={{ left: `${c.left}%`, width: c.width, height: c.height, animationDelay: `${c.delay}s`, animationDuration: `${c.duration}s`, transform: `rotate(${c.rotate}deg)` }} />
        ))}
      </div>
      <div className="absolute inset-y-0 -left-1/4 w-1/3 bg-paper-100/[0.06] shine-sweep-once pointer-events-none" />
      <div className="relative z-10 text-center px-6 py-14 sm:py-16">
        <span className="text-xs uppercase tracking-[0.3em] text-red-400 font-semibold">Prvak turnira</span>
        <div className="mt-7 flex flex-col items-center gap-5">
          <div className="crown-float"><TrophyIcon className="trophy-pop w-11 h-11 text-red-400" /></div>
          <Link to={`/timovi/${champion.id}`} className="group flex flex-col items-center gap-5">
            <div className="relative w-28 h-28">
              <div className="ring-expand absolute inset-0 rounded-full border-2 border-red-400/70 pointer-events-none" />
              <div className="glow-pulse absolute inset-0 rounded-full pointer-events-none" />
              <TeamBadge team={champion} className="trophy-pop relative w-28 h-28 rounded-full overflow-hidden bg-ink-800 ring-4 ring-red-500/60 flex items-center justify-center font-display text-3xl" />
            </div>
            <h2 className="champion-name-reveal font-display text-3xl sm:text-4xl leading-tight transition-colors group-hover:text-red-400">
              {champion.name}
            </h2>
          </Link>
        </div>
      </div>
    </div>
  );
}

function ScorerPicker({ roster, onPick, idPrefix, isBasketball }: {
  roster: RosterPlayer[];
  onPick: (playerId: string, points: number) => void | Promise<void>;
  idPrefix: string;
  isBasketball: boolean;
}) {
  const [selectedId, setSelectedId] = useState('');
  const [pendingPlayerId, setPendingPlayerId] = useState<string | null>(null);

  if (!roster.length) return <p className="text-[11px] text-paper-700 mt-1">Nema igrača u timu</p>;

  if (isBasketball && pendingPlayerId) {
    const pendingName = roster.find((p) => p.id === pendingPlayerId)?.full_name || 'Igrač';
    return (
      <div className="w-full max-w-[10.5rem] mt-1">
        <p className="text-[10px] text-paper-500 truncate mb-1.5">{pendingName}</p>
        <div className="flex gap-1.5">
          {[1, 2, 3].map((points) => (
            <button key={points} type="button" onClick={() => { onPick(pendingPlayerId, points); setPendingPlayerId(null); }} className="flex-1 py-2 text-xs font-semibold border border-red-500/30 hover:bg-red-500/10 hover:border-red-400/60 transition-colors">+{points}</button>
          ))}
        </div>
        <button type="button" onClick={() => setPendingPlayerId(null)} className="text-[10px] text-paper-700 hover:text-paper-100 transition-colors mt-1.5">Otkaži</button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[10.5rem] mt-1 relative">
      {isBasketball ? <BasketballIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-red-400 pointer-events-none" /> : <BallIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-red-400 pointer-events-none" />}
      <Dropdown
        id={idPrefix}
        value={selectedId}
        onChange={(playerId) => { if (isBasketball) { setPendingPlayerId(playerId); setSelectedId(''); } else { onPick(playerId, 1); setSelectedId(''); } }}
        placeholder={isBasketball ? 'Igrač' : 'Strelac'}
        options={roster.map((p) => ({ value: p.id, label: p.full_name || 'Igrač' }))}
        triggerClassName="w-full pl-8 pr-3 py-2 text-xs uppercase tracking-widest border border-red-500/30 hover:bg-red-500/10 hover:border-red-400/60 transition-colors flex items-center justify-between gap-2 overflow-hidden"
      />
    </div>
  );
}

const ENTRANT_UNIT = 100;
const COLUMN_GAP = 40;
const ENTRANT_WIDTH = 176;
const OUTCOME_WIDTH = 224;

function ConnectorOverlay({ itemCount }: { itemCount: number }) {
  if (itemCount < 2) return null;
  const pairs = itemCount / 2;
  return (
    <div className="absolute top-0 bottom-0 left-full pointer-events-none" style={{ width: COLUMN_GAP }}>
      {Array.from({ length: itemCount }, (_, i) => (
        <div key={`h-${i}`} className="absolute h-px bg-red-500/40" style={{ left: 0, width: COLUMN_GAP / 2, top: `${((i + 0.5) / itemCount) * 100}%` }} />
      ))}
      {Array.from({ length: pairs }, (_, k) => (
        <div key={`p-${k}`}>
          <div className="absolute w-px bg-red-500/40" style={{ left: COLUMN_GAP / 2, top: `${((2 * k + 0.5) / itemCount) * 100}%`, height: `${(1 / itemCount) * 100}%` }} />
          <div className="absolute h-px bg-red-500/40" style={{ left: COLUMN_GAP / 2, width: COLUMN_GAP / 2, top: `${((2 * k + 1) / itemCount) * 100}%` }} />
        </div>
      ))}
    </div>
  );
}

function BracketOutcomeBox({ match, teamsById, isOwner, onStart }: {
  match: BracketMatch; teamsById: Map<string, GroupTeam>; isOwner: boolean; onStart: (matchId: string) => void;
}) {
  const teamA = match.team_a_id ? teamsById.get(match.team_a_id) : null;
  const teamB = match.team_b_id ? teamsById.get(match.team_b_id) : null;
  const winner = match.winner_team_id ? teamsById.get(match.winner_team_id) : null;

  if (match.status === 'finished' && match.is_bye && winner) {
    return (
      <div className="w-full bg-ink-900 border border-ink-700 border-l-2 border-l-red-500/50 px-3 py-2">
        <Link to={`/timovi/${winner.id}`} className="group flex items-center gap-2 min-w-0">
          <TeamBadge team={winner} className="w-7 h-7 rounded-full overflow-hidden bg-ink-800 ring-1 ring-red-500/30 shrink-0 flex items-center justify-center" />
          <span className="text-sm text-paper-100 font-semibold truncate transition-colors group-hover:text-red-400">{winner.name}</span>
        </Link>
        <p className="text-[11px] text-paper-500 mt-1 pl-9">Slobodan prolaz</p>
      </div>
    );
  }

  if (match.status === 'finished' && teamA && teamB) {
    return (
      <div className="w-full bg-ink-900 border border-ink-700 border-l-2 border-l-red-500/50">
        <div className="divide-y divide-ink-700">
          <div className="flex items-center justify-between gap-2 min-w-0 px-3 py-2">
            <Link to={`/timovi/${teamA.id}`} className="group flex items-center gap-1.5 min-w-0 flex-1">
              <TeamBadge team={teamA} className="w-6 h-6 rounded-full overflow-hidden bg-ink-800 ring-1 ring-red-500/30 shrink-0 flex items-center justify-center" />
              <span className={`text-xs truncate transition-colors group-hover:text-red-400 ${match.winner_team_id === teamA.id ? 'text-paper-100 font-semibold' : 'text-paper-500'}`}>{teamA.name}</span>
            </Link>
            <div className="flex items-center border-l border-ink-700 pl-2 ml-1">
              <span className={`font-display text-sm shrink-0 ${match.winner_team_id === teamA.id ? 'text-paper-100' : 'text-paper-500'}`}>{match.team_a_goals}</span>
            </div>
          </div>
          <div className="flex items-center justify-between gap-2 min-w-0 px-3 py-2">
            <Link to={`/timovi/${teamB.id}`} className="group flex items-center gap-1.5 min-w-0 flex-1">
              <TeamBadge team={teamB} className="w-6 h-6 rounded-full overflow-hidden bg-ink-800 ring-1 ring-red-500/30 shrink-0 flex items-center justify-center" />
              <span className={`text-xs truncate transition-colors group-hover:text-red-400 ${match.winner_team_id === teamB.id ? 'text-paper-100 font-semibold' : 'text-paper-500'}`}>{teamB.name}</span>
            </Link>
            <div className="flex items-center border-l border-ink-700 pl-2 ml-1">
              <span className={`font-display text-sm shrink-0 ${match.winner_team_id === teamB.id ? 'text-paper-100' : 'text-paper-500'}`}>{match.team_b_goals}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-ink-900 border border-ink-700">
      <div className="divide-y divide-ink-700">
        <div className="flex items-center justify-between gap-2 min-w-0 px-3 py-2">
          {teamA ? (
            <Link to={`/timovi/${teamA.id}`} className="group flex items-center gap-1.5 min-w-0 flex-1">
              <TeamBadge team={teamA} className="w-6 h-6 rounded-full overflow-hidden bg-ink-800 ring-1 ring-red-500/30 shrink-0 flex items-center justify-center" />
              <span className="text-xs text-paper-100 truncate transition-colors group-hover:text-red-400">{teamA.name}</span>
            </Link>
          ) : <div className="flex items-center min-w-0 flex-1"><span className="text-xs text-paper-700">TBD</span></div>}
          {match.status === 'in_progress' && <div className="flex items-center border-l border-ink-700 pl-2 ml-1"><span className="text-xs font-display shrink-0">{match.team_a_goals}</span></div>}
        </div>
        <div className="flex items-center justify-between gap-2 min-w-0 px-3 py-2">
          {teamB ? (
            <Link to={`/timovi/${teamB.id}`} className="group flex items-center gap-1.5 min-w-0 flex-1">
              <TeamBadge team={teamB} className="w-6 h-6 rounded-full overflow-hidden bg-ink-800 ring-1 ring-red-500/30 shrink-0 flex items-center justify-center" />
              <span className="text-xs text-paper-100 truncate transition-colors group-hover:text-red-400">{teamB.name}</span>
            </Link>
          ) : <div className="flex items-center min-w-0 flex-1"><span className="text-xs text-paper-700">TBD</span></div>}
          {match.status === 'in_progress' && <div className="flex items-center border-l border-ink-700 pl-2 ml-1"><span className="text-xs font-display shrink-0">{match.team_b_goals}</span></div>}
        </div>
      </div>
      {isOwner && match.status === 'pending' && teamA && teamB && (
        <div className="px-3 pt-2 pb-2">
          <button type="button" onClick={() => onStart(match.id)} className="btn-solid w-full px-3 py-1.5 text-[10px] uppercase tracking-widest">Počni utakmicu</button>
        </div>
      )}
    </div>
  );
}

function BracketTree({ totalRounds, matchesByRound, teamsById, isOwner, onStart }: {
  totalRounds: number; matchesByRound: Map<number, BracketMatch[]>; teamsById: Map<string, GroupTeam>; isOwner: boolean; onStart: (matchId: string) => void;
}) {
  const round1Matches = (matchesByRound.get(1) ?? []).slice().sort((a, b) => a.bracket_slot - b.bracket_slot);
  const entrants: (GroupTeam | null)[] = [];
  round1Matches.forEach((m) => {
    entrants.push(m.team_a_id ? teamsById.get(m.team_a_id) ?? null : null);
    entrants.push(m.team_b_id ? teamsById.get(m.team_b_id) ?? null : null);
  });
  const totalHeight = entrants.length * ENTRANT_UNIT;
  const rounds = Array.from({ length: totalRounds }, (_, i) => i + 1);
  return (
    <div className="overflow-x-auto pb-4">
      <div style={{ width: 'max-content' }}>
        <div className="flex mb-4">
          <div style={{ width: ENTRANT_WIDTH }} className="text-center"><span className="text-[10px] uppercase tracking-widest text-paper-500">Učesnici</span></div>
          {rounds.map((round) => (
            <div key={round} style={{ width: OUTCOME_WIDTH, marginLeft: COLUMN_GAP }} className="text-center">
              <span className="text-[10px] uppercase tracking-widest text-red-400 font-semibold">{roundLabel(round, totalRounds)}</span>
            </div>
          ))}
        </div>
        <div className="flex">
          <div className="relative flex flex-col" style={{ height: totalHeight, width: ENTRANT_WIDTH }}>
            {entrants.map((team, i) => (
              <div key={i} className="flex-1 flex items-center px-1">
                <div className="w-full flex items-center gap-2 bg-ink-800 border border-ink-700 px-2.5 py-1.5 min-w-0">
                  {team ? (
                    <Link to={`/timovi/${team.id}`} className="group flex items-center gap-2 min-w-0">
                      <TeamBadge team={team} className="w-6 h-6 rounded-full overflow-hidden bg-ink-700 ring-1 ring-red-500/30 shrink-0 flex items-center justify-center" />
                      <span className="text-xs text-paper-100 truncate transition-colors group-hover:text-red-400">{team.name}</span>
                    </Link>
                  ) : <span className="text-xs text-paper-700">—</span>}
                </div>
              </div>
            ))}
            <ConnectorOverlay itemCount={entrants.length} />
          </div>
          {rounds.map((round) => {
            const matches = (matchesByRound.get(round) ?? []).slice().sort((a, b) => a.bracket_slot - b.bracket_slot);
            const isLast = round === totalRounds;
            return (
              <div key={round} className="relative flex flex-col" style={{ height: totalHeight, width: OUTCOME_WIDTH, marginLeft: COLUMN_GAP }}>
                {matches.map((m) => (
                  <div key={m.id} className="flex-1 flex items-center px-1">
                    <BracketOutcomeBox match={m} teamsById={teamsById} isOwner={isOwner} onStart={onStart} />
                  </div>
                ))}
                {!isLast && <ConnectorOverlay itemCount={matches.length} />}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function LiveMatchCard({ match, teamA, teamB, roundText, isOwner, rosterA, rosterB, isBasketball, events, finishError, onAddGoal, onFinishMatch, onAddEvent, onUndoLast }: {
  match: BracketMatch; teamA: GroupTeam; teamB: GroupTeam; roundText: string;
  isOwner: boolean; rosterA: RosterPlayer[]; rosterB: RosterPlayer[]; isBasketball: boolean;
  events: MatchEvent[]; finishError: string | null;
  onAddGoal: (matchId: string, side: 'a' | 'b', teamId: string, playerId: string, points: number) => void;
  onFinishMatch: (matchId: string) => void;
  onAddEvent: (matchId: string, teamId: string, playerId: string, eventType: MatchEventType) => void;
  onUndoLast: (matchId: string) => void;
}) {
  const rosterById = new Map([...rosterA, ...rosterB].map((p) => [p.id, p]));
  const hasEntries = match.team_a_goals > 0 || match.team_b_goals > 0 || events.length > 0;
  return (
    <div className="relative bg-ink-900 border border-red-500/40 overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-red-500 to-transparent" />
      <div className="px-6 py-6">
        <div className="flex items-center justify-center gap-2 mb-5">
          <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" /><span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" /></span>
          <span className="text-[11px] uppercase tracking-widest text-red-400 font-semibold">Uživo · {roundText}</span>
        </div>
        <div className="flex items-start sm:items-center justify-between gap-3 sm:gap-6">
          <div className="flex flex-col items-center gap-2 flex-1 min-w-0">
            <Link to={`/timovi/${teamA.id}`} className="group flex flex-col items-center gap-2">
              <TeamBadge team={teamA} className="w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden bg-ink-800 ring-2 ring-red-500/30 flex items-center justify-center shrink-0 font-display text-xl" />
              <span className="text-sm text-paper-100 text-center truncate max-w-full transition-colors group-hover:text-red-400">{teamA.name}</span>
            </Link>
            {isOwner && (
              <>
                <ScorerPicker idPrefix={`b-scorer-a-${match.id}`} roster={rosterA} isBasketball={isBasketball} onPick={(playerId, points) => onAddGoal(match.id, 'a', teamA.id, playerId, points)} />
                <EventPicker idPrefix={`b-assist-a-${match.id}`} roster={rosterA} icon={<AssistIcon className="w-3.5 h-3.5 text-paper-400" />} placeholder="Asistencija" accentClass="border-paper-500/30 text-paper-400 hover:bg-ink-800 hover:border-paper-400/50" onPick={(playerId) => onAddEvent(match.id, teamA.id, playerId, 'assist')} />
                {isBasketball && <EventPicker idPrefix={`b-rebound-a-${match.id}`} roster={rosterA} icon={<ReboundIcon className="w-3.5 h-3.5 text-paper-400" />} placeholder="Skok" accentClass="border-paper-500/30 text-paper-400 hover:bg-ink-800 hover:border-paper-400/50" onPick={(playerId) => onAddEvent(match.id, teamA.id, playerId, 'rebound')} />}
                {!isBasketball && (
                  <>
                    <EventPicker idPrefix={`b-save-a-${match.id}`} roster={rosterA} icon={<GloveIcon className="w-3.5 h-3.5 text-paper-400" />} placeholder="Odbrana" accentClass="border-paper-500/30 text-paper-400 hover:bg-ink-800 hover:border-paper-400/50" onPick={(playerId) => onAddEvent(match.id, teamA.id, playerId, 'save')} />
                    <EventPicker idPrefix={`b-yellow-a-${match.id}`} roster={rosterA} icon={<CardIcon className="w-3 h-3.5 text-yellow-400" />} placeholder="Žuti karton" accentClass="border-yellow-500/40 text-paper-400 hover:bg-yellow-500/10 hover:border-yellow-400/60" onPick={(playerId) => onAddEvent(match.id, teamA.id, playerId, 'yellow_card')} />
                    <EventPicker idPrefix={`b-red-a-${match.id}`} roster={rosterA} icon={<CardIcon className="w-3 h-3.5 text-red-400" />} placeholder="Crveni karton" accentClass="border-red-500/40 text-paper-400 hover:bg-red-500/10 hover:border-red-400/60" onPick={(playerId) => onAddEvent(match.id, teamA.id, playerId, 'red_card')} />
                  </>
                )}
              </>
            )}
          </div>
          <div className="flex items-center gap-2 sm:gap-3 shrink-0 pt-3 sm:pt-0">
            <span className="font-display text-4xl sm:text-5xl leading-none">{match.team_a_goals}</span>
            <span className="font-display text-2xl sm:text-3xl text-paper-700">:</span>
            <span className="font-display text-4xl sm:text-5xl leading-none">{match.team_b_goals}</span>
          </div>
          <div className="flex flex-col items-center gap-2 flex-1 min-w-0">
            <Link to={`/timovi/${teamB.id}`} className="group flex flex-col items-center gap-2">
              <TeamBadge team={teamB} className="w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden bg-ink-800 ring-2 ring-red-500/30 flex items-center justify-center shrink-0 font-display text-xl" />
              <span className="text-sm text-paper-100 text-center truncate max-w-full transition-colors group-hover:text-red-400">{teamB.name}</span>
            </Link>
            {isOwner && (
              <>
                <ScorerPicker idPrefix={`b-scorer-b-${match.id}`} roster={rosterB} isBasketball={isBasketball} onPick={(playerId, points) => onAddGoal(match.id, 'b', teamB.id, playerId, points)} />
                <EventPicker idPrefix={`b-assist-b-${match.id}`} roster={rosterB} icon={<AssistIcon className="w-3.5 h-3.5 text-paper-400" />} placeholder="Asistencija" accentClass="border-paper-500/30 text-paper-400 hover:bg-ink-800 hover:border-paper-400/50" onPick={(playerId) => onAddEvent(match.id, teamB.id, playerId, 'assist')} />
                {isBasketball && <EventPicker idPrefix={`b-rebound-b-${match.id}`} roster={rosterB} icon={<ReboundIcon className="w-3.5 h-3.5 text-paper-400" />} placeholder="Skok" accentClass="border-paper-500/30 text-paper-400 hover:bg-ink-800 hover:border-paper-400/50" onPick={(playerId) => onAddEvent(match.id, teamB.id, playerId, 'rebound')} />}
                {!isBasketball && (
                  <>
                    <EventPicker idPrefix={`b-save-b-${match.id}`} roster={rosterB} icon={<GloveIcon className="w-3.5 h-3.5 text-paper-400" />} placeholder="Odbrana" accentClass="border-paper-500/30 text-paper-400 hover:bg-ink-800 hover:border-paper-400/50" onPick={(playerId) => onAddEvent(match.id, teamB.id, playerId, 'save')} />
                    <EventPicker idPrefix={`b-yellow-b-${match.id}`} roster={rosterB} icon={<CardIcon className="w-3 h-3.5 text-yellow-400" />} placeholder="Žuti karton" accentClass="border-yellow-500/40 text-paper-400 hover:bg-yellow-500/10 hover:border-yellow-400/60" onPick={(playerId) => onAddEvent(match.id, teamB.id, playerId, 'yellow_card')} />
                    <EventPicker idPrefix={`b-red-b-${match.id}`} roster={rosterB} icon={<CardIcon className="w-3 h-3.5 text-red-400" />} placeholder="Crveni karton" accentClass="border-red-500/40 text-paper-400 hover:bg-red-500/10 hover:border-red-400/60" onPick={(playerId) => onAddEvent(match.id, teamB.id, playerId, 'red_card')} />
                  </>
                )}
              </>
            )}
          </div>
        </div>
        {events.length > 0 && (
          <div className="mt-6 pt-5 border-t border-ink-700 flex flex-wrap justify-center gap-2">
            {events.slice().reverse().map((e) => (
              <span key={e.id} className="text-[10px] uppercase tracking-widest text-paper-500 border border-ink-700 px-2 py-1 whitespace-nowrap">
                {rosterById.get(e.player_id)?.full_name || 'Igrač'} · {eventTypeLabel(e.event_type)}
              </span>
            ))}
          </div>
        )}
        {isOwner && (
          <div className="flex flex-col items-center gap-3 mt-6">
            {hasEntries && (
              <button type="button" onClick={() => onUndoLast(match.id)} className="text-[11px] uppercase tracking-widest text-paper-500 hover:text-paper-100 transition-colors">
                Poništi poslednji unos
              </button>
            )}
            <button type="button" onClick={() => onFinishMatch(match.id)} className="btn-solid px-6 py-2.5 text-xs uppercase tracking-widest">Završi utakmicu</button>
            {finishError && <p className="text-xs text-red-400">{finishError}</p>}
          </div>
        )}
      </div>
    </div>
  );
}

function FinishedMatchRow({ match, teamA, teamB, roundText, isBasketball, isExpanded, onToggle, timeline, loadingTimeline }: {
  match: BracketMatch; teamA: GroupTeam; teamB: GroupTeam; roundText: string;
  isBasketball: boolean; isExpanded: boolean; onToggle: () => void;
  timeline: TimelineEntry[]; loadingTimeline: boolean;
}) {
  return (
    <div className="bg-ink-900 border border-ink-700">
      <div
        role="button"
        tabIndex={0}
        onClick={onToggle}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle(); } }}
        className="w-full text-left px-4 py-3 hover:bg-ink-800 transition-colors cursor-pointer"
      >
        <div className="sm:hidden">
          <div className="text-center mb-1.5"><span className="text-[10px] uppercase tracking-widest text-paper-700">{roundText}</span></div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 flex-1 justify-end min-w-0">
              <span className={`truncate text-sm ${match.winner_team_id === teamA.id ? 'text-paper-100 font-semibold' : 'text-paper-500'}`}>{teamA.name}</span>
              <TeamBadge team={teamA} />
            </div>
            <span className="font-display text-base shrink-0 px-2">{match.team_a_goals} : {match.team_b_goals}</span>
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <TeamBadge team={teamB} />
              <span className={`truncate text-sm ${match.winner_team_id === teamB.id ? 'text-paper-100 font-semibold' : 'text-paper-500'}`}>{teamB.name}</span>
            </div>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-3">
          <span className="text-[10px] uppercase tracking-widest text-paper-700 w-16 sm:w-24 shrink-0 truncate">{roundText}</span>
          <div className="flex items-center gap-2 flex-1 justify-end min-w-0">
            <span className={`truncate text-sm ${match.winner_team_id === teamA.id ? 'text-paper-100 font-semibold' : 'text-paper-500'}`}>{teamA.name}</span>
            <TeamBadge team={teamA} />
          </div>
          <span className="font-display text-base shrink-0 px-2">{match.team_a_goals} : {match.team_b_goals}</span>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <TeamBadge team={teamB} />
            <span className={`truncate text-sm ${match.winner_team_id === teamB.id ? 'text-paper-100 font-semibold' : 'text-paper-500'}`}>{teamB.name}</span>
          </div>
        </div>
      </div>
      {isExpanded && (
        <div className="border-t border-ink-700">
          <MatchTimeline entries={timeline} loading={loadingTimeline} teamA={teamA} teamB={teamB} isBasketball={isBasketball} />
        </div>
      )}
    </div>
  );
}

export function EliminationTabContent({
  id,
  tournament,
  onSwitchToGroups,
  onFinished,
}: {
  id: string;
  tournament: TournamentInfo;
  onSwitchToGroups?: () => void;
  onFinished?: () => void;
}) {
  const { user } = useAuth();

  const [teams, setTeams] = useState<GroupTeam[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(true);
  const [bracketMatches, setBracketMatches] = useState<BracketMatch[]>([]);
  const [loadingBracket, setLoadingBracket] = useState(true);
  const [startingMatchId, setStartingMatchId] = useState<string | null>(null);
  const [pendingScrollId, setPendingScrollId] = useState<string | null>(null);
  const [rosters, setRosters] = useState<Map<string, RosterPlayer[]>>(new Map());
  const [finishError, setFinishError] = useState<string | null>(null);
  const [matchEvents, setMatchEvents] = useState<Map<string, MatchEvent[]>>(new Map());
  const fetchedEventMatchIds = useRef(new Set<string>());
  const [expandedMatchId, setExpandedMatchId] = useState<string | null>(null);
  const [matchTimelines, setMatchTimelines] = useState<Map<string, TimelineEntry[]>>(new Map());
  const [loadingTimelineId, setLoadingTimelineId] = useState<string | null>(null);
  const [confirmingDraw, setConfirmingDraw] = useState(false);
  const [drawingBracket, setDrawingBracket] = useState(false);
  const [drawError, setDrawError] = useState<string | null>(null);
  const [groupPhaseMatchCount, setGroupPhaseMatchCount] = useState(0);

  useEffect(() => {
    if (tournament.format !== 'grupe_i_eliminacija') return;
    supabase
      .from('tournament_matches')
      .select('id', { count: 'exact', head: true })
      .eq('tournament_id', id)
      .not('match_order', 'is', null)
      .then(({ count }) => setGroupPhaseMatchCount(count ?? 0));
  }, [id, tournament.format]);

  useEffect(() => {
    async function loadTeams() {
      const { data: participantRows } = await supabase.from('tournament_teams').select('team_id').eq('tournament_id', id);
      const teamIds = (participantRows ?? []).map((p) => p.team_id);
      if (teamIds.length) {
        const { data: teamRows } = await supabase.from('teams').select('id, name, crest_url, crest_position_x, crest_position_y').in('id', teamIds);
        setTeams((teamRows as GroupTeam[]) ?? []);
      }
      setLoadingTeams(false);
    }
    loadTeams();
  }, [id]);

  useEffect(() => {
    supabase
      .from('tournament_bracket_matches')
      .select('id, round, bracket_slot, team_a_id, team_b_id, team_a_goals, team_b_goals, status, is_bye, winner_team_id')
      .eq('tournament_id', id)
      .order('round', { ascending: true })
      .order('bracket_slot', { ascending: true })
      .then(({ data }) => { setBracketMatches((data as BracketMatch[]) ?? []); setLoadingBracket(false); });
  }, [id]);

  const matchIdsRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    matchIdsRef.current = new Set(bracketMatches.map((m) => m.id));
  }, [bracketMatches]);

  useEffect(() => {
    if (!pendingScrollId) return;
    const el = document.getElementById(`match-${pendingScrollId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setPendingScrollId(null);
    }
  }, [bracketMatches, pendingScrollId]);

  useEffect(() => {
    const channel = supabase
      .channel(`tournament-bracket-${id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tournament_bracket_matches', filter: `tournament_id=eq.${id}` },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            const oldId = (payload.old as { id: string }).id;
            setBracketMatches((prev) => prev.filter((m) => m.id !== oldId));
            return;
          }
          const row = payload.new as BracketMatch;
          setBracketMatches((prev) => {
            if (prev.some((m) => m.id === row.id)) return prev.map((m) => (m.id === row.id ? { ...m, ...row } : m));
            return [...prev, row].sort((a, b) => a.round - b.round || a.bracket_slot - b.bracket_slot);
          });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tournament_bracket_events' },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            const old = payload.old as { id: string; match_id?: string };
            if (!old.match_id || !matchIdsRef.current.has(old.match_id)) return;
            setMatchEvents((prev) => {
              const list = prev.get(old.match_id!) ?? [];
              const next = new Map(prev);
              next.set(old.match_id!, list.filter((e) => e.id !== old.id));
              return next;
            });
            return;
          }
          const row = payload.new as MatchEvent;
          if (!matchIdsRef.current.has(row.match_id)) return;
          setMatchEvents((prev) => {
            const list = prev.get(row.match_id) ?? [];
            if (list.some((e) => e.id === row.id)) return prev;
            const next = new Map(prev);
            next.set(row.match_id, [...list, row]);
            return next;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  useEffect(() => {
    const neededTeamIds = new Set<string>();
    bracketMatches.filter((m) => m.status === 'in_progress').forEach((m) => {
      if (m.team_a_id && !rosters.has(m.team_a_id)) neededTeamIds.add(m.team_a_id);
      if (m.team_b_id && !rosters.has(m.team_b_id)) neededTeamIds.add(m.team_b_id);
    });
    if (!neededTeamIds.size) return;
    const ids = [...neededTeamIds];
    async function loadRosters() {
      const { data: memberRows } = await supabase.from('team_members').select('team_id, user_id').in('team_id', ids);
      const userIds = [...new Set((memberRows ?? []).map((r) => r.user_id))];
      const { data: profiles } = userIds.length ? await supabase.from('public_profiles').select('id, full_name').in('id', userIds) : { data: [] as { id: string; full_name: string | null }[] };
      const nameById = new Map((profiles ?? []).map((p) => [p.id, p.full_name]));
      setRosters((prev) => {
        const next = new Map(prev);
        ids.forEach((tid) => { if (!next.has(tid)) next.set(tid, []); });
        (memberRows ?? []).forEach((r) => { const list = next.get(r.team_id) ?? []; list.push({ id: r.user_id, full_name: nameById.get(r.user_id) ?? null }); next.set(r.team_id, list); });
        return next;
      });
    }
    loadRosters();
  }, [bracketMatches, rosters]);

  useEffect(() => {
    const neededMatchIds = new Set<string>();
    bracketMatches.filter((m) => m.status === 'in_progress').forEach((m) => { if (!fetchedEventMatchIds.current.has(m.id)) neededMatchIds.add(m.id); });
    if (!neededMatchIds.size) return;
    const ids = [...neededMatchIds];
    ids.forEach((mid) => fetchedEventMatchIds.current.add(mid));
    supabase.from('tournament_bracket_events').select('id, match_id, team_id, player_id, event_type').in('match_id', ids).then(({ data }) => {
      setMatchEvents((prev) => {
        const next = new Map(prev);
        ids.forEach((mid) => { if (!next.has(mid)) next.set(mid, []); });
        (data as MatchEvent[] | null ?? []).forEach((e) => { const list = next.get(e.match_id) ?? []; list.push(e); next.set(e.match_id, list); });
        return next;
      });
    });
  }, [bracketMatches]);

  const teamsById = new Map(teams.map((t) => [t.id, t]));
  const isOwner = user?.id === tournament.owner_id;
  const bracketExists = bracketMatches.length > 0;
  const isBasketball = !!tournament.sports?.name && BASKETBALL_SPORT_NAMES.includes(tournament.sports.name);

  async function handleStartBracketMatch(matchId: string) {
    if (tournament.status === 'finished') return;
    setStartingMatchId(matchId);
    const { error } = await supabase.from('tournament_bracket_matches').update({ status: 'in_progress' }).eq('id', matchId);
    setStartingMatchId(null);
    if (!error) {
      setBracketMatches((prev) => prev.map((m) => (m.id === matchId ? { ...m, status: 'in_progress' } : m)));
      setPendingScrollId(matchId);
    }
  }

  async function handleAddGoal(matchId: string, side: 'a' | 'b', teamId: string, playerId: string, points: number) {
    const match = bracketMatches.find((m) => m.id === matchId);
    if (!match) return;
    const { error: goalError } = await supabase.from('tournament_bracket_goals').insert({ match_id: matchId, team_id: teamId, player_id: playerId, points });
    if (goalError) return;
    const field = side === 'a' ? 'team_a_goals' : 'team_b_goals';
    const newValue = (side === 'a' ? match.team_a_goals : match.team_b_goals) + points;
    const { error } = await supabase.from('tournament_bracket_matches').update({ [field]: newValue }).eq('id', matchId);
    if (!error) setBracketMatches((prev) => prev.map((m) => (m.id === matchId ? { ...m, [field]: newValue } : m)));
  }

  async function handleFinishBracketMatch(matchId: string) {
    const match = bracketMatches.find((m) => m.id === matchId);
    if (!match) return;
    if (match.team_a_goals === match.team_b_goals) { setFinishError('Meč ne može da se završi nerešeno u eliminacionoj fazi. Podesi rezultat.'); return; }
    setFinishError(null);
    const winnerId = match.team_a_goals > match.team_b_goals ? match.team_a_id : match.team_b_id;
    if (!winnerId) return;
    const { error } = await supabase.from('tournament_bracket_matches').update({ status: 'finished', winner_team_id: winnerId, finished_at: new Date().toISOString() }).eq('id', matchId);
    if (error) return;
    setBracketMatches((prev) => prev.map((m) => (m.id === matchId ? { ...m, status: 'finished', winner_team_id: winnerId } : m)));
    const totalRounds = Math.max(...bracketMatches.map((m) => m.round));
    if (match.round < totalRounds) {
      const nextRound = match.round + 1;
      const nextSlot = Math.floor(match.bracket_slot / 2);
      const field = match.bracket_slot % 2 === 0 ? 'team_a_id' : 'team_b_id';
      const { error: propError } = await supabase.from('tournament_bracket_matches').update({ [field]: winnerId }).eq('tournament_id', id).eq('round', nextRound).eq('bracket_slot', nextSlot);
      if (!propError) setBracketMatches((prev) => prev.map((m) => (m.round === nextRound && m.bracket_slot === nextSlot ? { ...m, [field]: winnerId } : m)));
    } else {
      const { error: finishTournamentError } = await supabase.from('tournaments').update({ status: 'finished' }).eq('id', id);
      if (!finishTournamentError) onFinished?.();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  async function handleAddEvent(matchId: string, teamId: string, playerId: string, eventType: MatchEventType) {
    const { data, error } = await supabase.from('tournament_bracket_events').insert({ match_id: matchId, team_id: teamId, player_id: playerId, event_type: eventType }).select('id, match_id, team_id, player_id, event_type').single();
    if (error || !data) return;
    setMatchEvents((prev) => { const next = new Map(prev); const list = next.get(matchId) ?? []; next.set(matchId, [...list, data as MatchEvent]); return next; });
  }

  async function handleUndoLast(matchId: string) {
    const match = bracketMatches.find((m) => m.id === matchId);
    if (!match) return;

    const [{ data: lastGoal }, { data: lastEvent }] = await Promise.all([
      supabase.from('tournament_bracket_goals').select('id, team_id, points, created_at').eq('match_id', matchId).order('created_at', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('tournament_bracket_events').select('id, match_id, team_id, player_id, event_type, created_at').eq('match_id', matchId).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    ]);

    const goalTime = lastGoal ? new Date(lastGoal.created_at).getTime() : -1;
    const eventTime = lastEvent ? new Date(lastEvent.created_at).getTime() : -1;
    if (goalTime < 0 && eventTime < 0) return;

    if (goalTime >= eventTime) {
      const { error } = await supabase.from('tournament_bracket_goals').delete().eq('id', lastGoal!.id);
      if (error) return;
      const side = lastGoal!.team_id === match.team_a_id ? 'a' : 'b';
      const field = side === 'a' ? 'team_a_goals' : 'team_b_goals';
      const newValue = Math.max(0, (side === 'a' ? match.team_a_goals : match.team_b_goals) - lastGoal!.points);
      const { error: updateError } = await supabase.from('tournament_bracket_matches').update({ [field]: newValue }).eq('id', matchId);
      if (!updateError) setBracketMatches((prev) => prev.map((m) => (m.id === matchId ? { ...m, [field]: newValue } : m)));
    } else {
      const { error } = await supabase.from('tournament_bracket_events').delete().eq('id', lastEvent!.id);
      if (error) return;
      setMatchEvents((prev) => {
        const next = new Map(prev);
        next.set(matchId, (next.get(matchId) ?? []).filter((e) => e.id !== lastEvent!.id));
        return next;
      });
    }
  }

  async function handleToggleMatchDetails(matchId: string) {
    if (expandedMatchId === matchId) { setExpandedMatchId(null); return; }
    setExpandedMatchId(matchId);
    if (matchTimelines.has(matchId)) return;
    setLoadingTimelineId(matchId);
    const [{ data: goalRows }, { data: eventRows }] = await Promise.all([
      supabase.from('tournament_bracket_goals').select('id, team_id, player_id, points, created_at').eq('match_id', matchId),
      supabase.from('tournament_bracket_events').select('id, team_id, player_id, event_type, created_at').eq('match_id', matchId),
    ]);
    const playerIds = [...new Set([...(goalRows ?? []).map((g) => g.player_id), ...(eventRows ?? []).map((e) => e.player_id)])];
    const { data: profiles } = playerIds.length ? await supabase.from('public_profiles').select('id, full_name').in('id', playerIds) : { data: [] as { id: string; full_name: string | null }[] };
    const nameById = new Map((profiles ?? []).map((p) => [p.id, p.full_name]));
    const entries: TimelineEntry[] = [
      ...(goalRows ?? []).map((g) => ({ id: g.id, team_id: g.team_id, playerName: nameById.get(g.player_id) || 'Igrač', kind: 'goal' as TimelineEntryKind, points: g.points, created_at: g.created_at })),
      ...(eventRows ?? []).map((e) => ({ id: e.id, team_id: e.team_id, playerName: nameById.get(e.player_id) || 'Igrač', kind: e.event_type as TimelineEntryKind, points: 0, created_at: e.created_at })),
    ].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    setMatchTimelines((prev) => new Map(prev).set(matchId, entries));
    setLoadingTimelineId(null);
  }

  async function handleSetDraw() {
    if (teams.length < 2) { setDrawError('Potrebna su bar 2 prijavljena tima za žreb.'); return; }
    setDrawingBracket(true);
    setDrawError(null);
    const shuffled = [...teams];
    for (let i = shuffled.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]; }
    const totalTeams = shuffled.length;
    const bracketSize = nextPowerOfTwo(totalTeams);
    const order = standardBracketOrder(bracketSize);
    const slotTeams: (GroupTeam | null)[] = order.map((seed) => (seed <= totalTeams ? shuffled[seed - 1] : null));
    const totalBracketRounds = Math.log2(bracketSize);
    let currentRoundTeams: (GroupTeam | null)[] = slotTeams;
    const rows: { tournament_id: string; round: number; bracket_slot: number; team_a_id: string | null; team_b_id: string | null; status: string; is_bye: boolean; winner_team_id: string | null; finished_at: string | null }[] = [];
    for (let round = 1; round <= totalBracketRounds; round++) {
      const matchCount = currentRoundTeams.length / 2;
      const nextRoundTeams: (GroupTeam | null)[] = [];
      for (let slot = 0; slot < matchCount; slot++) {
        const teamA = currentRoundTeams[slot * 2];
        const teamB = currentRoundTeams[slot * 2 + 1];
        let isBye = false;
        let winner: GroupTeam | null = null;
        if (round === 1) { const bothPresent = !!teamA && !!teamB; isBye = !bothPresent && !!(teamA || teamB); winner = isBye ? teamA ?? teamB ?? null : null; }
        rows.push({ tournament_id: id, round, bracket_slot: slot, team_a_id: teamA?.id ?? null, team_b_id: teamB?.id ?? null, status: isBye ? 'finished' : 'pending', is_bye: isBye, winner_team_id: winner?.id ?? null, finished_at: isBye ? new Date().toISOString() : null });
        nextRoundTeams.push(round === 1 && isBye ? winner : null);
      }
      currentRoundTeams = nextRoundTeams;
    }
    const { data: inserted, error } = await supabase.from('tournament_bracket_matches').insert(rows).select('id, round, bracket_slot, team_a_id, team_b_id, team_a_goals, team_b_goals, status, is_bye, winner_team_id');
    if (error || !inserted) { setDrawingBracket(false); setDrawError('Postavljanje žreba nije uspelo. Pokušaj ponovo.'); return; }
    await supabase.from('tournaments').update({ roster_locked: true }).eq('id', id);
    setDrawingBracket(false);
    setBracketMatches(inserted as BracketMatch[]);
    setConfirmingDraw(false);
  }

  const totalRounds = bracketMatches.length ? Math.max(...bracketMatches.map((m) => m.round)) : 0;
  const matchesByRound = new Map<number, BracketMatch[]>();
  bracketMatches.forEach((m) => { if (!matchesByRound.has(m.round)) matchesByRound.set(m.round, []); matchesByRound.get(m.round)!.push(m); });
  const finalMatch = bracketMatches.find((m) => m.round === totalRounds);
  const champion = finalMatch?.status === 'finished' && finalMatch.winner_team_id ? teamsById.get(finalMatch.winner_team_id) : null;
  const inProgressMatches = bracketMatches.filter((m) => m.status === 'in_progress');
  const finishedMatches = bracketMatches.filter((m) => m.status === 'finished' && !m.is_bye);

  const scheduleItems: ScheduleItem[] = tournament.start_time
    ? bracketMatches
        .filter((m) => !m.is_bye)
        .slice()
        .sort((a, b) => a.round - b.round || a.bracket_slot - b.bracket_slot)
        .map((m, i) => ({
          id: m.id,
          time: addMinutesToClock(
            tournament.start_time!,
            (groupPhaseMatchCount + i) * (tournament.match_duration_minutes + tournament.period_duration_minutes)
          ),
          label: `${m.team_a_id ? (teamsById.get(m.team_a_id)?.name ?? '?') : '?'} — ${m.team_b_id ? (teamsById.get(m.team_b_id)?.name ?? '?') : '?'}`,
          sublabel: roundLabel(m.round, totalRounds),
          status: m.status,
          onStart: isOwner && m.status === 'pending' && m.team_a_id && m.team_b_id && tournament.status !== 'finished' ? () => handleStartBracketMatch(m.id) : undefined,
          starting: startingMatchId === m.id,
        }))
    : [];

  if (loadingTeams || loadingBracket) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-12 sm:py-16 w-full">
        <BracketSkeleton />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 sm:py-16 w-full">
      {bracketExists ? (
        <>
          {champion && <ChampionBanner champion={champion} />}
          <BracketTree totalRounds={totalRounds} matchesByRound={matchesByRound} teamsById={teamsById} isOwner={isOwner} onStart={handleStartBracketMatch} />

          <ScheduleSection items={scheduleItems} />

          <div className="mt-16">
            <span className="text-xs uppercase tracking-widest text-red-400 font-semibold">Utakmice</span>
            <div className="w-10 h-0.5 bg-red-500 mt-3 mb-6" />
            {inProgressMatches.length > 0 && (
              <div className="flex flex-col gap-6 mb-10">
                {inProgressMatches.map((m) => {
                  const teamA = m.team_a_id ? teamsById.get(m.team_a_id) : null;
                  const teamB = m.team_b_id ? teamsById.get(m.team_b_id) : null;
                  if (!teamA || !teamB) return null;
                  return (
                    <div id={`match-${m.id}`} key={m.id}>
                      <LiveMatchCard match={m} teamA={teamA} teamB={teamB} roundText={roundLabel(m.round, totalRounds)} isOwner={isOwner} rosterA={rosters.get(teamA.id) ?? []} rosterB={rosters.get(teamB.id) ?? []} isBasketball={isBasketball} events={matchEvents.get(m.id) ?? []} finishError={finishError} onAddGoal={handleAddGoal} onFinishMatch={handleFinishBracketMatch} onAddEvent={handleAddEvent} onUndoLast={handleUndoLast} />
                    </div>
                  );
                })}
              </div>
            )}
            {finishedMatches.length > 0 && (
              <div>
                <span className="text-[11px] uppercase tracking-widest text-paper-500">Odigrane utakmice</span>
                <div className="flex flex-col gap-2 mt-3">
                  {finishedMatches.map((m) => {
                    const teamA = m.team_a_id ? teamsById.get(m.team_a_id) : null;
                    const teamB = m.team_b_id ? teamsById.get(m.team_b_id) : null;
                    if (!teamA || !teamB) return null;
                    return <FinishedMatchRow key={m.id} match={m} teamA={teamA} teamB={teamB} roundText={roundLabel(m.round, totalRounds)} isBasketball={isBasketball} isExpanded={expandedMatchId === m.id} onToggle={() => handleToggleMatchDetails(m.id)} timeline={matchTimelines.get(m.id) ?? []} loadingTimeline={loadingTimelineId === m.id} />;
                  })}
                </div>
              </div>
            )}
            {inProgressMatches.length === 0 && finishedMatches.length === 0 && <p className="text-sm text-paper-500">Još uvek nije odigrana nijedna utakmica.</p>}
          </div>
        </>
      ) : tournament.format === 'kup' ? (
        isOwner ? (
          teams.length < 2 ? (
            <p className="text-sm text-paper-500 text-center">Potrebno je najmanje 2 prijavljena tima da bi se postavio žreb.</p>
          ) : (
            <div className="max-w-md mx-auto text-center">
              <p className="text-sm text-paper-300 mb-4">Kada su svi timovi prijavljeni, postavi žreb. Timovi će nasumično biti raspoređeni jedni protiv drugih. Nakon toga, prijave, izmene turnira i povlačenja timova više neće biti mogući.</p>
              {confirmingDraw ? (
                <div className="flex items-center justify-center gap-3">
                  <button type="button" onClick={handleSetDraw} disabled={drawingBracket} className="px-5 py-2.5 text-xs uppercase tracking-widest text-paper-100 bg-red-500 hover:bg-red-400 transition-colors">{drawingBracket ? 'Kreiranje…' : 'Potvrdi'}</button>
                  <button type="button" onClick={() => setConfirmingDraw(false)} disabled={drawingBracket} className="text-xs uppercase tracking-widest text-paper-500 hover:text-paper-100 transition-colors">Otkaži</button>
                </div>
              ) : (
                <button type="button" onClick={() => setConfirmingDraw(true)} className="btn-solid px-6 py-3 text-sm uppercase tracking-widest inline-flex items-center justify-center gap-2">Postavi žreb</button>
              )}
              {drawError && <p className="text-sm text-red-400 mt-3">{drawError}</p>}
            </div>
          )
        ) : (
          <p className="text-sm text-paper-500 text-center">Žreb za kup još uvek nije postavljen.</p>
        )
      ) : (
        <div className="flex flex-col items-center text-center gap-6">
          <p className="text-sm text-paper-500">Grupna faza još uvek nije zaključena. Eliminaciona faza počinje kada je organizator zaključi.</p>
          {onSwitchToGroups && (
            <button type="button" onClick={onSwitchToGroups} className="btn-line px-6 py-3 text-sm uppercase tracking-widest inline-flex items-center justify-center gap-2">
              Idi na grupnu fazu
            </button>
          )}
        </div>
      )}
    </div>
  );
}
