import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Shield,
  MapPin,
  Calendar,
  Mail,
  Phone,
  Users,
  Trophy,
  ChevronLeft,
  Plus } from
'lucide-react';
import { useStore } from '../../store/useStore';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
export default function TeamDetails() {
  const { id } = useParams<{
    id: string;
  }>();
  const navigate = useNavigate();
  const { teams, players, matches, tournaments } = useStore();
  const [activeTab, setActiveTab] = useState('profile');
  const team = teams.find((t) => t.id === id);
  if (!team) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-white mb-4">
          Ekipa nije pronađena
        </h2>
        <Button onClick={() => navigate('/teams')}>Nazad na listu</Button>
      </div>);

  }
  const teamPlayers = players.filter((p) => p.teamId === team.id);
  const teamMatches = matches.filter(
    (m) => m.homeTeamId === team.id || m.awayTeamId === team.id
  );
  const completedMatches = teamMatches.filter((m) => m.status === 'completed');
  let wins = 0,
    draws = 0,
    losses = 0,
    goalsFor = 0,
    goalsAgainst = 0;
  completedMatches.forEach((m) => {
    const isHome = m.homeTeamId === team.id;
    const teamScore = isHome ? m.homeScore : m.awayScore;
    const oppScore = isHome ? m.awayScore : m.homeScore;
    if (teamScore !== null && oppScore !== null) {
      goalsFor += teamScore;
      goalsAgainst += oppScore;
      if (teamScore > oppScore) wins++;else
      if (teamScore < oppScore) losses++;else
      draws++;
    }
  });
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <button
        onClick={() => navigate('/teams')}
        className="flex items-center text-sm text-gs-text-secondary hover:text-white transition-colors mb-2">
        
        <ChevronLeft size={16} /> Nazad na ekipe
      </button>

      <div className="glass p-6 rounded-xl border border-gs-border relative overflow-hidden">
        <div
          className="absolute right-0 top-0 w-64 h-64 opacity-10 transform translate-x-10 -translate-y-10 rounded-full blur-3xl"
          style={{
            backgroundColor: team.primaryColor
          }}>
        </div>

        <div className="relative z-10 flex flex-col md:flex-row gap-6 items-start md:items-center">
          <div
            className="w-24 h-24 rounded-full bg-gs-primary border-4 flex items-center justify-center shadow-lg shrink-0 relative overflow-hidden"
            style={{
              borderColor: team.primaryColor || '#1E5FA8'
            }}>
            
            <div
              className="absolute inset-0 opacity-20"
              style={{
                background: `linear-gradient(135deg, ${team.primaryColor || '#1E5FA8'} 50%, ${team.secondaryColor || '#102444'} 50%)`
              }}>
            </div>
            <Shield size={40} className="text-white relative z-10" />
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-heading font-bold text-white">
                {team.name}
              </h1>
              <span className="px-2 py-1 bg-gs-primary rounded text-xs font-bold text-gs-text-secondary border border-gs-border">
                {team.shortName}
              </span>
            </div>

            <p className="text-gs-text-secondary mb-4 max-w-2xl">
              {team.description || 'Nema opisa za ovu ekipu.'}
            </p>

            <div className="flex flex-wrap gap-4 text-sm text-gs-text-secondary">
              <div className="flex items-center gap-1.5">
                <MapPin size={16} className="text-gs-accent" />
                <span>
                  {team.city}
                  {team.country ? `, ${team.country}` : ''}
                </span>
              </div>
              {team.foundedYear &&
              <div className="flex items-center gap-1.5">
                  <Calendar size={16} className="text-gs-accent" />
                  <span>Osnovan {team.foundedYear}.</span>
                </div>
              }
              <div className="flex items-center gap-1.5">
                <Users size={16} className="text-gs-accent" />
                <span>{teamPlayers.length} igrača</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Tabs */}
      <div className="flex overflow-x-auto border-b border-gs-border hide-scrollbar">
        {[
        {
          id: 'profile',
          label: 'Profil'
        },
        {
          id: 'players',
          label: 'Igrači'
        },
        {
          id: 'matches',
          label: 'Istorija mečeva'
        },
        {
          id: 'stats',
          label: 'Statistike'
        }].
        map((tab) =>
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`px-6 py-3 font-medium text-sm whitespace-nowrap transition-colors border-b-2 ${activeTab === tab.id ? 'border-gs-highlight text-gs-highlight' : 'border-transparent text-gs-text-secondary hover:text-white hover:border-gs-border'}`}>
          
            {tab.label}
          </button>
        )}
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'profile' &&
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
            <Card className="bg-gs-secondary border-gs-border">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold text-white mb-4 border-b border-gs-border pb-2">
                  Kontakt Informacije
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-gs-text-secondary">
                    <div className="w-8 h-8 rounded-full bg-gs-primary flex items-center justify-center">
                      <Users size={16} className="text-gs-accent" />
                    </div>
                    <div>
                      <p className="text-xs">Kontakt osoba</p>
                      <p className="text-white font-medium">
                        {team.contactName || 'Nije navedeno'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-gs-text-secondary">
                    <div className="w-8 h-8 rounded-full bg-gs-primary flex items-center justify-center">
                      <Phone size={16} className="text-gs-accent" />
                    </div>
                    <div>
                      <p className="text-xs">Telefon</p>
                      <p className="text-white font-medium">
                        {team.contactPhone || 'Nije navedeno'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-gs-text-secondary">
                    <div className="w-8 h-8 rounded-full bg-gs-primary flex items-center justify-center">
                      <Mail size={16} className="text-gs-accent" />
                    </div>
                    <div>
                      <p className="text-xs">Email</p>
                      <p className="text-white font-medium">
                        {team.contactEmail || 'Nije navedeno'}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gs-secondary border-gs-border">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold text-white mb-4 border-b border-gs-border pb-2">
                  Brza Statistika
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gs-primary p-4 rounded-lg border border-gs-border text-center">
                    <p className="text-gs-text-secondary text-sm mb-1">
                      Odigrano mečeva
                    </p>
                    <p className="text-3xl font-bold text-white">
                      {completedMatches.length}
                    </p>
                  </div>
                  <div className="bg-gs-primary p-4 rounded-lg border border-gs-border text-center">
                    <p className="text-gs-text-secondary text-sm mb-1">
                      Pobede
                    </p>
                    <p className="text-3xl font-bold text-gs-success">{wins}</p>
                  </div>
                  <div className="bg-gs-primary p-4 rounded-lg border border-gs-border text-center">
                    <p className="text-gs-text-secondary text-sm mb-1">
                      Dati golovi
                    </p>
                    <p className="text-3xl font-bold text-gs-highlight">
                      {goalsFor}
                    </p>
                  </div>
                  <div className="bg-gs-primary p-4 rounded-lg border border-gs-border text-center">
                    <p className="text-gs-text-secondary text-sm mb-1">
                      Primljeni golovi
                    </p>
                    <p className="text-3xl font-bold text-gs-error">
                      {goalsAgainst}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        }

        {activeTab === 'players' &&
        <div className="space-y-4 animate-fade-in">
            <div className="flex justify-end">
              <Button
              onClick={() => navigate('/players/new')}
              className="bg-gs-accent hover:bg-gs-highlight text-white border-none"
              leftIcon={<Plus size={18} />}>
              
                Dodaj igrača
              </Button>
            </div>

            {teamPlayers.length > 0 ?
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {teamPlayers.map((player) =>
            <div
              key={player.id}
              className="bg-gs-secondary p-4 rounded-xl border border-gs-border flex items-center gap-4 hover:border-gs-highlight transition-colors cursor-pointer"
              onClick={() => navigate(`/players/${player.id}`)}>
              
                    <div className="w-12 h-12 rounded-full bg-gs-primary border-2 border-gs-border flex items-center justify-center font-bold text-lg text-white">
                      {player.jerseyNumber}
                    </div>
                    <div>
                      <p className="font-bold text-white flex items-center gap-2">
                        {player.firstName} {player.lastName}
                        {player.isCaptain &&
                  <span className="text-xs bg-gs-gold text-gs-primary px-1.5 rounded font-bold">
                            C
                          </span>
                  }
                      </p>
                      <p className="text-sm text-gs-text-secondary">
                        {player.position}
                      </p>
                    </div>
                  </div>
            )}
              </div> :

          <div className="text-center p-12 bg-gs-secondary rounded-xl border border-gs-border border-dashed">
                <Users
              size={48}
              className="mx-auto text-gs-text-secondary opacity-50 mb-4" />
            
                <p className="text-gs-text-secondary">
                  Ekipa trenutno nema registrovanih igrača.
                </p>
              </div>
          }
          </div>
        }

        {activeTab === 'matches' &&
        <div className="space-y-4 animate-fade-in">
            {teamMatches.length > 0 ?
          teamMatches.map((match) => {
            const isHome = match.homeTeamId === team.id;
            const oppTeamId = isHome ? match.awayTeamId : match.homeTeamId;
            const oppTeam = teams.find((t) => t.id === oppTeamId);
            const tournament = tournaments.find(
              (t) => t.id === match.tournamentId
            );
            if (!oppTeam) return null;
            let resultClass = 'text-gs-text-secondary';
            if (match.status === 'completed') {
              const teamScore = isHome ? match.homeScore : match.awayScore;
              const oppScore = isHome ? match.awayScore : match.homeScore;
              if (teamScore! > oppScore!) resultClass = 'text-gs-success';else
              if (teamScore! < oppScore!) resultClass = 'text-gs-error';else
              resultClass = 'text-gs-draw';
            }
            return (
              <Card
                key={match.id}
                className="bg-gs-secondary border-gs-border">
                
                    <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="text-sm text-gs-text-secondary text-center sm:text-left w-full sm:w-1/4">
                        <p className="font-medium text-white truncate">
                          {tournament?.name}
                        </p>
                        <p>
                          {match.date} • {match.time}
                        </p>
                      </div>

                      <div className="flex items-center justify-center gap-4 w-full sm:w-2/4">
                        <span
                      className={`font-medium ${isHome ? 'text-white' : 'text-gs-text-secondary'}`}>
                      
                          {isHome ? team.name : oppTeam.name}
                        </span>

                        <div
                      className={`px-3 py-1 rounded bg-gs-primary border border-gs-border font-bold text-lg ${resultClass}`}>
                      
                          {match.status === 'completed' ?
                      `${match.homeScore} - ${match.awayScore}` :
                      'VS'}
                        </div>

                        <span
                      className={`font-medium ${!isHome ? 'text-white' : 'text-gs-text-secondary'}`}>
                      
                          {!isHome ? team.name : oppTeam.name}
                        </span>
                      </div>

                      <div className="w-full sm:w-1/4 flex justify-end">
                        <Badge
                      variant={
                      match.status === 'completed' ?
                      'secondary' :
                      'warning'
                      }
                      className={
                      match.status === 'completed' ?
                      'bg-gs-primary text-gs-text-secondary border-gs-border' :
                      'bg-gs-highlight/20 text-gs-highlight border-gs-highlight/30'
                      }>
                      
                          {match.status === 'completed' ?
                      'Završeno' :
                      'Zakazano'}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>);

          }) :

          <div className="text-center p-12 bg-gs-secondary rounded-xl border border-gs-border border-dashed">
                <Trophy
              size={48}
              className="mx-auto text-gs-text-secondary opacity-50 mb-4" />
            
                <p className="text-gs-text-secondary">
                  Ekipa još uvek nema odigranih mečeva.
                </p>
              </div>
          }
          </div>
        }

        {activeTab === 'stats' &&
        <div className="p-12 text-center bg-gs-secondary rounded-xl border border-gs-border border-dashed animate-fade-in">
            <p className="text-gs-text-secondary">
              Detaljne statistike ekipe će biti prikazane ovde.
            </p>
          </div>
        }
      </div>
    </div>);

}