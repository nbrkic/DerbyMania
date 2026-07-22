import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../lib/auth-context';
import { supabase } from '../lib/supabase';
import { SiteHeader, UserAvatar } from '../components/SiteHeader';
import { SiteFooter } from '../components/SiteFooter';
import { Dropdown } from '../components/Dropdown';
import {
  FOOTBALL_SPORT_NAMES,
  BASKETBALL_SPORT_NAMES,
  FOOTBALL_POSITION_VALUES,
  BASKETBALL_POSITION_VALUES,
  POSITION_LABELS,
} from '../lib/positions';
import { TeamCard, type Team } from './Teams';

type PlayerDetail = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  avatar_position_x: number;
  avatar_position_y: number;
  created_at: string;
  dominant_hand: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  age: number | null;
  preferred_positions: string[];
};

type OwnedTeam = { id: string; name: string };
type InviteStatus = 'none' | 'pending' | 'member';

const HAND_LABELS: Record<string, string> = {
  levak: 'Levak',
  desnjak: 'Dešnjak',
  oba: 'Oba',
};

function memberSince(iso: string) {
  return new Date(iso).toLocaleDateString('sr-RS', { month: 'long', year: 'numeric' });
}

function StatBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-ink-900 border border-ink-700 border-t-2 border-t-red-500/50 px-5 py-4">
      <p className="text-[11px] uppercase tracking-widest text-paper-500 mb-1">{label}</p>
      <p className="font-display text-xl leading-tight">{value}</p>
    </div>
  );
}

function PillList({ items }: { items: string[] }) {
  if (items.length === 0) return <p className="text-sm text-paper-700">Nije navedeno.</p>;
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <span key={item} className="text-xs uppercase tracking-widest text-paper-100 border border-ink-700 px-3 py-1.5">
          {item}
        </span>
      ))}
    </div>
  );
}

export default function PlayerDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [player, setPlayer] = useState<PlayerDetail | null>(null);
  const [sportNames, setSportNames] = useState<string[]>([]);
  const [memberTeams, setMemberTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  const [ownedTeams, setOwnedTeams] = useState<OwnedTeam[]>([]);
  const [teamStatus, setTeamStatus] = useState<Map<string, InviteStatus>>(new Map());
  const [selectedInviteTeamId, setSelectedInviteTeamId] = useState('');
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    async function load() {
      const { data: playerRow } = await supabase
        .from('public_profiles')
        .select(
          'id, full_name, avatar_url, avatar_position_x, avatar_position_y, created_at, dominant_hand, height_cm, weight_kg, age, preferred_positions'
        )
        .eq('id', id)
        .single();

      const row = (playerRow as unknown as PlayerDetail) ?? null;
      setPlayer(row);

      if (row) {
        const { data: preferredSports } = await supabase
          .from('profile_preferred_sports')
          .select('sports(name)')
          .eq('profile_id', row.id);
        setSportNames(
          ((preferredSports as unknown as { sports: { name: string } | null }[]) ?? [])
            .map((r) => r.sports?.name)
            .filter((name): name is string => !!name)
        );

        const { data: membershipRows } = await supabase.from('team_members').select('team_id').eq('user_id', row.id);
        const memberTeamIds = (membershipRows ?? []).map((m) => m.team_id);

        if (memberTeamIds.length) {
          const { data: teamRows } = await supabase
            .from('teams')
            .select('id, owner_id, name, crest_url, crest_position_x, crest_position_y, banner_url, city, founded_year, sport_id, sports(name)')
            .in('id', memberTeamIds);

          const rows = (teamRows as unknown as Omit<Team, 'founderName' | 'playerCount'>[]) ?? [];

          const ownerIds = [...new Set(rows.map((t) => t.owner_id))];
          const { data: founders } = ownerIds.length
            ? await supabase.from('public_profiles').select('id, full_name').in('id', ownerIds)
            : { data: [] as { id: string; full_name: string | null }[] };
          const nameById = new Map((founders ?? []).map((f) => [f.id, f.full_name]));

          const { data: allMemberRows } = await supabase.from('team_members').select('team_id').in('team_id', memberTeamIds);
          const countByTeam = new Map<string, number>();
          (allMemberRows ?? []).forEach((m) => countByTeam.set(m.team_id, (countByTeam.get(m.team_id) ?? 0) + 1));

          setMemberTeams(
            rows.map((t) => ({ ...t, founderName: nameById.get(t.owner_id) ?? null, playerCount: countByTeam.get(t.id) ?? 0 }))
          );
        } else {
          setMemberTeams([]);
        }
      }

      setLoading(false);
    }

    load();
  }, [id]);

  useEffect(() => {
    if (!user || !player || user.id === player.id) {
      setOwnedTeams([]);
      return;
    }

    async function loadOwnedTeams() {
      const { data } = await supabase
        .from('teams')
        .select('id, name')
        .eq('owner_id', user!.id)
        .order('created_at', { ascending: false });

      const owned = data ?? [];
      setOwnedTeams(owned);
      if (!owned.length) return;

      const ids = owned.map((t) => t.id);
      const { data: memberships } = await supabase
        .from('team_members')
        .select('team_id')
        .eq('user_id', player!.id)
        .in('team_id', ids);
      const memberSet = new Set((memberships ?? []).map((m) => m.team_id));

      const { data: pendings } = await supabase
        .from('team_join_requests')
        .select('team_id')
        .eq('user_id', player!.id)
        .eq('status', 'pending')
        .in('team_id', ids);
      const pendingSet = new Set((pendings ?? []).map((p) => p.team_id));

      const statusMap = new Map<string, InviteStatus>();
      owned.forEach((t) => {
        statusMap.set(t.id, memberSet.has(t.id) ? 'member' : pendingSet.has(t.id) ? 'pending' : 'none');
      });
      setTeamStatus(statusMap);
      setSelectedInviteTeamId(owned[0].id);
    }

    loadOwnedTeams();
  }, [user, player]);

  async function handleInvite() {
    if (!user || !player || !selectedInviteTeamId) return;
    setInviting(true);
    setInviteError(null);

    const { error } = await supabase.from('team_join_requests').insert({
      team_id: selectedInviteTeamId,
      user_id: player.id,
      initiated_by: user.id,
      type: 'invite',
    });

    setInviting(false);
    if (error) {
      setInviteError('Slanje poziva nije uspelo. Pokušaj ponovo.');
      return;
    }
    setTeamStatus((prev) => new Map(prev).set(selectedInviteTeamId, 'pending'));
  }

  const showFootballPositions = sportNames.some((n) => FOOTBALL_SPORT_NAMES.includes(n));
  const showBasketballPositions = sportNames.some((n) => BASKETBALL_SPORT_NAMES.includes(n));

  const currentInviteStatus = teamStatus.get(selectedInviteTeamId) ?? 'none';
  const inviteLabel = inviting
    ? 'Slanje…'
    : currentInviteStatus === 'member'
      ? 'Već je član ovog tima'
      : currentInviteStatus === 'pending'
        ? 'Poziv je već poslat'
        : ownedTeams.length === 1
          ? `Pozovi u tim „${ownedTeams[0].name}“`
          : 'Pozovi u tim';

  return (
    <div className="min-h-screen flex flex-col bg-ink-950 text-paper-100 overflow-x-hidden">
      <div className="grain" />
      <SiteHeader />

      <main className="flex-1 pt-16 flex flex-col">
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-paper-500">Učitavanje…</p>
          </div>
        ) : !player ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-6 px-6 text-center">
            <p className="text-paper-500">Igrač nije pronađen.</p>
            <Link to="/igraci" className="btn-line px-6 py-3 text-sm uppercase tracking-widest">
              Nazad na igrače
            </Link>
          </div>
        ) : (
          <>
            <section className="bg-ink-900 border-b border-ink-700">
              <div className="max-w-4xl mx-auto px-6 pt-8 sm:pt-10 pb-10 flex flex-col items-center text-center">
                <Link
                  to="/igraci"
                  className="self-start mb-8 btn-line px-6 py-3 text-sm uppercase tracking-widest inline-flex items-center justify-center gap-2"
                >
                  Nazad na igrače
                </Link>

                <UserAvatar
                  name={player.full_name || 'Igrač bez imena'}
                  avatarUrl={player.avatar_url}
                  position={{ x: player.avatar_position_x, y: player.avatar_position_y }}
                  className="w-28 h-28 sm:w-32 sm:h-32 text-3xl ring-2 ring-red-500/40"
                />
                <h1 className="font-display text-3xl sm:text-4xl mt-5 leading-tight">
                  {player.full_name || 'Igrač bez imena'}
                </h1>
                <div className="w-10 h-0.5 bg-red-500 mt-3 mb-3" />
                <p className="text-xs uppercase tracking-widest text-paper-500">Član od {memberSince(player.created_at)}</p>

                {ownedTeams.length > 0 && (
                  <div className="mt-6 w-full max-w-sm">
                    <p className="text-xs uppercase tracking-widest text-paper-500 mb-3">Pozovi igrača u svoj tim</p>
                    <div className="flex flex-col sm:flex-row items-center gap-3">
                      {ownedTeams.length > 1 && (
                        <div className="w-full sm:w-48">
                          <Dropdown
                            id="invite-team"
                            value={selectedInviteTeamId}
                            onChange={setSelectedInviteTeamId}
                            options={ownedTeams.map((t) => ({ value: t.id, label: t.name }))}
                          />
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={handleInvite}
                        disabled={inviting || currentInviteStatus !== 'none'}
                        className="btn-solid w-full sm:w-auto px-5 py-2.5 text-xs uppercase tracking-widest whitespace-nowrap"
                      >
                        {inviteLabel}
                      </button>
                    </div>
                    {inviteError && <p className="text-sm text-red-400 mt-3">{inviteError}</p>}
                  </div>
                )}
              </div>
            </section>

            <section className="flex-1 max-w-4xl mx-auto px-6 py-12 sm:py-16 w-full">
              <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-12">
                <StatBlock label="Godina" value={player.age != null ? String(player.age) : '—'} />
                <StatBlock label="Visina" value={player.height_cm ? `${player.height_cm} cm` : '—'} />
                <StatBlock label="Težina" value={player.weight_kg ? `${player.weight_kg} kg` : '—'} />
                <StatBlock label="Dominantna ruka" value={player.dominant_hand ? HAND_LABELS[player.dominant_hand] : '—'} />
                <StatBlock label="Timova" value={String(memberTeams.length)} />
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                <div className="bg-ink-900 border border-ink-700 border-t-2 border-t-red-500/50 px-5 py-4">
                  <span className="text-xs uppercase tracking-widest text-red-400 font-semibold">Preferirani sportovi</span>
                  <div className="mt-3">
                    <PillList items={sportNames} />
                  </div>
                </div>

                {showFootballPositions && (
                  <div className="bg-ink-900 border border-ink-700 border-t-2 border-t-red-500/50 px-5 py-4">
                    <span className="text-xs uppercase tracking-widest text-red-400 font-semibold">
                      Preferirane pozicije (Fudbal)
                    </span>
                    <div className="mt-3">
                      <PillList
                        items={player.preferred_positions
                          .filter((p) => FOOTBALL_POSITION_VALUES.includes(p))
                          .map((p) => POSITION_LABELS[p] ?? p)}
                      />
                    </div>
                  </div>
                )}

                {showBasketballPositions && (
                  <div className="bg-ink-900 border border-ink-700 border-t-2 border-t-red-500/50 px-5 py-4">
                    <span className="text-xs uppercase tracking-widest text-red-400 font-semibold">
                      Preferirane pozicije (Košarka)
                    </span>
                    <div className="mt-3">
                      <PillList
                        items={player.preferred_positions
                          .filter((p) => BASKETBALL_POSITION_VALUES.includes(p))
                          .map((p) => POSITION_LABELS[p] ?? p)}
                      />
                    </div>
                  </div>
                )}
              </div>

              {memberTeams.length > 0 && (
                <div>
                  <span className="text-xs uppercase tracking-widest text-red-400 font-semibold">Član timova</span>
                  <div className="grid sm:grid-cols-2 gap-6 mt-4">
                    {memberTeams.map((team, index) => (
                      <TeamCard key={team.id} team={team} index={index} />
                    ))}
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
