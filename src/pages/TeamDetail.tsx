import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { SiteHeader } from '../components/SiteHeader';
import { SiteFooter } from '../components/SiteFooter';

type TeamDetail = {
  id: string;
  owner_id: string;
  name: string;
  crest_url: string | null;
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
  const [team, setTeam] = useState<TeamDetail | null>(null);
  const [founderName, setFounderName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    async function load() {
      const { data: teamRow } = await supabase
        .from('teams')
        .select('id, owner_id, name, crest_url, banner_url, city, founded_year, sports(name)')
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
      }

      setLoading(false);
    }

    load();
  }, [id]);

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
                    <img src={team.crest_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="font-display text-3xl text-paper-500">{team.name[0]?.toUpperCase()}</span>
                  )}
                </div>

                <h1 className="font-display text-3xl sm:text-4xl mt-5 leading-tight">{team.name}</h1>
                <div className="w-10 h-0.5 bg-red-500 mt-3 mb-3" />
                {team.sports && (
                  <p className="text-xs uppercase tracking-widest text-red-400 font-semibold">{team.sports.name}</p>
                )}
              </div>
            </section>

            <section className="flex-1 max-w-4xl mx-auto px-6 py-12 sm:py-16 w-full">
              <div className="grid sm:grid-cols-3 gap-6 mb-10">
                <StatBlock label="Grad" value={team.city || '—'} />
                <StatBlock label="Godina osnivanja" value={team.founded_year ? String(team.founded_year) : '—'} />
                <StatBlock label="Igrača" value="0" />
              </div>

              {founderName && (
                <p className="text-sm text-paper-500 mb-10">
                  Osnivač: <span className="text-paper-100">{founderName}</span>
                </p>
              )}

              <Link to="/timovi" className="btn-line px-6 py-3 text-sm uppercase tracking-widest inline-flex items-center justify-center gap-2">
                Nazad na timove
              </Link>
            </section>
          </>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
