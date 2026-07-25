import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../lib/auth-context';
import { supabase } from '../lib/supabase';
import { SiteHeader } from '../components/SiteHeader';
import { SiteFooter } from '../components/SiteFooter';
import { PlayerCard, type Player } from './Players';
import { DetailHeroSkeleton, StatBlockSkeleton, RowSkeletonGrid } from '../components/Skeleton';

type TeamDetail = {
  id: string;
  owner_id: string;
  name: string;
  crest_url: string | null;
  crest_position_x: number;
  crest_position_y: number;
  banner_url: string | null;
  city: string | null;
  description: string | null;
  founded_year: number | null;
  sports: { name: string } | null;
};

type PlacementTone = 'champion' | 'runnerup' | 'default' | 'pending';
type Placement = { label: string; tone: PlacementTone };

type TeamTournamentInfo = {
  id: string;
  name: string;
  crest_url: string | null;
  crest_position_x: number;
  crest_position_y: number;
  format: string;
  status: string;
  start_date: string | null;
};

type TeamTournamentEntry = TeamTournamentInfo & { placement: Placement };

const RISE_CLASSES = ['rise-1', 'rise-2', 'rise-3', 'rise-4'];

const FORMAT_LABELS: Record<string, string> = {
  grupe_i_eliminacija: 'Grupna faza + eliminacija',
  liga: 'Liga',
  kup: 'Kup',
};

function eliminatedInRoundLabel(round: number, totalRounds: number) {
  const fromEnd = totalRounds - round;
  if (fromEnd === 0) return 'finalu';
  if (fromEnd === 1) return 'polufinalu';
  if (fromEnd === 2) return 'četvrtfinalu';
  if (fromEnd === 3) return 'osmini finala';
  if (fromEnd === 4) return 'šesnaestini finala';
  return `${round}. kolu`;
}

function StatBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-ink-900 border border-ink-700 border-t-2 border-t-red-500/50 px-5 py-4">
      <p className="text-[11px] uppercase tracking-widest text-paper-500 mb-1">{label}</p>
      <p className="font-display text-xl leading-tight">{value}</p>
    </div>
  );
}

function TeamTournamentRow({ tournament, index }: { tournament: TeamTournamentEntry; index: number }) {
  const startLabel = tournament.start_date
    ? new Date(tournament.start_date).toLocaleDateString('sr-Latn-RS', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  const toneClass =
    tournament.placement.tone === 'champion'
      ? 'text-red-400 border-red-500/40'
      : tournament.placement.tone === 'runnerup'
        ? 'text-paper-300 border-paper-300/40'
        : tournament.placement.tone === 'pending'
          ? 'text-paper-700 border-ink-700'
          : 'text-paper-500 border-ink-700';

  return (
    <Link
      to={`/turniri/${tournament.id}`}
      className={`group flex items-center gap-3 bg-ink-800 border border-ink-700 border-l-2 border-l-red-500/40 px-4 py-3 transition-colors duration-200 hover:bg-ink-700 hover:border-red-500/50 ${RISE_CLASSES[index % RISE_CLASSES.length]}`}
    >
      <div className="w-11 h-11 rounded-full overflow-hidden bg-ink-700 ring-1 ring-red-500/30 shrink-0 flex items-center justify-center">
        {tournament.crest_url ? (
          <img
            src={tournament.crest_url}
            alt=""
            className="w-full h-full object-cover"
            style={{ objectPosition: `${tournament.crest_position_x}% ${tournament.crest_position_y}%` }}
          />
        ) : (
          <span className="font-display text-sm text-paper-500">{tournament.name[0]?.toUpperCase()}</span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="font-display text-base leading-tight truncate transition-colors duration-200 group-hover:text-red-400">
          {tournament.name}
        </h3>
        <p className="text-[11px] uppercase tracking-widest text-paper-700 mt-0.5 truncate">
          {FORMAT_LABELS[tournament.format] ?? tournament.format}
          {startLabel ? ` · ${startLabel}` : ''}
        </p>
      </div>

      <span
        className={`text-[11px] uppercase tracking-widest font-semibold shrink-0 whitespace-nowrap border px-2.5 py-1 ${toneClass}`}
      >
        {tournament.placement.label}
      </span>
    </Link>
  );
}

export default function TeamDetail() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const fromTournamentId = searchParams.get('turnir');
  const { user } = useAuth();
  const navigate = useNavigate();

  const [team, setTeam] = useState<TeamDetail | null>(null);
  const [founderName, setFounderName] = useState<string | null>(null);
  const [playerCount, setPlayerCount] = useState(0);
  const [members, setMembers] = useState<Player[]>([]);
  const [isMember, setIsMember] = useState(false);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [confirmingLeave, setConfirmingLeave] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [leaveError, setLeaveError] = useState<string | null>(null);

  const [teamTournaments, setTeamTournaments] = useState<TeamTournamentEntry[]>([]);
  const [loadingTournaments, setLoadingTournaments] = useState(true);

  useEffect(() => {
    if (!id) return;

    async function load() {
      const { data: teamRow } = await supabase
        .from('teams')
        .select('id, owner_id, name, crest_url, crest_position_x, crest_position_y, banner_url, city, description, founded_year, sports(name)')
        .eq('id', id)
        .is('deleted_at', null)
        .single();

      const row = (teamRow as unknown as TeamDetail) ?? null;
      setTeam(row);

      if (row) {
        const { data: founder } = await supabase
          .from('public_profiles')
          .select('full_name')
          .eq('id', row.owner_id)
          .single();
        setFounderName(founder?.full_name ?? null);

        const { data: memberRows } = await supabase
          .from('team_members')
          .select('user_id')
          .eq('team_id', row.id);
        const memberIds = (memberRows ?? []).map((m) => m.user_id);
        setPlayerCount(memberIds.length);

        if (memberIds.length) {
          const { data: memberProfiles } = await supabase
            .from('public_profiles')
            .select('id, full_name, avatar_url, avatar_position_x, avatar_position_y, created_at')
            .in('id', memberIds);

          const profiles = (memberProfiles as unknown as Omit<Player, 'teamCount'>[]) ?? [];

          const { data: teamCountRows } = await supabase
            .from('team_members')
            .select('user_id')
            .in('user_id', memberIds);

          const countByUser = new Map<string, number>();
          (teamCountRows ?? []).forEach((m) =>
            countByUser.set(m.user_id, (countByUser.get(m.user_id) ?? 0) + 1)
          );

          setMembers(profiles.map((p) => ({ ...p, teamCount: countByUser.get(p.id) ?? 0 })));
        } else {
          setMembers([]);
        }

        if (user && user.id !== row.owner_id) {
          const { data: memberRow } = await supabase
            .from('team_members')
            .select('id')
            .eq('team_id', row.id)
            .eq('user_id', user.id)
            .maybeSingle();
          setIsMember(!!memberRow);

          const { data: requestRow } = await supabase
            .from('team_join_requests')
            .select('status')
            .eq('team_id', row.id)
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          setHasPendingRequest(requestRow?.status === 'pending');
        }
      }

      setLoading(false);
    }

    load();
  }, [id, user]);

  useEffect(() => {
    if (!team) {
      setTeamTournaments([]);
      return;
    }

    async function loadTournaments() {
      const { data: participantRows } = await supabase
        .from('tournament_teams')
        .select('tournament_id')
        .eq('team_id', team!.id);
      const tournamentIds = (participantRows ?? []).map((p) => p.tournament_id);

      if (!tournamentIds.length) {
        setTeamTournaments([]);
        setLoadingTournaments(false);
        return;
      }

      const { data: tournamentRows } = await supabase
        .from('tournaments')
        .select('id, name, crest_url, crest_position_x, crest_position_y, format, status, start_date')
        .in('id', tournamentIds)
        .order('created_at', { ascending: false });

      const tournaments = (tournamentRows as unknown as TeamTournamentInfo[]) ?? [];
      const placementByTournament = new Map<string, Placement>();

      const bracketFormatIds = tournaments.filter((t) => t.format !== 'liga').map((t) => t.id);
      const leagueFormatIds = tournaments.filter((t) => t.format === 'liga').map((t) => t.id);

      if (bracketFormatIds.length) {
        const { data: bracketRows } = await supabase
          .from('tournament_bracket_matches')
          .select('tournament_id, round, team_a_id, team_b_id, winner_team_id, status')
          .in('tournament_id', bracketFormatIds);

        const byTournament = new Map<string, NonNullable<typeof bracketRows>>();
        (bracketRows ?? []).forEach((r) => {
          if (!byTournament.has(r.tournament_id)) byTournament.set(r.tournament_id, []);
          byTournament.get(r.tournament_id)!.push(r);
        });

        bracketFormatIds.forEach((tid) => {
          const rows = byTournament.get(tid) ?? [];
          if (!rows.length) {
            placementByTournament.set(tid, { label: 'U toku', tone: 'pending' });
            return;
          }

          const maxRound = Math.max(...rows.map((r) => r.round));
          const finalMatch = rows.find((r) => r.round === maxRound);
          const teamMatches = rows.filter((r) => r.team_a_id === team!.id || r.team_b_id === team!.id);

          if (finalMatch && finalMatch.winner_team_id === team!.id) {
            placementByTournament.set(tid, { label: 'Šampion', tone: 'champion' });
          } else if (
            finalMatch &&
            finalMatch.status === 'finished' &&
            (finalMatch.team_a_id === team!.id || finalMatch.team_b_id === team!.id)
          ) {
            placementByTournament.set(tid, { label: 'Finalista', tone: 'runnerup' });
          } else {
            const lostMatch = teamMatches
              .filter((r) => r.status === 'finished' && r.winner_team_id && r.winner_team_id !== team!.id)
              .sort((a, b) => b.round - a.round)[0];

            placementByTournament.set(
              tid,
              lostMatch
                ? { label: `Ispao u ${eliminatedInRoundLabel(lostMatch.round, maxRound)}`, tone: 'default' }
                : { label: 'U toku', tone: 'pending' }
            );
          }
        });
      }

      if (leagueFormatIds.length) {
        const { data: leagueTeamsRows } = await supabase
          .from('tournament_teams')
          .select('tournament_id, team_id')
          .in('tournament_id', leagueFormatIds);
        const { data: leagueMatchRows } = await supabase
          .from('tournament_league_matches')
          .select('tournament_id, team_a_id, team_b_id, team_a_goals, team_b_goals, status')
          .in('tournament_id', leagueFormatIds);

        const teamIdsInvolved = [...new Set((leagueTeamsRows ?? []).map((r) => r.team_id))];
        const { data: teamNameRows } = teamIdsInvolved.length
          ? await supabase.from('teams').select('id, name').in('id', teamIdsInvolved)
          : { data: [] as { id: string; name: string }[] };
        const nameById = new Map((teamNameRows ?? []).map((t) => [t.id, t.name]));

        leagueFormatIds.forEach((tid) => {
          const teamsInTournament = (leagueTeamsRows ?? []).filter((r) => r.tournament_id === tid).map((r) => r.team_id);
          const matches = (leagueMatchRows ?? []).filter((m) => m.tournament_id === tid);

          const stats = new Map<string, { points: number; scored: number; conceded: number }>();
          teamsInTournament.forEach((tid2) => stats.set(tid2, { points: 0, scored: 0, conceded: 0 }));

          matches.forEach((m) => {
            const a = stats.get(m.team_a_id);
            const b = stats.get(m.team_b_id);
            if (!a || !b || m.status !== 'finished') return;

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
          });

          const ordered = teamsInTournament
            .map((tid2) => ({ teamId: tid2, ...(stats.get(tid2) ?? { points: 0, scored: 0, conceded: 0 }) }))
            .sort((x, y) => {
              if (y.points !== x.points) return y.points - x.points;
              const diffX = x.scored - x.conceded;
              const diffY = y.scored - y.conceded;
              if (diffY !== diffX) return diffY - diffX;
              if (y.scored !== x.scored) return y.scored - x.scored;
              return (nameById.get(x.teamId) ?? '').localeCompare(nameById.get(y.teamId) ?? '');
            });

          const rank = ordered.findIndex((o) => o.teamId === team!.id) + 1;
          const tournamentInfo = tournaments.find((t) => t.id === tid);

          if (!tournamentInfo || tournamentInfo.status !== 'finished') {
            placementByTournament.set(tid, { label: 'U toku', tone: 'pending' });
          } else if (rank === 1) {
            placementByTournament.set(tid, { label: 'Šampion', tone: 'champion' });
          } else if (rank === 2) {
            placementByTournament.set(tid, { label: '2. mesto', tone: 'runnerup' });
          } else if (rank > 0) {
            placementByTournament.set(tid, { label: `${rank}. mesto`, tone: 'default' });
          } else {
            placementByTournament.set(tid, { label: 'U toku', tone: 'pending' });
          }
        });
      }

      setTeamTournaments(
        tournaments.map((t) => ({ ...t, placement: placementByTournament.get(t.id) ?? { label: 'U toku', tone: 'pending' } }))
      );
      setLoadingTournaments(false);
    }

    loadTournaments();
  }, [team]);

  async function handleJoinRequest() {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!team) return;

    setJoining(true);
    setJoinError(null);
    const { error } = await supabase
      .from('team_join_requests')
      .insert({ team_id: team.id, user_id: user.id, initiated_by: user.id, type: 'request' });
    setJoining(false);

    if (error) {
      setJoinError('Slanje zahteva nije uspelo. Pokušaj ponovo.');
      return;
    }
    setHasPendingRequest(true);
  }

  async function handleLeaveTeam() {
    if (!user || !team) return;
    setLeaving(true);
    setLeaveError(null);
    const { error } = await supabase.from('team_members').delete().eq('team_id', team.id).eq('user_id', user.id);
    setLeaving(false);

    if (error) {
      setLeaveError('Napuštanje tima nije uspelo. Pokušaj ponovo.');
      return;
    }
    setIsMember(false);
    setPlayerCount((count) => Math.max(0, count - 1));
    setMembers((prev) => prev.filter((m) => m.id !== user.id));
    setConfirmingLeave(false);
  }

  async function handleDeleteTeam() {
    if (!team) return;
    setDeleting(true);
    setDeleteError(null);
    const { data, error } = await supabase
      .from('teams')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', team.id)
      .select('id');
    setDeleting(false);

    if (error || !data || data.length === 0) {
      setDeleteError('Brisanje tima nije uspelo. Pokušaj ponovo.');
      return;
    }
    navigate('/timovi');
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
              <div className="grid sm:grid-cols-3 gap-6 mb-10">
                {Array.from({ length: 3 }, (_, i) => (
                  <StatBlockSkeleton key={i} />
                ))}
              </div>
              <RowSkeletonGrid count={4} className="grid sm:grid-cols-2 gap-3" />
            </section>
          </>
        ) : !team ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-6 px-6 text-center">
            <p className="text-paper-500">Tim nije pronađen.</p>
            <Link to="/timovi" className="btn-line px-6 py-3 text-sm uppercase tracking-widest">
              Nazad na timove
            </Link>
          </div>
        ) : (
          <>
            <section className="bg-ink-900 border-b border-ink-700">
              <div className="aspect-[21/6] sm:aspect-[21/5] bg-ink-800 overflow-hidden">
                {team.banner_url && (
                  <img src={team.banner_url} alt="" className="w-full h-full object-cover" />
                )}
              </div>

              <div className="max-w-6xl mx-auto px-6 pb-10">
                <div className="relative z-10 w-28 h-28 sm:w-32 sm:h-32 -mt-14 sm:-mt-16 rounded-full overflow-hidden bg-ink-800 border-4 border-ink-900 ring-2 ring-red-500/40 flex items-center justify-center">
                  {team.crest_url ? (
                    <img
                      src={team.crest_url}
                      alt=""
                      className="w-full h-full object-cover"
                      style={{ objectPosition: `${team.crest_position_x}% ${team.crest_position_y}%` }}
                    />
                  ) : (
                    <span className="font-display text-3xl text-paper-500">{team.name[0]?.toUpperCase()}</span>
                  )}
                </div>

                {joinError && <p className="text-sm text-red-400 mt-3">{joinError}</p>}

                <div className="flex items-end justify-between gap-4 flex-wrap mt-5">
                  <div>
                    <h1 className="font-display text-3xl sm:text-4xl leading-tight">{team.name}</h1>
                    <div className="w-10 h-0.5 bg-red-500 mt-3 mb-3" />
                    {team.sports && (
                      <p className="text-xs uppercase tracking-widest text-red-400 font-semibold">{team.sports.name}</p>
                    )}
                  </div>

                  <div className="mb-1 flex flex-col items-end gap-3">
                    <Link
                      to="/timovi"
                      className="btn-line px-6 py-3 text-sm uppercase tracking-widest inline-flex items-center justify-center gap-2"
                    >
                      Nazad na timove
                    </Link>

                    {user?.id === team.owner_id ? (
                      <span className="text-xs uppercase tracking-widest text-red-400 border border-red-500/30 px-4 py-2.5 inline-block">
                        Ovo je tvoj tim
                      </span>
                    ) : isMember ? (
                      <span className="text-xs uppercase tracking-widest text-paper-500 border border-ink-700 px-4 py-2.5 inline-block">
                        Već si član tima
                      </span>
                    ) : hasPendingRequest ? (
                      <span className="text-xs uppercase tracking-widest text-red-400 border border-red-500/30 px-4 py-2.5 inline-block">
                        Zahtev je poslat
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleJoinRequest}
                        disabled={joining}
                        className="btn-solid px-5 py-2.5 text-xs uppercase tracking-widest"
                      >
                        {joining ? 'Slanje…' : 'Pridruži se timu'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </section>

            <section className="flex-1 max-w-6xl mx-auto px-6 py-12 sm:py-16 w-full">
              <div className="grid sm:grid-cols-3 gap-6 mb-10">
                <StatBlock label="Grad" value={team.city || '—'} />
                <StatBlock label="Godina osnivanja" value={team.founded_year ? String(team.founded_year) : '—'} />
                <StatBlock label="Igrača" value={String(playerCount)} />
              </div>

              {founderName && (
                <p className="text-sm text-paper-500 mb-10">
                  Osnivač: <span className="text-paper-100">{founderName}</span>
                </p>
              )}

              {fromTournamentId && (
                <Link
                  to={`/turniri/${fromTournamentId}`}
                  className="btn-line px-6 py-3 text-sm uppercase tracking-widest inline-flex items-center justify-center gap-2 mb-10"
                >
                  Nazad na turnir
                </Link>
              )}

              {team.description && (
                <div className="mb-10">
                  <span className="text-xs uppercase tracking-widest text-red-400 font-semibold">O timu</span>
                  <div className="w-10 h-0.5 bg-red-500 mt-3 mb-5" />
                  <p className="text-sm text-paper-200 leading-relaxed whitespace-pre-line">{team.description}</p>
                </div>
              )}

              <div className="mb-10">
                <span className="text-xs uppercase tracking-widest text-red-400 font-semibold">Igrači tima</span>
                <div className="w-10 h-0.5 bg-red-500 mt-3 mb-5" />
                {members.length === 0 ? (
                  <p className="text-sm text-paper-500">Ovaj tim još uvek nema igrača.</p>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-3">
                    {members.map((member, index) => (
                      <PlayerCard key={member.id} player={member} index={index} isCaptain={member.id === team.owner_id} />
                    ))}
                  </div>
                )}
              </div>

              <div className="mb-10">
                <span className="text-xs uppercase tracking-widest text-red-400 font-semibold">Turniri</span>
                <div className="w-10 h-0.5 bg-red-500 mt-3 mb-5" />
                {loadingTournaments ? (
                  <RowSkeletonGrid count={3} className="flex flex-col gap-3" />
                ) : teamTournaments.length === 0 ? (
                  <p className="text-sm text-paper-500">Ovaj tim se još uvek nije prijavio ni na jedan turnir.</p>
                ) : (
                  <div className="flex flex-col gap-3">
                    {teamTournaments.map((tournament, index) => (
                      <TeamTournamentRow key={tournament.id} tournament={tournament} index={index} />
                    ))}
                  </div>
                )}
              </div>

              {(isMember || user?.id === team.owner_id) && (
                <div className="mt-16 border border-red-500/20 bg-ink-900/60">
                  <div className="px-6 py-4 border-b border-red-500/20">
                    <span className="text-xs uppercase tracking-widest text-red-400 font-semibold">Opasna zona</span>
                  </div>

                  <div className="divide-y divide-ink-800">
                    {isMember && (
                      <div className="px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                          <p className="text-sm font-medium text-paper-100">Napusti tim</p>
                          <p className="text-xs text-paper-500 mt-1">Više nećeš biti član ovog tima.</p>
                          {leaveError && <p className="text-xs text-red-400 mt-2">{leaveError}</p>}
                        </div>
                        {confirmingLeave ? (
                          <div className="flex items-center gap-3 shrink-0">
                            <button
                              type="button"
                              onClick={handleLeaveTeam}
                              disabled={leaving}
                              className="px-4 py-2 text-xs uppercase tracking-widest text-paper-100 bg-red-500 hover:bg-red-400 transition-colors"
                            >
                              {leaving ? 'Napuštanje…' : 'Potvrdi'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmingLeave(false)}
                              disabled={leaving}
                              className="text-xs uppercase tracking-widest text-paper-500 hover:text-paper-100 transition-colors"
                            >
                              Otkaži
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmingLeave(true)}
                            className="shrink-0 px-4 py-2 text-xs uppercase tracking-widest text-red-400 border border-red-500/30 hover:bg-red-500/10 transition-colors"
                          >
                            Napusti tim
                          </button>
                        )}
                      </div>
                    )}

                    {user?.id === team.owner_id && (
                      <div className="px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                          <p className="text-sm font-medium text-paper-100">Obriši tim</p>
                          <p className="text-xs text-paper-500 mt-1">
                            Tim više neće biti vidljiv niti dostupan za nove prijave, ali istorija turnira i
                            utakmica u kojima je učestvovao ostaje sačuvana.
                          </p>
                          {deleteError && <p className="text-xs text-red-400 mt-2">{deleteError}</p>}
                        </div>
                        {confirmingDelete ? (
                          <div className="flex items-center gap-3 shrink-0">
                            <button
                              type="button"
                              onClick={handleDeleteTeam}
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
                            Obriši tim
                          </button>
                        )}
                      </div>
                    )}
                  </div>
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
