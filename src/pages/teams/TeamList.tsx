import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Shield, MapPin, Users } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
export default function TeamList() {
  const { teams, players } = useStore();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const filteredTeams = teams.filter(
    (t) =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.shortName.toLowerCase().includes(searchTerm.toLowerCase())
  );
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-white">Ekipe</h1>
          <p className="text-gs-text-secondary mt-1">
            Upravljajte registrovanim ekipama.
          </p>
        </div>
        <Button
          onClick={() => navigate('/teams/new')}
          className="bg-gs-accent hover:bg-gs-highlight text-white border-none"
          leftIcon={<Plus size={18} />}>
          
          Nova ekipa
        </Button>
      </div>

      <div className="bg-gs-secondary p-4 rounded-xl border border-gs-border">
        <Input
          placeholder="Pretraži po nazivu, gradu ili skraćenici..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          startAdornment={
          <Search size={18} className="text-gs-text-secondary" />
          }
          className="bg-gs-primary border-gs-border text-white max-w-md" />
        
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredTeams.length > 0 ?
        filteredTeams.map((team) => {
          const teamPlayersCount = players.filter(
            (p) => p.teamId === team.id
          ).length;
          return (
            <Card
              key={team.id}
              className="bg-gs-secondary border-gs-border hover:border-gs-highlight transition-all duration-300 cursor-pointer group"
              onClick={() => navigate(`/teams/${team.id}`)}>
              
                <CardContent className="p-6">
                  <div className="flex flex-col items-center text-center">
                    <div
                    className="w-24 h-24 rounded-full bg-gs-primary border-4 flex items-center justify-center shadow-lg mb-4 group-hover:scale-105 transition-transform duration-300 relative overflow-hidden"
                    style={{
                      borderColor: team.primaryColor || '#1E5FA8'
                    }}>
                    
                      {/* Diagonal split background for colors */}
                      <div
                      className="absolute inset-0 opacity-20"
                      style={{
                        background: `linear-gradient(135deg, ${team.primaryColor || '#1E5FA8'} 50%, ${team.secondaryColor || '#102444'} 50%)`
                      }}>
                    </div>
                      <Shield size={40} className="text-white relative z-10" />
                    </div>

                    <h3 className="text-xl font-bold text-white mb-1 group-hover:text-gs-highlight transition-colors">
                      {team.name}
                    </h3>
                    <span className="px-2 py-1 bg-gs-primary rounded text-xs font-bold text-gs-text-secondary border border-gs-border mb-4">
                      {team.shortName}
                    </span>

                    <div className="w-full space-y-2 mt-2 pt-4 border-t border-gs-border">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gs-text-secondary flex items-center gap-1.5">
                          <MapPin size={14} /> Grad
                        </span>
                        <span className="text-white font-medium">
                          {team.city}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gs-text-secondary flex items-center gap-1.5">
                          <Users size={14} /> Igrači
                        </span>
                        <span className="text-white font-medium">
                          {teamPlayersCount}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>);

        }) :

        <div className="col-span-full text-center p-12 bg-gs-secondary rounded-xl border border-gs-border border-dashed">
            <Shield
            size={48}
            className="mx-auto text-gs-text-secondary opacity-50 mb-4" />
          
            <h3 className="text-xl font-bold text-white mb-2">
              Nema pronađenih ekipa
            </h3>
            <p className="text-gs-text-secondary mb-6">
              Pokušajte sa drugačijim filterima ili registrujte novu ekipu.
            </p>
            <Button
            onClick={() => navigate('/teams/new')}
            className="bg-gs-accent hover:bg-gs-highlight text-white border-none">
            
              Registruj ekipu
            </Button>
          </div>
        }
      </div>
    </div>);

}