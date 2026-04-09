import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Shield, MapPin, Users } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export default function TeamList() {
  const { teams, players } = useStore();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = teams.filter(t =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.shortName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-display text-5xl font-bold tracking-tight text-ice-100">EKIPE</h1>
          <p className="text-silver-400 mt-1 text-sm">Upravljajte registrovanim ekipama.</p>
        </div>
        <Button onClick={() => navigate('/app/teams/new')} leftIcon={<Plus size={16} />}>
          Nova ekipa
        </Button>
      </div>

      <div className="p-4 rounded-xl bg-navy-800/60 border border-white/6">
        <Input
          placeholder="Pretraži po nazivu, gradu ili skraćenici..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          startAdornment={<Search size={16} />}
          className="max-w-md"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {filtered.length > 0 ? filtered.map(team => {
          const playerCount = players.filter(p => p.teamId === team.id).length;
          const color = team.primaryColor ?? '#1D6FE8';
          return (
            <div
              key={team.id}
              onClick={() => navigate(`/app/teams/${team.id}`)}
              className="group rounded-xl border border-white/6 bg-navy-800/60 hover:border-white/6-bright hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200 cursor-pointer overflow-hidden"
            >
              {/* Top color strip */}
              <div className="h-1.5 w-full" style={{ background: `linear-gradient(90deg, ${color}, ${team.secondaryColor ?? '#00C2FF'})` }} />

              <div className="p-5 flex flex-col items-center text-center">
                {/* Team badge */}
                <div
                  className="w-20 h-20 rounded-2xl flex items-center justify-center mb-4 relative overflow-hidden group-hover:scale-105 transition-transform duration-300 shadow-card border-2"
                  style={{ borderColor: color }}
                >
                  <div
                    className="absolute inset-0 opacity-15"
                    style={{ background: `linear-gradient(135deg, ${color} 50%, ${team.secondaryColor ?? '#0C1525'} 50%)` }}
                  />
                  <Shield size={32} className="text-ice-100 relative z-10" />
                </div>

                <h3 className="font-bold text-ice-100 text-base mb-1 group-hover:text-blue-400 transition-colors">
                  {team.name}
                </h3>
                <span className="px-2 py-0.5 bg-navy-900/80 rounded-md text-[10px] font-bold text-silver-600 border border-white/6 mb-4">
                  {team.shortName}
                </span>

                <div className="w-full border-t border-white/6 pt-4 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-silver-600 flex items-center gap-1.5"><MapPin size={12} /> Grad</span>
                    <span className="text-ice-100 font-medium">{team.city}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-silver-600 flex items-center gap-1.5"><Users size={12} /> Igrači</span>
                    <span className="text-ice-100 font-medium">{playerCount}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        }) : (
          <div className="col-span-full text-center py-16 rounded-xl border border-dashed border-white/6">
            <Shield size={40} className="mx-auto text-silver-600 mb-4" />
            <h3 className="font-bold text-ice-100 mb-2">Nema pronađenih ekipa</h3>
            <p className="text-silver-400 text-sm mb-5">Pokušajte sa drugačijim filterima ili registrujte novu ekipu.</p>
            <Button onClick={() => navigate('/app/teams/new')} leftIcon={<Plus size={15} />}>
              Registruj ekipu
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
