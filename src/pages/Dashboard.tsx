import React from 'react';
import { Trophy, Shield, Users, Activity, ChevronRight, Plus, TrendingUp, Calendar, Flame, Zap } from 'lucide-react';
import { useStore } from '../store/useStore';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const { tournaments, teams, players, matches } = useStore();
  const navigate = useNavigate();

  const activeTournaments  = tournaments.filter(t => t.status === 'active');
  const recentMatches      = matches.filter(m => m.status === 'completed').slice(-5).reverse();
  const upcomingMatches    = matches.filter(m => m.status === 'scheduled').slice(0, 4);

  const STATS = [
    { label: 'Ukupno turnira',     value: tournaments.length,        icon: Trophy,   color: '#60A5FA', bg: 'rgba(37,99,235,0.1)',   border: 'rgba(37,99,235,0.2)' },
    { label: 'Aktivni turniri',    value: activeTournaments.length,  icon: Activity, color: '#34D399', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.18)' },
    { label: 'Ekipe',              value: teams.length,              icon: Shield,   color: '#FCD34D', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.18)' },
    { label: 'Igrači',             value: players.length,            icon: Users,    color: '#C084FC', bg: 'rgba(168,85,247,0.08)', border: 'rgba(168,85,247,0.18)' },
  ];

  return (
    <div className="space-y-10">

      {/* ── HERO ─────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl border border-white/6 noise"
        style={{background:'linear-gradient(135deg, rgba(15,32,64,0.9) 0%, rgba(5,13,28,0.95) 100%)'}}>
        <div className="absolute top-0 right-0 w-80 h-80 bg-hero-orb-1 opacity-30 -translate-y-1/3 translate-x-1/3" style={{filter:'blur(60px)'}} />
        <div className="absolute bottom-0 right-20 w-60 h-60 bg-hero-orb-2 opacity-20 translate-y-1/3" style={{filter:'blur(80px)'}} />

        <div className="relative z-10 px-8 py-10 md:px-12 md:py-14">
          <div className="badge-blue inline-flex items-center gap-1.5 mb-6">
            <Zap size={11} fill="currentColor" />
            GoalStorm — Tournament Manager
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-gradient-subtle leading-tight mb-4">
            Dobrodošao nazad.
          </h1>
          <p className="text-silver-400 text-base max-w-lg mb-8 leading-relaxed">
            Upravljajte svim turnirima, ekipama i igračima na jednom mestu. Pregledajte statistike i planiraje naredne utakmice.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => navigate('/app/tournaments/new')}
              className="btn-primary px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2"
            >
              <Plus size={15} /> Novi turnir
            </button>
            <button
              onClick={() => navigate('/app/teams/new')}
              className="btn-ghost px-5 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2"
            >
              <Plus size={15} /> Nova ekipa
            </button>
          </div>
        </div>
      </div>

      {/* ── STATS ────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map((s, i) => {
          const Icon = s.icon;
          return (
            <div
              key={i}
              className="rounded-2xl p-6 border transition-all duration-200 hover:scale-[1.02]"
              style={{ background: `linear-gradient(135deg, ${s.bg} 0%, rgba(5,13,28,0.8) 100%)`, borderColor: s.border }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{background:s.bg, border:`1px solid ${s.border}`}}>
                  <Icon size={17} style={{color: s.color}} />
                </div>
                <TrendingUp size={13} className="text-silver-600" />
              </div>
              <div className="stat-num text-4xl mb-1" style={{color: s.color}}>{s.value}</div>
              <div className="text-silver-500 text-xs font-medium">{s.label}</div>
            </div>
          );
        })}
      </div>

      {/* ── MAIN GRID ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left 2/3 */}
        <div className="lg:col-span-2 space-y-6">

          {/* Active Tournaments */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Activity size={16} className="text-blue-400" />
                <h2 className="font-display text-base font-semibold text-white">Aktivni turniri</h2>
                {activeTournaments.length > 0 && (
                  <span className="badge-blue">{activeTournaments.length}</span>
                )}
              </div>
              <button onClick={() => navigate('/app/tournaments')} className="text-xs text-silver-500 hover:text-silver-300 flex items-center gap-1 transition-colors">
                Svi turniri <ChevronRight size={13} />
              </button>
            </div>

            <div className="space-y-3">
              {activeTournaments.length > 0 ? activeTournaments.map(t => (
                <div
                  key={t.id}
                  onClick={() => navigate(`/app/tournaments/${t.id}`)}
                  className="glass-card rounded-2xl p-5 cursor-pointer hover:scale-[1.01] transition-all duration-200 group"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold text-white group-hover:text-blue-300 transition-colors text-sm">{t.name}</h3>
                      <p className="text-silver-500 text-xs mt-0.5">{t.city} · {t.teamIds.length} ekipa</p>
                    </div>
                    <span className="badge-green">U toku</span>
                  </div>
                  <div className="w-full h-1 bg-navy-700 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-blue-600 to-blue-400" style={{width:'45%'}} />
                  </div>
                  <p className="text-right text-silver-600 text-[10px] mt-1.5">Grupna faza · 45%</p>
                </div>
              )) : (
                <div className="rounded-2xl border border-dashed border-white/8 py-12 text-center">
                  <Trophy size={32} className="mx-auto text-silver-600 mb-3" />
                  <p className="text-silver-500 text-sm mb-4">Nema aktivnih turnira</p>
                  <button onClick={() => navigate('/app/tournaments/new')} className="btn-outline-blue px-4 py-2 rounded-xl text-xs font-medium">
                    Kreiraj turnir
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Recent results */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Flame size={16} className="text-amber-400" />
              <h2 className="font-display text-base font-semibold text-white">Poslednji rezultati</h2>
            </div>
            <div className="glass-card rounded-2xl overflow-hidden divide-y divide-white/5">
              {recentMatches.length > 0 ? recentMatches.map(m => {
                const home = teams.find(t => t.id === m.homeTeamId);
                const away = teams.find(t => t.id === m.awayTeamId);
                if (!home || !away) return null;
                const homeWon = (m.homeScore ?? 0) > (m.awayScore ?? 0);
                const awayWon = (m.awayScore ?? 0) > (m.homeScore ?? 0);
                return (
                  <div key={m.id} className="flex items-center px-5 py-4 hover:bg-white/3 transition-colors">
                    <div className="flex-1 flex justify-end items-center gap-3 min-w-0">
                      <span className={`text-sm font-medium truncate ${homeWon ? 'text-white' : 'text-silver-500'}`}>{home.name}</span>
                      <div className="w-6 h-6 rounded-lg bg-navy-700 border border-white/8 flex items-center justify-center text-[9px] font-bold text-silver-400 flex-shrink-0">
                        {home.shortName.charAt(0)}
                      </div>
                    </div>
                    <div className="mx-4 flex-shrink-0">
                      <div className="font-mono font-bold text-base text-white bg-navy-800 border border-white/8 px-4 py-1.5 rounded-xl min-w-[68px] text-center tracking-wider">
                        {m.homeScore} <span className="text-silver-600">:</span> {m.awayScore}
                      </div>
                    </div>
                    <div className="flex-1 flex items-center gap-3 min-w-0">
                      <div className="w-6 h-6 rounded-lg bg-navy-700 border border-white/8 flex items-center justify-center text-[9px] font-bold text-silver-400 flex-shrink-0">
                        {away.shortName.charAt(0)}
                      </div>
                      <span className={`text-sm font-medium truncate ${awayWon ? 'text-white' : 'text-silver-500'}`}>{away.name}</span>
                    </div>
                  </div>
                );
              }) : (
                <div className="py-12 text-center">
                  <p className="text-silver-500 text-sm">Nema odigranih mečeva</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right 1/3 */}
        <div className="space-y-6">

          {/* Upcoming */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Calendar size={16} className="text-blue-400" />
              <h2 className="font-display text-base font-semibold text-white">Predstojeći mečevi</h2>
            </div>
            <div className="space-y-2">
              {upcomingMatches.length > 0 ? upcomingMatches.map(m => {
                const home = teams.find(t => t.id === m.homeTeamId);
                const away = teams.find(t => t.id === m.awayTeamId);
                if (!home || !away) return null;
                return (
                  <div key={m.id} className="glass-card rounded-xl p-4">
                    <div className="text-center mb-3">
                      <span className="badge-blue text-[10px]">{m.date} · {m.time}</span>
                    </div>
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-xs font-medium text-white truncate flex-1 text-right">{home.name}</span>
                      <span className="text-silver-600 text-[10px] font-bold px-2 flex-shrink-0">VS</span>
                      <span className="text-xs font-medium text-white truncate flex-1">{away.name}</span>
                    </div>
                  </div>
                );
              }) : (
                <div className="rounded-2xl border border-dashed border-white/8 py-10 text-center">
                  <p className="text-silver-500 text-xs">Nema zakazanih mečeva</p>
                </div>
              )}
            </div>
          </div>

          {/* Top scorers */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Trophy size={16} className="text-amber-400" />
              <h2 className="font-display text-base font-semibold text-white">Top strelci</h2>
            </div>
            <div className="glass-card rounded-2xl overflow-hidden divide-y divide-white/5">
              {[0,1,2,3,4].map(i => {
                const player = players[i];
                if (!player) return null;
                const team = teams.find(t => t.id === player.teamId);
                const goals = 5 - i;
                const rankStyle = i === 0
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/25'
                  : i === 1
                  ? 'bg-silver-400/10 text-silver-300 border border-silver-400/20'
                  : i === 2
                  ? 'bg-orange-700/15 text-orange-500 border border-orange-600/20'
                  : 'text-silver-600 border border-white/8 bg-transparent';
                return (
                  <div key={i} className="flex items-center gap-3 px-4 py-3 hover:bg-white/3 transition-colors">
                    <span className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${rankStyle}`}>
                      {i+1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{player.firstName} {player.lastName}</p>
                      <p className="text-[10px] text-silver-600">{team?.shortName ?? '—'}</p>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="stat-num text-lg text-blue-400">{goals}</span>
                      <span className="text-[10px] text-silver-600">gol</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
