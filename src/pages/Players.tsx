import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { SiteHeader, UserAvatar } from '../components/SiteHeader';
import { SiteFooter } from '../components/SiteFooter';
import { Dropdown } from '../components/Dropdown';

export type Player = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  avatar_position_x: number;
  avatar_position_y: number;
  created_at: string;
  teamCount: number;
  career_football_goals: number;
};

type Sport = { id: number; name: string };

const RISE_CLASSES = ['rise-1', 'rise-2', 'rise-3', 'rise-4'];
const PAGE_SIZE = 12;

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function memberSince(iso: string) {
  return new Date(iso).toLocaleDateString('sr-RS', { month: 'long', year: 'numeric' });
}

function teamWord(count: number) {
  if (count === 1) return 'tim';
  if (count >= 2 && count <= 4) return 'tima';
  return 'timova';
}

export function PlayerCard({
  player,
  index,
  isCaptain,
}: {
  player: Player;
  index: number;
  isCaptain?: boolean;
}) {
  const displayName = player.full_name || 'Igrač bez imena';
  return (
    <Link
      to={`/igraci/${player.id}`}
      className={`group flex items-center gap-3 bg-ink-800 border border-ink-700 border-l-2 border-l-red-500/40 px-4 py-3 transition-colors duration-200 hover:bg-ink-700 hover:border-red-500/50 ${RISE_CLASSES[index % RISE_CLASSES.length]}`}
    >
      <div className="relative shrink-0">
        <UserAvatar
          name={displayName}
          avatarUrl={player.avatar_url}
          position={{ x: player.avatar_position_x, y: player.avatar_position_y }}
          className="w-11 h-11 text-sm ring-1 ring-red-500/30"
        />
        {isCaptain && (
          <span
            title="Kapiten"
            className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-yellow-500 ring-2 ring-ink-800 flex items-center justify-center text-[9px] font-bold text-ink-950"
          >
            C
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="font-display text-base leading-tight truncate transition-colors duration-200 group-hover:text-red-400">
          {displayName}
        </h3>
        <p className="text-[11px] uppercase tracking-widest text-paper-700 mt-0.5 truncate">
          Član od {memberSince(player.created_at)}
        </p>
      </div>

      <div className="flex flex-col items-end gap-0.5 shrink-0">
        <span className="text-[11px] uppercase tracking-widest text-red-400 font-semibold whitespace-nowrap">
          {player.teamCount} {teamWord(player.teamCount)}
        </span>
        <span className="text-[10px] uppercase tracking-widest text-paper-700 whitespace-nowrap">
          {player.career_football_goals} {player.career_football_goals === 1 ? 'gol' : 'golova'}
        </span>
      </div>
    </Link>
  );
}

export default function Players() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [sports, setSports] = useState<Sport[]>([]);
  const [playerSports, setPlayerSports] = useState<Map<string, Set<number>>>(new Map());
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sportFilter, setSportFilter] = useState('');
  const [goalSort, setGoalSort] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    supabase
      .from('sports')
      .select('id, name')
      .order('name')
      .then(({ data }) => setSports(data ?? []));
  }, []);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('public_profiles')
        .select('id, full_name, avatar_url, avatar_position_x, avatar_position_y, created_at, career_football_goals')
        .order('full_name', { ascending: true });

      const rows = (data as unknown as Omit<Player, 'teamCount'>[]) ?? [];

      const userIds = rows.map((p) => p.id);
      const { data: memberRows } = userIds.length
        ? await supabase.from('team_members').select('user_id').in('user_id', userIds)
        : { data: [] as { user_id: string }[] };

      const countByUser = new Map<string, number>();
      (memberRows ?? []).forEach((m) => countByUser.set(m.user_id, (countByUser.get(m.user_id) ?? 0) + 1));

      const { data: preferredRows } = userIds.length
        ? await supabase.from('profile_preferred_sports').select('profile_id, sport_id').in('profile_id', userIds)
        : { data: [] as { profile_id: string; sport_id: number }[] };

      const sportsByPlayer = new Map<string, Set<number>>();
      (preferredRows ?? []).forEach((r) => {
        if (!sportsByPlayer.has(r.profile_id)) sportsByPlayer.set(r.profile_id, new Set());
        sportsByPlayer.get(r.profile_id)!.add(r.sport_id);
      });
      setPlayerSports(sportsByPlayer);

      setPlayers(rows.map((p) => ({ ...p, teamCount: countByUser.get(p.id) ?? 0 })));
      setLoading(false);
    }

    load();
  }, []);

  const filteredPlayers = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = players.filter((p) => {
      const matchesQuery = !query || (p.full_name ?? '').toLowerCase().includes(query);
      const matchesSport = !sportFilter || playerSports.get(p.id)?.has(Number(sportFilter));
      return matchesQuery && matchesSport;
    });

    if (goalSort === 'desc') {
      return [...filtered].sort((a, b) => b.career_football_goals - a.career_football_goals);
    }
    if (goalSort === 'asc') {
      return [...filtered].sort((a, b) => a.career_football_goals - b.career_football_goals);
    }
    return filtered;
  }, [players, search, sportFilter, playerSports, goalSort]);

  useEffect(() => {
    setPage(1);
  }, [search, sportFilter, goalSort]);

  const pageCount = Math.max(1, Math.ceil(filteredPlayers.length / PAGE_SIZE));
  const pagedPlayers = filteredPlayers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

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
            <div className="rise-1">
              <span className="text-xs uppercase tracking-widest text-red-400 font-semibold">Zajednica</span>
              <h1 className="font-display text-4xl sm:text-5xl mt-4 leading-tight">Igrači</h1>
            </div>

            {!loading && players.length > 0 && (
              <div className="rise-2 flex flex-col sm:flex-row sm:items-end gap-4 mt-16 w-full">
                <div className="relative flex-1">
                  <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-paper-500 pointer-events-none" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Pretraži igrače po imenu…"
                    className="w-full bg-ink-950 border border-ink-700 focus:border-red-400 focus:outline-none pl-10 pr-4 py-2.5 text-sm text-paper-100 placeholder:text-paper-500 transition-colors"
                  />
                </div>

                <div className="w-full sm:w-56">
                  <label htmlFor="sport-filter" className="block text-[11px] uppercase tracking-widest text-paper-500 mb-2">
                    Sport
                  </label>
                  <Dropdown
                    id="sport-filter"
                    value={sportFilter}
                    onChange={setSportFilter}
                    options={[{ value: '', label: 'Svi sportovi' }, ...sports.map((s) => ({ value: String(s.id), label: s.name }))]}
                    triggerClassName="w-full bg-ink-950 border border-ink-700 hover:border-red-400/50 focus:border-red-400 focus:outline-none px-4 py-2.5 text-sm text-paper-100 transition-colors text-left flex items-center justify-between gap-3"
                  />
                </div>

                <div className="w-full sm:w-56">
                  <label htmlFor="goal-sort" className="block text-[11px] uppercase tracking-widest text-paper-500 mb-2">
                    Sortiraj po golovima
                  </label>
                  <Dropdown
                    id="goal-sort"
                    value={goalSort}
                    onChange={setGoalSort}
                    options={[
                      { value: '', label: 'Podrazumevano' },
                      { value: 'desc', label: 'Golovi: najviše prvo' },
                      { value: 'asc', label: 'Golovi: najmanje prvo' },
                    ]}
                    triggerClassName="w-full bg-ink-950 border border-ink-700 hover:border-red-400/50 focus:border-red-400 focus:outline-none px-4 py-2.5 text-sm text-paper-100 transition-colors text-left flex items-center justify-between gap-3"
                  />
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="flex-1 bg-maroon-900">
          <div className="max-w-6xl mx-auto px-6 py-16 sm:py-20 w-full">
            {loading ? (
              <p className="text-paper-500">Učitavanje…</p>
            ) : players.length === 0 ? (
              <p className="text-paper-500">Još uvek nema registrovanih igrača.</p>
            ) : filteredPlayers.length === 0 ? (
              <p className="text-paper-500">Nema igrača koji odgovaraju pretrazi.</p>
            ) : (
              <>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {pagedPlayers.map((player, index) => (
                    <PlayerCard key={player.id} player={player} index={index} />
                  ))}
                </div>

                {pageCount > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-10">
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
