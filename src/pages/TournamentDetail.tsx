import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../lib/auth-context';
import { supabase } from '../lib/supabase';
import { SiteHeader } from '../components/SiteHeader';
import { SiteFooter } from '../components/SiteFooter';
import { Dropdown } from '../components/Dropdown';
import { TeamRow, type Team } from './Teams';
import { BASKETBALL_SPORT_NAMES } from '../lib/positions';

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
type TopScorer = { playerId: string; fullName: string | null; teamId: string; goals: number };

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

function StatBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-ink-900 border border-ink-700 border-t-2 border-t-red-500/50 px-5 py-4">
      <p className="text-[11px] uppercase tracking-widest text-paper-500 mb-1">{label}</p>
      <p className="font-display text-xl leading-tight">{value}</p>
    </div>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('sr-RS', { day: 'numeric', month: 'long', year: 'numeric' });
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

  useEffect(() => {
    if (!id) return;

    async function load() {
      const { data: tournamentRow } = await supabase
        .from('tournaments')
        .select(
          'id, owner_id, name, crest_url, crest_position_x, crest_position_y, banner_url, city, location, description, start_date, start_time, max_teams, format, players_per_team, substitutions_allowed, match_duration_minutes, period_duration_minutes, sport_id, status, roster_locked, sports(name)'
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

    async function loadTopScorer() {
      const counts = new Map<string, { teamId: string; goals: number }>();

      if (format === 'liga') {
        await countGoals('tournament_league_matches', 'tournament_league_goals', counts);
      } else if (format === 'kup') {
        await countGoals('tournament_bracket_matches', 'tournament_bracket_goals', counts);
      } else {
        await countGoals('tournament_matches', 'tournament_match_goals', counts);
        await countGoals('tournament_bracket_matches', 'tournament_bracket_goals', counts);
      }

      if (!counts.size) {
        setTopScorer(null);
        return;
      }

      let bestPlayerId = '';
      let best = { teamId: '', goals: -1 };
      counts.forEach((value, playerId) => {
        if (value.goals > best.goals) {
          best = value;
          bestPlayerId = playerId;
        }
      });

      const { data: profile } = await supabase.from('public_profiles').select('full_name').eq('id', bestPlayerId).single();

      setTopScorer({ playerId: bestPlayerId, fullName: profile?.full_name ?? null, teamId: best.teamId, goals: best.goals });
    }

    loadTopScorer();
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
    const { error } = await supabase.from('tournaments').delete().eq('id', tournament.id);
    setDeleting(false);

    if (error) {
      setDeleteError('Brisanje turnira nije uspelo. Pokušaj ponovo.');
      return;
    }
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

                  <div className="mb-1 flex flex-col items-end gap-3">
                    <Link
                      to="/turniri"
                      className="btn-line px-5 py-2.5 text-xs uppercase tracking-widest inline-flex items-center justify-center gap-2"
                    >
                      Nazad na turnire
                    </Link>

                    {user?.id === tournament.owner_id ? (
                      <div className="flex flex-col items-end gap-3">
                        <div className="flex items-center gap-3">
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

            {tournament.format === 'grupe_i_eliminacija' && (
              <section className="bg-maroon-900 border-b border-ink-700">
                <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col gap-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                    <div>
                      <span className="text-xs uppercase tracking-widest text-red-400 font-semibold">Grupna faza</span>
                      <p className="text-paper-200 text-sm mt-1">
                        Ovaj turnir koristi format grupa. Pogledaj raspored grupa i timove u njima.
                      </p>
                    </div>
                    <Link
                      to={`/turniri/${tournament.id}/grupe`}
                      className="btn-solid px-6 py-3 text-sm uppercase tracking-widest inline-flex items-center justify-center gap-2 whitespace-nowrap"
                    >
                      Pogledaj grupnu fazu
                    </Link>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 pt-6 border-t border-ink-700">
                    <div>
                      <span className="text-xs uppercase tracking-widest text-red-400 font-semibold">Eliminaciona faza</span>
                      <p className="text-paper-200 text-sm mt-1">
                        Kada se zaključi grupna faza, ovde se prati eliminaciona faza i pobednik turnira.
                      </p>
                    </div>
                    <Link
                      to={`/turniri/${tournament.id}/eliminacija`}
                      className="btn-solid px-6 py-3 text-sm uppercase tracking-widest inline-flex items-center justify-center gap-2 whitespace-nowrap"
                    >
                      Pogledaj eliminacionu fazu
                    </Link>
                  </div>
                </div>
              </section>
            )}

            {tournament.format === 'kup' && (
              <section className="bg-maroon-900 border-b border-ink-700">
                <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                  <div>
                    <span className="text-xs uppercase tracking-widest text-red-400 font-semibold">Kup</span>
                    <p className="text-paper-200 text-sm mt-1">
                      Ovaj turnir koristi kup format. Pogledaj žreb i eliminacionu fazu.
                    </p>
                  </div>
                  <Link
                    to={`/turniri/${tournament.id}/eliminacija`}
                    className="btn-solid px-6 py-3 text-sm uppercase tracking-widest inline-flex items-center justify-center gap-2 whitespace-nowrap"
                  >
                    Pogledaj kup
                  </Link>
                </div>
              </section>
            )}

            {tournament.format === 'liga' && (
              <section className="bg-maroon-900 border-b border-ink-700">
                <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                  <div>
                    <span className="text-xs uppercase tracking-widest text-red-400 font-semibold">Liga</span>
                    <p className="text-paper-200 text-sm mt-1">
                      Ovaj turnir koristi format lige. Pogledaj tabelu i utakmice svih prijavljenih timova.
                    </p>
                  </div>
                  <Link
                    to={`/turniri/${tournament.id}/liga`}
                    className="btn-solid px-6 py-3 text-sm uppercase tracking-widest inline-flex items-center justify-center gap-2 whitespace-nowrap"
                  >
                    Pogledaj tabelu lige
                  </Link>
                </div>
              </section>
            )}

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

              {isFinished && topScorer && (
                <div className="mb-10">
                  <span className="text-xs uppercase tracking-widest text-red-400 font-semibold">
                    Najbolji strelac turnira
                  </span>
                  <div className="w-10 h-0.5 bg-red-500 mt-3 mb-5" />
                  <Link
                    to={`/igraci/${topScorer.playerId}`}
                    className="group flex items-center gap-4 bg-ink-900 border border-ink-700 border-l-2 border-l-red-500/50 px-5 py-4 max-w-md transition-colors duration-200 hover:bg-ink-800 hover:border-l-red-400"
                  >
                    <div className="w-11 h-11 rounded-full bg-ink-800 ring-1 ring-red-500/40 flex items-center justify-center shrink-0">
                      {isBasketball ? (
                        <BasketballIcon className="w-5 h-5 text-red-400" />
                      ) : (
                        <BallIcon className="w-5 h-5 text-red-400" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
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

              {(ownedParticipatingTeams.length > 0 || user?.id === tournament.owner_id) && (
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

                    {user?.id === tournament.owner_id && (
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
          </>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
