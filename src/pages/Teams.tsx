import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { SiteHeader } from '../components/SiteHeader';
import { SiteFooter } from '../components/SiteFooter';
import { Dropdown } from '../components/Dropdown';
import { CardSkeletonGrid } from '../components/Skeleton';

type Sport = { id: number; name: string };

export type Team = {
  id: string;
  owner_id: string;
  name: string;
  crest_url: string | null;
  crest_position_x: number;
  crest_position_y: number;
  banner_url: string | null;
  city: string | null;
  founded_year: number | null;
  sport_id: number;
  sports: { name: string } | null;
  founderName: string | null;
  playerCount: number;
  deleted_at: string | null;
};

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

const RISE_CLASSES = ['rise-1', 'rise-2', 'rise-3', 'rise-4'];
const PAGE_SIZE = 9;

export function TeamCard({ team, index }: { team: Team; index: number }) {
  return (
    <Link
      to={`/timovi/${team.id}`}
      className={`group relative block bg-ink-800 border border-ink-700 border-t-2 border-t-red-500/40 overflow-hidden transition-all duration-300 hover:-translate-y-1.5 hover:border-red-500/50 hover:shadow-[0_24px_48px_-20px_rgba(0,0,0,0.7)] ${RISE_CLASSES[index % RISE_CLASSES.length]}`}
    >
      {/* diagonal shine sweep on hover */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-20">
        <div className="absolute inset-y-0 -left-1/3 w-1/4 -skew-x-12 bg-paper-100/[0.06] -translate-x-[120%] group-hover:translate-x-[600%] transition-transform duration-700 ease-out" />
      </div>

      <div className="aspect-[21/9] bg-ink-700 overflow-hidden">
        {team.banner_url && (
          <img
            src={team.banner_url}
            alt=""
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        )}
      </div>

      <div className="px-5 pb-5 relative">
        <div className="relative z-10 w-16 h-16 -mt-8 mb-3 rounded-full overflow-hidden bg-ink-700 border-4 border-ink-900 ring-2 ring-red-500/30 flex items-center justify-center transition-colors duration-300 group-hover:ring-red-500/60">
          {team.crest_url ? (
            <img
              src={team.crest_url}
              alt=""
              className="w-full h-full object-cover"
              style={{ objectPosition: `${team.crest_position_x}% ${team.crest_position_y}%` }}
            />
          ) : (
            <span className="font-display text-lg text-paper-500">{team.name[0]?.toUpperCase()}</span>
          )}
        </div>

        <h3 className="font-display text-xl leading-tight mb-1 transition-colors duration-300 group-hover:text-red-400">
          {team.name}
        </h3>
        {team.sports && (
          <p className="text-xs uppercase tracking-widest text-red-400 font-semibold mb-3">{team.sports.name}</p>
        )}

        <div className="flex items-center justify-between text-xs text-paper-500 pt-3 border-t border-ink-700">
          <span>{team.city || '—'}</span>
          <span>{team.founded_year ? `Osnovan ${team.founded_year}.` : ''}</span>
        </div>
        {team.founderName && (
          <p className="text-xs text-paper-500 mt-2">
            Osnivač: <span className="text-paper-100">{team.founderName}</span>
          </p>
        )}
        <p className="text-xs text-paper-700 uppercase tracking-widest mt-2">{team.playerCount} igrača</p>
      </div>
    </Link>
  );
}

export function TeamRow({ team, index, fromTournamentId }: { team: Team; index: number; fromTournamentId?: string }) {
  const isDeleted = !!team.deleted_at;

  const content = (
    <>
      <div className="w-11 h-11 rounded-full overflow-hidden bg-ink-700 ring-1 ring-red-500/30 shrink-0 flex items-center justify-center">
        {team.crest_url ? (
          <img
            src={team.crest_url}
            alt=""
            className="w-full h-full object-cover"
            style={{ objectPosition: `${team.crest_position_x}% ${team.crest_position_y}%` }}
          />
        ) : (
          <span className="font-display text-sm text-paper-500">{team.name[0]?.toUpperCase()}</span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <h3 className={`font-display text-base leading-tight truncate transition-colors duration-200 ${isDeleted ? '' : 'group-hover:text-red-400'}`}>
          {team.name}
        </h3>
        <p className="text-[11px] uppercase tracking-widest text-paper-700 mt-0.5 truncate">
          {isDeleted ? 'Tim obrisan' : `${team.sports?.name ?? ''}${team.city ? ` · ${team.city}` : ''}`}
        </p>
      </div>

      {!isDeleted && (
        <span className="text-[11px] uppercase tracking-widest text-red-400 font-semibold shrink-0 whitespace-nowrap">
          {team.playerCount} igrača
        </span>
      )}
    </>
  );

  if (isDeleted) {
    return (
      <div
        className={`group flex items-center gap-3 bg-ink-800 border border-ink-700 border-l-2 border-l-paper-700/50 px-4 py-3 opacity-60 ${RISE_CLASSES[index % RISE_CLASSES.length]}`}
      >
        {content}
      </div>
    );
  }

  return (
    <Link
      to={fromTournamentId ? `/timovi/${team.id}?turnir=${fromTournamentId}` : `/timovi/${team.id}`}
      className={`group flex items-center gap-3 bg-ink-800 border border-ink-700 border-l-2 border-l-red-500/40 px-4 py-3 transition-colors duration-200 hover:bg-ink-700 hover:border-red-500/50 ${RISE_CLASSES[index % RISE_CLASSES.length]}`}
    >
      {content}
    </Link>
  );
}

export default function Teams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [sports, setSports] = useState<Sport[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sportFilter, setSportFilter] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    async function load() {
      const { data: teamRows } = await supabase
        .from('teams')
        .select('id, owner_id, name, crest_url, crest_position_x, crest_position_y, banner_url, city, founded_year, sport_id, sports(name), deleted_at')
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      const rows = (teamRows as unknown as Omit<Team, 'founderName' | 'playerCount'>[]) ?? [];

      const ownerIds = [...new Set(rows.map((t) => t.owner_id))];
      const { data: founders } = ownerIds.length
        ? await supabase.from('public_profiles').select('id, full_name').in('id', ownerIds)
        : { data: [] as { id: string; full_name: string | null }[] };

      const nameById = new Map((founders ?? []).map((f) => [f.id, f.full_name]));

      const teamIds = rows.map((t) => t.id);
      const { data: memberRows } = teamIds.length
        ? await supabase.from('team_members').select('team_id').in('team_id', teamIds)
        : { data: [] as { team_id: string }[] };

      const countByTeam = new Map<string, number>();
      (memberRows ?? []).forEach((m) => countByTeam.set(m.team_id, (countByTeam.get(m.team_id) ?? 0) + 1));

      setTeams(
        rows.map((t) => ({
          ...t,
          founderName: nameById.get(t.owner_id) ?? null,
          playerCount: countByTeam.get(t.id) ?? 0,
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

  const filteredTeams = useMemo(() => {
    const query = search.trim().toLowerCase();
    return teams.filter((t) => {
      const matchesSearch = !query || t.name.toLowerCase().includes(query);
      const matchesSport = !sportFilter || String(t.sport_id) === sportFilter;
      return matchesSearch && matchesSport;
    });
  }, [teams, search, sportFilter]);

  useEffect(() => {
    setPage(1);
  }, [search, sportFilter]);

  const pageCount = Math.max(1, Math.ceil(filteredTeams.length / PAGE_SIZE));
  const pagedTeams = filteredTeams.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

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
                <span className="text-xs uppercase tracking-widest text-red-400 font-semibold">Pridruži se timu ili napravi svoj</span>
                <h1 className="font-display text-4xl sm:text-5xl mt-4 leading-tight">Pregled timova</h1>
              </div>
              <Link
                to="/timovi/novi"
                className="rise-2 btn-solid px-6 py-3 text-sm inline-flex items-center justify-center gap-2 whitespace-nowrap"
              >
                Napravi svoj tim
              </Link>
            </div>

            {!loading && teams.length > 0 && (
              <div className="rise-2 flex flex-col sm:flex-row gap-4 mt-16">
                <div className="relative flex-1">
                  <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-paper-500 pointer-events-none" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Pretraži timove po imenu…"
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
              </div>
            )}
          </div>
        </section>

        <section className="flex-1 bg-maroon-900">
          <div className="max-w-6xl mx-auto px-6 py-16 sm:py-20 w-full">
            {loading ? (
              <CardSkeletonGrid count={9} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8" />
            ) : teams.length === 0 ? (
              <p className="text-paper-500">Još uvek nema timova. Budi prvi koji će ga napraviti.</p>
            ) : filteredTeams.length === 0 ? (
              <p className="text-paper-500">Nema timova koji odgovaraju pretrazi.</p>
            ) : (
              <>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                  {pagedTeams.map((team, index) => (
                    <TeamCard key={team.id} team={team} index={index} />
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
