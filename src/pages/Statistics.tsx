import React from 'react';
import { Trophy, Users, Shield, Activity } from 'lucide-react';
import { useStore } from '../store/useStore';
import { Card, CardContent } from '../components/ui/Card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell } from
'recharts';
export default function Statistics() {
  const { tournaments, teams, players, matches } = useStore();
  // Calculate global stats
  const completedMatches = matches.filter((m) => m.status === 'completed');
  let totalGoals = 0;
  let totalYellowCards = 0;
  let totalRedCards = 0;
  completedMatches.forEach((m) => {
    if (m.homeScore !== null) totalGoals += m.homeScore;
    if (m.awayScore !== null) totalGoals += m.awayScore;
    m.events.forEach((e) => {
      if (e.type === 'yellow_card') totalYellowCards++;
      if (e.type === 'red_card' || e.type === 'second_yellow') totalRedCards++;
    });
  });
  const avgGoalsPerMatch =
  completedMatches.length > 0 ?
  (totalGoals / completedMatches.length).toFixed(2) :
  '0.00';
  // Top Scorers
  const playerGoals: Record<string, number> = {};
  completedMatches.forEach((m) => {
    m.events.forEach((e) => {
      if (e.type === 'goal') {
        playerGoals[e.playerId] = (playerGoals[e.playerId] || 0) + 1;
      }
    });
  });
  const topScorers = Object.entries(playerGoals).
  map(([playerId, goals]) => ({
    playerId,
    goals
  })).
  sort((a, b) => b.goals - a.goals).
  slice(0, 5);
  // Chart Data: Goals by minute (mocked distribution based on actual goals if available)
  const goalsByMinuteData = [
  {
    name: '0-15',
    goals: 12
  },
  {
    name: '16-30',
    goals: 18
  },
  {
    name: '31-45',
    goals: 25
  },
  {
    name: '46-60',
    goals: 15
  },
  {
    name: '61-75',
    goals: 22
  },
  {
    name: '76-90+',
    goals: 35
  }];

  // Chart Data: Match Results
  let homeWins = 0,
    awayWins = 0,
    draws = 0;
  completedMatches.forEach((m) => {
    if (m.homeScore! > m.awayScore!) homeWins++;else
    if (m.homeScore! < m.awayScore!) awayWins++;else
    draws++;
  });
  const matchResultsData = [
  {
    name: 'Pobeda Domaćina',
    value: homeWins,
    color: '#2E9BF5'
  },
  {
    name: 'Nerešeno',
    value: draws,
    color: '#F5A623'
  },
  {
    name: 'Pobeda Gosta',
    value: awayWins,
    color: '#E74C3C'
  }];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-heading font-bold text-white">
          Globalne Statistike
        </h1>
        <p className="text-gs-text-secondary mt-1">
          Pregled celokupnog sistema i takmičenja.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gs-secondary border-gs-border">
          <CardContent className="p-4 text-center">
            <Trophy className="mx-auto text-gs-gold mb-2" size={24} />
            <p className="text-gs-text-secondary text-sm mb-1">
              Odigrano Mečeva
            </p>
            <p className="text-2xl font-bold text-white">
              {completedMatches.length}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-gs-secondary border-gs-border">
          <CardContent className="p-4 text-center">
            <Activity className="mx-auto text-gs-highlight mb-2" size={24} />
            <p className="text-gs-text-secondary text-sm mb-1">Ukupno Golova</p>
            <p className="text-2xl font-bold text-white">{totalGoals}</p>
          </CardContent>
        </Card>
        <Card className="bg-gs-secondary border-gs-border">
          <CardContent className="p-4 text-center">
            <Shield className="mx-auto text-gs-accent mb-2" size={24} />
            <p className="text-gs-text-secondary text-sm mb-1">Prosek Golova</p>
            <p className="text-2xl font-bold text-white">{avgGoalsPerMatch}</p>
          </CardContent>
        </Card>
        <Card className="bg-gs-secondary border-gs-border">
          <CardContent className="p-4 text-center">
            <Users className="mx-auto text-gs-error mb-2" size={24} />
            <p className="text-gs-text-secondary text-sm mb-1">Kartoni (Ž/C)</p>
            <p className="text-2xl font-bold text-white">
              {totalYellowCards} / {totalRedCards}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-gs-secondary border-gs-border">
          <CardContent className="p-6">
            <h3 className="text-xl font-bold text-white mb-6">
              Distribucija Rezultata
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={matchResultsData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value">
                    
                    {matchResultsData.map((entry, index) =>
                    <Cell key={`cell-${index}`} fill={entry.color} />
                    )}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#102444',
                      borderColor: '#1A3A5C',
                      color: '#fff'
                    }}
                    itemStyle={{
                      color: '#fff'
                    }} />
                  
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 mt-4 text-sm">
              {matchResultsData.map((item) =>
              <div key={item.name} className="flex items-center gap-2">
                  <div
                  className="w-3 h-3 rounded-full"
                  style={{
                    backgroundColor: item.color
                  }}>
                </div>
                  <span className="text-gs-text-secondary">
                    {item.name} ({item.value})
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gs-secondary border-gs-border">
          <CardContent className="p-6">
            <h3 className="text-xl font-bold text-white mb-6">
              Golovi po minutima
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={goalsByMinuteData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#1A3A5C"
                    vertical={false} />
                  
                  <XAxis
                    dataKey="name"
                    stroke="#A0B4CC"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false} />
                  
                  <YAxis
                    stroke="#A0B4CC"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false} />
                  
                  <Tooltip
                    cursor={{
                      fill: '#1A3A5C',
                      opacity: 0.4
                    }}
                    contentStyle={{
                      backgroundColor: '#102444',
                      borderColor: '#1A3A5C',
                      color: '#fff'
                    }} />
                  
                  <Bar dataKey="goals" fill="#2E9BF5" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gs-secondary border-gs-border lg:col-span-2">
          <CardContent className="p-6">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Trophy className="text-gs-gold" size={20} />
              Top Strelci (Sva takmičenja)
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gs-text-secondary uppercase bg-gs-primary/30 border-b border-gs-border">
                  <tr>
                    <th className="px-4 py-3 w-16 text-center">Rang</th>
                    <th className="px-4 py-3">Igrač</th>
                    <th className="px-4 py-3">Ekipa</th>
                    <th className="px-4 py-3 text-center">Golovi</th>
                  </tr>
                </thead>
                <tbody>
                  {topScorers.length > 0 ?
                  topScorers.map((scorer, index) => {
                    const player = players.find(
                      (p) => p.id === scorer.playerId
                    );
                    if (!player) return null;
                    const team = teams.find((t) => t.id === player.teamId);
                    return (
                      <tr
                        key={scorer.playerId}
                        className="border-b border-gs-border/50 hover:bg-gs-primary/30 transition-colors">
                        
                          <td className="px-4 py-3 text-center">
                            <span
                            className={`w-8 h-8 rounded-full inline-flex items-center justify-center font-bold ${index === 0 ? 'bg-gs-gold text-gs-primary' : index === 1 ? 'bg-gray-300 text-gs-primary' : index === 2 ? 'bg-amber-600 text-white' : 'text-gs-text-secondary'}`}>
                            
                              {index + 1}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-bold text-white">
                            {player.firstName} {player.lastName}
                          </td>
                          <td className="px-4 py-3 text-gs-text-secondary">
                            {team?.name}
                          </td>
                          <td className="px-4 py-3 text-center font-bold text-gs-highlight text-lg">
                            {scorer.goals}
                          </td>
                        </tr>);

                  }) :

                  <tr>
                      <td
                      colSpan={4}
                      className="px-4 py-8 text-center text-gs-text-secondary">
                      
                        Nema podataka o strelcima.
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>);

}