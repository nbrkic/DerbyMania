import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../lib/auth-context';
import { supabase } from '../lib/supabase';
import { Dropdown } from '../components/Dropdown';
import { BASKETBALL_SPORT_NAMES } from '../lib/positions';
import { TableSkeleton } from '../components/Skeleton';

type LeagueTeam = {
  id: string;
  name: string;
  crest_url: string | null;
  crest_position_x: number;
  crest_position_y: number;
  deleted_at: string | null;
};

type MatchStatus = 'in_progress' | 'finished';

type LeagueMatch = {
  id: string;
  team_a_id: string;
  team_b_id: string;
  team_a_goals: number;
  team_b_goals: number;
  status: MatchStatus;
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

type Standing = { team: LeagueTeam; played: number; scored: number; conceded: number; points: number };

function computeStandings(teams: LeagueTeam[], matches: LeagueMatch[]): Standing[] {
  const stats = new Map<string, { played: number; scored: number; conceded: number; points: number }>();
  teams.forEach((t) => stats.set(t.id, { played: 0, scored: 0, conceded: 0, points: 0 }));

  matches.forEach((m) => {
    const a = stats.get(m.team_a_id);
    const b = stats.get(m.team_b_id);
    if (!a || !b) return;

    a.played += 1;
    b.played += 1;

    if (m.status === 'finished') {
      a.scored += m.team_a_goals;
      a.conceded += m.team_b_goals;
      b.scored += m.team_b_goals;
      b.conceded += m.team_a_goals;

      if (m.team_a_goals > m.team_b_goals) a.points += 3;
      else if (m.team_a_goals < m.team_b_goals) b.points += 3;
      else {
        a.points += 1;
        b.points += 1;
      }
    }
  });

  return teams
    .map((team) => ({ team, ...(stats.get(team.id) ?? { played: 0, scored: 0, conceded: 0, points: 0 }) }))
    .sort((x, y) => {
      if (y.points !== x.points) return y.points - x.points;
      const diffX = x.scored - x.conceded;
      const diffY = y.scored - y.conceded;
      if (diffY !== diffX) return diffY - diffX;
      if (y.scored !== x.scored) return y.scored - x.scored;
      return x.team.name.localeCompare(y.team.name);
    });
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

function TeamBadge({ team, className }: { team: LeagueTeam; className?: string }) {
  return (
    <div
      className={
        className ??
        'w-6 h-6 rounded-full overflow-hidden bg-ink-700 ring-1 ring-red-500/30 shrink-0 flex items-center justify-center'
      }
    >
      {team.crest_url ? (
        <img
          src={team.crest_url}
          alt=""
          className="w-full h-full object-cover"
          style={{ objectPosition: `${team.crest_position_x}% ${team.crest_position_y}%` }}
        />
      ) : (
        <span className="font-display text-paper-500">{team.name[0]?.toUpperCase()}</span>
      )}
    </div>
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

function EventPicker({
  roster,
  onPick,
  idPrefix,
  icon,
  placeholder,
  accentClass,
}: {
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
    <div className="w-full max-w-none sm:max-w-[10.5rem] mt-1.5 relative">
      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none">{icon}</span>
      <Dropdown
        id={idPrefix}
        value={selectedId}
        onChange={(playerId) => {
          onPick(playerId);
          setSelectedId('');
        }}
        placeholder={placeholder}
        options={roster.map((p) => ({ value: p.id, label: p.full_name || 'Igrač' }))}
        triggerClassName={`w-full pl-8 pr-3 py-1.5 text-[11px] uppercase tracking-widest border ${accentClass} transition-colors flex items-center justify-between gap-2 overflow-hidden`}
      />
    </div>
  );
}

function timelineEntryIcon(kind: TimelineEntryKind, isBasketball: boolean) {
  if (kind === 'goal') {
    return isBasketball ? (
      <BasketballIcon className="w-3.5 h-3.5 text-red-400 shrink-0" />
    ) : (
      <BallIcon className="w-3.5 h-3.5 text-red-400 shrink-0" />
    );
  }
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

function MatchTimeline({
  entries,
  loading,
  teamA,
  teamB,
  isBasketball,
}: {
  entries: TimelineEntry[];
  loading: boolean;
  teamA: LeagueTeam;
  teamB: LeagueTeam;
  isBasketball: boolean;
}) {
  if (loading) {
    return <p className="text-xs text-paper-500 px-4 py-3">Učitavanje…</p>;
  }

  if (!entries.length) {
    return <p className="text-xs text-paper-500 px-4 py-3">Nema zabeleženih dešavanja na ovoj utakmici.</p>;
  }

  return (
    <div className="flex flex-col divide-y divide-ink-800">
      {entries.map((entry) => {
        const team = entry.team_id === teamA.id ? teamA : teamB;
        return (
          <div key={entry.id} className="flex items-center gap-2.5 px-4 py-2.5">
            {timelineEntryIcon(entry.kind, isBasketball)}
            <TeamBadge team={team} className="w-5 h-5 rounded-full overflow-hidden bg-ink-700 ring-1 ring-red-500/30 shrink-0 flex items-center justify-center" />
            <span className="text-xs text-paper-100 truncate flex-1 min-w-0">{entry.playerName}</span>
            <span className="text-[10px] uppercase tracking-widest text-paper-500 shrink-0 whitespace-nowrap">
              {timelineEntryLabel(entry, isBasketball)}
            </span>
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

function PodiumConfetti() {
  const confetti = useMemo(
    () =>
      Array.from({ length: 44 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: 0.9 + Math.random() * 0.7,
        duration: 2 + Math.random() * 1.6,
        width: 4 + Math.random() * 5,
        height: 8 + Math.random() * 8,
        rotate: Math.random() * 360,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      })),
    []
  );

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {confetti.map((c) => (
        <span
          key={c.id}
          className={`confetti-piece absolute top-0 ${c.color}`}
          style={{
            left: `${c.left}%`,
            width: c.width,
            height: c.height,
            animationDelay: `${c.delay}s`,
            animationDuration: `${c.duration}s`,
            transform: `rotate(${c.rotate}deg)`,
          }}
        />
      ))}
    </div>
  );
}

function PodiumSection({
  first,
  second,
  third,
}: {
  first: LeagueTeam;
  second: LeagueTeam | null;
  third: LeagueTeam | null;
}) {
  return (
    <div className="relative mb-14 overflow-hidden bg-ink-900 border border-red-500/40">
      <div
        className="absolute inset-0 opacity-[0.07] pointer-events-none"
        style={{
          backgroundImage:
            'repeating-linear-gradient(135deg, var(--paper-100) 0, var(--paper-100) 1px, transparent 1px, transparent 28px)',
          WebkitMaskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)',
          maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)',
        }}
      />

      <PodiumConfetti />

      <div className="absolute inset-y-0 -left-1/4 w-1/3 bg-paper-100/[0.06] shine-sweep-once pointer-events-none" />

      <div className="relative z-10 text-center px-6 pt-14 sm:pt-16">
        <span className="text-xs uppercase tracking-[0.3em] text-red-400 font-semibold">Turnir je završen</span>
        <div className="crown-float mt-4 inline-flex">
          <TrophyIcon className="trophy-pop w-9 h-9 text-red-400" />
        </div>
      </div>

      <div className="relative z-10 flex items-end justify-center gap-3 sm:gap-6 px-6 pt-6">
        {second ? (
          <div className="podium-rise-2 flex flex-col items-center gap-3 w-24 sm:w-32">
            <TeamBadge
              team={second}
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden bg-ink-800 ring-2 ring-paper-300/50 flex items-center justify-center font-display text-lg"
            />
            <span className="text-xs sm:text-sm text-paper-100 text-center truncate max-w-full">{second.name}</span>
            <div className="w-full h-16 sm:h-20 bg-ink-800 border border-ink-700 border-t-2 border-t-paper-300/60 flex items-start justify-center pt-2">
              <span className="font-display text-2xl text-paper-300">2</span>
            </div>
          </div>
        ) : (
          <div className="w-24 sm:w-32" />
        )}

        <div className="podium-rise-1 flex flex-col items-center gap-3 w-28 sm:w-36">
          <div className="relative w-20 h-20 sm:w-24 sm:h-24">
            <div className="ring-expand absolute inset-0 rounded-full border-2 border-red-400/70 pointer-events-none" />
            <div className="glow-pulse absolute inset-0 rounded-full pointer-events-none" />
            <TeamBadge
              team={first}
              className="trophy-pop relative w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden bg-ink-800 ring-4 ring-red-500/60 flex items-center justify-center font-display text-2xl"
            />
          </div>
          <span className="champion-name-reveal font-display text-lg sm:text-xl leading-tight text-center truncate max-w-full">
            {first.name}
          </span>
          <div className="w-full h-24 sm:h-28 bg-ink-800 border border-ink-700 border-t-2 border-t-red-500/60 flex items-start justify-center pt-2">
            <span className="font-display text-3xl text-red-400">1</span>
          </div>
        </div>

        {third ? (
          <div className="podium-rise-3 flex flex-col items-center gap-3 w-24 sm:w-32">
            <TeamBadge
              team={third}
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden bg-ink-800 ring-2 ring-paper-700/60 flex items-center justify-center font-display text-lg"
            />
            <span className="text-xs sm:text-sm text-paper-100 text-center truncate max-w-full">{third.name}</span>
            <div className="w-full h-10 sm:h-14 bg-ink-800 border border-ink-700 border-t-2 border-t-paper-700/60 flex items-start justify-center pt-2">
              <span className="font-display text-2xl text-paper-500">3</span>
            </div>
          </div>
        ) : (
          <div className="w-24 sm:w-32" />
        )}
      </div>

      <div className="h-10 sm:h-12" />
    </div>
  );
}

function StandingsTable({
  teams,
  matches,
  isBasketball,
}: {
  teams: LeagueTeam[];
  matches: LeagueMatch[];
  isBasketball: boolean;
}) {
  const standings = computeStandings(teams, matches);

  return (
    <div className="bg-ink-900 border border-ink-700 border-t-2 border-t-red-500/50 overflow-hidden">
      <div className="px-5 py-3 border-b border-ink-700">
        <span className="font-display text-lg leading-tight">Tabela</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="text-[10px] uppercase tracking-widest text-paper-500">
              <th className="text-left font-medium pl-5 pr-2 py-2 w-7">#</th>
              <th className="text-left font-medium px-2 py-2">Tim</th>
              <th className="text-center font-medium px-2 py-2" title="Odigrane utakmice">OU</th>
              <th className="text-center font-medium px-2 py-2" title={isBasketball ? 'Dati poeni' : 'Dati golovi'}>
                {isBasketball ? 'DP' : 'DG'}
              </th>
              <th className="text-center font-medium px-2 py-2" title={isBasketball ? 'Primljeni poeni' : 'Primljeni golovi'}>
                {isBasketball ? 'PP' : 'PG'}
              </th>
              <th className="text-center font-medium pl-2 pr-5 py-2" title={isBasketball ? 'Bodovi' : 'Poeni'}>
                {isBasketball ? 'Bod' : 'P'}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-800">
            {standings.map((s, index) => (
              <tr key={s.team.id} className="hover:bg-ink-800 transition-colors">
                <td className="pl-5 pr-2 py-2.5 text-paper-500">{index + 1}</td>
                <td className="px-2 py-2.5 min-w-0">
                  {s.team.deleted_at ? (
                    <div className="flex items-center gap-2 min-w-0 opacity-60">
                      <TeamBadge team={s.team} />
                      <span className="truncate text-paper-500">{s.team.name}</span>
                    </div>
                  ) : (
                    <Link to={`/timovi/${s.team.id}`} className="group flex items-center gap-2 min-w-0">
                      <TeamBadge team={s.team} />
                      <span className="truncate text-paper-100 transition-colors duration-200 group-hover:text-red-400">
                        {s.team.name}
                      </span>
                    </Link>
                  )}
                </td>
                <td className="text-center px-2 py-2.5 text-paper-300">{s.played}</td>
                <td className="text-center px-2 py-2.5 text-paper-300">{s.scored}</td>
                <td className="text-center px-2 py-2.5 text-paper-300">{s.conceded}</td>
                <td className="text-center pl-2 pr-5 py-2.5 font-semibold text-paper-100">{s.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ScorerPicker({
  roster,
  onPick,
  idPrefix,
  isBasketball,
}: {
  roster: RosterPlayer[];
  onPick: (playerId: string, points: number) => void | Promise<void>;
  idPrefix: string;
  isBasketball: boolean;
}) {
  const [selectedId, setSelectedId] = useState('');
  const [pendingPlayerId, setPendingPlayerId] = useState<string | null>(null);

  if (!roster.length) {
    return <p className="text-[11px] text-paper-700 mt-1">Nema igrača u timu</p>;
  }

  if (isBasketball && pendingPlayerId) {
    const pendingName = roster.find((p) => p.id === pendingPlayerId)?.full_name || 'Igrač';
    return (
      <div className="w-full max-w-none sm:max-w-[10.5rem] mt-1">
        <p className="text-[10px] text-paper-500 truncate mb-1.5">{pendingName}</p>
        <div className="flex gap-1.5">
          {[1, 2, 3].map((points) => (
            <button
              key={points}
              type="button"
              onClick={() => {
                onPick(pendingPlayerId, points);
                setPendingPlayerId(null);
              }}
              className="flex-1 py-2 text-xs font-semibold border border-red-500/30 hover:bg-red-500/10 hover:border-red-400/60 transition-colors"
            >
              +{points}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setPendingPlayerId(null)}
          className="text-[10px] text-paper-700 hover:text-paper-100 transition-colors mt-1.5"
        >
          Otkaži
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-none sm:max-w-[10.5rem] mt-1 relative">
      {isBasketball ? (
        <BasketballIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-red-400 pointer-events-none" />
      ) : (
        <BallIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-red-400 pointer-events-none" />
      )}
      <Dropdown
        id={idPrefix}
        value={selectedId}
        onChange={(playerId) => {
          if (isBasketball) {
            setPendingPlayerId(playerId);
            setSelectedId('');
          } else {
            onPick(playerId, 1);
            setSelectedId('');
          }
        }}
        placeholder={isBasketball ? 'Igrač' : 'Strelac'}
        options={roster.map((p) => ({ value: p.id, label: p.full_name || 'Igrač' }))}
        triggerClassName="w-full pl-8 pr-3 py-2 text-xs uppercase tracking-widest border border-red-500/30 hover:bg-red-500/10 hover:border-red-400/60 transition-colors flex items-center justify-between gap-2 overflow-hidden"
      />
    </div>
  );
}

function LiveMatchCard({
  match,
  teamA,
  teamB,
  isOwner,
  rosterA,
  rosterB,
  isBasketball,
  events,
  onAddGoal,
  onFinishMatch,
  onAddEvent,
  onUndoLast,
}: {
  match: LeagueMatch;
  teamA: LeagueTeam;
  teamB: LeagueTeam;
  isOwner: boolean;
  rosterA: RosterPlayer[];
  rosterB: RosterPlayer[];
  isBasketball: boolean;
  events: MatchEvent[];
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
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
          </span>
          <span className="text-[11px] uppercase tracking-widest text-red-400 font-semibold">Uživo</span>
        </div>

        <div className="flex items-start sm:items-center justify-between gap-3 sm:gap-6">
          <div className="flex flex-col items-center gap-2 flex-1 min-w-0">
            <TeamBadge team={teamA} className="w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden bg-ink-800 ring-2 ring-red-500/30 flex items-center justify-center shrink-0 font-display text-xl" />
            <span className="text-sm text-paper-100 text-center truncate max-w-full">{teamA.name}</span>
            {isOwner && (
              <>
                <ScorerPicker
                  idPrefix={`league-scorer-a-${match.id}`}
                  roster={rosterA}
                  isBasketball={isBasketball}
                  onPick={(playerId, points) => onAddGoal(match.id, 'a', match.team_a_id, playerId, points)}
                />
                <EventPicker
                  idPrefix={`league-assist-a-${match.id}`}
                  roster={rosterA}
                  icon={<AssistIcon className="w-3.5 h-3.5 text-paper-400" />}
                  placeholder="Asistencija"
                  accentClass="border-paper-500/30 text-paper-400 hover:bg-ink-800 hover:border-paper-400/50"
                  onPick={(playerId) => onAddEvent(match.id, match.team_a_id, playerId, 'assist')}
                />
                {isBasketball && (
                  <EventPicker
                    idPrefix={`league-rebound-a-${match.id}`}
                    roster={rosterA}
                    icon={<ReboundIcon className="w-3.5 h-3.5 text-paper-400" />}
                    placeholder="Skok"
                    accentClass="border-paper-500/30 text-paper-400 hover:bg-ink-800 hover:border-paper-400/50"
                    onPick={(playerId) => onAddEvent(match.id, match.team_a_id, playerId, 'rebound')}
                  />
                )}
                {!isBasketball && (
                  <>
                    <EventPicker
                      idPrefix={`league-save-a-${match.id}`}
                      roster={rosterA}
                      icon={<GloveIcon className="w-3.5 h-3.5 text-paper-400" />}
                      placeholder="Odbrana"
                      accentClass="border-paper-500/30 text-paper-400 hover:bg-ink-800 hover:border-paper-400/50"
                      onPick={(playerId) => onAddEvent(match.id, match.team_a_id, playerId, 'save')}
                    />
                    <EventPicker
                      idPrefix={`league-yellow-a-${match.id}`}
                      roster={rosterA}
                      icon={<CardIcon className="w-3 h-3.5 text-yellow-400" />}
                      placeholder="Žuti karton"
                      accentClass="border-yellow-500/40 text-paper-400 hover:bg-yellow-500/10 hover:border-yellow-400/60"
                      onPick={(playerId) => onAddEvent(match.id, match.team_a_id, playerId, 'yellow_card')}
                    />
                    <EventPicker
                      idPrefix={`league-red-a-${match.id}`}
                      roster={rosterA}
                      icon={<CardIcon className="w-3 h-3.5 text-red-400" />}
                      placeholder="Crveni karton"
                      accentClass="border-red-500/40 text-paper-400 hover:bg-red-500/10 hover:border-red-400/60"
                      onPick={(playerId) => onAddEvent(match.id, match.team_a_id, playerId, 'red_card')}
                    />
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
            <TeamBadge team={teamB} className="w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden bg-ink-800 ring-2 ring-red-500/30 flex items-center justify-center shrink-0 font-display text-xl" />
            <span className="text-sm text-paper-100 text-center truncate max-w-full">{teamB.name}</span>
            {isOwner && (
              <>
                <ScorerPicker
                  idPrefix={`league-scorer-b-${match.id}`}
                  roster={rosterB}
                  isBasketball={isBasketball}
                  onPick={(playerId, points) => onAddGoal(match.id, 'b', match.team_b_id, playerId, points)}
                />
                <EventPicker
                  idPrefix={`league-assist-b-${match.id}`}
                  roster={rosterB}
                  icon={<AssistIcon className="w-3.5 h-3.5 text-paper-400" />}
                  placeholder="Asistencija"
                  accentClass="border-paper-500/30 text-paper-400 hover:bg-ink-800 hover:border-paper-400/50"
                  onPick={(playerId) => onAddEvent(match.id, match.team_b_id, playerId, 'assist')}
                />
                {isBasketball && (
                  <EventPicker
                    idPrefix={`league-rebound-b-${match.id}`}
                    roster={rosterB}
                    icon={<ReboundIcon className="w-3.5 h-3.5 text-paper-400" />}
                    placeholder="Skok"
                    accentClass="border-paper-500/30 text-paper-400 hover:bg-ink-800 hover:border-paper-400/50"
                    onPick={(playerId) => onAddEvent(match.id, match.team_b_id, playerId, 'rebound')}
                  />
                )}
                {!isBasketball && (
                  <>
                    <EventPicker
                      idPrefix={`league-save-b-${match.id}`}
                      roster={rosterB}
                      icon={<GloveIcon className="w-3.5 h-3.5 text-paper-400" />}
                      placeholder="Odbrana"
                      accentClass="border-paper-500/30 text-paper-400 hover:bg-ink-800 hover:border-paper-400/50"
                      onPick={(playerId) => onAddEvent(match.id, match.team_b_id, playerId, 'save')}
                    />
                    <EventPicker
                      idPrefix={`league-yellow-b-${match.id}`}
                      roster={rosterB}
                      icon={<CardIcon className="w-3 h-3.5 text-yellow-400" />}
                      placeholder="Žuti karton"
                      accentClass="border-yellow-500/40 text-paper-400 hover:bg-yellow-500/10 hover:border-yellow-400/60"
                      onPick={(playerId) => onAddEvent(match.id, match.team_b_id, playerId, 'yellow_card')}
                    />
                    <EventPicker
                      idPrefix={`league-red-b-${match.id}`}
                      roster={rosterB}
                      icon={<CardIcon className="w-3 h-3.5 text-red-400" />}
                      placeholder="Crveni karton"
                      accentClass="border-red-500/40 text-paper-400 hover:bg-red-500/10 hover:border-red-400/60"
                      onPick={(playerId) => onAddEvent(match.id, match.team_b_id, playerId, 'red_card')}
                    />
                  </>
                )}
              </>
            )}
          </div>
        </div>

        {events.length > 0 && (
          <div className="mt-6 pt-5 border-t border-ink-700 flex flex-wrap justify-center gap-2">
            {events
              .slice()
              .reverse()
              .map((e) => (
                <span
                  key={e.id}
                  className="text-[10px] uppercase tracking-widest text-paper-500 border border-ink-700 px-2 py-1 whitespace-nowrap"
                >
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
            <button
              type="button"
              onClick={() => onFinishMatch(match.id)}
              className="btn-solid px-6 py-2.5 text-xs uppercase tracking-widest"
            >
              Završi utakmicu
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function FinishedMatchRow({
  match,
  teamA,
  teamB,
  isBasketball,
  isExpanded,
  onToggle,
  timeline,
  loadingTimeline,
}: {
  match: LeagueMatch;
  teamA: LeagueTeam;
  teamB: LeagueTeam;
  isBasketball: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  timeline: TimelineEntry[];
  loadingTimeline: boolean;
}) {
  return (
    <div className="bg-ink-900 border border-ink-700">
      <button type="button" onClick={onToggle} className="w-full text-left px-4 py-3 hover:bg-ink-800 transition-colors">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 flex-1 justify-end min-w-0">
            <span className="truncate text-sm text-paper-200">{teamA.name}</span>
            <TeamBadge team={teamA} />
          </div>
          <span className="font-display text-base shrink-0 px-2">
            {match.team_a_goals} : {match.team_b_goals}
          </span>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <TeamBadge team={teamB} />
            <span className="truncate text-sm text-paper-200">{teamB.name}</span>
          </div>
        </div>
      </button>

      {isExpanded && (
        <div className="border-t border-ink-700">
          <MatchTimeline entries={timeline} loading={loadingTimeline} teamA={teamA} teamB={teamB} isBasketball={isBasketball} />
        </div>
      )}
    </div>
  );
}

export function LeagueTabContent({
  id,
  tournament,
  onFinished,
}: {
  id: string;
  tournament: {
    id: string;
    owner_id: string;
    format: string;
    status: string;
    roster_locked: boolean;
    sports: { name: string } | null;
  };
  onFinished?: () => void;
}) {
  const { user } = useAuth();

  const [localRosterLocked, setLocalRosterLocked] = useState(tournament.roster_locked);
  const [localStatus, setLocalStatus] = useState(tournament.status);

  const [teams, setTeams] = useState<LeagueTeam[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(true);

  const [confirmingLock, setConfirmingLock] = useState(false);
  const [lockingTable, setLockingTable] = useState(false);
  const [lockError, setLockError] = useState<string | null>(null);

  const [matches, setMatches] = useState<LeagueMatch[]>([]);
  const [rosters, setRosters] = useState<Map<string, RosterPlayer[]>>(new Map());
  const fetchedRosterTeamIds = useRef(new Set<string>());
  const [matchEvents, setMatchEvents] = useState<Map<string, MatchEvent[]>>(new Map());
  const fetchedEventMatchIds = useRef(new Set<string>());
  const [expandedMatchId, setExpandedMatchId] = useState<string | null>(null);
  const [matchTimelines, setMatchTimelines] = useState<Map<string, TimelineEntry[]>>(new Map());
  const [loadingTimelineId, setLoadingTimelineId] = useState<string | null>(null);
  const [teamAId, setTeamAId] = useState('');
  const [teamBId, setTeamBId] = useState('');
  const [showNewMatchForm, setShowNewMatchForm] = useState(false);
  const [creatingMatch, setCreatingMatch] = useState(false);
  const [newMatchError, setNewMatchError] = useState<string | null>(null);

  const [confirmingFinish, setConfirmingFinish] = useState(false);
  const [finishingTournament, setFinishingTournament] = useState(false);
  const [finishTournamentError, setFinishTournamentError] = useState<string | null>(null);

  useEffect(() => {
    async function loadTeams() {
      const { data: participantRows } = await supabase
        .from('tournament_teams')
        .select('team_id')
        .eq('tournament_id', id);
      const teamIds = (participantRows ?? []).map((p) => p.team_id);

      if (teamIds.length) {
        const { data: teamRows } = await supabase
          .from('teams')
          .select('id, name, crest_url, crest_position_x, crest_position_y, deleted_at')
          .in('id', teamIds);
        setTeams((teamRows as LeagueTeam[]) ?? []);
      } else {
        setTeams([]);
      }
      setLoadingTeams(false);
    }
    loadTeams();
  }, [id]);

  useEffect(() => {
    if (!localRosterLocked) return;

    supabase
      .from('tournament_league_matches')
      .select('id, team_a_id, team_b_id, team_a_goals, team_b_goals, status')
      .eq('tournament_id', tournament.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => setMatches((data as LeagueMatch[]) ?? []));
  }, [localRosterLocked, tournament.id]);

  const matchIdsRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    matchIdsRef.current = new Set(matches.map((m) => m.id));
  }, [matches]);

  useEffect(() => {
    if (!localRosterLocked) return;

    const channel = supabase
      .channel(`tournament-league-${tournament.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tournament_league_matches', filter: `tournament_id=eq.${tournament.id}` },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            const oldId = (payload.old as { id: string }).id;
            setMatches((prev) => prev.filter((m) => m.id !== oldId));
            return;
          }
          const row = payload.new as LeagueMatch;
          setMatches((prev) => {
            if (prev.some((m) => m.id === row.id)) return prev.map((m) => (m.id === row.id ? { ...m, ...row } : m));
            return [row, ...prev];
          });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tournament_league_events' },
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
  }, [localRosterLocked, tournament.id]);

  useEffect(() => {
    const neededTeamIds = new Set<string>();
    matches
      .filter((m) => m.status === 'in_progress')
      .forEach((m) => {
        if (!fetchedRosterTeamIds.current.has(m.team_a_id)) neededTeamIds.add(m.team_a_id);
        if (!fetchedRosterTeamIds.current.has(m.team_b_id)) neededTeamIds.add(m.team_b_id);
      });
    if (!neededTeamIds.size) return;

    const ids = [...neededTeamIds];
    ids.forEach((tid) => fetchedRosterTeamIds.current.add(tid));

    async function loadRosters() {
      const { data: memberRows } = await supabase.from('team_members').select('team_id, user_id').in('team_id', ids);
      const userIds = [...new Set((memberRows ?? []).map((r) => r.user_id))];
      const { data: profiles } = userIds.length
        ? await supabase.from('public_profiles').select('id, full_name').in('id', userIds)
        : { data: [] as { id: string; full_name: string | null }[] };
      const nameById = new Map((profiles ?? []).map((p) => [p.id, p.full_name]));

      setRosters((prev) => {
        const next = new Map(prev);
        ids.forEach((tid) => {
          if (!next.has(tid)) next.set(tid, []);
        });
        (memberRows ?? []).forEach((r) => {
          const list = next.get(r.team_id) ?? [];
          list.push({ id: r.user_id, full_name: nameById.get(r.user_id) ?? null });
          next.set(r.team_id, list);
        });
        return next;
      });
    }

    loadRosters();
  }, [matches]);

  useEffect(() => {
    const neededMatchIds = new Set<string>();
    matches
      .filter((m) => m.status === 'in_progress')
      .forEach((m) => {
        if (!fetchedEventMatchIds.current.has(m.id)) neededMatchIds.add(m.id);
      });
    if (!neededMatchIds.size) return;

    const ids = [...neededMatchIds];
    ids.forEach((mid) => fetchedEventMatchIds.current.add(mid));

    supabase
      .from('tournament_league_events')
      .select('id, match_id, team_id, player_id, event_type')
      .in('match_id', ids)
      .then(({ data }) => {
        setMatchEvents((prev) => {
          const next = new Map(prev);
          ids.forEach((mid) => {
            if (!next.has(mid)) next.set(mid, []);
          });
          (data as MatchEvent[] | null ?? []).forEach((e) => {
            const list = next.get(e.match_id) ?? [];
            list.push(e);
            next.set(e.match_id, list);
          });
          return next;
        });
      });
  }, [matches]);

  async function handleLockTable() {
    setLockingTable(true);
    setLockError(null);

    const { error } = await supabase.from('tournaments').update({ roster_locked: true }).eq('id', tournament.id);
    setLockingTable(false);

    if (error) {
      setLockError('Kreiranje tabele nije uspelo. Pokušaj ponovo.');
      return;
    }
    setLocalRosterLocked(true);
    setConfirmingLock(false);
  }

  async function handleCreateMatch() {
    if (!teamAId || !teamBId) return;

    setCreatingMatch(true);
    setNewMatchError(null);

    const { data, error } = await supabase
      .from('tournament_league_matches')
      .insert({ tournament_id: tournament.id, team_a_id: teamAId, team_b_id: teamBId })
      .select('id, team_a_id, team_b_id, team_a_goals, team_b_goals, status')
      .single();

    setCreatingMatch(false);

    if (error || !data) {
      setNewMatchError('Kreiranje utakmice nije uspelo. Pokušaj ponovo.');
      return;
    }

    setMatches((prev) => [data as LeagueMatch, ...prev]);
    setShowNewMatchForm(false);
    setTeamAId('');
    setTeamBId('');
  }

  async function handleAddGoal(matchId: string, side: 'a' | 'b', teamId: string, playerId: string, points: number) {
    const match = matches.find((m) => m.id === matchId);
    if (!match) return;

    const { error: goalError } = await supabase
      .from('tournament_league_goals')
      .insert({ match_id: matchId, team_id: teamId, player_id: playerId, points });
    if (goalError) return;

    const field = side === 'a' ? 'team_a_goals' : 'team_b_goals';
    const newValue = (side === 'a' ? match.team_a_goals : match.team_b_goals) + points;

    const { error } = await supabase.from('tournament_league_matches').update({ [field]: newValue }).eq('id', matchId);
    if (!error) {
      setMatches((prev) => prev.map((m) => (m.id === matchId ? { ...m, [field]: newValue } : m)));
    }
  }

  async function handleFinishMatch(matchId: string) {
    const { error } = await supabase
      .from('tournament_league_matches')
      .update({ status: 'finished', finished_at: new Date().toISOString() })
      .eq('id', matchId);

    if (!error) {
      setMatches((prev) => prev.map((m) => (m.id === matchId ? { ...m, status: 'finished' } : m)));
    }
  }

  async function handleAddEvent(matchId: string, teamId: string, playerId: string, eventType: MatchEventType) {
    const { data, error } = await supabase
      .from('tournament_league_events')
      .insert({ match_id: matchId, team_id: teamId, player_id: playerId, event_type: eventType })
      .select('id, match_id, team_id, player_id, event_type')
      .single();

    if (error || !data) return;

    setMatchEvents((prev) => {
      const next = new Map(prev);
      const list = next.get(matchId) ?? [];
      next.set(matchId, [...list, data as MatchEvent]);
      return next;
    });
  }

  async function handleUndoLast(matchId: string) {
    const match = matches.find((m) => m.id === matchId);
    if (!match) return;

    const [{ data: lastGoal }, { data: lastEvent }] = await Promise.all([
      supabase.from('tournament_league_goals').select('id, team_id, points, created_at').eq('match_id', matchId).order('created_at', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('tournament_league_events').select('id, match_id, team_id, player_id, event_type, created_at').eq('match_id', matchId).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    ]);

    const goalTime = lastGoal ? new Date(lastGoal.created_at).getTime() : -1;
    const eventTime = lastEvent ? new Date(lastEvent.created_at).getTime() : -1;
    if (goalTime < 0 && eventTime < 0) return;

    if (goalTime >= eventTime) {
      const { error } = await supabase.from('tournament_league_goals').delete().eq('id', lastGoal!.id);
      if (error) return;
      const side = lastGoal!.team_id === match.team_a_id ? 'a' : 'b';
      const field = side === 'a' ? 'team_a_goals' : 'team_b_goals';
      const newValue = Math.max(0, (side === 'a' ? match.team_a_goals : match.team_b_goals) - lastGoal!.points);
      const { error: updateError } = await supabase.from('tournament_league_matches').update({ [field]: newValue }).eq('id', matchId);
      if (!updateError) setMatches((prev) => prev.map((m) => (m.id === matchId ? { ...m, [field]: newValue } : m)));
    } else {
      const { error } = await supabase.from('tournament_league_events').delete().eq('id', lastEvent!.id);
      if (error) return;
      setMatchEvents((prev) => {
        const next = new Map(prev);
        next.set(matchId, (next.get(matchId) ?? []).filter((e) => e.id !== lastEvent!.id));
        return next;
      });
    }
  }

  async function handleToggleMatchDetails(matchId: string) {
    if (expandedMatchId === matchId) {
      setExpandedMatchId(null);
      return;
    }
    setExpandedMatchId(matchId);
    if (matchTimelines.has(matchId)) return;

    setLoadingTimelineId(matchId);

    const [{ data: goalRows }, { data: eventRows }] = await Promise.all([
      supabase.from('tournament_league_goals').select('id, team_id, player_id, points, created_at').eq('match_id', matchId),
      supabase.from('tournament_league_events').select('id, team_id, player_id, event_type, created_at').eq('match_id', matchId),
    ]);

    const playerIds = [...new Set([...(goalRows ?? []).map((g) => g.player_id), ...(eventRows ?? []).map((e) => e.player_id)])];
    const { data: profiles } = playerIds.length
      ? await supabase.from('public_profiles').select('id, full_name').in('id', playerIds)
      : { data: [] as { id: string; full_name: string | null }[] };
    const nameById = new Map((profiles ?? []).map((p) => [p.id, p.full_name]));

    const entries: TimelineEntry[] = [
      ...(goalRows ?? []).map((g) => ({
        id: g.id,
        team_id: g.team_id,
        playerName: nameById.get(g.player_id) || 'Igrač',
        kind: 'goal' as TimelineEntryKind,
        points: g.points,
        created_at: g.created_at,
      })),
      ...(eventRows ?? []).map((e) => ({
        id: e.id,
        team_id: e.team_id,
        playerName: nameById.get(e.player_id) || 'Igrač',
        kind: e.event_type as TimelineEntryKind,
        points: 0,
        created_at: e.created_at,
      })),
    ].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    setMatchTimelines((prev) => new Map(prev).set(matchId, entries));
    setLoadingTimelineId(null);
  }

  async function handleFinishTournament() {
    setFinishingTournament(true);
    setFinishTournamentError(null);

    const { error } = await supabase.from('tournaments').update({ status: 'finished' }).eq('id', tournament.id);
    setFinishingTournament(false);

    if (error) {
      setFinishTournamentError('Završavanje turnira nije uspelo. Pokušaj ponovo.');
      return;
    }
    setLocalStatus('finished');
    setConfirmingFinish(false);
    onFinished?.();
  }

  const teamsById = new Map(teams.map((t) => [t.id, t]));
  const isOwner = user?.id === tournament.owner_id;
  const isTournamentFinished = localStatus === 'finished';
  const isBasketball = !!tournament.sports?.name && BASKETBALL_SPORT_NAMES.includes(tournament.sports.name);

  const teamAOptions = teams.map((t) => ({ value: t.id, label: t.name }));
  const teamBOptions = teamAId ? teams.filter((t) => t.id !== teamAId).map((t) => ({ value: t.id, label: t.name })) : [];

  const inProgressMatches = matches.filter((m) => m.status === 'in_progress');
  const finishedMatches = matches.filter((m) => m.status === 'finished');
  const standings = computeStandings(teams, matches);

  if (loadingTeams) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-12 sm:py-16 w-full">
        <TableSkeleton rows={6} />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 sm:py-16 w-full">
      {localRosterLocked ? (
        <>
          {isTournamentFinished && standings[0] && (
            <PodiumSection
              first={standings[0].team}
              second={standings[1]?.team ?? null}
              third={standings[2]?.team ?? null}
            />
          )}

          <StandingsTable teams={teams} matches={matches} isBasketball={isBasketball} />

          <div className="mt-16">
            <span className="text-xs uppercase tracking-widest text-red-400 font-semibold">Utakmice</span>
            <div className="w-10 h-0.5 bg-red-500 mt-3 mb-6" />

            {isOwner && !isTournamentFinished && (
              <div className="mb-8">
                {showNewMatchForm ? (
                  <div className="max-w-md bg-ink-900 border border-ink-700 px-5 py-5">
                    <div className="flex flex-col sm:flex-row items-center gap-3">
                      <div className="w-full sm:flex-1">
                        <Dropdown
                          id="league-match-team-a"
                          value={teamAId}
                          onChange={(v) => {
                            setTeamAId(v);
                            setTeamBId('');
                          }}
                          placeholder="Izaberi prvi tim"
                          options={teamAOptions}
                        />
                      </div>
                      <span className="text-paper-500 text-xs shrink-0">protiv</span>
                      <div className="w-full sm:flex-1">
                        <Dropdown
                          id="league-match-team-b"
                          value={teamBId}
                          onChange={setTeamBId}
                          placeholder="Izaberi drugi tim"
                          options={teamBOptions}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mt-4">
                      <button
                        type="button"
                        onClick={handleCreateMatch}
                        disabled={creatingMatch || !teamAId || !teamBId}
                        className="btn-solid px-5 py-2.5 text-xs uppercase tracking-widest"
                      >
                        {creatingMatch ? 'Kreiranje…' : 'Potvrdi'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowNewMatchForm(false);
                          setTeamAId('');
                          setTeamBId('');
                          setNewMatchError(null);
                        }}
                        disabled={creatingMatch}
                        className="text-xs uppercase tracking-widest text-paper-500 hover:text-paper-100 transition-colors"
                      >
                        Otkaži
                      </button>
                    </div>
                    {newMatchError && <p className="text-xs text-red-400 mt-3">{newMatchError}</p>}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowNewMatchForm(true)}
                    className="btn-solid px-6 py-3 text-sm uppercase tracking-widest inline-flex items-center justify-center gap-2"
                  >
                    Nova utakmica
                  </button>
                )}
              </div>
            )}

            {inProgressMatches.length > 0 && (
              <div className="flex flex-col gap-6 mb-10">
                {inProgressMatches.map((m) => {
                  const teamA = teamsById.get(m.team_a_id);
                  const teamB = teamsById.get(m.team_b_id);
                  if (!teamA || !teamB) return null;
                  return (
                    <LiveMatchCard
                      key={m.id}
                      match={m}
                      teamA={teamA}
                      teamB={teamB}
                      isOwner={isOwner && !isTournamentFinished}
                      rosterA={rosters.get(m.team_a_id) ?? []}
                      rosterB={rosters.get(m.team_b_id) ?? []}
                      isBasketball={isBasketball}
                      events={matchEvents.get(m.id) ?? []}
                      onAddGoal={handleAddGoal}
                      onFinishMatch={handleFinishMatch}
                      onAddEvent={handleAddEvent}
                      onUndoLast={handleUndoLast}
                    />
                  );
                })}
              </div>
            )}

            {finishedMatches.length > 0 && (
              <div>
                <span className="text-[11px] uppercase tracking-widest text-paper-500">Odigrane utakmice</span>
                <div className="flex flex-col gap-2 mt-3">
                  {finishedMatches.map((m) => {
                    const teamA = teamsById.get(m.team_a_id);
                    const teamB = teamsById.get(m.team_b_id);
                    if (!teamA || !teamB) return null;
                    return (
                      <FinishedMatchRow
                        key={m.id}
                        match={m}
                        teamA={teamA}
                        teamB={teamB}
                        isBasketball={isBasketball}
                        isExpanded={expandedMatchId === m.id}
                        onToggle={() => handleToggleMatchDetails(m.id)}
                        timeline={matchTimelines.get(m.id) ?? []}
                        loadingTimeline={loadingTimelineId === m.id}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {inProgressMatches.length === 0 && finishedMatches.length === 0 && !isOwner && (
              <p className="text-sm text-paper-500">Još uvek nije odigrana nijedna utakmica.</p>
            )}
          </div>

          {isOwner && !isTournamentFinished && (
            <div className="mt-16 border border-red-500/20 bg-ink-900/60">
              <div className="px-6 py-4 border-b border-red-500/20">
                <span className="text-xs uppercase tracking-widest text-red-400 font-semibold">Kraj turnira</span>
              </div>

              <div className="px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-paper-100">Završi turnir</p>
                  <p className="text-xs text-paper-500 mt-1">
                    Prva tri tima sa trenutne tabele biće proglašena za pobednike. Ova akcija je trajna.
                  </p>
                  {finishTournamentError && <p className="text-xs text-red-400 mt-2">{finishTournamentError}</p>}
                </div>
                {confirmingFinish ? (
                  <div className="flex items-center gap-3 shrink-0">
                    <button
                      type="button"
                      onClick={handleFinishTournament}
                      disabled={finishingTournament}
                      className="px-4 py-2 text-xs uppercase tracking-widest text-paper-100 bg-red-500 hover:bg-red-400 transition-colors"
                    >
                      {finishingTournament ? 'Završavanje…' : 'Potvrdi'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmingFinish(false)}
                      disabled={finishingTournament}
                      className="text-xs uppercase tracking-widest text-paper-500 hover:text-paper-100 transition-colors"
                    >
                      Otkaži
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmingFinish(true)}
                    className="shrink-0 btn-solid px-5 py-2.5 text-xs uppercase tracking-widest whitespace-nowrap"
                  >
                    Završi turnir
                  </button>
                )}
              </div>
            </div>
          )}
        </>
      ) : isOwner ? (
        teams.length < 2 ? (
          <p className="text-sm text-paper-500">Potrebno je najmanje 2 prijavljena tima da bi se napravila tabela.</p>
        ) : (
          <div className="max-w-md">
            <p className="text-sm text-paper-300 mb-4">
              Kada su svi timovi prijavljeni, napravi tabelu lige. Nakon toga, prijave, izmene turnira i
              povlačenja timova više neće biti mogući.
            </p>
            {confirmingLock ? (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleLockTable}
                  disabled={lockingTable}
                  className="px-5 py-2.5 text-xs uppercase tracking-widest text-paper-100 bg-red-500 hover:bg-red-400 transition-colors"
                >
                  {lockingTable ? 'Kreiranje…' : 'Potvrdi'}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmingLock(false)}
                  disabled={lockingTable}
                  className="text-xs uppercase tracking-widest text-paper-500 hover:text-paper-100 transition-colors"
                >
                  Otkaži
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmingLock(true)}
                className="btn-solid px-6 py-3 text-sm uppercase tracking-widest inline-flex items-center justify-center gap-2"
              >
                Napravi tabelu
              </button>
            )}
            {lockError && <p className="text-sm text-red-400 mt-3">{lockError}</p>}
          </div>
        )
      ) : (
        <p className="text-sm text-paper-500">Tabela turnira još uvek nije formirana.</p>
      )}
    </div>
  );
}
