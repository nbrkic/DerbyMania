import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Calendar, Users, Trophy, MapPin } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';

const statusMap: Record<string, { label: string; variant: 'success' | 'warning' | 'secondary' | 'primary' }> = {
  active:    { label: 'Aktivan',      variant: 'success' },
  upcoming:  { label: 'Predstojeći', variant: 'warning' },
  completed: { label: 'Završen',     variant: 'secondary' },
  draft:     { label: 'Draft',       variant: 'primary' },
};

const filterLabels: Record<string, string> = {
  all: 'Svi', active: 'Aktivni', upcoming: 'Predstojeći', completed: 'Završeni', draft: 'Draft',
};

export default function TournamentList() {
  const { tournaments } = useStore();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = tournaments.filter(t => {
    const matchSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.city ?? '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-display text-5xl font-bold tracking-tight text-ice-100">TURNIRI</h1>
          <p className="text-silver-400 mt-1 text-sm">Upravljajte svim turnirima na jednom mestu.</p>
        </div>
        <Button onClick={() => navigate('/app/tournaments/new')} leftIcon={<Plus size={16} />}>
          Novi turnir
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 p-4 rounded-xl bg-navy-800/60 border border-white/6">
        <div className="flex-1">
          <Input
            placeholder="Pretraži turnire..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            startAdornment={<Search size={16} />}
          />
        </div>
        <div className="flex gap-1.5 overflow-x-auto">
          {Object.keys(filterLabels).map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                statusFilter === status
                  ? 'bg-navy-800/50 text-white shadow-glow-blue'
                  : 'bg-navy-900/80 text-silver-400 hover:text-ice-100 border border-white/6 hover:border-white/6-bright'
              }`}
            >
              {filterLabels[status]}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filtered.length > 0 ? filtered.map(t => {
          const status = statusMap[t.status] ?? statusMap.draft;
          return (
            <div
              key={t.id}
              onClick={() => navigate(`/app/tournaments/${t.id}`)}
              className="group rounded-xl border border-white/6 bg-navy-800/60 hover:border-white/6-bright hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200 cursor-pointer overflow-hidden"
            >
              {/* Card top banner */}
              <div className="h-20 relative overflow-hidden bg-gradient-to-br from-navy-700/60 to-navy-900/80">
                <div className="absolute inset-0 bg-radial-blue opacity-60" />
                <div className="absolute right-3 top-3">
                  <Badge variant={status.variant}>{status.label}</Badge>
                </div>
                <div className="absolute -right-4 -bottom-6 opacity-10 group-hover:opacity-20 transition-opacity group-hover:scale-110 duration-500">
                  <Trophy size={100} />
                </div>
              </div>

              <div className="p-5 relative">
                {/* Logo badge */}
                <div className="absolute -top-6 left-5 w-12 h-12 rounded-xl bg-navy-900/80 border border-white/6 flex items-center justify-center shadow-card">
                  <Trophy size={22} className="text-amber-400" />
                </div>

                <div className="mt-7">
                  <h3 className="font-bold text-ice-100 text-lg group-hover:text-blue-400 transition-colors mb-0.5 truncate">
                    {t.name}
                  </h3>
                  <p className="text-xs text-silver-600 mb-4 line-clamp-1">{t.description ?? 'Nema opisa'}</p>

                  <div className="space-y-2 text-xs text-silver-400">
                    <div className="flex items-center gap-2">
                      <Calendar size={13} className="text-blue-500 flex-shrink-0" />
                      <span>{new Date(t.startDate).toLocaleDateString('sr-RS')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users size={13} className="text-blue-500 flex-shrink-0" />
                      <span>{t.teamIds.length} / {t.teamCount} ekipa</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin size={13} className="text-blue-500 flex-shrink-0" />
                      <span>{t.city ?? 'Nije definisano'}</span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-4 w-full bg-navy-800/50 rounded-full h-1">
                    <div
                      className="bg-accent-gradient h-1 rounded-full transition-all"
                      style={{ width: `${(t.teamIds.length / t.teamCount) * 100}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-right text-silver-600 mt-1">
                    {t.teamIds.length}/{t.teamCount} ekipa prijavljeno
                  </p>
                </div>
              </div>
            </div>
          );
        }) : (
          <div className="col-span-full text-center py-16 rounded-xl border border-dashed border-white/6">
            <Trophy size={40} className="mx-auto text-silver-600 mb-4" />
            <h3 className="font-bold text-ice-100 mb-2">Nema pronađenih turnira</h3>
            <p className="text-silver-400 text-sm mb-5">Pokušajte sa drugačijim filterima ili kreirajte novi.</p>
            <Button onClick={() => navigate('/app/tournaments/new')} leftIcon={<Plus size={15} />}>
              Kreiraj turnir
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
