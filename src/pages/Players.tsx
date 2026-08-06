import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { SiteHeader, UserAvatar } from '../components/SiteHeader';
import { SiteFooter } from '../components/SiteFooter';
import { Dropdown } from '../components/Dropdown';
import { FOOTBALL_POSITION_OPTIONS, BASKETBALL_POSITION_OPTIONS } from '../lib/positions';
import { normalizeForSearch } from '../lib/text';
import { RowSkeletonGrid, RowSkeleton } from '../components/Skeleton';

export type Player = {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  avatar_position_x: number;
  avatar_position_y: number;
  created_at: string;
  teamCount: number;
  career_football_goals: number;
  career_basketball_points: number;
  preferred_positions: string[];
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

function FootballIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8.2 15.2 10.6 14 14.3H10L8.8 10.6Z" />
      <path d="M12 8.2V4.5" />
      <path d="M8.8 10.6 5.4 9.5" />
      <path d="M10 14.3 8 17.8" />
      <path d="M14 14.3 16 17.8" />
      <path d="M15.2 10.6 18.6 9.5" />
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

const RANK_ACCENT: Record<number, string> = {
  1: 'border-amber-300/60',
  2: 'border-zinc-300/50',
  3: 'border-orange-700/50',
};

const RANK_TEXT: Record<number, string> = {
  1: 'text-amber-300',
  2: 'text-zinc-300',
  3: 'text-orange-500',
};

const MONTHS_GENITIVE = [
  'januara',
  'februara',
  'marta',
  'aprila',
  'maja',
  'juna',
  'jula',
  'avgusta',
  'septembra',
  'oktobra',
  'novembra',
  'decembra',
];

function memberSince(iso: string) {
  const date = new Date(iso);
  return `${MONTHS_GENITIVE[date.getMonth()]} ${date.getFullYear()}.`;
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
  hideTeamCount,
}: {
  player: Player;
  index: number;
  isCaptain?: boolean;
  hideTeamCount?: boolean;
}) {
  const displayName = player.full_name || 'Igrač bez imena';
  return (
    <Link
      to={`/@${player.username ?? player.id}`}
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

      {!hideTeamCount && (
        <div className="flex flex-col items-end gap-0.5 shrink-0">
          <span className="text-[11px] uppercase tracking-widest text-red-400 font-semibold whitespace-nowrap">
            {player.teamCount} {teamWord(player.teamCount)}
          </span>
        </div>
      )}
    </Link>
  );
}

function TopScorersStrip({
  title,
  icon,
  players,
  getValue,
  unitWord,
  riseClass,
}: {
  title: string;
  icon: ReactNode;
  players: Player[];
  getValue: (player: Player) => number;
  unitWord: (value: number) => string;
  riseClass: string;
}) {
  if (!players.length) return null;

  return (
    <div className={`${riseClass} mt-10`}>
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <span className="text-xs uppercase tracking-widest text-red-400 font-semibold">{title}</span>
      </div>
      <div className="grid sm:grid-cols-3 gap-3">
        {players.map((player, index) => {
          const rank = index + 1;
          const medalBorder = RANK_ACCENT[rank];
          const rankText = RANK_TEXT[rank] ?? 'text-paper-700';
          const displayName = player.full_name || 'Igrač bez imena';
          const value = getValue(player);
          const borderClasses = medalBorder
            ? `border ${medalBorder}`
            : 'border border-ink-700 border-l-2 border-l-red-500/40';

          return (
            <Link
              key={player.id}
              to={`/@${player.username ?? player.id}`}
              className={`group flex items-center gap-3 bg-ink-800 ${borderClasses} pl-4 pr-5 py-2.5 transition-colors duration-200 hover:bg-ink-700 hover:border-red-400/70`}
            >
              <span className={`font-display text-lg w-5 text-center shrink-0 transition-colors duration-200 ${rankText} group-hover:text-red-400`}>{rank}</span>
              <UserAvatar
                name={displayName}
                avatarUrl={player.avatar_url}
                position={{ x: player.avatar_position_x, y: player.avatar_position_y }}
                className="w-8 h-8 text-xs ring-1 ring-red-500/30 shrink-0"
              />
              <span className="text-sm text-paper-100 truncate transition-colors duration-200 group-hover:text-red-400">
                {displayName}
              </span>
              <span className="text-xs text-paper-500 whitespace-nowrap ml-auto">
                {value} {unitWord(value)}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default function Players() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [sports, setSports] = useState<Sport[]>([]);
  const [playerSports, setPlayerSports] = useState<Map<string, Set<number>>>(new Map());
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sportFilter, setSportFilter] = useState('');
  const [positionFilter, setPositionFilter] = useState('');
  const [statSort, setStatSort] = useState('');
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
        .select('id, full_name, avatar_url, avatar_position_x, avatar_position_y, created_at, career_football_goals, career_basketball_points, preferred_positions')
        .order('full_name', { ascending: true });

      const rows = (data as unknown as Omit<Player, 'teamCount' | 'username'>[]) ?? [];

      const userIds = rows.map((p) => p.id);
      const { data: memberRows } = userIds.length
        ? await supabase.from('team_members').select('user_id, team_id').in('user_id', userIds)
        : { data: [] as { user_id: string; team_id: string }[] };

      const teamIds = [...new Set((memberRows ?? []).map((m) => m.team_id))];
      const { data: activeTeamRows } = teamIds.length
        ? await supabase.from('teams').select('id').in('id', teamIds).is('deleted_at', null)
        : { data: [] as { id: string }[] };
      const activeTeamIds = new Set((activeTeamRows ?? []).map((t) => t.id));

      const { data: usernameRows } = userIds.length
        ? await supabase.from('player_usernames').select('id, username').in('id', userIds)
        : { data: [] as { id: string; username: string }[] };
      const usernameById = new Map((usernameRows ?? []).map((u) => [u.id, u.username]));

      const countByUser = new Map<string, number>();
      (memberRows ?? []).forEach((m) => {
        if (!activeTeamIds.has(m.team_id)) return;
        countByUser.set(m.user_id, (countByUser.get(m.user_id) ?? 0) + 1);
      });

      const { data: preferredRows } = userIds.length
        ? await supabase.from('profile_preferred_sports').select('profile_id, sport_id').in('profile_id', userIds)
        : { data: [] as { profile_id: string; sport_id: number }[] };

      const sportsByPlayer = new Map<string, Set<number>>();
      (preferredRows ?? []).forEach((r) => {
        if (!sportsByPlayer.has(r.profile_id)) sportsByPlayer.set(r.profile_id, new Set());
        sportsByPlayer.get(r.profile_id)!.add(r.sport_id);
      });
      setPlayerSports(sportsByPlayer);

      setPlayers(rows.map((p) => ({ ...p, username: usernameById.get(p.id) ?? null, teamCount: countByUser.get(p.id) ?? 0 })));
      setLoading(false);
    }

    load();
  }, []);

  const filteredPlayers = useMemo(() => {
    const query = normalizeForSearch(search);
    const filtered = players.filter((p) => {
      const matchesQuery = !query || normalizeForSearch(p.full_name ?? '').includes(query);
      const matchesSport = !sportFilter || playerSports.get(p.id)?.has(Number(sportFilter));
      const matchesPosition = !positionFilter || p.preferred_positions?.includes(positionFilter);
      return matchesQuery && matchesSport && matchesPosition;
    });

    if (statSort === 'goals_desc') {
      return [...filtered].sort((a, b) => b.career_football_goals - a.career_football_goals);
    }
    if (statSort === 'goals_asc') {
      return [...filtered].sort((a, b) => a.career_football_goals - b.career_football_goals);
    }
    if (statSort === 'points_desc') {
      return [...filtered].sort((a, b) => b.career_basketball_points - a.career_basketball_points);
    }
    if (statSort === 'points_asc') {
      return [...filtered].sort((a, b) => a.career_basketball_points - b.career_basketball_points);
    }
    return filtered;
  }, [players, search, sportFilter, positionFilter, playerSports, statSort]);

  const topScorers = useMemo(
    () =>
      players
        .filter((p) => p.career_football_goals > 0)
        .sort((a, b) => b.career_football_goals - a.career_football_goals || (a.full_name ?? '').localeCompare(b.full_name ?? ''))
        .slice(0, 5),
    [players]
  );

  const topBasketballScorers = useMemo(
    () =>
      players
        .filter((p) => p.career_basketball_points > 0)
        .sort((a, b) => b.career_basketball_points - a.career_basketball_points || (a.full_name ?? '').localeCompare(b.full_name ?? ''))
        .slice(0, 5),
    [players]
  );

  useEffect(() => {
    setPage(1);
  }, [search, sportFilter, positionFilter, statSort]);

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

            {loading && (
              <div className="rise-2 mt-10 flex gap-3 overflow-x-auto pb-1">
                {Array.from({ length: 3 }, (_, i) => (
                  <div key={i} className="w-56 shrink-0">
                    <RowSkeleton />
                  </div>
                ))}
              </div>
            )}

            {!loading && (
              <>
                <TopScorersStrip
                  title="Najbolji strelci (fudbal/mali fudbal)"
                  icon={<FootballIcon className="w-4 h-4 text-red-400" />}
                  players={topScorers}
                  getValue={(p) => p.career_football_goals}
                  unitWord={(v) => (v === 1 ? 'gol' : 'golova')}
                  riseClass="rise-2"
                />
                <TopScorersStrip
                  title="Top poenteri (košarka/basket)"
                  icon={<BasketballIcon className="w-4 h-4 text-red-400" />}
                  players={topBasketballScorers}
                  getValue={(p) => p.career_basketball_points}
                  unitWord={(v) => (v === 1 ? 'poen' : 'poena')}
                  riseClass="rise-3"
                />
              </>
            )}

            {!loading && players.length > 0 && (
              <div className="rise-4 flex flex-col sm:flex-row sm:flex-wrap sm:items-end gap-4 mt-16 w-full">
                <div className="relative flex-1 min-w-[12rem]">
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
                  <label htmlFor="position-filter" className="block text-[11px] uppercase tracking-widest text-paper-500 mb-2">
                    Pozicija
                  </label>
                  <Dropdown
                    id="position-filter"
                    value={positionFilter}
                    onChange={setPositionFilter}
                    options={[
                      { value: '', label: 'Sve pozicije' },
                      ...FOOTBALL_POSITION_OPTIONS.map((o) => ({ value: o.value, label: `Fudbal: ${o.label}` })),
                      ...BASKETBALL_POSITION_OPTIONS.map((o) => ({ value: o.value, label: `Košarka: ${o.label}` })),
                    ]}
                    triggerClassName="w-full bg-ink-950 border border-ink-700 hover:border-red-400/50 focus:border-red-400 focus:outline-none px-4 py-2.5 text-sm text-paper-100 transition-colors text-left flex items-center justify-between gap-3"
                  />
                </div>

                <div className="w-full sm:w-56">
                  <label htmlFor="stat-sort" className="block text-[11px] uppercase tracking-widest text-paper-500 mb-2">
                    Sortiraj
                  </label>
                  <Dropdown
                    id="stat-sort"
                    value={statSort}
                    onChange={setStatSort}
                    options={[
                      { value: '', label: 'Podrazumevano' },
                      { value: 'goals_desc', label: 'Golovi: najviše prvo' },
                      { value: 'goals_asc', label: 'Golovi: najmanje prvo' },
                      { value: 'points_desc', label: 'Poeni: najviše prvo' },
                      { value: 'points_asc', label: 'Poeni: najmanje prvo' },
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
              <RowSkeletonGrid count={9} />
            ) : players.length === 0 ? (
              <p className="text-paper-500">Još uvek nema registrovanih igrača.</p>
            ) : filteredPlayers.length === 0 ? (
              <p className="text-paper-500">Nema igrača koji odgovaraju pretrazi.</p>
            ) : (
              <>
                <span className="text-xs uppercase tracking-widest text-red-400 font-semibold">Svi DerbyMania igrači</span>
                <div className="w-10 h-0.5 bg-red-500 mt-3 mb-5" />

                <div className="grid sm:grid-cols-3 gap-3">
                  {pagedPlayers.map((player, index) => (
                    <PlayerCard key={player.id} player={player} index={index} hideTeamCount />
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
