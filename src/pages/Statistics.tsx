import React from 'react';
import { Trophy, Users, Shield, Activity, TrendingUp } from 'lucide-react';
import { useStore } from '../store/useStore';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';

export default function Statistics() {
  const { tournaments, teams, players, matches } = useStore();
  const completedMatches = matches.filter(m => m.status === 'completed');

  let totalGoals = 0, totalYellowCards = 0, totalRedCards = 0;
  completedMatches.forEach(m => {
    if (m.homeScore !== null) totalGoals += m.homeScore;
    if (m.awayScore !== null) totalGoals += m.awayScore;
    m.events.forEach(e => {
      if (e.type === 'yellow_card') totalYellowCards++;
      if (e.type === 'red_card' || e.type === 'second_yellow') totalRedCards++;
    });
  });

  const avgGoals = completedMatches.length > 0 ? (totalGoals / completedMatches.length).toFixed(2) : '0.00';

  const playerGoals: Record<string, number> = {};
  completedMatches.forEach(m => m.events.forEach(e => {
    if (e.type === 'goal') playerGoals[e.playerId] = (playerGoals[e.playerId] || 0) + 1;
  }));
  const topScorers = Object.entries(playerGoals).map(([id, g]) => ({ id, g })).sort((a, b) => b.g - a.g).slice(0, 5);

  const goalsByMinute = [
    { name: '0-15', goals: 12 }, { name: '16-30', goals: 18 }, { name: '31-45', goals: 25 },
    { name: '46-60', goals: 15 }, { name: '61-75', goals: 22 }, { name: '76-90+', goals: 35 },
  ];

  let homeWins = 0, awayWins = 0, draws = 0;
  completedMatches.forEach(m => {
    if (m.homeScore! > m.awayScore!) homeWins++;
    else if (m.homeScore! < m.awayScore!) awayWins++;
    else draws++;
  });

  const resultData = [
    { name: 'Pobeda domaćina', value: homeWins, color: '#3B82F6' },
    { name: 'Nerešeno',         value: draws,   color: '#F59E0B' },
    { name: 'Pobeda gosta',     value: awayWins, color: '#EF4444' },
  ];

  const topStats = [
    { label: 'Odigrano mečeva',  value: completedMatches.length, icon: Trophy,   color: 'text-amber-400',    bg: 'bg-amber-500/10',    border: 'border-white/6/20' },
    { label: 'Ukupno golova',    value: totalGoals,               icon: Activity, color: 'text-blue-400', bg: 'bg-blue-600/10', border: 'border-white/6/20' },
    { label: 'Prosek golova',    value: avgGoals,                  icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-white/6/20' },
    { label: 'Kartoni Ž/C',     value: `${totalYellowCards}/${totalRedCards}`, icon: Shield, color: 'text-red-400', bg: 'bg-navy-800/50/10', border: 'border-white/6/20' },
  ];

  const tooltipStyle = { backgroundColor: '#050D1C', borderColor: 'rgba(255,255,255,0.08)', color: '#F0F6FF', borderRadius: '8px', fontSize: '12px' };

  return (
    <div className="space-y-6 animate-fade-up">
      <div>
        <h1 className="font-display text-5xl font-bold tracking-tight text-ice-100">STATISTIKE</h1>
        <p className="text-silver-400 mt-1 text-sm">Pregled celokupnog sistema i takmičenja.</p>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {topStats.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className={`rounded-xl border ${s.border} ${s.bg} p-5`}>
              <div className={`p-2 rounded-lg ${s.bg} border ${s.border} w-fit mb-4`}>
                <Icon size={18} className={s.color} />
              </div>
              <p className={`stat-number text-4xl ${s.color} mb-1`}>{s.value}</p>
              <p className="text-xs text-silver-400">{s.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie chart */}
        <div className="rounded-xl border border-white/6 bg-navy-800/60 p-6">
          <h3 className="font-bold text-ice-100 mb-6">Distribucija rezultata</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={resultData} cx="50%" cy="50%" innerRadius={55} outerRadius={75} paddingAngle={5} dataKey="value">
                  {resultData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-5 mt-4">
            {resultData.map(item => (
              <div key={item.name} className="flex items-center gap-2 text-xs">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-silver-400">{item.name} <span className="font-bold text-ice-100">({item.value})</span></span>
              </div>
            ))}
          </div>
        </div>

        {/* Bar chart */}
        <div className="rounded-xl border border-white/6 bg-navy-800/60 p-6">
          <h3 className="font-bold text-ice-100 mb-6">Golovi po minutima</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={goalsByMinute}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="name" stroke="#475569" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#475569" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: '#1E3050', opacity: 0.5 }} contentStyle={tooltipStyle} />
                <Bar dataKey="goals" fill='url(#blueGrad)' radius={[5, 5, 0, 0]} />
                <defs>
                  <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3B8EFF" />
                    <stop offset="100%" stopColor="#00C2FF" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Scorers table */}
        <div className="rounded-xl border border-white/6 bg-navy-800/60 lg:col-span-2 overflow-hidden">
          <div className="px-6 py-4 border-b border-white/6 bg-navy-700/50 flex items-center gap-2">
            <Trophy size={16} className="text-amber-400" />
            <h3 className="font-bold text-ice-100">Top strelci (sva takmičenja)</h3>
          </div>
          <table className="w-full text-sm text-left">
            <thead className="text-[10px] text-silver-600 uppercase tracking-wider bg-navy-900/80">
              <tr>
                <th className="px-5 py-3 w-16 text-center">Rang</th>
                <th className="px-5 py-3">Igrač</th>
                <th className="px-5 py-3">Ekipa</th>
                <th className="px-5 py-3 text-center">Golovi</th>
              </tr>
            </thead>
            <tbody>
              {topScorers.length > 0 ? topScorers.map(({ id: pid, g }, i) => {
                const player = players.find(p => p.id === pid);
                if (!player) return null;
                const team = teams.find(t => t.id === player.teamId);
                const rankColors = [
                  'bg-navy-800/50/15 text-amber-400 border border-white/6/30',
                  'bg-navy-800/502/10 text-silver-400 border border-white/6',
                  'bg-amber-600/15 text-amber-500 border border-amber-600/30',
                ];
                return (
                  <tr key={pid} className="border-t border-white/6 hover:bg-navy-700/50 transition-colors">
                    <td className="px-5 py-4 text-center">
                      <span className={`w-7 h-7 rounded-lg inline-flex items-center justify-center text-xs font-bold ${rankColors[i] ?? 'text-silver-600'}`}>
                        {i + 1}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-semibold text-ice-100">{player.firstName} {player.lastName}</td>
                    <td className="px-5 py-4 text-silver-400">{team?.name ?? '—'}</td>
                    <td className="px-5 py-4 text-center">
                      <span className="stat-number text-xl text-blue-400">{g}</span>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={4} className="px-5 py-10 text-center text-silver-400 text-sm">Nema podataka o strelcima.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
