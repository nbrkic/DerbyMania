import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../lib/auth-context';
import { supabase } from '../lib/supabase';
import { SiteHeader } from '../components/SiteHeader';
import { SiteFooter } from '../components/SiteFooter';

type TeamDetail = {
  id: string;
  owner_id: string;
  name: string;
  crest_url: string | null;
  crest_position_x: number;
  crest_position_y: number;
  banner_url: string | null;
  city: string | null;
  founded_year: number | null;
  sports: { name: string } | null;
};

function StatBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-ink-900 border border-ink-700 border-t-2 border-t-red-500/50 px-5 py-4">
      <p className="text-[11px] uppercase tracking-widest text-paper-500 mb-1">{label}</p>
      <p className="font-display text-xl leading-tight">{value}</p>
    </div>
  );
}

export default function TeamDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [team, setTeam] = useState<TeamDetail | null>(null);
  const [founderName, setFounderName] = useState<string | null>(null);
  const [playerCount, setPlayerCount] = useState(0);
  const [isMember, setIsMember] = useState(false);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    async function load() {
      const { data: teamRow } = await supabase
        .from('teams')
        .select('id, owner_id, name, crest_url, crest_position_x, crest_position_y, banner_url, city, founded_year, sports(name)')
        .eq('id', id)
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

        const { count } = await supabase
          .from('team_members')
          .select('id', { count: 'exact', head: true })
          .eq('team_id', row.id);
        setPlayerCount(count ?? 0);

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

  async function handleJoinRequest() {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!team) return;

    setJoining(true);
    setJoinError(null);
    const { error } = await supabase.from('team_join_requests').insert({ team_id: team.id, user_id: user.id });
    setJoining(false);

    if (error) {
      setJoinError('Slanje zahteva nije uspelo. Pokušaj ponovo.');
      return;
    }
    setHasPendingRequest(true);
  }

  async function handleDeleteTeam() {
    if (!team) return;
    setDeleting(true);
    setDeleteError(null);
    const { error } = await supabase.from('teams').delete().eq('id', team.id);
    setDeleting(false);

    if (error) {
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
          <div className="flex-1 flex items-center justify-center">
            <p className="text-paper-500">Učitavanje…</p>
          </div>
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

              <div className="max-w-4xl mx-auto px-6 pb-10">
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

                  <div className="mb-1">
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

            <section className="flex-1 max-w-4xl mx-auto px-6 py-12 sm:py-16 w-full">
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

              <Link to="/timovi" className="btn-line px-6 py-3 text-sm uppercase tracking-widest inline-flex items-center justify-center gap-2">
                Nazad na timove
              </Link>

              {user?.id === team.owner_id && (
                <div className="mt-16 pt-6 border-t border-ink-800">
                  {confirmingDelete ? (
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-xs text-paper-500">Da li si siguran da želiš da obrišeš ovaj tim?</span>
                      <button
                        type="button"
                        onClick={handleDeleteTeam}
                        disabled={deleting}
                        className="text-xs uppercase tracking-widest text-red-400 hover:text-red-300 transition-colors underline underline-offset-4"
                      >
                        {deleting ? 'Brisanje…' : 'Da, obriši tim'}
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
                      className="text-xs uppercase tracking-widest text-paper-700 hover:text-red-400 transition-colors"
                    >
                      Obriši tim
                    </button>
                  )}
                  {deleteError && <p className="text-sm text-red-400 mt-3">{deleteError}</p>}
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
