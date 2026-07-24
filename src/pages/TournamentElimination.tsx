import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../lib/auth-context';
import { supabase } from '../lib/supabase';
import { SiteHeader } from '../components/SiteHeader';
import { SiteFooter } from '../components/SiteFooter';
import { Dropdown } from '../components/Dropdown';
import { BASKETBALL_SPORT_NAMES } from '../lib/positions';
import { CompactHeroSkeleton, BracketSkeleton } from '../components/Skeleton';

type TournamentInfo = {
  id: string;
  owner_id: string;
  name: string;
  crest_url: string | null;
  crest_position_x: number;
  crest_position_y: number;
  format: string;
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

function TeamBadge({ team, className }: { team: GroupTeam; className?: string }) {
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
  const confetti = useMemo(
    () =>
      Array.from({ length: 44 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.7,
        duration: 2 + Math.random() * 1.6,
        width: 4 + Math.random() * 5,
        height: 8 + Math.random() * 8,
        rotate: Math.random() * 360,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      })),
    []
  );

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

      <div className="absolute inset-y-0 -left-1/4 w-1/3 bg-paper-100/[0.06] shine-sweep-once pointer-events-none" />

      <div className="relative z-10 text-center px-6 py-14 sm:py-16">
        <span className="text-xs uppercase tracking-[0.3em] text-red-400 font-semibold">Prvak turnira</span>

        <div className="mt-7 flex flex-col items-center gap-5">
          <div className="crown-float">
            <TrophyIcon className="trophy-pop w-11 h-11 text-red-400" />
          </div>

          <div className="relative w-28 h-28">
            <div className="ring-expand absolute inset-0 rounded-full border-2 border-red-400/70 pointer-events-none" />
            <div className="glow-pulse absolute inset-0 rounded-full pointer-events-none" />
            <TeamBadge
              team={champion}
              className="trophy-pop relative w-28 h-28 rounded-full overflow-hidden bg-ink-800 ring-4 ring-red-500/60 flex items-center justify-center font-display text-3xl"
            />
          </div>

          <h2 className="champion-name-reveal font-display text-3xl sm:text-4xl leading-tight">{champion.name}</h2>
        </div>
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
      <div className="w-full max-w-[10.5rem] mt-1">
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
    <div className="w-full max-w-[10.5rem] mt-1 relative">
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
        <div
          key={`h-${i}`}
          className="absolute h-px bg-red-500/40"
          style={{ left: 0, width: COLUMN_GAP / 2, top: `${((i + 0.5) / itemCount) * 100}%` }}
        />
      ))}
      {Array.from({ length: pairs }, (_, k) => (
        <div key={`p-${k}`}>
          <div
            className="absolute w-px bg-red-500/40"
            style={{
              left: COLUMN_GAP / 2,
              top: `${((2 * k + 0.5) / itemCount) * 100}%`,
              height: `${(1 / itemCount) * 100}%`,
            }}
          />
          <div
            className="absolute h-px bg-red-500/40"
            style={{ left: COLUMN_GAP / 2, width: COLUMN_GAP / 2, top: `${((2 * k + 1) / itemCount) * 100}%` }}
          />
        </div>
      ))}
    </div>
  );
}

function BracketOutcomeBox({
  match,
  teamsById,
  isOwner,
  rosterA,
  rosterB,
  isBasketball,
  onStart,
  onAddGoal,
  onFinish,
  finishError,
}: {
  match: BracketMatch;
  teamsById: Map<string, GroupTeam>;
  isOwner: boolean;
  rosterA: RosterPlayer[];
  rosterB: RosterPlayer[];
  isBasketball: boolean;
  onStart: (matchId: string) => void;
  onAddGoal: (matchId: string, side: 'a' | 'b', teamId: string, playerId: string, points: number) => void;
  onFinish: (matchId: string) => void;
  finishError: string | null;
}) {
  const teamA = match.team_a_id ? teamsById.get(match.team_a_id) : null;
  const teamB = match.team_b_id ? teamsById.get(match.team_b_id) : null;
  const winner = match.winner_team_id ? teamsById.get(match.winner_team_id) : null;

  if (match.status === 'finished' && match.is_bye && winner) {
    return (
      <div className="w-full bg-ink-900 border border-ink-700 border-l-2 border-l-red-500/50 px-3 py-2">
        <div className="flex items-center gap-2 min-w-0">
          <TeamBadge
            team={winner}
            className="w-7 h-7 rounded-full overflow-hidden bg-ink-800 ring-1 ring-red-500/30 shrink-0 flex items-center justify-center"
          />
          <span className="text-sm text-paper-100 font-semibold truncate">{winner.name}</span>
        </div>
        <p className="text-[11px] text-paper-500 mt-1 pl-9">Slobodan prolaz</p>
      </div>
    );
  }

  if (match.status === 'finished' && teamA && teamB) {
    return (
      <div className="w-full bg-ink-900 border border-ink-700 border-l-2 border-l-red-500/50 px-3 py-2">
        <div className="flex items-center justify-between gap-2 min-w-0">
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <TeamBadge
              team={teamA}
              className="w-6 h-6 rounded-full overflow-hidden bg-ink-800 ring-1 ring-red-500/30 shrink-0 flex items-center justify-center"
            />
            <span
              className={`text-xs truncate ${
                match.winner_team_id === teamA.id ? 'text-paper-100 font-semibold' : 'text-paper-500'
              }`}
            >
              {teamA.name}
            </span>
          </div>
          <span
            className={`font-display text-sm shrink-0 ${
              match.winner_team_id === teamA.id ? 'text-paper-100' : 'text-paper-500'
            }`}
          >
            {match.team_a_goals}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2 min-w-0 mt-1.5">
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <TeamBadge
              team={teamB}
              className="w-6 h-6 rounded-full overflow-hidden bg-ink-800 ring-1 ring-red-500/30 shrink-0 flex items-center justify-center"
            />
            <span
              className={`text-xs truncate ${
                match.winner_team_id === teamB.id ? 'text-paper-100 font-semibold' : 'text-paper-500'
              }`}
            >
              {teamB.name}
            </span>
          </div>
          <span
            className={`font-display text-sm shrink-0 ${
              match.winner_team_id === teamB.id ? 'text-paper-100' : 'text-paper-500'
            }`}
          >
            {match.team_b_goals}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-ink-900 border border-ink-700 px-3 py-2">
      <div className="flex items-center justify-between gap-2 min-w-0">
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          {teamA ? (
            <>
              <TeamBadge
                team={teamA}
                className="w-6 h-6 rounded-full overflow-hidden bg-ink-800 ring-1 ring-red-500/30 shrink-0 flex items-center justify-center"
              />
              <span className="text-xs text-paper-100 truncate">{teamA.name}</span>
            </>
          ) : (
            <span className="text-xs text-paper-700">TBD</span>
          )}
        </div>
        {match.status === 'in_progress' && (
          <span className="text-xs font-display shrink-0">
            {match.team_a_goals}:{match.team_b_goals}
          </span>
        )}
      </div>

      <div className="flex items-center gap-1.5 min-w-0 mt-1.5">
        {teamB ? (
          <>
            <TeamBadge
              team={teamB}
              className="w-6 h-6 rounded-full overflow-hidden bg-ink-800 ring-1 ring-red-500/30 shrink-0 flex items-center justify-center"
            />
            <span className="text-xs text-paper-100 truncate">{teamB.name}</span>
          </>
        ) : (
          <span className="text-xs text-paper-700">TBD</span>
        )}
      </div>

      {isOwner && match.status === 'in_progress' && (
        <div className="flex flex-col gap-1.5 mt-2">
          <ScorerPicker
            idPrefix={`tree-scorer-a-${match.id}`}
            roster={rosterA}
            isBasketball={isBasketball}
            onPick={(playerId, points) => onAddGoal(match.id, 'a', match.team_a_id!, playerId, points)}
          />
          <ScorerPicker
            idPrefix={`tree-scorer-b-${match.id}`}
            roster={rosterB}
            isBasketball={isBasketball}
            onPick={(playerId, points) => onAddGoal(match.id, 'b', match.team_b_id!, playerId, points)}
          />
          <button
            type="button"
            onClick={() => onFinish(match.id)}
            className="btn-solid px-3 py-1.5 text-[10px] uppercase tracking-widest mt-1"
          >
            Završi utakmicu
          </button>
          {finishError && <p className="text-[10px] text-red-400">{finishError}</p>}
        </div>
      )}

      {isOwner && match.status === 'pending' && teamA && teamB && (
        <button
          type="button"
          onClick={() => onStart(match.id)}
          className="btn-solid w-full mt-2 px-3 py-1.5 text-[10px] uppercase tracking-widest"
        >
          Počni utakmicu
        </button>
      )}
    </div>
  );
}

function BracketTree({
  totalRounds,
  matchesByRound,
  teamsById,
  isOwner,
  rosters,
  isBasketball,
  onStart,
  onAddGoal,
  onFinish,
  finishError,
}: {
  totalRounds: number;
  matchesByRound: Map<number, BracketMatch[]>;
  teamsById: Map<string, GroupTeam>;
  isOwner: boolean;
  rosters: Map<string, RosterPlayer[]>;
  isBasketball: boolean;
  onStart: (matchId: string) => void;
  onAddGoal: (matchId: string, side: 'a' | 'b', teamId: string, playerId: string, points: number) => void;
  onFinish: (matchId: string) => void;
  finishError: string | null;
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
          <div style={{ width: ENTRANT_WIDTH }} className="text-center">
            <span className="text-[10px] uppercase tracking-widest text-paper-500">Učesnici</span>
          </div>
          {rounds.map((round) => (
            <div key={round} style={{ width: OUTCOME_WIDTH, marginLeft: COLUMN_GAP }} className="text-center">
              <span className="text-[10px] uppercase tracking-widest text-red-400 font-semibold">
                {roundLabel(round, totalRounds)}
              </span>
            </div>
          ))}
        </div>

        <div className="flex">
          <div className="relative flex flex-col" style={{ height: totalHeight, width: ENTRANT_WIDTH }}>
            {entrants.map((team, i) => (
              <div key={i} className="flex-1 flex items-center px-1">
                <div className="w-full flex items-center gap-2 bg-ink-800 border border-ink-700 px-2.5 py-1.5 min-w-0">
                  {team ? (
                    <>
                      <TeamBadge
                        team={team}
                        className="w-6 h-6 rounded-full overflow-hidden bg-ink-700 ring-1 ring-red-500/30 shrink-0 flex items-center justify-center"
                      />
                      <span className="text-xs text-paper-100 truncate">{team.name}</span>
                    </>
                  ) : (
                    <span className="text-xs text-paper-700">—</span>
                  )}
                </div>
              </div>
            ))}
            <ConnectorOverlay itemCount={entrants.length} />
          </div>

          {rounds.map((round) => {
            const matches = (matchesByRound.get(round) ?? []).slice().sort((a, b) => a.bracket_slot - b.bracket_slot);
            const isLast = round === totalRounds;
            return (
              <div
                key={round}
                className="relative flex flex-col"
                style={{ height: totalHeight, width: OUTCOME_WIDTH, marginLeft: COLUMN_GAP }}
              >
                {matches.map((m) => (
                  <div key={m.id} className="flex-1 flex items-center px-1">
                    <BracketOutcomeBox
                      match={m}
                      teamsById={teamsById}
                      isOwner={isOwner}
                      rosterA={m.team_a_id ? rosters.get(m.team_a_id) ?? [] : []}
                      rosterB={m.team_b_id ? rosters.get(m.team_b_id) ?? [] : []}
                      isBasketball={isBasketball}
                      onStart={onStart}
                      onAddGoal={onAddGoal}
                      onFinish={onFinish}
                      finishError={finishError}
                    />
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

export default function TournamentElimination() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const [tournament, setTournament] = useState<TournamentInfo | null>(null);
  const [teams, setTeams] = useState<GroupTeam[]>([]);
  const [loading, setLoading] = useState(true);

  const [bracketMatches, setBracketMatches] = useState<BracketMatch[]>([]);
  const [loadingBracket, setLoadingBracket] = useState(true);

  const [rosters, setRosters] = useState<Map<string, RosterPlayer[]>>(new Map());
  const [finishError, setFinishError] = useState<string | null>(null);

  const [confirmingDraw, setConfirmingDraw] = useState(false);
  const [drawingBracket, setDrawingBracket] = useState(false);
  const [drawError, setDrawError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    async function load() {
      const { data: tournamentRow } = await supabase
        .from('tournaments')
        .select('id, owner_id, name, crest_url, crest_position_x, crest_position_y, format, sports(name)')
        .eq('id', id)
        .single();

      const row = (tournamentRow as unknown as TournamentInfo) ?? null;
      setTournament(row);

      if (row) {
        const { data: participantRows } = await supabase
          .from('tournament_teams')
          .select('team_id')
          .eq('tournament_id', row.id);
        const teamIds = (participantRows ?? []).map((p) => p.team_id);

        if (teamIds.length) {
          const { data: teamRows } = await supabase
            .from('teams')
            .select('id, name, crest_url, crest_position_x, crest_position_y')
            .in('id', teamIds);
          setTeams((teamRows as GroupTeam[]) ?? []);
        }
      }

      setLoading(false);
    }

    load();
  }, [id]);

  useEffect(() => {
    if (!tournament) return;

    supabase
      .from('tournament_bracket_matches')
      .select('id, round, bracket_slot, team_a_id, team_b_id, team_a_goals, team_b_goals, status, is_bye, winner_team_id')
      .eq('tournament_id', tournament.id)
      .order('round', { ascending: true })
      .order('bracket_slot', { ascending: true })
      .then(({ data }) => {
        setBracketMatches((data as BracketMatch[]) ?? []);
        setLoadingBracket(false);
      });
  }, [tournament]);

  useEffect(() => {
    const neededTeamIds = new Set<string>();
    bracketMatches
      .filter((m) => m.status === 'in_progress')
      .forEach((m) => {
        if (m.team_a_id && !rosters.has(m.team_a_id)) neededTeamIds.add(m.team_a_id);
        if (m.team_b_id && !rosters.has(m.team_b_id)) neededTeamIds.add(m.team_b_id);
      });
    if (!neededTeamIds.size) return;

    const ids = [...neededTeamIds];

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
  }, [bracketMatches, rosters]);

  const teamsById = new Map(teams.map((t) => [t.id, t]));
  const isOwner = user?.id === tournament?.owner_id;
  const bracketExists = bracketMatches.length > 0;
  const isBasketball = !!tournament?.sports?.name && BASKETBALL_SPORT_NAMES.includes(tournament.sports.name);

  async function handleStartBracketMatch(matchId: string) {
    const { error } = await supabase
      .from('tournament_bracket_matches')
      .update({ status: 'in_progress' })
      .eq('id', matchId);
    if (!error) {
      setBracketMatches((prev) => prev.map((m) => (m.id === matchId ? { ...m, status: 'in_progress' } : m)));
    }
  }

  async function handleAddGoal(matchId: string, side: 'a' | 'b', teamId: string, playerId: string, points: number) {
    const match = bracketMatches.find((m) => m.id === matchId);
    if (!match) return;

    const { error: goalError } = await supabase
      .from('tournament_bracket_goals')
      .insert({ match_id: matchId, team_id: teamId, player_id: playerId, points });
    if (goalError) return;

    const field = side === 'a' ? 'team_a_goals' : 'team_b_goals';
    const newValue = (side === 'a' ? match.team_a_goals : match.team_b_goals) + points;

    const { error } = await supabase.from('tournament_bracket_matches').update({ [field]: newValue }).eq('id', matchId);
    if (!error) {
      setBracketMatches((prev) => prev.map((m) => (m.id === matchId ? { ...m, [field]: newValue } : m)));
    }
  }

  async function handleFinishBracketMatch(matchId: string) {
    if (!tournament) return;
    const match = bracketMatches.find((m) => m.id === matchId);
    if (!match) return;

    if (match.team_a_goals === match.team_b_goals) {
      setFinishError('Meč ne može da se završi nerešeno u eliminacionoj fazi. Podesi rezultat.');
      return;
    }
    setFinishError(null);

    const winnerId = match.team_a_goals > match.team_b_goals ? match.team_a_id : match.team_b_id;
    if (!winnerId) return;

    const { error } = await supabase
      .from('tournament_bracket_matches')
      .update({ status: 'finished', winner_team_id: winnerId, finished_at: new Date().toISOString() })
      .eq('id', matchId);
    if (error) return;

    setBracketMatches((prev) => prev.map((m) => (m.id === matchId ? { ...m, status: 'finished', winner_team_id: winnerId } : m)));

    const totalRounds = Math.max(...bracketMatches.map((m) => m.round));
    if (match.round < totalRounds) {
      const nextRound = match.round + 1;
      const nextSlot = Math.floor(match.bracket_slot / 2);
      const field = match.bracket_slot % 2 === 0 ? 'team_a_id' : 'team_b_id';

      const { error: propError } = await supabase
        .from('tournament_bracket_matches')
        .update({ [field]: winnerId })
        .eq('tournament_id', tournament.id)
        .eq('round', nextRound)
        .eq('bracket_slot', nextSlot);

      if (!propError) {
        setBracketMatches((prev) =>
          prev.map((m) => (m.round === nextRound && m.bracket_slot === nextSlot ? { ...m, [field]: winnerId } : m))
        );
      }
    }
  }

  async function handleSetDraw() {
    if (!tournament) return;
    if (teams.length < 2) {
      setDrawError('Potrebna su bar 2 prijavljena tima za žreb.');
      return;
    }

    setDrawingBracket(true);
    setDrawError(null);

    const shuffled = [...teams];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    const totalTeams = shuffled.length;
    const bracketSize = nextPowerOfTwo(totalTeams);
    const order = standardBracketOrder(bracketSize);
    const slotTeams: (GroupTeam | null)[] = order.map((seed) => (seed <= totalTeams ? shuffled[seed - 1] : null));

    const totalBracketRounds = Math.log2(bracketSize);
    let currentRoundTeams: (GroupTeam | null)[] = slotTeams;
    const rows: {
      tournament_id: string;
      round: number;
      bracket_slot: number;
      team_a_id: string | null;
      team_b_id: string | null;
      status: string;
      is_bye: boolean;
      winner_team_id: string | null;
      finished_at: string | null;
    }[] = [];

    for (let round = 1; round <= totalBracketRounds; round++) {
      const matchCount = currentRoundTeams.length / 2;
      const nextRoundTeams: (GroupTeam | null)[] = [];

      for (let slot = 0; slot < matchCount; slot++) {
        const teamA = currentRoundTeams[slot * 2];
        const teamB = currentRoundTeams[slot * 2 + 1];

        let isBye = false;
        let winner: GroupTeam | null = null;

        if (round === 1) {
          const bothPresent = !!teamA && !!teamB;
          isBye = !bothPresent && !!(teamA || teamB);
          winner = isBye ? teamA ?? teamB ?? null : null;
        }

        rows.push({
          tournament_id: tournament.id,
          round,
          bracket_slot: slot,
          team_a_id: teamA?.id ?? null,
          team_b_id: teamB?.id ?? null,
          status: isBye ? 'finished' : 'pending',
          is_bye: isBye,
          winner_team_id: winner?.id ?? null,
          finished_at: isBye ? new Date().toISOString() : null,
        });

        nextRoundTeams.push(round === 1 && isBye ? winner : null);
      }

      currentRoundTeams = nextRoundTeams;
    }

    const { data: inserted, error } = await supabase
      .from('tournament_bracket_matches')
      .insert(rows)
      .select('id, round, bracket_slot, team_a_id, team_b_id, team_a_goals, team_b_goals, status, is_bye, winner_team_id');

    if (error || !inserted) {
      setDrawingBracket(false);
      setDrawError('Postavljanje žreba nije uspelo. Pokušaj ponovo.');
      return;
    }

    await supabase.from('tournaments').update({ roster_locked: true }).eq('id', tournament.id);

    setDrawingBracket(false);
    setBracketMatches(inserted as BracketMatch[]);
    setConfirmingDraw(false);
  }

  const totalRounds = bracketMatches.length ? Math.max(...bracketMatches.map((m) => m.round)) : 0;
  const matchesByRound = new Map<number, BracketMatch[]>();
  bracketMatches.forEach((m) => {
    if (!matchesByRound.has(m.round)) matchesByRound.set(m.round, []);
    matchesByRound.get(m.round)!.push(m);
  });
  const finalMatch = bracketMatches.find((m) => m.round === totalRounds);
  const champion = finalMatch?.status === 'finished' && finalMatch.winner_team_id ? teamsById.get(finalMatch.winner_team_id) : null;

  return (
    <div className="min-h-screen flex flex-col bg-ink-950 text-paper-100 overflow-x-hidden">
      <div className="grain" />
      <SiteHeader />

      <main className="flex-1 pt-16 flex flex-col">
        {loading ? (
          <>
            <CompactHeroSkeleton />
            <section className="flex-1 max-w-6xl mx-auto px-6 py-12 sm:py-16 w-full">
              <BracketSkeleton />
            </section>
          </>
        ) : !tournament ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-6 px-6 text-center">
            <p className="text-paper-500">Turnir nije pronađen.</p>
            <Link to="/turniri" className="btn-line px-6 py-3 text-sm uppercase tracking-widest">
              Nazad na turnire
            </Link>
          </div>
        ) : (
          <>
            <section className="bg-ink-900 border-b border-ink-700">
              <div className="max-w-6xl mx-auto px-6 py-10 flex flex-wrap items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full overflow-hidden bg-ink-800 ring-2 ring-red-500/40 flex items-center justify-center shrink-0">
                    {tournament.crest_url ? (
                      <img
                        src={tournament.crest_url}
                        alt=""
                        className="w-full h-full object-cover"
                        style={{ objectPosition: `${tournament.crest_position_x}% ${tournament.crest_position_y}%` }}
                      />
                    ) : (
                      <span className="font-display text-xl text-paper-500">{tournament.name[0]?.toUpperCase()}</span>
                    )}
                  </div>
                  <div>
                    <span className="text-xs uppercase tracking-widest text-red-400 font-semibold">
                      {tournament.format === 'kup' ? 'Kup' : 'Eliminaciona faza'}
                    </span>
                    <h1 className="font-display text-2xl sm:text-3xl leading-tight">{tournament.name}</h1>
                  </div>
                </div>

                <Link
                  to={`/turniri/${tournament.id}`}
                  className="btn-line px-5 py-2.5 text-xs uppercase tracking-widest inline-flex items-center justify-center gap-2"
                >
                  Nazad na turnir
                </Link>
              </div>
            </section>

            <section className="flex-1 max-w-6xl mx-auto px-6 py-12 sm:py-16 w-full">
              {loadingBracket ? (
                <BracketSkeleton />
              ) : bracketExists ? (
                <>
                  {champion && <ChampionBanner champion={champion} />}

                  <BracketTree
                    totalRounds={totalRounds}
                    matchesByRound={matchesByRound}
                    teamsById={teamsById}
                    isOwner={isOwner}
                    rosters={rosters}
                    isBasketball={isBasketball}
                    onStart={handleStartBracketMatch}
                    onAddGoal={handleAddGoal}
                    onFinish={handleFinishBracketMatch}
                    finishError={finishError}
                  />
                </>
              ) : tournament.format === 'kup' ? (
                isOwner ? (
                  teams.length < 2 ? (
                    <p className="text-sm text-paper-500 text-center">
                      Potrebno je najmanje 2 prijavljena tima da bi se postavio žreb.
                    </p>
                  ) : (
                    <div className="max-w-md mx-auto text-center">
                      <p className="text-sm text-paper-300 mb-4">
                        Kada su svi timovi prijavljeni, postavi žreb. Timovi će nasumično biti raspoređeni jedni
                        protiv drugih. Nakon toga, prijave, izmene turnira i povlačenja timova više neće biti mogući.
                      </p>
                      {confirmingDraw ? (
                        <div className="flex items-center justify-center gap-3">
                          <button
                            type="button"
                            onClick={handleSetDraw}
                            disabled={drawingBracket}
                            className="px-5 py-2.5 text-xs uppercase tracking-widest text-paper-100 bg-red-500 hover:bg-red-400 transition-colors"
                          >
                            {drawingBracket ? 'Kreiranje…' : 'Potvrdi'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmingDraw(false)}
                            disabled={drawingBracket}
                            className="text-xs uppercase tracking-widest text-paper-500 hover:text-paper-100 transition-colors"
                          >
                            Otkaži
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmingDraw(true)}
                          className="btn-solid px-6 py-3 text-sm uppercase tracking-widest inline-flex items-center justify-center gap-2"
                        >
                          Postavi žreb
                        </button>
                      )}
                      {drawError && <p className="text-sm text-red-400 mt-3">{drawError}</p>}
                    </div>
                  )
                ) : (
                  <p className="text-sm text-paper-500 text-center">Žreb za kup još uvek nije postavljen.</p>
                )
              ) : (
                <div className="flex flex-col items-center text-center gap-6">
                  <p className="text-sm text-paper-500">
                    Grupna faza još uvek nije zaključena. Eliminaciona faza počinje kada je organizator zaključi.
                  </p>
                  <Link
                    to={`/turniri/${tournament.id}/grupe`}
                    className="btn-line px-6 py-3 text-sm uppercase tracking-widest inline-flex items-center justify-center gap-2"
                  >
                    Idi na grupnu fazu
                  </Link>
                </div>
              )}
            </section>
          </>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
