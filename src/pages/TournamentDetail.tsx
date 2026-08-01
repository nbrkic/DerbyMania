import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../lib/auth-context';
import { supabase } from '../lib/supabase';
import { SiteHeader } from '../components/SiteHeader';
import { SiteFooter } from '../components/SiteFooter';
import { Dropdown } from '../components/Dropdown';
import { TeamRow, type Team } from './Teams';
import { BASKETBALL_SPORT_NAMES } from '../lib/positions';
import { DetailHeroSkeleton, StatBlockSkeleton, RowSkeletonGrid } from '../components/Skeleton';
import { GroupsTabContent } from '../components/GroupsTabContent';
import { EliminationTabContent } from '../components/EliminationTabContent';
import { LeagueTabContent } from '../components/LeagueTabContent';

type TabId = 'pocetna' | 'grupna' | 'eliminacija' | 'liga' | 'kup';

const FORMAT_LABELS: Record<string, string> = {
  grupe_i_eliminacija: 'Grupna faza + eliminacija',
  liga: 'Liga',
  kup: 'Kup',
};

type TournamentDetail = {
  id: string;
  owner_id: string;
  name: string;
  crest_url: string | null;
  crest_position_x: number;
  crest_position_y: number;
  banner_url: string | null;
  city: string | null;
  location: string | null;
  description: string | null;
  start_date: string | null;
  start_time: string | null;
  max_teams: number | null;
  entry_fee_per_player: number | null;
  format: string;
  players_per_team: number;
  substitutions_allowed: number;
  match_duration_minutes: number;
  period_duration_minutes: number;
  sport_id: number;
  status: string;
  roster_locked: boolean;
  sports: { name: string } | null;
};

type OwnedTeam = { id: string; name: string; sport_id: number };
type RequestStatus = 'none' | 'pending' | 'member';
type TopScorer = { playerId: string; username: string | null; fullName: string | null; teamId: string; goals: number };
type TopEventPlayer = { playerId: string; username: string | null; fullName: string | null; teamId: string; count: number };

function pickBestPlayer(counts: Map<string, { teamId: string; count: number }>) {
  let bestPlayerId = '';
  let best = { teamId: '', count: -1 };
  counts.forEach((value, playerId) => {
    if (value.count > best.count) {
      best = value;
      bestPlayerId = playerId;
    }
  });
  return bestPlayerId ? { playerId: bestPlayerId, teamId: best.teamId, count: best.count } : null;
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

function ReboundIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M4 8h16" />
      <path d="M8 15l4-7 4 7" />
    </svg>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

type InviteTeamOption = {
  id: string;
  name: string;
  crest_url: string | null;
  crest_position_x: number;
  crest_position_y: number;
};

function StatBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-ink-900 border border-ink-700 border-t-2 border-t-red-500/50 px-5 py-4">
      <p className="text-[11px] uppercase tracking-widest text-paper-500 mb-1">{label}</p>
      <p className="font-display text-xl leading-tight">{value}</p>
    </div>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('sr-Latn-RS', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function TournamentDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [tournament, setTournament] = useState<TournamentDetail | null>(null);
  const [organizerName, setOrganizerName] = useState<string | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  const [ownedTeams, setOwnedTeams] = useState<OwnedTeam[]>([]);
  const [teamStatus, setTeamStatus] = useState<Map<string, RequestStatus>>(new Map());
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [requesting, setRequesting] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);

  const [ownerTeams, setOwnerTeams] = useState<OwnedTeam[]>([]);
  const [selectedOwnerTeamId, setSelectedOwnerTeamId] = useState('');
  const [addingOwnTeam, setAddingOwnTeam] = useState(false);
  const [addOwnTeamError, setAddOwnTeamError] = useState<string | null>(null);

  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [withdrawingTeamId, setWithdrawingTeamId] = useState<string | null>(null);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);
  const [groupsFormed, setGroupsFormed] = useState(false);

  const [topScorer, setTopScorer] = useState<TopScorer | null>(null);
  const [topAssister, setTopAssister] = useState<TopEventPlayer | null>(null);
  const [topKeeper, setTopKeeper] = useState<TopEventPlayer | null>(null);
  const [topRebounder, setTopRebounder] = useState<TopEventPlayer | null>(null);

  const [inviteTeams, setInviteTeams] = useState<InviteTeamOption[]>([]);
  const [invitedTeamIds, setInvitedTeamIds] = useState<Set<string>>(new Set());
  const [inviteQuery, setInviteQuery] = useState('');
  const [inviteOpen, setInviteOpen] = useState(false);
  const inviteBoxRef = useRef<HTMLDivElement>(null);
  const [invitingTeamId, setInvitingTeamId] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<TabId>('pocetna');

  useEffect(() => {
    if (!id) return;

    async function load() {
      const { data: tournamentRow } = await supabase
        .from('tournaments')
        .select(
          'id, owner_id, name, crest_url, crest_position_x, crest_position_y, banner_url, city, location, description, start_date, start_time, max_teams, entry_fee_per_player, format, players_per_team, substitutions_allowed, match_duration_minutes, period_duration_minutes, sport_id, status, roster_locked, sports(name)'
        )
        .eq('id', id)
        .single();

      const row = (tournamentRow as unknown as TournamentDetail) ?? null;
      setTournament(row);

      if (row) {
        const { data: organizer } = await supabase
          .from('public_profiles')
          .select('full_name')
          .eq('id', row.owner_id)
          .single();
        setOrganizerName(organizer?.full_name ?? null);

        const { count: groupCount } = await supabase
          .from('tournament_groups')
          .select('id', { count: 'exact', head: true })
          .eq('tournament_id', row.id);
        setGroupsFormed((groupCount ?? 0) > 0);

        const { data: participantRows } = await supabase
          .from('tournament_teams')
          .select('team_id')
          .eq('tournament_id', row.id);
        const teamIds = (participantRows ?? []).map((p) => p.team_id);

        if (teamIds.length) {
          const { data: teamRows } = await supabase
            .from('teams')
            .select('id, owner_id, name, crest_url, crest_position_x, crest_position_y, banner_url, city, founded_year, sport_id, sports(name), deleted_at')
            .in('id', teamIds);

          const rows = (teamRows as unknown as Omit<Team, 'founderName' | 'playerCount'>[]) ?? [];

          const ownerIds = [...new Set(rows.map((t) => t.owner_id))];
          const { data: founders } = ownerIds.length
            ? await supabase.from('public_profiles').select('id, full_name').in('id', ownerIds)
            : { data: [] as { id: string; full_name: string | null }[] };
          const nameById = new Map((founders ?? []).map((f) => [f.id, f.full_name]));

          const { data: memberRows } = await supabase.from('team_members').select('team_id').in('team_id', teamIds);
          const countByTeam = new Map<string, number>();
          (memberRows ?? []).forEach((m) => countByTeam.set(m.team_id, (countByTeam.get(m.team_id) ?? 0) + 1));

          setTeams(
            rows.map((t) => ({ ...t, founderName: nameById.get(t.owner_id) ?? null, playerCount: countByTeam.get(t.id) ?? 0 }))
          );
        } else {
          setTeams([]);
        }
      }

      setLoading(false);
    }

    load();
  }, [id]);

  useEffect(() => {
    if (!tournament || tournament.status !== 'finished') {
      setTopScorer(null);
      setTopAssister(null);
      setTopKeeper(null);
      setTopRebounder(null);
      return;
    }

    const tournamentId = tournament.id;
    const format = tournament.format;

    async function countGoals(matchTable: string, goalsTable: string, counts: Map<string, { teamId: string; goals: number }>) {
      const { data: matchRows } = await supabase.from(matchTable).select('id').eq('tournament_id', tournamentId);
      const matchIds = (matchRows ?? []).map((m: { id: string }) => m.id);
      if (!matchIds.length) return;

      const { data: goalRows } = await supabase.from(goalsTable).select('player_id, team_id, points').in('match_id', matchIds);
      (goalRows ?? []).forEach((g: { player_id: string; team_id: string; points: number }) => {
        const entry = counts.get(g.player_id) ?? { teamId: g.team_id, goals: 0 };
        entry.goals += g.points;
        counts.set(g.player_id, entry);
      });
    }

    async function countEvents(
      matchTable: string,
      eventsTable: string,
      eventType: 'assist' | 'save' | 'rebound',
      counts: Map<string, { teamId: string; count: number }>
    ) {
      const { data: matchRows } = await supabase.from(matchTable).select('id').eq('tournament_id', tournamentId);
      const matchIds = (matchRows ?? []).map((m: { id: string }) => m.id);
      if (!matchIds.length) return;

      const { data: eventRows } = await supabase
        .from(eventsTable)
        .select('player_id, team_id')
        .eq('event_type', eventType)
        .in('match_id', matchIds);
      (eventRows ?? []).forEach((e: { player_id: string; team_id: string }) => {
        const entry = counts.get(e.player_id) ?? { teamId: e.team_id, count: 0 };
        entry.count += 1;
        counts.set(e.player_id, entry);
      });
    }

    async function resolvePlayer(playerId: string) {
      const { data: profile } = await supabase.from('public_profiles').select('full_name').eq('id', playerId).single();
      const { data: usernameRow } = await supabase.from('player_usernames').select('username').eq('id', playerId).maybeSingle();
      return { username: usernameRow?.username ?? null, fullName: profile?.full_name ?? null };
    }

    async function loadTopPlayers() {
      const goalCounts = new Map<string, { teamId: string; goals: number }>();
      const assistCounts = new Map<string, { teamId: string; count: number }>();
      const saveCounts = new Map<string, { teamId: string; count: number }>();
      const reboundCounts = new Map<string, { teamId: string; count: number }>();

      if (format === 'liga') {
        await countGoals('tournament_league_matches', 'tournament_league_goals', goalCounts);
        await countEvents('tournament_league_matches', 'tournament_league_events', 'assist', assistCounts);
        await countEvents('tournament_league_matches', 'tournament_league_events', 'save', saveCounts);
        await countEvents('tournament_league_matches', 'tournament_league_events', 'rebound', reboundCounts);
      } else if (format === 'kup') {
        await countGoals('tournament_bracket_matches', 'tournament_bracket_goals', goalCounts);
        await countEvents('tournament_bracket_matches', 'tournament_bracket_events', 'assist', assistCounts);
        await countEvents('tournament_bracket_matches', 'tournament_bracket_events', 'save', saveCounts);
        await countEvents('tournament_bracket_matches', 'tournament_bracket_events', 'rebound', reboundCounts);
      } else {
        await countGoals('tournament_matches', 'tournament_match_goals', goalCounts);
        await countGoals('tournament_bracket_matches', 'tournament_bracket_goals', goalCounts);
        await countEvents('tournament_matches', 'tournament_match_events', 'assist', assistCounts);
        await countEvents('tournament_bracket_matches', 'tournament_bracket_events', 'assist', assistCounts);
        await countEvents('tournament_matches', 'tournament_match_events', 'save', saveCounts);
        await countEvents('tournament_bracket_matches', 'tournament_bracket_events', 'save', saveCounts);
        await countEvents('tournament_matches', 'tournament_match_events', 'rebound', reboundCounts);
        await countEvents('tournament_bracket_matches', 'tournament_bracket_events', 'rebound', reboundCounts);
      }

      if (!goalCounts.size) {
        setTopScorer(null);
      } else {
        let bestPlayerId = '';
        let best = { teamId: '', goals: -1 };
        goalCounts.forEach((value, playerId) => {
          if (value.goals > best.goals) {
            best = value;
            bestPlayerId = playerId;
          }
        });
        const { username, fullName } = await resolvePlayer(bestPlayerId);
        setTopScorer({ playerId: bestPlayerId, username, fullName, teamId: best.teamId, goals: best.goals });
      }

      const bestAssister = pickBestPlayer(assistCounts);
      if (!bestAssister) {
        setTopAssister(null);
      } else {
        const { username, fullName } = await resolvePlayer(bestAssister.playerId);
        setTopAssister({ ...bestAssister, username, fullName });
      }

      const bestKeeper = pickBestPlayer(saveCounts);
      if (!bestKeeper) {
        setTopKeeper(null);
      } else {
        const { username, fullName } = await resolvePlayer(bestKeeper.playerId);
        setTopKeeper({ ...bestKeeper, username, fullName });
      }

      const bestRebounder = pickBestPlayer(reboundCounts);
      if (!bestRebounder) {
        setTopRebounder(null);
      } else {
        const { username, fullName } = await resolvePlayer(bestRebounder.playerId);
        setTopRebounder({ ...bestRebounder, username, fullName });
      }
    }

    loadTopPlayers();
  }, [tournament]);

  useEffect(() => {
    if (!user || !tournament || user.id === tournament.owner_id) {
      setOwnedTeams([]);
      return;
    }

    async function loadOwnedTeams() {
      const { data } = await supabase
        .from('teams')
        .select('id, name, sport_id')
        .eq('owner_id', user!.id)
        .eq('sport_id', tournament!.sport_id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      const owned = data ?? [];
      setOwnedTeams(owned);
      if (!owned.length) return;

      const ids = owned.map((t) => t.id);
      const { data: participations } = await supabase
        .from('tournament_teams')
        .select('team_id')
        .eq('tournament_id', tournament!.id)
        .in('team_id', ids);
      const memberSet = new Set((participations ?? []).map((p) => p.team_id));

      const { data: pendings } = await supabase
        .from('tournament_team_requests')
        .select('team_id')
        .eq('tournament_id', tournament!.id)
        .eq('status', 'pending')
        .in('team_id', ids);
      const pendingSet = new Set((pendings ?? []).map((p) => p.team_id));

      const statusMap = new Map<string, RequestStatus>();
      owned.forEach((t) => {
        statusMap.set(t.id, memberSet.has(t.id) ? 'member' : pendingSet.has(t.id) ? 'pending' : 'none');
      });
      setTeamStatus(statusMap);
      setSelectedTeamId(owned[0].id);
    }

    loadOwnedTeams();
  }, [user, tournament]);

  useEffect(() => {
    if (!user || !tournament || user.id !== tournament.owner_id) {
      setOwnerTeams([]);
      return;
    }

    supabase
      .from('teams')
      .select('id, name, sport_id')
      .eq('owner_id', user.id)
      .eq('sport_id', tournament.sport_id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        const owned = data ?? [];
        setOwnerTeams(owned);
        if (owned.length) setSelectedOwnerTeamId(owned[0].id);
      });
  }, [user, tournament]);

  useEffect(() => {
    if (!user || !tournament || user.id !== tournament.owner_id) {
      setInviteTeams([]);
      setInvitedTeamIds(new Set());
      return;
    }
    if (tournament.status === 'finished' || tournament.roster_locked) {
      setInviteTeams([]);
      return;
    }

    async function loadInviteData() {
      const { data: teamRows } = await supabase
        .from('teams')
        .select('id, name, crest_url, crest_position_x, crest_position_y')
        .eq('sport_id', tournament!.sport_id)
        .is('deleted_at', null)
        .order('name', { ascending: true });
      setInviteTeams((teamRows as InviteTeamOption[]) ?? []);

      const { data: pendingInvites } = await supabase
        .from('tournament_team_requests')
        .select('team_id')
        .eq('tournament_id', tournament!.id)
        .eq('type', 'invite')
        .eq('status', 'pending');
      setInvitedTeamIds(new Set((pendingInvites ?? []).map((r) => r.team_id)));
    }

    loadInviteData();
  }, [user, tournament]);

  useEffect(() => {
    if (!inviteOpen) return;

    function onPointerDown(e: MouseEvent) {
      if (inviteBoxRef.current?.contains(e.target as Node)) return;
      setInviteOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setInviteOpen(false);
    }
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [inviteOpen]);

  async function handleInviteTeam(teamId: string) {
    if (!tournament || !user) return;
    setInvitingTeamId(teamId);
    setInviteError(null);
    const { error } = await supabase
      .from('tournament_team_requests')
      .insert({ tournament_id: tournament.id, team_id: teamId, requested_by: user.id, type: 'invite' });
    setInvitingTeamId(null);

    if (error) {
      setInviteError('Slanje poziva nije uspelo. Pokušaj ponovo.');
      return;
    }
    setInvitedTeamIds((prev) => new Set(prev).add(teamId));
    setInviteQuery('');
  }

  async function handleAddOwnTeam() {
    if (!tournament || !selectedOwnerTeamId) return;

    setAddingOwnTeam(true);
    setAddOwnTeamError(null);
    const { error } = await supabase
      .from('tournament_teams')
      .insert({ tournament_id: tournament.id, team_id: selectedOwnerTeamId });

    if (error) {
      setAddingOwnTeam(false);
      setAddOwnTeamError('Dodavanje tima nije uspelo. Pokušaj ponovo.');
      return;
    }

    const { data: teamRow } = await supabase
      .from('teams')
      .select('id, owner_id, name, crest_url, crest_position_x, crest_position_y, banner_url, city, founded_year, sport_id, sports(name), deleted_at')
      .eq('id', selectedOwnerTeamId)
      .single();

    if (teamRow) {
      const { count } = await supabase
        .from('team_members')
        .select('id', { count: 'exact', head: true })
        .eq('team_id', selectedOwnerTeamId);

      const row = teamRow as unknown as Omit<Team, 'founderName' | 'playerCount'>;
      setTeams((prev) => [...prev, { ...row, founderName: organizerName, playerCount: count ?? 0 }]);
    }

    setAddingOwnTeam(false);
  }

  async function handleRequest() {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!tournament || !selectedTeamId) return;

    setRequesting(true);
    setRequestError(null);
    const { error } = await supabase
      .from('tournament_team_requests')
      .insert({ tournament_id: tournament.id, team_id: selectedTeamId, requested_by: user.id });
    setRequesting(false);

    if (error) {
      setRequestError('Slanje prijave nije uspelo. Pokušaj ponovo.');
      return;
    }
    setTeamStatus((prev) => new Map(prev).set(selectedTeamId, 'pending'));
  }

  async function handleWithdraw(teamId: string) {
    if (!tournament) return;
    setWithdrawingTeamId(teamId);
    setWithdrawError(null);
    const { error } = await supabase
      .from('tournament_teams')
      .delete()
      .eq('tournament_id', tournament.id)
      .eq('team_id', teamId);
    setWithdrawingTeamId(null);

    if (error) {
      setWithdrawError('Povlačenje tima nije uspelo. Pokušaj ponovo.');
      return;
    }
    setTeams((prev) => prev.filter((t) => t.id !== teamId));
    setTeamStatus((prev) => new Map(prev).set(teamId, 'none'));
  }

  async function handleDeleteTournament() {
    if (!tournament) return;
    setDeleting(true);
    setDeleteError(null);

    const tid = tournament.id;

    // Fetch all match IDs grouped by table type
    const [leagueMatches, bracketMatches, groupMatches] = await Promise.all([
      supabase.from('tournament_league_matches').select('id').eq('tournament_id', tid),
      supabase.from('tournament_bracket_matches').select('id').eq('tournament_id', tid),
      supabase.from('tournament_matches').select('id').eq('tournament_id', tid),
    ]);

    const leagueIds = (leagueMatches.data ?? []).map((r: { id: string }) => r.id);
    const bracketIds = (bracketMatches.data ?? []).map((r: { id: string }) => r.id);
    const groupMatchIds = (groupMatches.data ?? []).map((r: { id: string }) => r.id);

    // Collect all player IDs from goal/event tables so we can snapshot career stats
    const playerIdSet = new Set<string>();
    const playerRowQueries: PromiseLike<{ data: { player_id: string }[] | null }>[] = [];
    if (leagueIds.length > 0) {
      playerRowQueries.push(supabase.from('tournament_league_goals').select('player_id').in('match_id', leagueIds) as PromiseLike<{ data: { player_id: string }[] | null }>);
      playerRowQueries.push(supabase.from('tournament_league_events').select('player_id').in('match_id', leagueIds) as PromiseLike<{ data: { player_id: string }[] | null }>);
    }
    if (bracketIds.length > 0) {
      playerRowQueries.push(supabase.from('tournament_bracket_goals').select('player_id').in('match_id', bracketIds) as PromiseLike<{ data: { player_id: string }[] | null }>);
      playerRowQueries.push(supabase.from('tournament_bracket_events').select('player_id').in('match_id', bracketIds) as PromiseLike<{ data: { player_id: string }[] | null }>);
    }
    if (groupMatchIds.length > 0) {
      playerRowQueries.push(supabase.from('tournament_match_goals').select('player_id').in('match_id', groupMatchIds) as PromiseLike<{ data: { player_id: string }[] | null }>);
      playerRowQueries.push(supabase.from('tournament_match_events').select('player_id').in('match_id', groupMatchIds) as PromiseLike<{ data: { player_id: string }[] | null }>);
    }
    if (playerRowQueries.length > 0) {
      const playerResults = await Promise.all(playerRowQueries);
      for (const { data } of playerResults) {
        for (const row of data ?? []) playerIdSet.add(row.player_id);
      }
    }
    const affectedPlayerIds = [...playerIdSet];

    type CareerStats = {
      id: string;
      career_football_goals: number;
      career_basketball_points: number;
      career_football_assists: number;
      career_basketball_assists: number;
      career_saves: number;
      career_yellow_cards: number;
      career_red_cards: number;
      career_rebounds: number;
    };
    const careerStatKeys: (keyof Omit<CareerStats, 'id'>)[] = [
      'career_football_goals', 'career_basketball_points',
      'career_football_assists', 'career_basketball_assists',
      'career_saves', 'career_yellow_cards', 'career_red_cards', 'career_rebounds',
    ];

    // Snapshot career stats BEFORE deletion so we can restore them if DB triggers decrement them
    let beforeMap = new Map<string, CareerStats>();
    if (affectedPlayerIds.length > 0) {
      const { data } = await supabase
        .from('profiles')
        .select('id, career_football_goals, career_basketball_points, career_football_assists, career_basketball_assists, career_saves, career_yellow_cards, career_red_cards, career_rebounds')
        .in('id', affectedPlayerIds);
      beforeMap = new Map((data ?? []).map((r: CareerStats) => [r.id, r]));
    }

    // Delete leaf records (goals & events) that reference match IDs
    const leafDeletes: PromiseLike<unknown>[] = [];
    if (leagueIds.length > 0) {
      leafDeletes.push(supabase.from('tournament_league_goals').delete().in('match_id', leagueIds));
      leafDeletes.push(supabase.from('tournament_league_events').delete().in('match_id', leagueIds));
    }
    if (bracketIds.length > 0) {
      leafDeletes.push(supabase.from('tournament_bracket_goals').delete().in('match_id', bracketIds));
      leafDeletes.push(supabase.from('tournament_bracket_events').delete().in('match_id', bracketIds));
    }
    if (groupMatchIds.length > 0) {
      leafDeletes.push(supabase.from('tournament_match_goals').delete().in('match_id', groupMatchIds));
      leafDeletes.push(supabase.from('tournament_match_events').delete().in('match_id', groupMatchIds));
    }
    await Promise.all(leafDeletes);

    // Delete match tables, group assignments, groups, teams
    await Promise.all([
      supabase.from('tournament_league_matches').delete().eq('tournament_id', tid),
      supabase.from('tournament_bracket_matches').delete().eq('tournament_id', tid),
      supabase.from('tournament_matches').delete().eq('tournament_id', tid),
      supabase.from('tournament_group_teams').delete().eq('tournament_id', tid),
    ]);

    await Promise.all([
      supabase.from('tournament_groups').delete().eq('tournament_id', tid),
      supabase.from('tournament_teams').delete().eq('tournament_id', tid),
    ]);

    const { error } = await supabase.from('tournaments').delete().eq('id', tid);
    if (error) {
      setDeleting(false);
      setDeleteError('Brisanje turnira nije uspelo. Pokušaj ponovo.');
      return;
    }

    // Restore career stats that DB triggers may have decremented
    if (affectedPlayerIds.length > 0) {
      const { data: afterData } = await supabase
        .from('profiles')
        .select('id, career_football_goals, career_basketball_points, career_football_assists, career_basketball_assists, career_saves, career_yellow_cards, career_red_cards, career_rebounds')
        .in('id', affectedPlayerIds);

      const restores: PromiseLike<unknown>[] = [];
      for (const after of (afterData ?? []) as CareerStats[]) {
        const before = beforeMap.get(after.id);
        if (!before) continue;
        const update: Partial<Record<keyof Omit<CareerStats, 'id'>, number>> = {};
        for (const key of careerStatKeys) {
          if (after[key] < before[key]) update[key] = before[key];
        }
        if (Object.keys(update).length > 0) {
          restores.push(supabase.from('profiles').update(update).eq('id', after.id) as PromiseLike<unknown>);
        }
      }
      await Promise.all(restores);
    }

    setDeleting(false);
    navigate('/turniri');
  }

  const currentStatus = teamStatus.get(selectedTeamId) ?? 'none';
  const requestLabel = requesting
    ? 'Slanje…'
    : currentStatus === 'member'
      ? 'Tim već učestvuje'
      : currentStatus === 'pending'
        ? 'Prijava je već poslata'
        : ownedTeams.length === 1
          ? `Prijavi tim „${ownedTeams[0].name}“`
          : 'Prijavi tim';

  const isFull = tournament?.max_teams != null && teams.length >= tournament.max_teams;
  const isFinished = tournament?.status === 'finished';
  const isLocked = isFinished || !!tournament?.roster_locked;
  const ownedParticipatingTeams = teams.filter((t) => t.owner_id === user?.id);
  const sportName = tournament?.sports?.name ?? null;
  const isBasketball = !!sportName && BASKETBALL_SPORT_NAMES.includes(sportName);
  const periodLabel = isBasketball ? 'Trajanje četvrtine' : 'Trajanje poluvremena';
  const startLabel = tournament?.start_date ? formatDate(tournament.start_date) : null;
  const topScorerTeam = topScorer ? teams.find((t) => t.id === topScorer.teamId) ?? null : null;
  const topAssisterTeam = topAssister ? teams.find((t) => t.id === topAssister.teamId) ?? null : null;
  const topKeeperTeam = topKeeper ? teams.find((t) => t.id === topKeeper.teamId) ?? null : null;
  const topRebounderTeam = topRebounder ? teams.find((t) => t.id === topRebounder.teamId) ?? null : null;

  const participatingTeamIds = new Set(teams.map((t) => t.id));
  const inviteQueryTrimmed = inviteQuery.trim().toLowerCase();
  const inviteMatches = inviteTeams
    .filter((t) => !participatingTeamIds.has(t.id) && (!inviteQueryTrimmed || t.name.toLowerCase().includes(inviteQueryTrimmed)))
    .slice(0, 30);

  const tabs: { id: TabId; label: string }[] = [{ id: 'pocetna', label: 'Početna' }];
  if (tournament?.format === 'grupe_i_eliminacija') {
    tabs.push({ id: 'grupna', label: 'Grupna faza' });
    tabs.push({ id: 'eliminacija', label: 'Eliminacija' });
  } else if (tournament?.format === 'liga') {
    tabs.push({ id: 'liga', label: 'Liga' });
  } else if (tournament?.format === 'kup') {
    tabs.push({ id: 'kup', label: 'Kup' });
  }

  return (
    <div className="min-h-screen flex flex-col bg-ink-950 text-paper-100 overflow-x-hidden">
      <div className="grain" />
      <SiteHeader />

      <main className="flex-1 pt-16 flex flex-col">
        {loading ? (
          <>
            <DetailHeroSkeleton />
            <section className="flex-1 max-w-6xl mx-auto px-6 py-12 sm:py-16 w-full">
              <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-6">
                {Array.from({ length: 5 }, (_, i) => (
                  <StatBlockSkeleton key={i} />
                ))}
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-10">
                {Array.from({ length: 5 }, (_, i) => (
                  <StatBlockSkeleton key={i} />
                ))}
              </div>
              <RowSkeletonGrid count={6} />
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
              <div className="aspect-[21/6] sm:aspect-[21/5] bg-ink-800 overflow-hidden">
                {tournament.banner_url && (
                  <img src={tournament.banner_url} alt="" className="w-full h-full object-cover" />
                )}
              </div>

              <div className="max-w-6xl mx-auto px-6 pb-10">
                <div className="relative z-10 w-28 h-28 sm:w-32 sm:h-32 -mt-14 sm:-mt-16 rounded-full overflow-hidden bg-ink-800 border-4 border-ink-900 ring-2 ring-red-500/40 flex items-center justify-center">
                  {tournament.crest_url ? (
                    <img
                      src={tournament.crest_url}
                      alt=""
                      className="w-full h-full object-cover"
                      style={{ objectPosition: `${tournament.crest_position_x}% ${tournament.crest_position_y}%` }}
                    />
                  ) : (
                    <span className="font-display text-3xl text-paper-500">{tournament.name[0]?.toUpperCase()}</span>
                  )}
                </div>

                <div className="flex items-end justify-between gap-4 flex-wrap mt-5">
                  <div>
                    <h1 className="font-display text-3xl sm:text-4xl leading-tight">{tournament.name}</h1>
                    <div className="w-10 h-0.5 bg-red-500 mt-3 mb-3" />
                    {tournament.sports && (
                      <p className="text-xs uppercase tracking-widest text-red-400 font-semibold">{tournament.sports.name}</p>
                    )}
                  </div>

                  <div className="mb-1 w-full sm:w-auto flex flex-col items-center sm:items-end gap-3">
                    <Link
                      to="/turniri"
                      className="btn-line px-5 py-2.5 text-xs uppercase tracking-widest inline-flex items-center justify-center gap-2"
                    >
                      Nazad na turnire
                    </Link>

                    {user?.id === tournament.owner_id ? (
                      <div className="w-full sm:w-auto flex flex-col items-center sm:items-end gap-3">
                        <div className="flex items-center justify-center flex-wrap gap-3">
                          <span className="text-xs uppercase tracking-widest text-red-400 border border-red-500/30 px-4 py-2.5 inline-block">
                            {isFinished ? 'Turnir je završen' : isLocked ? 'Turnir je zaključan' : 'Ovo je tvoj turnir'}
                          </span>
                          {!isLocked && (
                            <Link
                              to={`/turniri/${tournament.id}/izmena`}
                              className="btn-solid px-5 py-2.5 text-xs uppercase tracking-widest inline-flex items-center justify-center gap-2"
                            >
                              Izmeni turnir
                            </Link>
                          )}
                        </div>

                        {!isLocked && ownedParticipatingTeams.length === 0 && ownerTeams.length > 0 && (
                          <div className="w-full sm:max-w-sm">
                            <div className="flex flex-col sm:flex-row items-center gap-3">
                              {ownerTeams.length > 1 && (
                                <div className="w-full sm:w-48">
                                  <Dropdown
                                    id="owner-team"
                                    value={selectedOwnerTeamId}
                                    onChange={setSelectedOwnerTeamId}
                                    options={ownerTeams.map((t) => ({ value: t.id, label: t.name }))}
                                    triggerClassName="w-full bg-transparent border border-ink-700 hover:border-paper-100 transition-colors px-5 py-2.5 text-xs uppercase tracking-widest flex items-center justify-between gap-3"
                                  />
                                </div>
                              )}
                              <button
                                type="button"
                                onClick={handleAddOwnTeam}
                                disabled={addingOwnTeam || isFull}
                                className="btn-solid w-full sm:w-auto px-5 py-2.5 text-xs uppercase tracking-widest whitespace-nowrap"
                              >
                                {addingOwnTeam
                                  ? 'Dodavanje…'
                                  : isFull
                                    ? 'Turnir je popunjen'
                                    : ownerTeams.length === 1
                                      ? `Dodaj svoj tim „${ownerTeams[0].name}“`
                                      : 'Dodaj svoj tim'}
                              </button>
                            </div>
                            {addOwnTeamError && <p className="text-sm text-red-400 mt-3">{addOwnTeamError}</p>}
                          </div>
                        )}
                      </div>
                    ) : isLocked ? (
                      <span className="text-xs uppercase tracking-widest text-paper-500 border border-ink-700 px-4 py-2.5 inline-block">
                        {isFinished ? 'Turnir je završen' : 'Prijave su zatvorene'}
                      </span>
                    ) : ownedTeams.length > 0 ? (
                      <div className="w-full sm:max-w-sm">
                        <div className="flex flex-col sm:flex-row items-center gap-3">
                          {ownedTeams.length > 1 && (
                            <div className="w-full sm:w-48">
                              <Dropdown
                                id="request-team"
                                value={selectedTeamId}
                                onChange={setSelectedTeamId}
                                options={ownedTeams.map((t) => ({ value: t.id, label: t.name }))}
                              />
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={handleRequest}
                            disabled={requesting || currentStatus !== 'none' || (isFull && currentStatus === 'none')}
                            className="btn-solid w-full sm:w-auto px-5 py-2.5 text-xs uppercase tracking-widest whitespace-nowrap"
                          >
                            {isFull && currentStatus === 'none' ? 'Turnir je popunjen' : requestLabel}
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>

                {requestError && <p className="text-sm text-red-400 mt-3">{requestError}</p>}
              </div>
            </section>

            <div className="bg-ink-900 border-b border-ink-700 sticky top-16 z-10">
              <div className="max-w-6xl mx-auto">
                <div className="flex">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex-1 py-3.5 text-xs uppercase tracking-widest font-semibold transition-colors border-b-2 ${
                        activeTab === tab.id
                          ? 'border-red-500 text-paper-100'
                          : 'border-transparent text-paper-500 hover:text-paper-100'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {activeTab === 'pocetna' && (
            <section className="flex-1 max-w-6xl mx-auto px-6 py-12 sm:py-16 w-full">
              <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-6">
                <StatBlock label="Grad" value={tournament.city || '—'} />
                <StatBlock label="Lokacija" value={tournament.location || '—'} />
                <StatBlock label="Termin" value={startLabel || '—'} />
                <StatBlock label="Vreme početka" value={tournament.start_time ? tournament.start_time.slice(0, 5) : '—'} />
                <StatBlock
                  label="Timova"
                  value={tournament.max_teams ? `${teams.length} / ${tournament.max_teams}` : String(teams.length)}
                />
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-10">
                <StatBlock label="Format" value={FORMAT_LABELS[tournament.format] ?? tournament.format} />
                <StatBlock label="Broj igrača" value={String(tournament.players_per_team)} />
                <StatBlock label="Dozvoljene izmene" value={String(tournament.substitutions_allowed)} />
                <StatBlock label="Trajanje utakmice" value={`${tournament.match_duration_minutes} min`} />
                <StatBlock label={periodLabel} value={`${tournament.period_duration_minutes} min`} />
              </div>

              <div className="mb-10 bg-ink-900 border border-red-500/30 border-l-2 border-l-red-500 px-5 py-4 inline-block">
                <p className="text-[11px] uppercase tracking-widest text-paper-500 mb-1">Kotizacija</p>
                <p className="font-display text-xl leading-tight">
                  {tournament.entry_fee_per_player != null
                    ? `${tournament.entry_fee_per_player.toLocaleString('sr-Latn-RS')} RSD po igraču`
                    : 'Bez kotizacije'}
                </p>
              </div>

              {isFinished &&
                (topScorer || topAssister || (topKeeper && !isBasketball) || (topRebounder && isBasketball)) && (
                <div className="mb-10">
                  <span className="text-xs uppercase tracking-widest text-red-400 font-semibold">
                    Najbolji igrači turnira
                  </span>
                  <div className="w-10 h-0.5 bg-red-500 mt-3 mb-5" />
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {topScorer && (
                      <Link
                        to={`/${topScorer.username ?? topScorer.playerId}`}
                        className="group flex items-center gap-4 bg-ink-900 border border-ink-700 border-l-2 border-l-red-500/50 px-5 py-4 transition-colors duration-200 hover:bg-ink-800 hover:border-l-red-400"
                      >
                        <div className="w-11 h-11 rounded-full bg-ink-800 ring-1 ring-red-500/40 flex items-center justify-center shrink-0">
                          {isBasketball ? (
                            <BasketballIcon className="w-5 h-5 text-red-400" />
                          ) : (
                            <BallIcon className="w-5 h-5 text-red-400" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] uppercase tracking-widest text-paper-500 mb-0.5">Najbolji strelac</p>
                          <p className="text-paper-100 font-medium truncate transition-colors duration-200 group-hover:text-red-400">
                            {topScorer.fullName || 'Igrač'}
                          </p>
                          {topScorerTeam && <p className="text-xs text-paper-500 truncate">{topScorerTeam.name}</p>}
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-display text-2xl leading-none">{topScorer.goals}</p>
                          <p className="text-[10px] uppercase tracking-widest text-paper-500 mt-1">
                            {isBasketball ? (topScorer.goals === 1 ? 'poen' : 'poena') : 'golova'}
                          </p>
                        </div>
                      </Link>
                    )}

                    {topAssister && (
                      <Link
                        to={`/${topAssister.username ?? topAssister.playerId}`}
                        className="group flex items-center gap-4 bg-ink-900 border border-ink-700 border-l-2 border-l-red-500/50 px-5 py-4 transition-colors duration-200 hover:bg-ink-800 hover:border-l-red-400"
                      >
                        <div className="w-11 h-11 rounded-full bg-ink-800 ring-1 ring-red-500/40 flex items-center justify-center shrink-0">
                          <AssistIcon className="w-5 h-5 text-red-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] uppercase tracking-widest text-paper-500 mb-0.5">Najbolji asistent</p>
                          <p className="text-paper-100 font-medium truncate transition-colors duration-200 group-hover:text-red-400">
                            {topAssister.fullName || 'Igrač'}
                          </p>
                          {topAssisterTeam && <p className="text-xs text-paper-500 truncate">{topAssisterTeam.name}</p>}
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-display text-2xl leading-none">{topAssister.count}</p>
                          <p className="text-[10px] uppercase tracking-widest text-paper-500 mt-1">asistencija</p>
                        </div>
                      </Link>
                    )}

                    {!isBasketball && topKeeper && (
                      <Link
                        to={`/${topKeeper.username ?? topKeeper.playerId}`}
                        className="group flex items-center gap-4 bg-ink-900 border border-ink-700 border-l-2 border-l-red-500/50 px-5 py-4 transition-colors duration-200 hover:bg-ink-800 hover:border-l-red-400"
                      >
                        <div className="w-11 h-11 rounded-full bg-ink-800 ring-1 ring-red-500/40 flex items-center justify-center shrink-0">
                          <GloveIcon className="w-5 h-5 text-red-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] uppercase tracking-widest text-paper-500 mb-0.5">Najbolji golman</p>
                          <p className="text-paper-100 font-medium truncate transition-colors duration-200 group-hover:text-red-400">
                            {topKeeper.fullName || 'Igrač'}
                          </p>
                          {topKeeperTeam && <p className="text-xs text-paper-500 truncate">{topKeeperTeam.name}</p>}
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-display text-2xl leading-none">{topKeeper.count}</p>
                          <p className="text-[10px] uppercase tracking-widest text-paper-500 mt-1">odbrana</p>
                        </div>
                      </Link>
                    )}

                    {isBasketball && topRebounder && (
                      <Link
                        to={`/${topRebounder.username ?? topRebounder.playerId}`}
                        className="group flex items-center gap-4 bg-ink-900 border border-ink-700 border-l-2 border-l-red-500/50 px-5 py-4 transition-colors duration-200 hover:bg-ink-800 hover:border-l-red-400"
                      >
                        <div className="w-11 h-11 rounded-full bg-ink-800 ring-1 ring-red-500/40 flex items-center justify-center shrink-0">
                          <ReboundIcon className="w-5 h-5 text-red-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] uppercase tracking-widest text-paper-500 mb-0.5">Najbolji skakač</p>
                          <p className="text-paper-100 font-medium truncate transition-colors duration-200 group-hover:text-red-400">
                            {topRebounder.fullName || 'Igrač'}
                          </p>
                          {topRebounderTeam && <p className="text-xs text-paper-500 truncate">{topRebounderTeam.name}</p>}
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-display text-2xl leading-none">{topRebounder.count}</p>
                          <p className="text-[10px] uppercase tracking-widest text-paper-500 mt-1">skokova</p>
                        </div>
                      </Link>
                    )}
                  </div>
                </div>
              )}

              {organizerName && (
                <p className="text-sm text-paper-500 mb-10">
                  Organizator: <span className="text-paper-100">{organizerName}</span>
                </p>
              )}

              {tournament.description && (
                <div className="mb-10">
                  <span className="text-xs uppercase tracking-widest text-red-400 font-semibold">O turniru</span>
                  <div className="w-10 h-0.5 bg-red-500 mt-3 mb-5" />
                  <p className="text-sm text-paper-200 leading-relaxed whitespace-pre-line">{tournament.description}</p>
                </div>
              )}

              <div className="mb-10">
                <span className="text-xs uppercase tracking-widest text-red-400 font-semibold">Prijavljeni timovi</span>
                <div className="w-10 h-0.5 bg-red-500 mt-3 mb-5" />
                {teams.length === 0 ? (
                  <p className="text-sm text-paper-500">Nijedan tim se još nije prijavio na ovaj turnir.</p>
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {teams.map((team, index) => (
                      <TeamRow key={team.id} team={team} index={index} fromTournamentId={tournament.id} />
                    ))}
                  </div>
                )}
              </div>

              {user?.id === tournament.owner_id && !isLocked && (
                <div className="mb-10">
                  <span className="text-xs uppercase tracking-widest text-red-400 font-semibold">Pozovi tim</span>
                  <div className="w-10 h-0.5 bg-red-500 mt-3 mb-5" />
                  <p className="text-sm text-paper-500 mb-4 max-w-md">
                    Pretraži sve timove u bazi i pozovi ih da učestvuju na ovom turniru. Osnivač tima dobija obaveštenje i
                    može da prihvati ili odbije poziv.
                  </p>

                  <div ref={inviteBoxRef} className="relative max-w-md">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-paper-500 pointer-events-none" />
                    <input
                      type="text"
                      value={inviteQuery}
                      onChange={(e) => setInviteQuery(e.target.value)}
                      onFocus={() => setInviteOpen(true)}
                      placeholder="Klikni da vidiš sve timove ili pretraži po imenu…"
                      className="w-full bg-ink-900 border border-ink-700 focus:border-red-400 focus:outline-none pl-10 pr-4 py-2.5 text-sm text-paper-100 placeholder:text-paper-500 transition-colors"
                    />

                    {inviteOpen && inviteMatches.length > 0 && (
                      <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-ink-900 border border-red-500/30 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.85)] max-h-72 overflow-y-auto">
                        {inviteMatches.map((t) => {
                          const alreadyInvited = invitedTeamIds.has(t.id);
                          return (
                            <div
                              key={t.id}
                              className="flex items-center gap-3 px-4 py-2.5 border-b border-ink-800 last:border-b-0"
                            >
                              <div className="w-8 h-8 rounded-full overflow-hidden bg-ink-800 ring-1 ring-red-500/30 shrink-0 flex items-center justify-center">
                                {t.crest_url ? (
                                  <img
                                    src={t.crest_url}
                                    alt=""
                                    className="w-full h-full object-cover"
                                    style={{ objectPosition: `${t.crest_position_x}% ${t.crest_position_y}%` }}
                                  />
                                ) : (
                                  <span className="font-display text-xs text-paper-500">{t.name[0]?.toUpperCase()}</span>
                                )}
                              </div>
                              <span className="flex-1 min-w-0 truncate text-sm text-paper-100">{t.name}</span>
                              <button
                                type="button"
                                onClick={() => handleInviteTeam(t.id)}
                                disabled={alreadyInvited || invitingTeamId === t.id}
                                className="shrink-0 text-[10px] uppercase tracking-widest px-3 py-1.5 border border-red-500/30 hover:bg-red-500/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                              >
                                {invitingTeamId === t.id ? 'Slanje…' : alreadyInvited ? 'Poziv poslat' : 'Pozovi'}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {inviteOpen && inviteMatches.length === 0 && (
                    <p className="text-sm text-paper-500 mt-3">
                      {inviteQueryTrimmed ? 'Nema rezultata.' : 'Nema dostupnih timova za poziv.'}
                    </p>
                  )}
                  {inviteError && <p className="text-sm text-red-400 mt-3">{inviteError}</p>}
                </div>
              )}

              {(ownedParticipatingTeams.length > 0 || (user?.id === tournament.owner_id && !isFinished)) && (
                <div className="mt-16 border border-red-500/20 bg-ink-900/60">
                  <div className="px-6 py-4 border-b border-red-500/20">
                    <span className="text-xs uppercase tracking-widest text-red-400 font-semibold">Opasna zona</span>
                  </div>

                  <div className="divide-y divide-ink-800">
                    {ownedParticipatingTeams.map((team) => (
                      <div key={team.id} className="px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                          <p className="text-sm font-medium text-paper-100">Povuci tim „{team.name}“</p>
                          <p className="text-xs text-paper-500 mt-1">
                            {groupsFormed
                              ? 'Grupe su već formirane – tim više ne može da se povuče sa turnira.'
                              : tournament.roster_locked
                                ? 'Tabela je već formirana – tim više ne može da se povuče sa turnira.'
                                : 'Tim više neće učestvovati na ovom turniru.'}
                          </p>
                          {withdrawError && withdrawingTeamId === null && (
                            <p className="text-xs text-red-400 mt-2">{withdrawError}</p>
                          )}
                        </div>
                        {!groupsFormed && !tournament.roster_locked && (
                          <button
                            type="button"
                            onClick={() => handleWithdraw(team.id)}
                            disabled={withdrawingTeamId === team.id}
                            className="shrink-0 px-4 py-2 text-xs uppercase tracking-widest text-red-400 border border-red-500/30 hover:bg-red-500/10 transition-colors"
                          >
                            {withdrawingTeamId === team.id ? 'Povlačenje…' : 'Povuci tim'}
                          </button>
                        )}
                      </div>
                    ))}

                    {user?.id === tournament.owner_id && !isFinished && (
                      <div className="px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                          <p className="text-sm font-medium text-paper-100">Obriši turnir</p>
                          <p className="text-xs text-paper-500 mt-1">
                            Ovo trajno briše turnir, prijavljene timove i sve zahteve za prijavu.
                          </p>
                          {deleteError && <p className="text-xs text-red-400 mt-2">{deleteError}</p>}
                        </div>
                        {confirmingDelete ? (
                          <div className="flex items-center gap-3 shrink-0">
                            <button
                              type="button"
                              onClick={handleDeleteTournament}
                              disabled={deleting}
                              className="px-4 py-2 text-xs uppercase tracking-widest text-paper-100 bg-red-500 hover:bg-red-400 transition-colors"
                            >
                              {deleting ? 'Brisanje…' : 'Potvrdi'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmingDelete(false)}
                              disabled={deleting}
                              className="text-xs uppercase tracking-widest text-paper-500 hover:text-paper-100 transition-colors"
                            >
                              Otkaži
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmingDelete(true)}
                            className="shrink-0 px-4 py-2 text-xs uppercase tracking-widest text-red-400 border border-red-500/30 hover:bg-red-500/10 transition-colors"
                          >
                            Obriši turnir
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </section>
            )}

            {activeTab === 'grupna' && id && (
              <GroupsTabContent id={id} tournament={tournament} onSwitchToElimination={() => setActiveTab('eliminacija')} />
            )}
            {activeTab === 'eliminacija' && id && (
              <EliminationTabContent
                id={id}
                tournament={tournament}
                onSwitchToGroups={() => setActiveTab('grupna')}
                onFinished={() => setTournament((prev) => (prev ? { ...prev, status: 'finished' } : prev))}
              />
            )}
            {activeTab === 'liga' && id && (
              <LeagueTabContent
                id={id}
                tournament={tournament}
                onFinished={() => setTournament((prev) => (prev ? { ...prev, status: 'finished' } : prev))}
              />
            )}
            {activeTab === 'kup' && id && (
              <EliminationTabContent
                id={id}
                tournament={tournament}
                onFinished={() => setTournament((prev) => (prev ? { ...prev, status: 'finished' } : prev))}
              />
            )}
          </>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
