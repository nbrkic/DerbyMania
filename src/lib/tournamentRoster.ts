import { supabase } from './supabase';

export type RosterCandidate = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  birthYear: number | null;
};

export type IneligibleCandidate = RosterCandidate & {
  reason: 'age' | 'already_playing';
  conflictTeamName?: string;
};

export type EligibilityPool = {
  eligible: RosterCandidate[];
  ineligible: IneligibleCandidate[];
};

export type RosterTournament = {
  id: string;
  players_per_team: number;
  substitutions_allowed: number;
  min_birth_year: number | null;
  max_birth_year: number | null;
};

export function requiredSquadSize(tournament: RosterTournament) {
  return tournament.players_per_team + tournament.substitutions_allowed;
}

export function isAgeEligible(birthYear: number | null, minBirthYear: number | null, maxBirthYear: number | null) {
  if (minBirthYear == null && maxBirthYear == null) return true;
  if (birthYear == null) return false;
  if (minBirthYear != null && birthYear < minBirthYear) return false;
  if (maxBirthYear != null && birthYear > maxBirthYear) return false;
  return true;
}

/** Da li osnivač već ima DRUGI svoj tim prijavljen (ili na čekanju) na ovaj turnir. */
export async function checkOwnerConflict(
  tournamentId: string,
  ownerId: string,
  excludeTeamId: string
): Promise<{ blocked: boolean; teamName: string | null }> {
  const { data: ownedTeams } = await supabase.from('teams').select('id, name').eq('owner_id', ownerId).is('deleted_at', null);
  const ownedIds = (ownedTeams ?? []).filter((t) => t.id !== excludeTeamId).map((t) => t.id);
  if (!ownedIds.length) return { blocked: false, teamName: null };

  const nameById = new Map((ownedTeams ?? []).map((t) => [t.id, t.name]));

  const { data: participating } = await supabase
    .from('tournament_teams')
    .select('team_id')
    .eq('tournament_id', tournamentId)
    .in('team_id', ownedIds);
  if (participating && participating.length > 0) {
    return { blocked: true, teamName: nameById.get(participating[0].team_id) ?? null };
  }

  const { data: pending } = await supabase
    .from('tournament_team_requests')
    .select('team_id')
    .eq('tournament_id', tournamentId)
    .eq('status', 'pending')
    .in('team_id', ownedIds);
  if (pending && pending.length > 0) {
    return { blocked: true, teamName: nameById.get(pending[0].team_id) ?? null };
  }

  return { blocked: false, teamName: null };
}

/** Učitava sve članove tima i deli ih na one koji ispunjavaju uslove turnira i one koji ne. */
export async function loadEligibilityPool(tournamentId: string, teamId: string, tournament: RosterTournament): Promise<EligibilityPool> {
  const { data: memberRows } = await supabase.from('team_members').select('user_id').eq('team_id', teamId);
  const userIds = (memberRows ?? []).map((m) => m.user_id);
  if (!userIds.length) return { eligible: [], ineligible: [] };

  const [{ data: profiles }, { data: birthYears }, { data: conflictRows }] = await Promise.all([
    supabase.from('public_profiles').select('id, full_name, avatar_url').in('id', userIds),
    supabase.rpc('get_birth_years', { user_ids: userIds }),
    supabase.from('tournament_team_roster').select('user_id, team_id').eq('tournament_id', tournamentId).neq('team_id', teamId),
  ]);

  const birthYearRows = (birthYears ?? []) as unknown as { id: string; birth_year: number | null }[];
  const birthYearById = new Map(birthYearRows.map((r) => [r.id, r.birth_year]));
  const conflictTeamIdByUser = new Map((conflictRows ?? []).map((r: { user_id: string; team_id: string }) => [r.user_id, r.team_id]));

  let conflictTeamNameById = new Map<string, string>();
  const conflictTeamIds = [...new Set([...conflictTeamIdByUser.values()])];
  if (conflictTeamIds.length) {
    const { data: conflictTeams } = await supabase.from('teams').select('id, name').in('id', conflictTeamIds);
    conflictTeamNameById = new Map((conflictTeams ?? []).map((t) => [t.id, t.name]));
  }

  const eligible: RosterCandidate[] = [];
  const ineligible: IneligibleCandidate[] = [];

  (profiles ?? []).forEach((p: { id: string; full_name: string | null; avatar_url: string | null }) => {
    const birthYear = birthYearById.get(p.id) ?? null;
    const candidate: RosterCandidate = { id: p.id, full_name: p.full_name, avatar_url: p.avatar_url, birthYear };

    const conflictingTeamId = conflictTeamIdByUser.get(p.id);
    if (conflictingTeamId) {
      ineligible.push({ ...candidate, reason: 'already_playing', conflictTeamName: conflictTeamNameById.get(conflictingTeamId) });
      return;
    }
    if (!isAgeEligible(birthYear, tournament.min_birth_year, tournament.max_birth_year)) {
      ineligible.push({ ...candidate, reason: 'age' });
      return;
    }
    eligible.push(candidate);
  });

  return { eligible, ineligible };
}

/** Upisuje prijavljeni sastav tima za turnir (zamenjuje prethodni, ako postoji). */
export async function finalizeRoster(tournamentId: string, teamId: string, userIds: string[]) {
  await supabase.from('tournament_team_roster').delete().eq('tournament_id', tournamentId).eq('team_id', teamId);
  if (!userIds.length) return { error: null };
  const { error } = await supabase
    .from('tournament_team_roster')
    .insert(userIds.map((user_id) => ({ tournament_id: tournamentId, team_id: teamId, user_id })));
  return { error };
}

/** Oslobađa rezervisana mesta (npr. posle odbijanja zahteva/poziva ili povlačenja tima). */
export async function releaseRoster(tournamentId: string, teamId: string) {
  await supabase.from('tournament_team_roster').delete().eq('tournament_id', tournamentId).eq('team_id', teamId);
}
