import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Users } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
export default function PlayerList() {
  const { players, teams } = useStore();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [teamFilter, setTeamFilter] = useState('all');
  const filteredPlayers = players.filter((p) => {
    const fullName = `${p.firstName} ${p.lastName}`.toLowerCase();
    const matchesSearch = fullName.includes(searchTerm.toLowerCase());
    const matchesTeam = teamFilter === 'all' || p.teamId === teamFilter;
    return matchesSearch && matchesTeam;
  });
  const teamOptions = [
  {
    value: 'all',
    label: 'Sve ekipe'
  },
  ...teams.map((t) => ({
    value: t.id,
    label: t.name
  }))];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-white">Igrači</h1>
          <p className="text-gs-text-secondary mt-1">
            Baza svih registrovanih igrača.
          </p>
        </div>
        <Button
          onClick={() => navigate('/players/new')}
          className="bg-gs-accent hover:bg-gs-highlight text-white border-none"
          leftIcon={<Plus size={18} />}>
          
          Novi igrač
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 bg-gs-secondary p-4 rounded-xl border border-gs-border">
        <div className="flex-1">
          <Input
            placeholder="Pretraži po imenu i prezimenu..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            startAdornment={
            <Search size={18} className="text-gs-text-secondary" />
            }
            className="bg-gs-primary border-gs-border text-white" />
          
        </div>
        <div className="w-full sm:w-64">
          <Select
            value={teamFilter}
            onChange={(val) => setTeamFilter(val as string)}
            options={teamOptions} />
          
        </div>
      </div>

      <Card className="bg-gs-secondary border-gs-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gs-text-secondary uppercase bg-gs-primary/30 border-b border-gs-border">
              <tr>
                <th className="px-6 py-4">Igrač</th>
                <th className="px-6 py-4">Broj</th>
                <th className="px-6 py-4">Pozicija</th>
                <th className="px-6 py-4">Ekipa</th>
                <th className="px-6 py-4 text-right">Akcije</th>
              </tr>
            </thead>
            <tbody>
              {filteredPlayers.length > 0 ?
              filteredPlayers.map((player) => {
                const team = teams.find((t) => t.id === player.teamId);
                return (
                  <tr
                    key={player.id}
                    className="border-b border-gs-border/50 hover:bg-gs-primary/30 transition-colors">
                    
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gs-primary border border-gs-border flex items-center justify-center text-gs-text-secondary font-bold">
                            {player.firstName.charAt(0)}
                            {player.lastName.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-white flex items-center gap-2">
                              {player.firstName} {player.lastName}
                              {player.isCaptain &&
                            <span className="text-[10px] bg-gs-gold text-gs-primary px-1 rounded font-bold">
                                  C
                                </span>
                            }
                            </p>
                            <p className="text-xs text-gs-text-secondary">
                              {new Date().getFullYear() -
                            new Date(player.dateOfBirth).getFullYear()}{' '}
                              god.
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-white">
                          {player.jerseyNumber}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-gs-primary rounded text-xs font-medium text-gs-text-secondary border border-gs-border">
                          {player.position}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {team ?
                      <div className="flex items-center gap-2">
                            <div
                          className="w-5 h-5 rounded-full bg-gs-primary flex items-center justify-center text-[8px] font-bold"
                          style={{
                            borderBottom: `2px solid ${team.primaryColor}`
                          }}>
                          
                              {team.shortName.charAt(0)}
                            </div>
                            <span className="text-white">{team.name}</span>
                          </div> :

                      <span className="text-gs-text-secondary">-</span>
                      }
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button
                        size="small"
                        variant="secondary"
                        onClick={() => navigate(`/players/${player.id}`)}
                        className="bg-gs-primary text-white border-gs-border hover:bg-gs-border">
                        
                          Detalji
                        </Button>
                      </td>
                    </tr>);

              }) :

              <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <Users
                    size={48}
                    className="mx-auto text-gs-text-secondary opacity-50 mb-4" />
                  
                    <p className="text-gs-text-secondary">
                      Nema pronađenih igrača.
                    </p>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </Card>
    </div>);

}