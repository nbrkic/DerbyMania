import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Users, ChevronLeft, Shield, Calendar, Activity, Trophy } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { Button } from '../../components/ui/Button';

export default function PlayerDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { players, teams, matches } = useStore();
  const player = players.find(p => p.id === id);

  if (!player) {
    return (
      <div className="text-center py-20">
        <Users size={48} className="mx-auto text-silver-600 mb-4" />
        <h2 className="text-xl font-bold text-ice-100 mb-4">Igrač nije pronađen</h2>
        <Button onClick={() => navigate('/app/players')}>Nazad na listu</Button>
      </div>
    );
  }

  const team = teams.find(t => t.id === player.teamId);
  const playerMatches = matches.filter(m => m.homeTeamId === player.teamId || m.awayTeamId === player.teamId);
  const completedMatches = playerMatches.filter(m => m.status === 'completed');

  let goals = 0, yellowCards = 0, redCards = 0;
  completedMatches.forEach(match => {
    match.events.forEach(event => {
      if (event.playerId === player.id) {
        if (event.type === 'goal') goals++;
        if (event.type === 'yellow_card') yellowCards++;
        if (event.type === 'red_card' || event.type === 'second_yellow') redCards++;
      }
    });
  });

  const age = new Date().getFullYear() - new Date(player.dateOfBirth).getFullYear();

  const positionColors: Record<string, string> = {
    GK: 'bg-navy-800/50/15 text-amber-400 border-white/6/30',
    ST: 'bg-navy-800/50/15 text-red-400 border-white/6/30',
    CF: 'bg-navy-800/50/15 text-red-400 border-white/6/30',
    LW: 'bg-navy-800/50/15 text-red-400 border-white/6/30',
    RW: 'bg-navy-800/50/15 text-red-400 border-white/6/30',
    CM: 'bg-navy-800/50/15 text-emerald-400 border-white/6/30',
    CAM: 'bg-navy-800/50/15 text-emerald-400 border-white/6/30',
    CDM: 'bg-navy-800/50/15 text-emerald-400 border-white/6/30',
  };
  const posClass = positionColors[player.position] ?? 'bg-navy-800/50/15 text-blue-400 border-white/6/30';

  return (
    <div className="space-y-6 animate-fade-up">
      <button onClick={() => navigate('/app/players')} className="flex items-center gap-1 text-sm text-silver-400 hover:text-ice-100 transition-colors">
        <ChevronLeft size={16} /> Nazad na igrače
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile sidebar */}
        <div className="lg:col-span-1">
          <div className="rounded-2xl border border-white/6 bg-navy-800/60 overflow-hidden">
            {/* Top color strip */}
            <div className="h-24 bg-radial-blue relative overflow-hidden">
              <div className="absolute inset-0 opacity-30 bg-accent-gradient" />
              <div className="absolute bottom-0 right-0 opacity-10 translate-x-4 translate-y-4">
                <Users size={100} />
              </div>
            </div>

            <div className="px-6 pb-6 -mt-10 relative flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-2xl bg-navy-900/80 border-2 border-white/6 flex items-center justify-center shadow-card mb-3 relative">
                <span className="stat-number text-3xl text-blue-400">#{player.jerseyNumber}</span>
                <span className={`absolute -bottom-2.5 text-[10px] font-bold px-2 py-0.5 rounded-full border ${posClass}`}>
                  {player.position}
                </span>
              </div>

              <h1 className="font-display text-3xl font-black tracking-wide text-ice-100 mt-3 flex items-center gap-2">
                {player.firstName} {player.lastName}
                {player.isCaptain && <span className="text-sm bg-navy-800/50 text-silver-400 px-2 py-0.5 rounded font-bold">C</span>}
              </h1>

              {team && (
                <button
                  onClick={() => navigate(`/app/teams/${team.id}`)}
                  className="mt-2 flex items-center gap-2 px-3 py-1.5 rounded-full bg-navy-900/80 border border-white/6 hover:border-white/6-bright transition-all"
                >
                  <div
                    className="w-4 h-4 rounded bg-navy-800/60 border border-white/6 flex items-center justify-center text-[9px] font-bold text-silver-400"
                    style={{ borderBottomColor: team.primaryColor ?? '#1D6FE8', borderBottomWidth: 2 }}
                  >
                    {team.shortName.charAt(0)}
                  </div>
                  <span className="text-sm font-medium text-ice-100">{team.name}</span>
                </button>
              )}

              <div className="w-full mt-6 space-y-0 border-t border-white/6 pt-4 text-sm">
                {[
                  { icon: Calendar,  label: 'Starost',     value: `${age} god. (${new Date(player.dateOfBirth).toLocaleDateString('sr-RS')})` },
                  { icon: Shield,    label: 'Noga',        value: player.dominantFoot === 'right' ? 'Desna' : player.dominantFoot === 'left' ? 'Leva' : 'Obe' },
                  ...(player.height || player.weight ? [{ icon: Activity, label: 'Fizionomija', value: [player.height && `${player.height}cm`, player.weight && `${player.weight}kg`].filter(Boolean).join(' / ') }] : []),
                ].map((row, i, arr) => (
                  <div key={row.label} className={`flex justify-between items-center py-3 ${i < arr.length - 1 ? 'border-b border-white/6' : ''}`}>
                    <span className="text-silver-600 flex items-center gap-1.5 text-xs"><row.icon size={13} />{row.label}</span>
                    <span className="text-ice-100 font-medium text-xs text-right">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Stats & Events */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center gap-2">
            <Trophy size={18} className="text-amber-400" />
            <h2 className="font-heading font-bold text-ice-100">Statistika igrača</h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Odigrano',       value: completedMatches.length, color: 'text-ice-100' },
              { label: 'Golovi',         value: goals,                    color: 'text-blue-400' },
              { label: 'Žuti kartoni',   value: yellowCards,              color: 'text-amber-400' },
              { label: 'Crveni kartoni', value: redCards,                 color: 'text-red-400' },
            ].map(s => (
              <div key={s.label} className="rounded-xl border border-white/6 bg-navy-800/60 p-4 text-center">
                <p className={`stat-number text-3xl ${s.color} mb-1`}>{s.value}</p>
                <p className="text-[11px] text-silver-600">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Events */}
          <div className="rounded-xl border border-white/6 bg-navy-800/60 p-6">
            <h3 className="font-bold text-ice-100 mb-5 pb-4 border-b border-white/6">Poslednji događaji</h3>
            <div className="space-y-2">
              {completedMatches.length > 0 ? (() => {
                const eventsRows = completedMatches
                  .map(match => {
                    const playerEvents = match.events.filter(e => e.playerId === player.id);
                    if (playerEvents.length === 0) return null;
                    const isHome = match.homeTeamId === player.teamId;
                    const oppTeam = teams.find(t => t.id === (isHome ? match.awayTeamId : match.homeTeamId));
                    return { match, playerEvents, oppTeam };
                  })
                  .filter(Boolean);

                if (eventsRows.length === 0) {
                  return <p className="text-silver-400 text-sm text-center py-6">Nema zabeleženih događaja za ovog igrača.</p>;
                }

                return eventsRows.map(row => {
                  if (!row) return null;
                  const { match, playerEvents, oppTeam } = row;
                  return (
                    <div key={match.id} className="flex items-center justify-between p-3 rounded-lg bg-navy-900/80 border border-white/6">
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-silver-600 w-16">{match.date}</span>
                        <span className="font-medium text-sm text-ice-100">vs {oppTeam?.name}</span>
                      </div>
                      <div className="flex gap-2">
                        {playerEvents.map(event => (
                          <div key={event.id} className="flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg bg-navy-800/60 border border-white/6">
                            {event.type === 'goal' && <span className="text-blue-400">⚽ {event.minute}'</span>}
                            {event.type === 'yellow_card' && <span className="text-amber-400">🟨 {event.minute}'</span>}
                            {(event.type === 'red_card' || event.type === 'second_yellow') && <span className="text-red-400">🟥 {event.minute}'</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                });
              })() : (
                <p className="text-silver-400 text-sm text-center py-6">Nema zabeleženih događaja za ovog igrača.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
