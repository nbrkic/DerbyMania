import React from 'react';
import {
  Trophy,
  Shield,
  Users,
  Activity,
  ChevronRight,
  Plus } from
'lucide-react';
import { useStore } from '../store/useStore';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useNavigate } from 'react-router-dom';
export default function Dashboard() {
  const { tournaments, teams, players, matches } = useStore();
  const navigate = useNavigate();
  const activeTournaments = tournaments.filter((t) => t.status === 'active');
  const recentMatches = matches.
  filter((m) => m.status === 'completed').
  slice(-5);
  const upcomingMatches = matches.
  filter((m) => m.status === 'scheduled').
  slice(0, 3);
  const stats = [
  {
    label: 'Ukupno Turnira',
    value: tournaments.length,
    icon: Trophy,
    color: 'text-gs-gold'
  },
  {
    label: 'Aktivnih Turnira',
    value: activeTournaments.length,
    icon: Activity,
    color: 'text-gs-success'
  },
  {
    label: 'Registrovanih Ekipa',
    value: teams.length,
    icon: Shield,
    color: 'text-gs-highlight'
  },
  {
    label: 'Registrovanih Igrača',
    value: players.length,
    icon: Users,
    color: 'text-gs-accent'
  }];

  return (
    <div className="space-y-8">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl glass p-8 border border-gs-border">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 opacity-10">
          <Trophy size={200} />
        </div>
        <div className="relative z-10">
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-white mb-2">
            Organizuj. Takmiči se. Pobeđuj.
          </h1>
          <p className="text-gs-text-secondary text-lg max-w-2xl mb-6">
            Dobrodošli u GoalStorm - ultimativnu platformu za upravljanje
            fudbalskim turnirima. Pratite rezultate, statistike i upravljajte
            ekipama na jednom mestu.
          </p>
          <div className="flex flex-wrap gap-4">
            <Button
              onClick={() => navigate('/tournaments/new')}
              className="bg-gs-accent hover:bg-gs-highlight text-white border-none"
              leftIcon={<Plus size={18} />}>
              
              Novi turnir
            </Button>
            <Button
              onClick={() => navigate('/teams/new')}
              variant="secondary"
              className="bg-gs-secondary hover:bg-gs-border text-white border-gs-border"
              leftIcon={<Plus size={18} />}>
              
              Nova ekipa
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <Card key={i} className="bg-gs-secondary border-gs-border">
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <p className="text-gs-text-secondary text-sm font-medium mb-1">
                    {stat.label}
                  </p>
                  <p className="text-3xl font-bold text-white">{stat.value}</p>
                </div>
                <div
                  className={`p-3 rounded-lg bg-gs-primary/50 ${stat.color}`}>
                  
                  <Icon size={24} />
                </div>
              </CardContent>
            </Card>);

        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content Column */}
        <div className="lg:col-span-2 space-y-8">
          {/* Active Tournaments */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-heading font-bold text-white flex items-center gap-2">
                <Activity className="text-gs-highlight" size={20} />
                Aktivni Turniri
              </h2>
              <button
                onClick={() => navigate('/tournaments')}
                className="text-sm text-gs-highlight hover:text-white flex items-center gap-1 transition-colors">
                
                Vidi sve <ChevronRight size={16} />
              </button>
            </div>

            <div className="space-y-4">
              {activeTournaments.length > 0 ?
              activeTournaments.map((tournament) =>
              <Card
                key={tournament.id}
                className="bg-gs-secondary border-gs-border hover:border-gs-highlight transition-colors cursor-pointer"
                onClick={() => navigate(`/tournaments/${tournament.id}`)}>
                
                    <CardContent className="p-5">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-bold text-white">
                            {tournament.name}
                          </h3>
                          <p className="text-sm text-gs-text-secondary">
                            {tournament.city} • {tournament.teamIds.length}{' '}
                            ekipa
                          </p>
                        </div>
                        <span className="px-3 py-1 rounded-full bg-gs-success/20 text-gs-success text-xs font-medium border border-gs-success/30">
                          U toku
                        </span>
                      </div>
                      <div className="w-full bg-gs-primary rounded-full h-2 mb-1">
                        <div
                      className="bg-gs-highlight h-2 rounded-full"
                      style={{
                        width: '45%'
                      }}>
                    </div>
                      </div>
                      <p className="text-xs text-right text-gs-text-secondary">
                        Grupna faza (45%)
                      </p>
                    </CardContent>
                  </Card>
              ) :

              <div className="text-center p-8 bg-gs-secondary rounded-xl border border-gs-border border-dashed">
                  <p className="text-gs-text-secondary">
                    Nema aktivnih turnira.
                  </p>
                </div>
              }
            </div>
          </section>

          {/* Recent Results */}
          <section>
            <h2 className="text-xl font-heading font-bold text-white mb-4 flex items-center gap-2">
              <Trophy className="text-gs-gold" size={20} />
              Poslednji Rezultati
            </h2>
            <div className="space-y-3">
              {recentMatches.length > 0 ?
              recentMatches.map((match) => {
                const homeTeam = teams.find((t) => t.id === match.homeTeamId);
                const awayTeam = teams.find((t) => t.id === match.awayTeamId);
                const tournament = tournaments.find(
                  (t) => t.id === match.tournamentId
                );
                if (!homeTeam || !awayTeam) return null;
                return (
                  <div
                    key={match.id}
                    className="glass-card rounded-lg p-4 flex items-center justify-between">
                    
                      <div className="flex-1 flex justify-end items-center gap-3">
                        <span className="font-medium text-white">
                          {homeTeam.name}
                        </span>
                        <div
                        className="w-6 h-6 rounded-full bg-gs-primary flex items-center justify-center text-xs font-bold"
                        style={{
                          borderBottom: `2px solid ${homeTeam.primaryColor}`
                        }}>
                        
                          {homeTeam.shortName.charAt(0)}
                        </div>
                      </div>

                      <div className="px-4 flex flex-col items-center">
                        <div className="bg-gs-primary px-3 py-1 rounded border border-gs-border font-bold text-lg text-white min-w-[70px] text-center">
                          {match.homeScore} - {match.awayScore}
                        </div>
                        <span className="text-[10px] text-gs-text-secondary mt-1">
                          {tournament?.name}
                        </span>
                      </div>

                      <div className="flex-1 flex justify-start items-center gap-3">
                        <div
                        className="w-6 h-6 rounded-full bg-gs-primary flex items-center justify-center text-xs font-bold"
                        style={{
                          borderBottom: `2px solid ${awayTeam.primaryColor}`
                        }}>
                        
                          {awayTeam.shortName.charAt(0)}
                        </div>
                        <span className="font-medium text-white">
                          {awayTeam.name}
                        </span>
                      </div>
                    </div>);

              }) :

              <div className="text-center p-8 bg-gs-secondary rounded-xl border border-gs-border border-dashed">
                  <p className="text-gs-text-secondary">
                    Nema odigranih mečeva.
                  </p>
                </div>
              }
            </div>
          </section>
        </div>

        {/* Sidebar Column */}
        <div className="space-y-8">
          {/* Upcoming Matches */}
          <section>
            <h2 className="text-xl font-heading font-bold text-white mb-4">
              Predstojeći Mečevi
            </h2>
            <div className="space-y-3">
              {upcomingMatches.length > 0 ?
              upcomingMatches.map((match) => {
                const homeTeam = teams.find((t) => t.id === match.homeTeamId);
                const awayTeam = teams.find((t) => t.id === match.awayTeamId);
                if (!homeTeam || !awayTeam) return null;
                return (
                  <Card
                    key={match.id}
                    className="bg-gs-secondary border-gs-border">
                    
                      <CardContent className="p-4">
                        <div className="text-center mb-3">
                          <span className="text-xs font-medium text-gs-highlight bg-gs-highlight/10 px-2 py-1 rounded">
                            {match.date} • {match.time}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-sm text-white truncate w-2/5 text-right">
                            {homeTeam.name}
                          </span>
                          <span className="text-gs-text-secondary text-xs font-bold px-2">
                            VS
                          </span>
                          <span className="font-medium text-sm text-white truncate w-2/5">
                            {awayTeam.name}
                          </span>
                        </div>
                      </CardContent>
                    </Card>);

              }) :

              <div className="text-center p-6 bg-gs-secondary rounded-xl border border-gs-border border-dashed">
                  <p className="text-gs-text-secondary text-sm">
                    Nema zakazanih mečeva.
                  </p>
                </div>
              }
            </div>
          </section>

          {/* Top Scorers */}
          <section>
            <h2 className="text-xl font-heading font-bold text-white mb-4">
              Top Strelci
            </h2>
            <Card className="bg-gs-secondary border-gs-border overflow-hidden">
              <div className="divide-y divide-gs-border">
                {[1, 2, 3, 4, 5].map((_, i) => {
                  // Mock data for dashboard
                  const mockPlayers = players.slice(0, 5);
                  const player = mockPlayers[i];
                  if (!player) return null;
                  const team = teams.find((t) => t.id === player.teamId);
                  const goals = 5 - i; // Mock goals
                  return (
                    <div
                      key={i}
                      className="p-3 flex items-center justify-between hover:bg-gs-primary/50 transition-colors">
                      
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-gs-gold text-gs-primary' : i === 1 ? 'bg-gray-300 text-gs-primary' : i === 2 ? 'bg-amber-600 text-white' : 'bg-gs-primary text-gs-text-secondary border border-gs-border'}`}>
                          
                          {i + 1}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">
                            {player.firstName} {player.lastName}
                          </p>
                          <p className="text-xs text-gs-text-secondary">
                            {team?.shortName}
                          </p>
                        </div>
                      </div>
                      <div className="font-bold text-gs-highlight">
                        {goals}{' '}
                        <span className="text-xs font-normal text-gs-text-secondary">
                          gol
                        </span>
                      </div>
                    </div>);

                })}
              </div>
            </Card>
          </section>
        </div>
      </div>
    </div>);

}