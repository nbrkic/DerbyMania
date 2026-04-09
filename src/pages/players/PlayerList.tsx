import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Users } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';

export default function PlayerList() {
  const { players, teams } = useStore();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [teamFilter, setTeamFilter] = useState('all');

  const filtered = players.filter(p => {
    const fullName = `${p.firstName} ${p.lastName}`.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase()) && (teamFilter === 'all' || p.teamId === teamFilter);
  });

  const teamOptions = [
    { value: 'all', label: 'Sve ekipe' },
    ...teams.map(t => ({ value: t.id, label: t.name })),
  ];

  const positionColors: Record<string, string> = {
    GK: 'text-amber-400 bg-amber-500/10 border-white/6/20',
    CB: 'text-blue-400 bg-blue-600/10 border-white/6/20',
    LB: 'text-blue-400 bg-blue-600/10 border-white/6/20',
    RB: 'text-blue-400 bg-blue-600/10 border-white/6/20',
    LWB: 'text-cyan-400 bg-navy-800/50/10 border-white/6/20',
    RWB: 'text-cyan-400 bg-navy-800/50/10 border-white/6/20',
    CDM: 'text-emerald-400 bg-emerald-500/10 border-white/6/20',
    CM: 'text-emerald-400 bg-emerald-500/10 border-white/6/20',
    CAM: 'text-emerald-400 bg-emerald-500/10 border-white/6/20',
    LM: 'text-emerald-400 bg-emerald-500/10 border-white/6/20',
    RM: 'text-emerald-400 bg-emerald-500/10 border-white/6/20',
    LW: 'text-red-400 bg-navy-800/50/10 border-white/6/20',
    RW: 'text-red-400 bg-navy-800/50/10 border-white/6/20',
    CF: 'text-red-400 bg-navy-800/50/10 border-white/6/20',
    ST: 'text-red-400 bg-navy-800/50/10 border-white/6/20',
  };

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-display text-5xl font-bold tracking-tight text-ice-100">IGRAČI</h1>
          <p className="text-silver-400 mt-1 text-sm">Baza svih registrovanih igrača.</p>
        </div>
        <Button onClick={() => navigate('/app/players/new')} leftIcon={<Plus size={16} />}>
          Novi igrač
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 p-4 rounded-xl bg-navy-800/60 border border-white/6">
        <div className="flex-1">
          <Input
            placeholder="Pretraži po imenu i prezimenu..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            startAdornment={<Search size={16} />}
          />
        </div>
        <div className="w-full sm:w-56">
          <Select value={teamFilter} onChange={val => setTeamFilter(val as string)} options={teamOptions} />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-white/6 bg-navy-800/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-[10px] text-silver-600 uppercase tracking-wider bg-navy-900/80 border-b border-white/6">
              <tr>
                <th className="px-5 py-4">Igrač</th>
                <th className="px-4 py-4">Broj</th>
                <th className="px-4 py-4">Pozicija</th>
                <th className="px-4 py-4">Ekipa</th>
                <th className="px-4 py-4 text-right">Akcije</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length > 0 ? filtered.map((player, i) => {
                const team = teams.find(t => t.id === player.teamId);
                const posClass = positionColors[player.position] ?? 'text-silver-400 bg-navy-900/80 border-white/6';
                return (
                  <tr key={player.id} className={`border-t border-white/6 hover:bg-navy-700/50 transition-colors ${i % 2 === 0 ? '' : 'bg-navy-900/80/30'}`}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-navy-900/80 border border-white/6 flex items-center justify-center font-bold text-sm text-blue-400 flex-shrink-0">
                          {player.firstName.charAt(0)}{player.lastName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-ice-100 flex items-center gap-2">
                            {player.firstName} {player.lastName}
                            {player.isCaptain && <span className="text-[10px] bg-navy-800/50 text-silver-400 px-1.5 py-0.5 rounded font-bold">C</span>}
                          </p>
                          <p className="text-[11px] text-silver-600">
                            {new Date().getFullYear() - new Date(player.dateOfBirth).getFullYear()} god.
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="stat-number text-lg text-ice-100 font-bold">#{player.jerseyNumber}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`text-[11px] font-bold px-2 py-1 rounded-md border ${posClass}`}>
                        {player.position}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      {team ? (
                        <div className="flex items-center gap-2">
                          <div
                            className="w-5 h-5 rounded-md bg-navy-900/80 border border-white/6 flex items-center justify-center text-[9px] font-bold text-silver-400"
                            style={{ borderBottomColor: team.primaryColor ?? '#1D6FE8', borderBottomWidth: 2 }}
                          >
                            {team.shortName.charAt(0)}
                          </div>
                          <span className="text-ice-100 text-sm">{team.name}</span>
                        </div>
                      ) : <span className="text-silver-600">—</span>}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <Button size="small" variant="secondary" onClick={() => navigate(`/app/players/${player.id}`)}>
                        Detalji
                      </Button>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={5} className="px-5 py-16 text-center">
                    <Users size={36} className="mx-auto text-silver-600 mb-3" />
                    <p className="text-silver-400 text-sm">Nema pronađenih igrača.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
