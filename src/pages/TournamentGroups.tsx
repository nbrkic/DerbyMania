import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../lib/auth-context';
import { supabase } from '../lib/supabase';
import { SiteHeader } from '../components/SiteHeader';
import { SiteFooter } from '../components/SiteFooter';
import { Dropdown } from '../components/Dropdown';

type TournamentInfo = {
  id: string;
  owner_id: string;
  name: string;
  crest_url: string | null;
  crest_position_x: number;
  crest_position_y: number;
  format: string;
  status: string;
  sports: { name: string } | null;
};

type GroupTeam = {
  id: string;
  name: string;
  crest_url: string | null;
  crest_position_x: number;
  crest_position_y: number;
};

type TournamentGroup = { id: string; name: string; teamIds: string[] };

type MatchStatus = 'in_progress' | 'finished';

type TournamentMatch = {
  id: string;
  group_id: string;
  team_a_id: string;
  team_b_id: string;
  team_a_goals: number;
  team_b_goals: number;
  status: MatchStatus;
};

type RosterPlayer = { id: string; full_name: string | null };

type Standing = { team: GroupTeam; played: number; scored: number; conceded: number; points: number };

function computeStandings(teams: GroupTeam[], matches: TournamentMatch[]): Standing[] {
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

function describeGroupSizes(teamCount: number, groupCount: number) {
  if (!groupCount) return '';
  const base = Math.floor(teamCount / groupCount);
  const remainder = teamCount % groupCount;
  if (remainder === 0) return `${groupCount} grupe, po ${base} tima`;
  return `${remainder} grupe po ${base + 1} tima, ${groupCount - remainder} grupe po ${base} tima`;
}

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

function BallIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5 8.2 10.2l1.5 4.5h4.6l1.5-4.5Z" strokeLinejoin="round" />
      <path d="M12 3v4.5M6.2 8l2 2.2M17.8 8l-2 2.2M9.7 14.7 8 19M14.3 14.7 16 19" strokeLinecap="round" />
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

function GroupTable({ name, teams, matches }: { name: string; teams: GroupTeam[]; matches: TournamentMatch[] }) {
  const standings = computeStandings(teams, matches);

  return (
    <div className="bg-ink-900 border border-ink-700 border-t-2 border-t-red-500/50 overflow-hidden">
      <div className="px-5 py-3 border-b border-ink-700">
        <span className="font-display text-lg leading-tight">{name}</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="text-[10px] uppercase tracking-widest text-paper-500">
              <th className="text-left font-medium pl-5 pr-2 py-2 w-7">#</th>
              <th className="text-left font-medium px-2 py-2">Tim</th>
              <th className="text-center font-medium px-2 py-2" title="Odigrane utakmice">OU</th>
              <th className="text-center font-medium px-2 py-2" title="Dati golovi">DG</th>
              <th className="text-center font-medium px-2 py-2" title="Primljeni golovi">PG</th>
              <th className="text-center font-medium pl-2 pr-5 py-2" title="Poeni">P</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-800">
            {standings.map((s, index) => (
              <tr key={s.team.id} className="hover:bg-ink-800 transition-colors">
                <td className="pl-5 pr-2 py-2.5 text-paper-500">{index + 1}</td>
                <td className="px-2 py-2.5 min-w-0">
                  <Link to={`/timovi/${s.team.id}`} className="group flex items-center gap-2 min-w-0">
                    <TeamBadge team={s.team} />
                    <span className="truncate text-paper-100 transition-colors duration-200 group-hover:text-red-400">
                      {s.team.name}
                    </span>
                  </Link>
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
}: {
  roster: RosterPlayer[];
  onPick: (playerId: string) => void | Promise<void>;
  idPrefix: string;
}) {
  const [selectedId, setSelectedId] = useState('');

  if (!roster.length) {
    return <p className="text-[11px] text-paper-700 mt-1">Nema igrača u timu</p>;
  }

  return (
    <div className="w-full max-w-[10.5rem] mt-1 relative">
      <BallIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-red-400 pointer-events-none" />
      <Dropdown
        id={idPrefix}
        value={selectedId}
        onChange={(playerId) => {
          onPick(playerId);
          setSelectedId('');
        }}
        placeholder="Strelac"
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
  groupName,
  isOwner,
  rosterA,
  rosterB,
  onAddGoal,
  onFinishMatch,
}: {
  match: TournamentMatch;
  teamA: GroupTeam;
  teamB: GroupTeam;
  groupName: string;
  isOwner: boolean;
  rosterA: RosterPlayer[];
  rosterB: RosterPlayer[];
  onAddGoal: (matchId: string, side: 'a' | 'b', teamId: string, playerId: string) => void;
  onFinishMatch: (matchId: string) => void;
}) {
  return (
    <div className="relative bg-ink-900 border border-red-500/40 overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-red-500 to-transparent" />
      <div className="px-6 py-6">
        <div className="flex items-center justify-center gap-2 mb-5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
          </span>
          <span className="text-[11px] uppercase tracking-widest text-red-400 font-semibold">Uživo · {groupName}</span>
        </div>

        <div className="flex items-center justify-between gap-3 sm:gap-6">
          <div className="flex flex-col items-center gap-2 flex-1 min-w-0">
            <TeamBadge team={teamA} className="w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden bg-ink-800 ring-2 ring-red-500/30 flex items-center justify-center shrink-0 font-display text-xl" />
            <span className="text-sm text-paper-100 text-center truncate max-w-full">{teamA.name}</span>
            {isOwner && (
              <ScorerPicker
                idPrefix={`scorer-a-${match.id}`}
                roster={rosterA}
                onPick={(playerId) => onAddGoal(match.id, 'a', match.team_a_id, playerId)}
              />
            )}
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <span className="font-display text-4xl sm:text-5xl leading-none">{match.team_a_goals}</span>
            <span className="font-display text-2xl sm:text-3xl text-paper-700">:</span>
            <span className="font-display text-4xl sm:text-5xl leading-none">{match.team_b_goals}</span>
          </div>

          <div className="flex flex-col items-center gap-2 flex-1 min-w-0">
            <TeamBadge team={teamB} className="w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden bg-ink-800 ring-2 ring-red-500/30 flex items-center justify-center shrink-0 font-display text-xl" />
            <span className="text-sm text-paper-100 text-center truncate max-w-full">{teamB.name}</span>
            {isOwner && (
              <ScorerPicker
                idPrefix={`scorer-b-${match.id}`}
                roster={rosterB}
                onPick={(playerId) => onAddGoal(match.id, 'b', match.team_b_id, playerId)}
              />
            )}
          </div>
        </div>

        {isOwner && (
          <div className="flex justify-center mt-6">
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
  groupName,
}: {
  match: TournamentMatch;
  teamA: GroupTeam;
  teamB: GroupTeam;
  groupName: string;
}) {
  return (
    <div className="bg-ink-900 border border-ink-700 px-4 py-3">
      {/* mobile: group name centered above the row */}
      <div className="sm:hidden">
        <div className="text-center mb-1.5">
          <span className="text-[10px] uppercase tracking-widest text-paper-700">{groupName}</span>
        </div>
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
      </div>

      {/* larger screens: group name as a left-side tag, single row */}
      <div className="hidden sm:flex items-center gap-3">
        <span className="text-[10px] uppercase tracking-widest text-paper-700 w-16 sm:w-20 shrink-0 truncate">
          {groupName}
        </span>
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
    </div>
  );
}

export default function TournamentGroups() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const [tournament, setTournament] = useState<TournamentInfo | null>(null);
  const [teams, setTeams] = useState<GroupTeam[]>([]);
  const [loading, setLoading] = useState(true);

  const [groups, setGroups] = useState<TournamentGroup[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [numGroups, setNumGroups] = useState('2');
  const [generatingGroups, setGeneratingGroups] = useState(false);
  const [groupsError, setGroupsError] = useState<string | null>(null);
  const [confirmingResetGroups, setConfirmingResetGroups] = useState(false);
  const [resettingGroups, setResettingGroups] = useState(false);

  const [matches, setMatches] = useState<TournamentMatch[]>([]);
  const [rosters, setRosters] = useState<Map<string, RosterPlayer[]>>(new Map());
  const fetchedRosterTeamIds = useRef(new Set<string>());
  const [teamAId, setTeamAId] = useState('');
  const [teamBId, setTeamBId] = useState('');
  const [showNewMatchForm, setShowNewMatchForm] = useState(false);

  const [bracketExists, setBracketExists] = useState(false);
  const [loadingBracketStatus, setLoadingBracketStatus] = useState(true);
  const [qualifiersPerGroup, setQualifiersPerGroup] = useState('2');
  const [concluding, setConcluding] = useState(false);
  const [concludeError, setConcludeError] = useState<string | null>(null);
  const [creatingMatch, setCreatingMatch] = useState(false);
  const [newMatchError, setNewMatchError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    async function load() {
      const { data: tournamentRow } = await supabase
        .from('tournaments')
        .select('id, owner_id, name, crest_url, crest_position_x, crest_position_y, format, status, sports(name)')
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
        } else {
          setTeams([]);
        }
      }

      setLoading(false);
    }

    load();
  }, [id]);

  useEffect(() => {
    if (!tournament) return;

    async function loadGroups() {
      const { data: groupRows } = await supabase
        .from('tournament_groups')
        .select('id, name')
        .eq('tournament_id', tournament!.id)
        .order('created_at', { ascending: true });

      const groupList = groupRows ?? [];
      if (!groupList.length) {
        setGroups([]);
        setLoadingGroups(false);
        return;
      }

      const { data: groupTeamRows } = await supabase
        .from('tournament_group_teams')
        .select('group_id, team_id')
        .eq('tournament_id', tournament!.id);

      const teamIdsByGroup = new Map<string, string[]>();
      (groupTeamRows ?? []).forEach((r) => {
        if (!teamIdsByGroup.has(r.group_id)) teamIdsByGroup.set(r.group_id, []);
        teamIdsByGroup.get(r.group_id)!.push(r.team_id);
      });

      setGroups(groupList.map((g) => ({ id: g.id, name: g.name, teamIds: teamIdsByGroup.get(g.id) ?? [] })));
      setLoadingGroups(false);
    }

    loadGroups();
  }, [tournament]);

  useEffect(() => {
    if (!tournament) return;

    supabase
      .from('tournament_matches')
      .select('id, group_id, team_a_id, team_b_id, team_a_goals, team_b_goals, status')
      .eq('tournament_id', tournament.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => setMatches((data as TournamentMatch[]) ?? []));
  }, [tournament]);

  useEffect(() => {
    if (!tournament) return;

    supabase
      .from('tournament_bracket_matches')
      .select('id', { count: 'exact', head: true })
      .eq('tournament_id', tournament.id)
      .then(({ count }) => {
        setBracketExists((count ?? 0) > 0);
        setLoadingBracketStatus(false);
      });
  }, [tournament]);

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

  async function handleGenerateGroups() {
    if (!tournament) return;
    const n = Number(numGroups);

    if (!n || n < 2) {
      setGroupsError('Izaberi broj grupa.');
      return;
    }
    if (n > Math.floor(teams.length / 2)) {
      setGroupsError('Previše grupa za trenutan broj prijavljenih timova.');
      return;
    }

    setGeneratingGroups(true);
    setGroupsError(null);

    const shuffledTeamIds = teams.map((t) => t.id);
    for (let i = shuffledTeamIds.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledTeamIds[i], shuffledTeamIds[j]] = [shuffledTeamIds[j], shuffledTeamIds[i]];
    }

    const groupNames = Array.from({ length: n }, (_, i) => `Grupa ${String.fromCharCode(65 + i)}`);

    const { data: insertedGroups, error: groupsInsertError } = await supabase
      .from('tournament_groups')
      .insert(groupNames.map((name) => ({ tournament_id: tournament.id, name })))
      .select('id, name');

    if (groupsInsertError || !insertedGroups) {
      setGeneratingGroups(false);
      setGroupsError('Kreiranje grupa nije uspelo. Pokušaj ponovo.');
      return;
    }

    const assignments = shuffledTeamIds.map((teamId, index) => ({
      tournament_id: tournament.id,
      group_id: insertedGroups[index % insertedGroups.length].id,
      team_id: teamId,
    }));

    const { error: assignError } = await supabase.from('tournament_group_teams').insert(assignments);

    if (assignError) {
      setGeneratingGroups(false);
      setGroupsError('Raspoređivanje timova u grupe nije uspelo. Pokušaj ponovo.');
      return;
    }

    setGroups(
      insertedGroups.map((g) => ({
        id: g.id,
        name: g.name,
        teamIds: assignments.filter((a) => a.group_id === g.id).map((a) => a.team_id),
      }))
    );
    setGeneratingGroups(false);
  }

  async function handleResetGroups() {
    if (!tournament) return;
    setResettingGroups(true);
    const { error } = await supabase.from('tournament_groups').delete().eq('tournament_id', tournament.id);
    setResettingGroups(false);

    if (error) {
      setGroupsError('Resetovanje grupa nije uspelo. Pokušaj ponovo.');
      return;
    }
    setGroups([]);
    setMatches([]);
    setConfirmingResetGroups(false);
  }

  async function handleConcludeGroupStage() {
    if (!tournament) return;
    const n = Number(qualifiersPerGroup);

    if (!n || n < 1) {
      setConcludeError('Izaberi broj timova koji prolazi dalje.');
      return;
    }
    if (!groups.length) {
      setConcludeError('Prvo moraju biti formirane grupe.');
      return;
    }

    const teamsByIdLocal = new Map(teams.map((t) => [t.id, t]));
    const qualifiers: { team: GroupTeam; groupIndex: number; rankInGroup: number }[] = [];
    groups.forEach((group, groupIndex) => {
      const groupTeams = group.teamIds.map((tid) => teamsByIdLocal.get(tid)).filter((t): t is GroupTeam => !!t);
      const groupMatchesForGroup = matches.filter((m) => m.group_id === group.id);
      const standings = computeStandings(groupTeams, groupMatchesForGroup);
      standings.slice(0, n).forEach((s, rankInGroup) => {
        qualifiers.push({ team: s.team, groupIndex, rankInGroup });
      });
    });

    if (qualifiers.length < 2) {
      setConcludeError('Potrebno je bar 2 tima da bi se formirala eliminaciona faza.');
      return;
    }

    qualifiers.sort((a, b) => a.rankInGroup - b.rankInGroup || a.groupIndex - b.groupIndex);

    setConcluding(true);
    setConcludeError(null);

    const totalQualifiers = qualifiers.length;
    const bracketSize = nextPowerOfTwo(totalQualifiers);
    const order = standardBracketOrder(bracketSize);
    const slotTeams: (GroupTeam | null)[] = order.map((seed) =>
      seed <= totalQualifiers ? qualifiers[seed - 1].team : null
    );

    const totalRounds = Math.log2(bracketSize);
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

    for (let round = 1; round <= totalRounds; round++) {
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

    const { error } = await supabase.from('tournament_bracket_matches').insert(rows);

    setConcluding(false);

    if (error) {
      setConcludeError('Formiranje eliminacione faze nije uspelo. Pokušaj ponovo.');
      return;
    }

    setBracketExists(true);
  }

  async function handleCreateMatch() {
    if (!tournament || !teamAId || !teamBId) return;
    const groupOfA = groups.find((g) => g.teamIds.includes(teamAId));
    if (!groupOfA) {
      setNewMatchError('Izabrani tim nije raspoređen ni u jednu grupu.');
      return;
    }

    setCreatingMatch(true);
    setNewMatchError(null);

    const { data, error } = await supabase
      .from('tournament_matches')
      .insert({ tournament_id: tournament.id, group_id: groupOfA.id, team_a_id: teamAId, team_b_id: teamBId })
      .select('id, group_id, team_a_id, team_b_id, team_a_goals, team_b_goals, status')
      .single();

    setCreatingMatch(false);

    if (error || !data) {
      setNewMatchError('Kreiranje utakmice nije uspelo. Pokušaj ponovo.');
      return;
    }

    setMatches((prev) => [data as TournamentMatch, ...prev]);
    setShowNewMatchForm(false);
    setTeamAId('');
    setTeamBId('');
  }

  async function handleAddGoal(matchId: string, side: 'a' | 'b', teamId: string, playerId: string) {
    const match = matches.find((m) => m.id === matchId);
    if (!match) return;

    const { error: goalError } = await supabase
      .from('tournament_match_goals')
      .insert({ match_id: matchId, team_id: teamId, player_id: playerId });
    if (goalError) return;

    const field = side === 'a' ? 'team_a_goals' : 'team_b_goals';
    const newValue = (side === 'a' ? match.team_a_goals : match.team_b_goals) + 1;

    const { error } = await supabase.from('tournament_matches').update({ [field]: newValue }).eq('id', matchId);
    if (!error) {
      setMatches((prev) => prev.map((m) => (m.id === matchId ? { ...m, [field]: newValue } : m)));
    }
  }

  async function handleFinishMatch(matchId: string) {
    const { error } = await supabase
      .from('tournament_matches')
      .update({ status: 'finished', finished_at: new Date().toISOString() })
      .eq('id', matchId);

    if (!error) {
      setMatches((prev) => prev.map((m) => (m.id === matchId ? { ...m, status: 'finished' } : m)));
    }
  }

  const teamsById = new Map(teams.map((t) => [t.id, t]));
  const groupIdByTeamId = new Map<string, string>();
  const groupNameById = new Map(groups.map((g) => [g.id, g.name]));
  groups.forEach((g) => g.teamIds.forEach((tid) => groupIdByTeamId.set(tid, g.id)));

  const maxGroups = Math.floor(teams.length / 2);
  const groupNumberOptions = Array.from({ length: Math.max(0, maxGroups - 1) }, (_, i) => {
    const value = String(i + 2);
    return { value, label: value };
  });
  const isOwner = user?.id === tournament?.owner_id;

  const teamAOptions = groups.flatMap((g) =>
    g.teamIds.map((tid) => teamsById.get(tid)).filter((t): t is GroupTeam => !!t).map((t) => ({ value: t.id, label: `${t.name} (${g.name})` }))
  );
  const teamBOptions = teamAId
    ? (groups.find((g) => g.teamIds.includes(teamAId))?.teamIds ?? [])
        .filter((tid) => tid !== teamAId)
        .map((tid) => teamsById.get(tid))
        .filter((t): t is GroupTeam => !!t)
        .map((t) => ({ value: t.id, label: t.name }))
    : [];

  const inProgressMatches = matches.filter((m) => m.status === 'in_progress');
  const finishedMatches = matches.filter((m) => m.status === 'finished');

  const minGroupSize = groups.length ? Math.min(...groups.map((g) => g.teamIds.length)) : 0;
  const qualifiersOptions = Array.from({ length: Math.max(0, minGroupSize) }, (_, i) => {
    const value = String(i + 1);
    return { value, label: value };
  });

  return (
    <div className="min-h-screen flex flex-col bg-ink-950 text-paper-100 overflow-x-hidden">
      <div className="grain" />
      <SiteHeader />

      <main className="flex-1 pt-16 flex flex-col">
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-paper-500">Učitavanje…</p>
          </div>
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
                    <span className="text-xs uppercase tracking-widest text-red-400 font-semibold">Grupna faza</span>
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
              {loadingGroups ? (
                <p className="text-sm text-paper-500">Učitavanje…</p>
              ) : groups.length > 0 ? (
                <>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {groups.map((group) => (
                      <GroupTable
                        key={group.id}
                        name={group.name}
                        teams={group.teamIds.map((tid) => teamsById.get(tid)).filter((t): t is GroupTeam => !!t)}
                        matches={matches.filter((m) => m.group_id === group.id)}
                      />
                    ))}
                  </div>

                  <div className="mt-16">
                    <span className="text-xs uppercase tracking-widest text-red-400 font-semibold">Utakmice</span>
                    <div className="w-10 h-0.5 bg-red-500 mt-3 mb-6" />

                    {isOwner && bracketExists && (
                      <p className="text-xs text-paper-500 mb-8">
                        Grupna faza je zaključena, nove utakmice više ne mogu da se prave.
                      </p>
                    )}

                    {isOwner && !bracketExists && (
                      <div className="mb-8">
                        {showNewMatchForm ? (
                          <div className="max-w-md bg-ink-900 border border-ink-700 px-5 py-5">
                            <div className="flex flex-col sm:flex-row items-center gap-3">
                              <div className="w-full sm:flex-1">
                                <Dropdown
                                  id="match-team-a"
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
                                  id="match-team-b"
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
                              groupName={groupNameById.get(m.group_id) ?? ''}
                              isOwner={isOwner}
                              rosterA={rosters.get(m.team_a_id) ?? []}
                              rosterB={rosters.get(m.team_b_id) ?? []}
                              onAddGoal={handleAddGoal}
                              onFinishMatch={handleFinishMatch}
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
                                groupName={groupNameById.get(m.group_id) ?? ''}
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

                  {(isOwner || bracketExists) && (
                    <div className="mt-16">
                      <span className="text-xs uppercase tracking-widest text-red-400 font-semibold">Eliminaciona faza</span>
                      <div className="w-10 h-0.5 bg-red-500 mt-3 mb-6" />

                      {loadingBracketStatus ? (
                        <p className="text-sm text-paper-500">Učitavanje…</p>
                      ) : bracketExists ? (
                        <div className="bg-ink-900 border border-ink-700 px-5 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <p className="text-sm text-paper-300">
                            Grupna faza je zaključena. {tournament.status === 'finished' ? 'Eliminaciona faza je završena.' : 'Eliminaciona faza je u toku.'}
                          </p>
                          <Link
                            to={`/turniri/${tournament.id}/eliminacija`}
                            className="btn-solid px-5 py-2.5 text-xs uppercase tracking-widest inline-flex items-center justify-center gap-2 whitespace-nowrap"
                          >
                            Pogledaj eliminacionu fazu
                          </Link>
                        </div>
                      ) : !isOwner ? null : minGroupSize < 1 ? (
                        <p className="text-sm text-paper-500">Grupe nemaju dovoljno timova.</p>
                      ) : (
                        <div className="max-w-sm">
                          <p className="text-sm text-paper-300 mb-4">
                            Kada su odigrane sve željene utakmice u grupama, zaključi grupnu fazu i izaberi koliko
                            timova iz svake grupe prolazi u eliminacionu fazu.
                          </p>
                          <div className="flex flex-col sm:flex-row items-center gap-3">
                            <div className="w-full sm:w-40">
                              <Dropdown
                                id="qualifiers-per-group"
                                value={qualifiersPerGroup}
                                onChange={setQualifiersPerGroup}
                                options={qualifiersOptions}
                              />
                            </div>
                            <button
                              type="button"
                              onClick={handleConcludeGroupStage}
                              disabled={concluding}
                              className="btn-solid w-full sm:w-auto px-5 py-2.5 text-xs uppercase tracking-widest whitespace-nowrap"
                            >
                              {concluding ? 'Kreiranje…' : 'Zaključi grupnu fazu'}
                            </button>
                          </div>
                          {concludeError && <p className="text-sm text-red-400 mt-3">{concludeError}</p>}
                        </div>
                      )}
                    </div>
                  )}

                  {isOwner && (
                    <div className="mt-16 border border-red-500/20 bg-ink-900/60">
                      <div className="px-6 py-4 border-b border-red-500/20">
                        <span className="text-xs uppercase tracking-widest text-red-400 font-semibold">Opasna zona</span>
                      </div>

                      <div className="px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                          <p className="text-sm font-medium text-paper-100">Resetuj grupe</p>
                          <p className="text-xs text-paper-500 mt-1">
                            Ovo trajno briše sve grupe i sve odigrane i tekuće utakmice u grupnoj fazi.
                          </p>
                          {groupsError && <p className="text-xs text-red-400 mt-2">{groupsError}</p>}
                        </div>
                        {confirmingResetGroups ? (
                          <div className="flex items-center gap-3 shrink-0">
                            <button
                              type="button"
                              onClick={handleResetGroups}
                              disabled={resettingGroups}
                              className="px-4 py-2 text-xs uppercase tracking-widest text-paper-100 bg-red-500 hover:bg-red-400 transition-colors"
                            >
                              {resettingGroups ? 'Resetovanje…' : 'Potvrdi'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmingResetGroups(false)}
                              disabled={resettingGroups}
                              className="text-xs uppercase tracking-widest text-paper-500 hover:text-paper-100 transition-colors"
                            >
                              Otkaži
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmingResetGroups(true)}
                            className="shrink-0 px-4 py-2 text-xs uppercase tracking-widest text-red-400 border border-red-500/30 hover:bg-red-500/10 transition-colors"
                          >
                            Resetuj grupe
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </>
              ) : isOwner ? (
                maxGroups < 2 ? (
                  <p className="text-sm text-paper-500">
                    Potrebno je najmanje 4 prijavljena tima da bi se formirale grupe.
                  </p>
                ) : (
                  <div className="max-w-sm">
                    <div className="flex flex-col sm:flex-row items-center gap-3">
                      <div className="w-full sm:w-40">
                        <Dropdown id="num-groups" value={numGroups} onChange={setNumGroups} options={groupNumberOptions} />
                      </div>
                      <button
                        type="button"
                        onClick={handleGenerateGroups}
                        disabled={generatingGroups}
                        className="btn-solid w-full sm:w-auto px-5 py-2.5 text-xs uppercase tracking-widest whitespace-nowrap"
                      >
                        {generatingGroups ? 'Kreiranje…' : 'Napravi grupe'}
                      </button>
                    </div>
                    {numGroups && (
                      <p className="text-xs text-paper-500 mt-3">{describeGroupSizes(teams.length, Number(numGroups))}</p>
                    )}
                    {groupsError && <p className="text-sm text-red-400 mt-3">{groupsError}</p>}
                  </div>
                )
              ) : (
                <p className="text-sm text-paper-500">Grupe još uvek nisu formirane.</p>
              )}
            </section>
          </>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
