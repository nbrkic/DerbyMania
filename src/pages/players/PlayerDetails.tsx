import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Users,
  ChevronLeft,
  Shield,
  Calendar,
  Activity,
  Trophy } from
'lucide-react';
import { useStore } from '../../store/useStore';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
export default function PlayerDetails() {
  const { id } = useParams<{
    id: string;
  }>();
  const navigate = useNavigate();
  const { players, teams, matches } = useStore();
  const player = players.find((p) => p.id === id);
  if (!player) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-white mb-4">
          Igrač nije pronađen
        </h2>
        <Button onClick={() => navigate('/players')}>Nazad na listu</Button>
      </div>);

  }
  const team = teams.find((t) => t.id === player.teamId);
  // Calculate stats
  const playerMatches = matches.filter(
    (m) => m.homeTeamId === player.teamId || m.awayTeamId === player.teamId
  );
  const completedMatches = playerMatches.filter((m) => m.status === 'completed');
  let goals = 0;
  let yellowCards = 0;
  let redCards = 0;
  completedMatches.forEach((match) => {
    match.events.forEach((event) => {
      if (event.playerId === player.id) {
        if (event.type === 'goal') goals++;
        if (event.type === 'yellow_card') yellowCards++;
        if (event.type === 'red_card' || event.type === 'second_yellow')
        redCards++;
      }
    });
  });
  const age =
  new Date().getFullYear() - new Date(player.dateOfBirth).getFullYear();
  return (
    <div className="space-y-6 animate-fade-in">
      <button
        onClick={() => navigate('/players')}
        className="flex items-center text-sm text-gs-text-secondary hover:text-white transition-colors mb-2">
        
        <ChevronLeft size={16} /> Nazad na igrače
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <Card className="bg-gs-secondary border-gs-border h-full">
            <CardContent className="p-6 flex flex-col items-center text-center">
              <div className="w-32 h-32 rounded-full bg-gs-primary border-4 border-gs-border flex items-center justify-center mb-4 relative overflow-hidden shadow-xl">
                <Users size={48} className="text-gs-text-secondary" />
                <div className="absolute bottom-0 w-full bg-gs-accent/80 text-white text-xs font-bold py-1">
                  {player.position}
                </div>
              </div>

              <h1 className="text-2xl font-bold text-white mb-1 flex items-center justify-center gap-2">
                {player.firstName} {player.lastName}
                {player.isCaptain &&
                <span className="text-xs bg-gs-gold text-gs-primary px-1.5 rounded font-bold">
                    C
                  </span>
                }
              </h1>

              {team &&
              <div
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gs-primary border border-gs-border mt-2 mb-6 cursor-pointer hover:border-gs-highlight transition-colors"
                onClick={() => navigate(`/teams/${team.id}`)}>
                
                  <div
                  className="w-4 h-4 rounded-full bg-gs-primary flex items-center justify-center text-[8px] font-bold"
                  style={{
                    borderBottom: `2px solid ${team.primaryColor}`
                  }}>
                  
                    {team.shortName.charAt(0)}
                  </div>
                  <span className="text-sm text-white font-medium">
                    {team.name}
                  </span>
                </div>
              }

              <div className="w-full space-y-3 text-sm text-left border-t border-gs-border pt-4">
                <div className="flex justify-between">
                  <span className="text-gs-text-secondary flex items-center gap-2">
                    <Calendar size={16} /> Starost
                  </span>
                  <span className="text-white font-medium">
                    {age} god. (
                    {new Date(player.dateOfBirth).toLocaleDateString('sr-RS')})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gs-text-secondary flex items-center gap-2">
                    <Activity size={16} /> Broj dresa
                  </span>
                  <span className="text-white font-medium">
                    #{player.jerseyNumber}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gs-text-secondary flex items-center gap-2">
                    <Shield size={16} /> Noga
                  </span>
                  <span className="text-white font-medium">
                    {player.dominantFoot === 'right' ?
                    'Desna' :
                    player.dominantFoot === 'left' ?
                    'Leva' :
                    'Obe'}
                  </span>
                </div>
                {(player.height || player.weight) &&
                <div className="flex justify-between">
                    <span className="text-gs-text-secondary flex items-center gap-2">
                      <Users size={16} /> Fizionomija
                    </span>
                    <span className="text-white font-medium">
                      {player.height ? `${player.height}cm` : ''}{' '}
                      {player.height && player.weight ? '/' : ''}{' '}
                      {player.weight ? `${player.weight}kg` : ''}
                    </span>
                  </div>
                }
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats & History */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-heading font-bold text-white flex items-center gap-2">
            <Trophy className="text-gs-gold" size={20} />
            Statistika Igrača
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card className="bg-gs-secondary border-gs-border">
              <CardContent className="p-4 text-center">
                <p className="text-gs-text-secondary text-sm mb-1">Odigrano</p>
                <p className="text-3xl font-bold text-white">
                  {completedMatches.length}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-gs-secondary border-gs-border">
              <CardContent className="p-4 text-center">
                <p className="text-gs-text-secondary text-sm mb-1">Golovi</p>
                <p className="text-3xl font-bold text-gs-highlight">{goals}</p>
              </CardContent>
            </Card>
            <Card className="bg-gs-secondary border-gs-border">
              <CardContent className="p-4 text-center">
                <p className="text-gs-text-secondary text-sm mb-1">
                  Žuti kartoni
                </p>
                <p className="text-3xl font-bold text-gs-gold">{yellowCards}</p>
              </CardContent>
            </Card>
            <Card className="bg-gs-secondary border-gs-border">
              <CardContent className="p-4 text-center">
                <p className="text-gs-text-secondary text-sm mb-1">
                  Crveni kartoni
                </p>
                <p className="text-3xl font-bold text-gs-error">{redCards}</p>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-gs-secondary border-gs-border mt-6">
            <CardContent className="p-6">
              <h3 className="text-lg font-bold text-white mb-4 border-b border-gs-border pb-2">
                Poslednji Događaji
              </h3>

              <div className="space-y-3">
                {completedMatches.length > 0 ?
                completedMatches.map((match) => {
                  const playerEvents = match.events.filter(
                    (e) => e.playerId === player.id
                  );
                  if (playerEvents.length === 0) return null;
                  const isHome = match.homeTeamId === player.teamId;
                  const oppTeamId = isHome ?
                  match.awayTeamId :
                  match.homeTeamId;
                  const oppTeam = teams.find((t) => t.id === oppTeamId);
                  return (
                    <div
                      key={match.id}
                      className="flex items-center justify-between p-3 bg-gs-primary rounded-lg border border-gs-border">
                      
                        <div className="flex items-center gap-3">
                          <div className="text-xs text-gs-text-secondary w-16">
                            {match.date}
                          </div>
                          <div className="font-medium text-white text-sm">
                            vs {oppTeam?.name}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {playerEvents.map((event) =>
                        <div
                          key={event.id}
                          className="flex items-center gap-1 text-xs font-bold px-2 py-1 rounded bg-gs-secondary border border-gs-border">
                          
                              {event.type === 'goal' &&
                          <span className="text-gs-highlight">
                                  ⚽ {event.minute}'
                                </span>
                          }
                              {event.type === 'yellow_card' &&
                          <span className="text-gs-gold">
                                  🟨 {event.minute}'
                                </span>
                          }
                              {(event.type === 'red_card' ||
                          event.type === 'second_yellow') &&
                          <span className="text-gs-error">
                                  🟥 {event.minute}'
                                </span>
                          }
                            </div>
                        )}
                        </div>
                      </div>);

                }) :

                <p className="text-gs-text-secondary text-sm text-center py-4">
                    Nema zabeleženih događaja za ovog igrača.
                  </p>
                }
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>);

}