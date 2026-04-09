import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Trophy,
  Calendar,
  MapPin,
  Users,
  Settings,
  Play,
  ChevronLeft } from
'lucide-react';
import { useStore } from '../../store/useStore';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
export default function TournamentDetails() {
  const { id } = useParams<{
    id: string;
  }>();
  const navigate = useNavigate();
  const { tournaments, teams, groups, getGroupStandings, updateTournament } =
  useStore();
  const [activeTab, setActiveTab] = useState('overview');
  const tournament = tournaments.find((t) => t.id === id);
  if (!tournament) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-white mb-4">
          Turnir nije pronađen
        </h2>
        <Button onClick={() => navigate('/tournaments')}>Nazad na listu</Button>
      </div>);

  }
  const tournamentTeams = teams.filter((t) => tournament.teamIds.includes(t.id));
  const tournamentGroups = groups.filter(
    (g) => g.tournamentId === tournament.id
  );
  const handleStartTournament = () => {
    updateTournament(tournament.id, {
      status: 'active'
    });
  };
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <Badge
            variant="success"
            className="bg-gs-success/20 text-gs-success border-gs-success/30">
            
            Aktivan
          </Badge>);

      case 'upcoming':
        return (
          <Badge
            variant="warning"
            className="bg-gs-highlight/20 text-gs-highlight border-gs-highlight/30">
            
            Predstojeći
          </Badge>);

      case 'completed':
        return (
          <Badge
            variant="secondary"
            className="bg-gs-border text-gs-text-secondary">
            
            Završen
          </Badge>);

      case 'draft':
        return (
          <Badge
            variant="secondary"
            className="bg-gs-primary text-gs-text-secondary border-gs-border">
            
            Draft
          </Badge>);

      default:
        return null;
    }
  };
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <button
        onClick={() => navigate('/tournaments')}
        className="flex items-center text-sm text-gs-text-secondary hover:text-white transition-colors mb-2">
        
        <ChevronLeft size={16} /> Nazad na turnire
      </button>

      <div className="glass p-6 rounded-xl border border-gs-border relative overflow-hidden">
        <div className="absolute right-0 top-0 opacity-5 transform translate-x-10 -translate-y-10">
          <Trophy size={200} />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row gap-6 items-start md:items-center">
          <div className="w-24 h-24 rounded-2xl bg-gs-secondary border-2 border-gs-border flex items-center justify-center shadow-lg shrink-0">
            <Trophy className="text-gs-gold" size={48} />
          </div>

          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h1 className="text-3xl font-heading font-bold text-white">
                {tournament.name}
              </h1>
              {getStatusBadge(tournament.status)}
            </div>

            <p className="text-gs-text-secondary mb-4 max-w-2xl">
              {tournament.description}
            </p>

            <div className="flex flex-wrap gap-4 text-sm text-gs-text-secondary">
              <div className="flex items-center gap-1.5">
                <Calendar size={16} className="text-gs-accent" />
                <span>
                  {new Date(tournament.startDate).toLocaleDateString('sr-RS')} -{' '}
                  {new Date(tournament.endDate).toLocaleDateString('sr-RS')}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin size={16} className="text-gs-accent" />
                <span>{tournament.city || 'Nije definisano'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Users size={16} className="text-gs-accent" />
                <span>
                  {tournament.teamIds.length} / {tournament.teamCount} ekipa
                </span>
              </div>
            </div>
          </div>

          {tournament.status === 'upcoming' &&
          <Button
            onClick={handleStartTournament}
            className="bg-gs-success hover:bg-green-500 text-white border-none w-full md:w-auto"
            leftIcon={<Play size={18} />}>
            
              Startuj Turnir
            </Button>
          }
        </div>
      </div>

      {/* Custom Tabs */}
      <div className="flex overflow-x-auto border-b border-gs-border hide-scrollbar">
        {[
        {
          id: 'overview',
          label: 'Pregled'
        },
        {
          id: 'groups',
          label: 'Grupna faza'
        },
        {
          id: 'bracket',
          label: 'Eliminacije'
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
        {activeTab === 'overview' &&
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
            <div className="lg:col-span-2 space-y-6">
              <Card className="bg-gs-secondary border-gs-border">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <Users className="text-gs-accent" size={20} />
                    Prijavljene Ekipe ({tournamentTeams.length})
                  </h3>

                  {tournamentTeams.length > 0 ?
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {tournamentTeams.map((team) =>
                  <div
                    key={team.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-gs-primary border border-gs-border hover:border-gs-highlight transition-colors cursor-pointer"
                    onClick={() => navigate(`/teams/${team.id}`)}>
                    
                          <div
                      className="w-10 h-10 rounded-full bg-gs-secondary flex items-center justify-center font-bold text-sm"
                      style={{
                        borderBottom: `2px solid ${team.primaryColor}`
                      }}>
                      
                            {team.shortName.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-white">{team.name}</p>
                            <p className="text-xs text-gs-text-secondary">
                              {team.city}
                            </p>
                          </div>
                        </div>
                  )}
                    </div> :

                <p className="text-gs-text-secondary text-sm">
                      Nema prijavljenih ekipa.
                    </p>
                }
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="bg-gs-secondary border-gs-border">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <Settings className="text-gs-accent" size={20} />
                    Pravila i Format
                  </h3>

                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between py-2 border-b border-gs-border">
                      <span className="text-gs-text-secondary">Format</span>
                      <span className="font-medium text-white">
                        {tournament.format === 'group_knockout' ?
                      'Grupe + Eliminacija' :
                      tournament.format === 'league' ?
                      'Liga' :
                      'Kup'}
                      </span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gs-border">
                      <span className="text-gs-text-secondary">
                        Trajanje meča
                      </span>
                      <span className="font-medium text-white">
                        {tournament.settings.matchDuration} min
                      </span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gs-border">
                      <span className="text-gs-text-secondary">
                        Bodovanje (P/N/I)
                      </span>
                      <span className="font-medium text-white">
                        {tournament.settings.pointsWin} /{' '}
                        {tournament.settings.pointsDraw} /{' '}
                        {tournament.settings.pointsLoss}
                      </span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gs-border">
                      <span className="text-gs-text-secondary">Produžeci</span>
                      <span className="font-medium text-white">
                        {tournament.settings.extraTime ? 'Da' : 'Ne'}
                      </span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-gs-text-secondary">Penali</span>
                      <span className="font-medium text-white">
                        {tournament.settings.penalties ? 'Da' : 'Ne'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        }

        {activeTab === 'groups' &&
        <div className="space-y-8 animate-fade-in">
            {tournamentGroups.length > 0 ?
          tournamentGroups.map((group) => {
            const standings = getGroupStandings(group.id);
            return (
              <Card
                key={group.id}
                className="bg-gs-secondary border-gs-border overflow-hidden">
                
                    <div className="bg-gs-primary/50 p-4 border-b border-gs-border flex justify-between items-center">
                      <h3 className="text-lg font-bold text-white">
                        {group.name}
                      </h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gs-text-secondary uppercase bg-gs-primary/30">
                          <tr>
                            <th className="px-4 py-3 w-10 text-center">#</th>
                            <th className="px-4 py-3">Ekipa</th>
                            <th className="px-2 py-3 text-center">O</th>
                            <th className="px-2 py-3 text-center">P</th>
                            <th className="px-2 py-3 text-center">N</th>
                            <th className="px-2 py-3 text-center">I</th>
                            <th className="px-2 py-3 text-center">GR</th>
                            <th className="px-4 py-3 text-center font-bold text-white">
                              B
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {standings.map((standing, index) => {
                        const team = teams.find(
                          (t) => t.id === standing.teamId
                        );
                        if (!team) return null;
                        const isAdvancing =
                        index < (tournament.advancingPerGroup || 2);
                        return (
                          <tr
                            key={team.id}
                            className={`border-b border-gs-border/50 hover:bg-gs-primary/30 transition-colors ${isAdvancing ? 'bg-gs-success/5' : ''}`}>
                            
                                <td className="px-4 py-3 text-center">
                                  <span
                                className={`w-6 h-6 rounded-full inline-flex items-center justify-center text-xs font-bold ${isAdvancing ? 'bg-gs-success text-white' : 'text-gs-text-secondary'}`}>
                                
                                    {index + 1}
                                  </span>
                                </td>
                                <td className="px-4 py-3 font-medium text-white flex items-center gap-2">
                                  <div
                                className="w-6 h-6 rounded-full bg-gs-primary flex items-center justify-center text-[10px] font-bold"
                                style={{
                                  borderBottom: `2px solid ${team.primaryColor}`
                                }}>
                                
                                    {team.shortName.charAt(0)}
                                  </div>
                                  {team.name}
                                </td>
                                <td className="px-2 py-3 text-center text-gs-text-secondary">
                                  {standing.played}
                                </td>
                                <td className="px-2 py-3 text-center text-gs-text-secondary">
                                  {standing.won}
                                </td>
                                <td className="px-2 py-3 text-center text-gs-text-secondary">
                                  {standing.drawn}
                                </td>
                                <td className="px-2 py-3 text-center text-gs-text-secondary">
                                  {standing.lost}
                                </td>
                                <td className="px-2 py-3 text-center text-gs-text-secondary">
                                  {standing.goalsFor}:{standing.goalsAgainst}
                                </td>
                                <td className="px-4 py-3 text-center font-bold text-gs-highlight">
                                  {standing.points}
                                </td>
                              </tr>);

                      })}
                        </tbody>
                      </table>
                    </div>
                  </Card>);

          }) :

          <div className="text-center p-12 bg-gs-secondary rounded-xl border border-gs-border border-dashed">
                <p className="text-gs-text-secondary mb-4">
                  Grupe još nisu žrebane.
                </p>
                <Button className="bg-gs-accent hover:bg-gs-highlight text-white border-none">
                  Žrebaj Grupe
                </Button>
              </div>
          }
          </div>
        }

        {activeTab === 'bracket' &&
        <div className="p-12 text-center bg-gs-secondary rounded-xl border border-gs-border border-dashed animate-fade-in">
            <Trophy
            size={48}
            className="mx-auto text-gs-text-secondary opacity-50 mb-4" />
          
            <h3 className="text-xl font-bold text-white mb-2">
              Eliminaciona faza
            </h3>
            <p className="text-gs-text-secondary">
              Bracket će biti dostupan kada se završi grupna faza.
            </p>
          </div>
        }

        {activeTab === 'stats' &&
        <div className="p-12 text-center bg-gs-secondary rounded-xl border border-gs-border border-dashed animate-fade-in">
            <p className="text-gs-text-secondary">
              Statistike turnira će biti prikazane ovde.
            </p>
          </div>
        }
      </div>
    </div>);

}