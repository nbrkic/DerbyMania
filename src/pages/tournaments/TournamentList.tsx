import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, Calendar, Users, Trophy } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
export default function TournamentList() {
  const { tournaments } = useStore();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const filteredTournaments = tournaments.filter((t) => {
    const matchesSearch =
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.city && t.city.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-white">
            Turniri
          </h1>
          <p className="text-gs-text-secondary mt-1">
            Upravljajte svim turnirima na jednom mestu.
          </p>
        </div>
        <Button
          onClick={() => navigate('/tournaments/new')}
          className="bg-gs-accent hover:bg-gs-highlight text-white border-none"
          leftIcon={<Plus size={18} />}>
          
          Novi turnir
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 bg-gs-secondary p-4 rounded-xl border border-gs-border">
        <div className="flex-1">
          <Input
            placeholder="Pretraži turnire..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            startAdornment={
            <Search size={18} className="text-gs-text-secondary" />
            }
            className="bg-gs-primary border-gs-border text-white" />
          
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
          {['all', 'active', 'upcoming', 'completed', 'draft'].map((status) =>
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${statusFilter === status ? 'bg-gs-accent text-white' : 'bg-gs-primary text-gs-text-secondary hover:bg-gs-border'}`}>
            
              {status === 'all' ?
            'Svi' :
            status === 'active' ?
            'Aktivni' :
            status === 'upcoming' ?
            'Predstojeći' :
            status === 'completed' ?
            'Završeni' :
            'Draft'}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredTournaments.length > 0 ?
        filteredTournaments.map((tournament) =>
        <Card
          key={tournament.id}
          className="bg-gs-secondary border-gs-border hover:border-gs-highlight transition-all duration-300 cursor-pointer group"
          onClick={() => navigate(`/tournaments/${tournament.id}`)}>
          
              <CardContent className="p-0">
                <div className="h-24 bg-gradient-to-r from-gs-primary to-gs-secondary relative overflow-hidden rounded-t-xl border-b border-gs-border">
                  <div className="absolute right-0 top-0 opacity-10 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform duration-500">
                    <Trophy size={120} />
                  </div>
                  <div className="absolute top-4 right-4">
                    {getStatusBadge(tournament.status)}
                  </div>
                </div>

                <div className="p-5 relative">
                  <div className="w-16 h-16 rounded-xl bg-gs-primary border-2 border-gs-secondary absolute -top-10 flex items-center justify-center shadow-lg">
                    <Trophy className="text-gs-gold" size={32} />
                  </div>

                  <div className="mt-6">
                    <h3 className="text-xl font-bold text-white mb-1 group-hover:text-gs-highlight transition-colors">
                      {tournament.name}
                    </h3>
                    <p className="text-sm text-gs-text-secondary mb-4 line-clamp-1">
                      {tournament.description || 'Nema opisa'}
                    </p>

                    <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-sm">
                      <div className="flex items-center gap-2 text-gs-text-secondary">
                        <Calendar size={16} className="text-gs-accent" />
                        <span>
                          {new Date(tournament.startDate).toLocaleDateString(
                        'sr-RS'
                      )}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-gs-text-secondary">
                        <Users size={16} className="text-gs-accent" />
                        <span>
                          {tournament.teamIds.length} / {tournament.teamCount}{' '}
                          ekipa
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-gs-text-secondary col-span-2">
                        <div className="w-4 h-4 rounded bg-gs-primary border border-gs-border flex items-center justify-center text-[10px]">
                          📍
                        </div>
                        <span>{tournament.city || 'Nije definisano'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
        ) :

        <div className="col-span-full text-center p-12 bg-gs-secondary rounded-xl border border-gs-border border-dashed">
            <Trophy
            size={48}
            className="mx-auto text-gs-text-secondary opacity-50 mb-4" />
          
            <h3 className="text-xl font-bold text-white mb-2">
              Nema pronađenih turnira
            </h3>
            <p className="text-gs-text-secondary mb-6">
              Pokušajte sa drugačijim filterima ili kreirajte novi turnir.
            </p>
            <Button
            onClick={() => navigate('/tournaments/new')}
            className="bg-gs-accent hover:bg-gs-highlight text-white border-none">
            
              Kreiraj prvi turnir
            </Button>
          </div>
        }
      </div>
    </div>);

}