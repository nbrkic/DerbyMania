import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { SiteHeader } from '../components/SiteHeader';
import { SiteFooter } from '../components/SiteFooter';
import { Dropdown } from '../components/Dropdown';
import { CardSkeletonGrid } from '../components/Skeleton';
import { normalizeForSearch } from '../lib/text';

type Sport = { id: number; name: string };

export type Tournament = {
  id: string;
  owner_id: string;
  name: string;
  crest_url: string | null;
  crest_position_x: number;
  crest_position_y: number;
  banner_url: string | null;
  city: string | null;
  location: string | null;
  start_date: string | null;
  max_teams: number | null;
  sport_id: number;
  status: string;
  sports: { name: string } | null;
  founderName: string | null;
  teamCount: number;
};

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function formatStartDate(start: string | null) {
  if (!start) return null;
  return new Date(start).toLocaleDateString('sr-Latn-RS', { day: 'numeric', month: 'short', year: 'numeric' });
}

const RISE_CLASSES = ['rise-1', 'rise-2', 'rise-3', 'rise-4'];
const PAGE_SIZE = 9;

export function TournamentCard({ tournament, index }: { tournament: Tournament; index: number }) {
  const dateRange = formatStartDate(tournament.start_date);
  return (
    <Link
      to={`/turniri/${tournament.id}`}
      className={`group relative block bg-ink-800 border border-ink-700 border-t-2 border-t-red-500/40 overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:border-red-500/60 hover:shadow-[0_0_0_1px_rgba(239,68,68,0.3),0_20px_40px_-18px_rgba(220,38,38,0.55)] ${RISE_CLASSES[index % RISE_CLASSES.length]}`}
    >
      <div className="aspect-[21/9] bg-ink-700 overflow-hidden relative">
        {tournament.banner_url && (
          <img
            src={tournament.banner_url}
            alt=""
            className="w-full h-full object-cover transition-all duration-500 group-hover:brightness-110 group-hover:saturate-125"
          />
        )}
        <div className="absolute inset-0 bg-red-600/0 group-hover:bg-red-600/10 transition-colors duration-300" />
        {tournament.status === 'finished' && (
          <span className="absolute top-3 right-3 text-[10px] uppercase tracking-widest text-paper-100 bg-ink-950/80 border border-ink-700 px-2.5 py-1">
            Završen
          </span>
        )}
      </div>

      <div className="px-5 pb-5 relative">
        <div className="relative z-10 w-16 h-16 -mt-8 mb-3 rounded-full overflow-hidden bg-ink-700 border-4 border-ink-900 ring-2 ring-red-500/30 flex items-center justify-center transition-all duration-300 group-hover:ring-4 group-hover:ring-red-500/60 group-hover:scale-110">
          {tournament.crest_url ? (
            <img
              src={tournament.crest_url}
              alt=""
              className="w-full h-full object-cover"
              style={{ objectPosition: `${tournament.crest_position_x}% ${tournament.crest_position_y}%` }}
            />
          ) : (
            <span className="font-display text-lg text-paper-500">{tournament.name[0]?.toUpperCase()}</span>
          )}
        </div>

        <h3 className="font-display text-xl leading-tight mb-1 transition-colors duration-300 group-hover:text-red-400">
          {tournament.name}
        </h3>
        {tournament.sports && (
          <p className="text-xs uppercase tracking-widest text-red-400 font-semibold mb-2">{tournament.sports.name}</p>
        )}
        <div className="h-0.5 w-0 bg-red-500 group-hover:w-full transition-all duration-500 ease-out mb-3" />

        <div className="flex items-center justify-between text-xs text-paper-500 pt-3 border-t border-ink-700">
          <span>{tournament.city || '—'}</span>
          <span>{dateRange || ''}</span>
        </div>
        {tournament.founderName && (
          <p className="text-xs text-paper-500 mt-2">
            Organizator: <span className="text-paper-100">{tournament.founderName}</span>
          </p>
        )}
        <p className="text-xs text-paper-700 uppercase tracking-widest mt-2">
          {tournament.teamCount}
          {tournament.max_teams ? ` / ${tournament.max_teams}` : ''} timova
        </p>
      </div>
    </Link>
  );
}

export function TournamentRow({ tournament, index }: { tournament: Tournament; index: number }) {
  const dateRange = formatStartDate(tournament.start_date);
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
          {tournament.sports?.name ?? ''}
          {dateRange ? ` · ${dateRange}` : ''}
        </p>
      </div>

      <span
        className={`text-[11px] uppercase tracking-widest font-semibold shrink-0 whitespace-nowrap ${
          tournament.status === 'finished' ? 'text-paper-500' : 'text-red-400'
        }`}
      >
        {tournament.status === 'finished'
          ? 'Završen'
          : `${tournament.teamCount}${tournament.max_teams ? ` / ${tournament.max_teams}` : ''} timova`}
      </span>
    </Link>
  );
}

export default function Tournaments() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [sports, setSports] = useState<Sport[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sportFilter, setSportFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    async function load() {
      const { data: tournamentRows } = await supabase
        .from('tournaments')
        .select(
          'id, owner_id, name, crest_url, crest_position_x, crest_position_y, banner_url, city, location, start_date, max_teams, sport_id, status, sports(name)'
        )
        .order('created_at', { ascending: false });

      const rows = (tournamentRows as unknown as Omit<Tournament, 'founderName' | 'teamCount'>[]) ?? [];

      const ownerIds = [...new Set(rows.map((t) => t.owner_id))];
      const { data: founders } = ownerIds.length
        ? await supabase.from('public_profiles').select('id, full_name').in('id', ownerIds)
        : { data: [] as { id: string; full_name: string | null }[] };

      const nameById = new Map((founders ?? []).map((f) => [f.id, f.full_name]));

      const tournamentIds = rows.map((t) => t.id);
      const { data: teamRows } = tournamentIds.length
        ? await supabase.from('tournament_teams').select('tournament_id').in('tournament_id', tournamentIds)
        : { data: [] as { tournament_id: string }[] };

      const countByTournament = new Map<string, number>();
      (teamRows ?? []).forEach((t) => countByTournament.set(t.tournament_id, (countByTournament.get(t.tournament_id) ?? 0) + 1));

      setTournaments(
        rows.map((t) => ({
          ...t,
          founderName: nameById.get(t.owner_id) ?? null,
          teamCount: countByTournament.get(t.id) ?? 0,
        }))
      );
      setLoading(false);
    }

    load();

    supabase
      .from('sports')
      .select('id, name')
      .order('name')
      .then(({ data }) => setSports(data ?? []));
  }, []);

  const filteredTournaments = useMemo(() => {
    const query = normalizeForSearch(search);
    return tournaments.filter((t) => {
      const matchesSearch = !query || normalizeForSearch(t.name).includes(query);
      const matchesSport = !sportFilter || String(t.sport_id) === sportFilter;
      const matchesStatus = !statusFilter || t.status === statusFilter;
      return matchesSearch && matchesSport && matchesStatus;
    });
  }, [tournaments, search, sportFilter, statusFilter]);

  useEffect(() => {
    setPage(1);
  }, [search, sportFilter, statusFilter]);

  const pageCount = Math.max(1, Math.ceil(filteredTournaments.length / PAGE_SIZE));
  const pagedTournaments = filteredTournaments.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="min-h-screen flex flex-col bg-ink-950 text-paper-100 overflow-x-hidden">
      <div className="grain" />
      <SiteHeader />

      <main className="flex-1 pt-16 flex flex-col">
        <section className="relative z-20 bg-ink-900 border-b border-ink-700">
          <div
            className="absolute inset-x-0 top-0 h-56 opacity-[0.08] pointer-events-none"
            style={{
              backgroundImage:
                'repeating-linear-gradient(135deg, var(--paper-100) 0, var(--paper-100) 1px, transparent 1px, transparent 28px)',
              WebkitMaskImage: 'radial-gradient(ellipse at 30% 55%, black 25%, transparent 70%)',
              maskImage: 'radial-gradient(ellipse at 30% 55%, black 25%, transparent 70%)',
            }}
          />

          <div className="relative max-w-6xl mx-auto px-6 pt-16 sm:pt-20 pb-8 sm:pb-10 w-full">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
              <div className="rise-1">
                <span className="text-xs uppercase tracking-widest text-red-400 font-semibold">Prijavi tim ili organizuj svoj</span>
                <h1 className="font-display text-4xl sm:text-5xl mt-4 leading-tight">Pregled turnira</h1>
              </div>
              <Link
                to="/turniri/novi"
                className="rise-2 btn-solid px-6 py-3 text-sm inline-flex items-center justify-center gap-2 whitespace-nowrap"
              >
                Napravi turnir
              </Link>
            </div>

            {!loading && tournaments.length > 0 && (
              <div className="rise-2 flex flex-col sm:flex-row gap-4 mt-16">
                <div className="relative flex-1">
                  <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-paper-500 pointer-events-none" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Pretraži turnire po imenu…"
                    className="w-full bg-ink-950 border border-ink-700 focus:border-red-400 focus:outline-none pl-10 pr-4 py-2.5 text-sm text-paper-100 placeholder:text-paper-500 transition-colors"
                  />
                </div>
                <div className="sm:w-56 shrink-0">
                  <Dropdown
                    id="sport-filter"
                    value={sportFilter}
                    onChange={setSportFilter}
                    options={[{ value: '', label: 'Svi sportovi' }, ...sports.map((s) => ({ value: String(s.id), label: s.name }))]}
                    triggerClassName="w-full h-full bg-ink-950 border border-ink-700 hover:border-red-400/50 focus:border-red-400 focus:outline-none px-4 py-2.5 text-sm text-paper-100 text-left flex items-center justify-between gap-3 transition-colors"
                  />
                </div>
                <div className="sm:w-56 shrink-0">
                  <Dropdown
                    id="status-filter"
                    value={statusFilter}
                    onChange={setStatusFilter}
                    options={[
                      { value: '', label: 'Svi turniri' },
                      { value: 'active', label: 'Aktivni' },
                      { value: 'finished', label: 'Završeni' },
                    ]}
                    triggerClassName="w-full h-full bg-ink-950 border border-ink-700 hover:border-red-400/50 focus:border-red-400 focus:outline-none px-4 py-2.5 text-sm text-paper-100 text-left flex items-center justify-between gap-3 transition-colors"
                  />
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="flex-1 bg-maroon-900">
          <div className="max-w-6xl mx-auto px-6 py-16 sm:py-20 w-full">
            {loading ? (
              <CardSkeletonGrid count={9} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8" />
            ) : tournaments.length === 0 ? (
              <p className="text-paper-500">Još uvek nema turnira. Budi prvi koji će ga napraviti.</p>
            ) : filteredTournaments.length === 0 ? (
              <p className="text-paper-500">Nema turnira koji odgovaraju pretrazi.</p>
            ) : (
              <>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                  {pagedTournaments.map((tournament, index) => (
                    <TournamentCard key={tournament.id} tournament={tournament} index={index} />
                  ))}
                </div>

                {pageCount > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-12">
                    <button
                      type="button"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="w-9 h-9 flex items-center justify-center border border-ink-700 text-paper-500 hover:text-paper-100 hover:border-red-400/50 transition-colors disabled:opacity-30 disabled:pointer-events-none"
                      aria-label="Prethodna strana"
                    >
                      ‹
                    </button>
                    {Array.from({ length: pageCount }, (_, i) => i + 1).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPage(p)}
                        className={`w-9 h-9 flex items-center justify-center text-sm transition-colors ${
                          p === page
                            ? 'bg-red-500 text-paper-100 font-semibold'
                            : 'border border-ink-700 text-paper-500 hover:text-paper-100 hover:border-red-400/50'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                      disabled={page === pageCount}
                      className="w-9 h-9 flex items-center justify-center border border-ink-700 text-paper-500 hover:text-paper-100 hover:border-red-400/50 transition-colors disabled:opacity-30 disabled:pointer-events-none"
                      aria-label="Sledeća strana"
                    >
                      ›
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
