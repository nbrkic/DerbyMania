import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Trophy, Calendar, MapPin, Users, Settings, Play, ChevronLeft, Timer, Target } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';

const statusMap: Record<string, { label: string; variant: 'success' | 'warning' | 'secondary' | 'primary' }> = {
  active:    { label: 'Aktivan',      variant: 'success' },
  upcoming:  { label: 'Predstojeći', variant: 'warning' },
  completed: { label: 'Završen',     variant: 'secondary' },
  draft:     { label: 'Draft',       variant: 'primary' },
};

const tabs = [
  { id: 'overview', label: 'Pregled' },
  { id: 'groups',   label: 'Grupna faza' },
  { id: 'bracket',  label: 'Eliminacije' },
  { id: 'stats',    label: 'Statistike' },
];

export default function TournamentDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { tournaments, teams, groups, getGroupStandings, updateTournament } = useStore();
  const [activeTab, setActiveTab] = useState('overview');

  const tournament = tournaments.find(t => t.id === id);
  if (!tournament) {
    return (
      <div className="text-center py-20">
        <Trophy size={48} className="mx-auto text-silver-600 mb-4" />
        <h2 className="text-xl font-bold text-ice-100 mb-4">Turnir nije pronađen</h2>
        <Button onClick={() => navigate('/app/tournaments')}>Nazad na listu</Button>
      </div>
    );
  }

  const tournamentTeams = teams.filter(t => tournament.teamIds.includes(t.id));
  const tournamentGroups = groups.filter(g => g.tournamentId === tournament.id);
  const status = statusMap[tournament.status] ?? statusMap.draft;

  const formatLabels: Record<string, string> = {
    group_knockout: 'Grupe + Eliminacija',
    league:         'Liga',
    knockout:       'Kup',
    group_playoff:  'Grupe + Playoff',
  };

  return (
    <div className="space-y-6 animate-fade-up">
      <button
        onClick={() => navigate('/app/tournaments')}
        className="flex items-center gap-1 text-sm text-silver-400 hover:text-ice-100 transition-colors"
      >
        <ChevronLeft size={16} /> Nazad na turnire
      </button>

      {/* Hero header */}
      <div className="relative overflow-hidden rounded-2xl border border-white/6 bg-navy-800/60">
        <div className="absolute inset-0 bg-radial-blue pointer-events-none" />
        <div className="absolute top-0 right-0 opacity-[0.04] translate-x-8 -translate-y-8">
          <Trophy size={220} />
        </div>
        <div className="relative z-10 p-6 md:p-8 flex flex-col md:flex-row gap-6 items-start md:items-center">
          <div className="w-20 h-20 rounded-2xl bg-navy-900/80 border border-white/6 flex items-center justify-center flex-shrink-0 shadow-card">
            <Trophy size={38} className="text-amber-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h1 className="font-display text-4xl font-black tracking-wide text-ice-100">{tournament.name}</h1>
              <Badge variant={status.variant}>{status.label}</Badge>
            </div>
            <p className="text-silver-400 text-sm mb-4 max-w-2xl">{tournament.description}</p>
            <div className="flex flex-wrap gap-4 text-xs text-silver-400">
              <div className="flex items-center gap-1.5">
                <Calendar size={14} className="text-blue-500" />
                {new Date(tournament.startDate).toLocaleDateString('sr-RS')} – {new Date(tournament.endDate).toLocaleDateString('sr-RS')}
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin size={14} className="text-blue-500" />
                {tournament.city ?? 'Nije definisano'}
              </div>
              <div className="flex items-center gap-1.5">
                <Users size={14} className="text-blue-500" />
                {tournament.teamIds.length} / {tournament.teamCount} ekipa
              </div>
            </div>
          </div>
          {tournament.status === 'upcoming' && (
            <Button
              onClick={() => updateTournament(tournament.id, { status: 'active' })}
              leftIcon={<Play size={16} />}
              className="flex-shrink-0"
            >
              Startuj turnir
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto border-b border-white/6 gap-1">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-3 text-sm font-medium whitespace-nowrap transition-all border-b-2 -mb-px ${
              activeTab === tab.id
                ? 'border-white/6 text-blue-400'
                : 'border-transparent text-silver-400 hover:text-ice-100 hover:border-white/6'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-up">
          <div className="lg:col-span-2">
            <div className="rounded-xl border border-white/6 bg-navy-800/60 p-6">
              <h3 className="font-bold text-ice-100 mb-4 flex items-center gap-2">
                <Users size={18} className="text-blue-500" />
                Prijavljene ekipe ({tournamentTeams.length})
              </h3>
              {tournamentTeams.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {tournamentTeams.map(team => (
                    <div
                      key={team.id}
                      onClick={() => navigate(`/app/teams/${team.id}`)}
                      className="flex items-center gap-3 p-3 rounded-lg bg-navy-900/80 border border-white/6 hover:border-white/6-bright transition-all cursor-pointer group"
                    >
                      <div
                        className="w-9 h-9 rounded-lg bg-navy-800/60 border border-white/6 flex items-center justify-center text-xs font-bold text-ice-100 flex-shrink-0"
                        style={{ borderBottomColor: team.primaryColor ?? '#1D6FE8', borderBottomWidth: 2 }}
                      >
                        {team.shortName.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-ice-100 group-hover:text-blue-400 transition-colors truncate">{team.name}</p>
                        <p className="text-xs text-silver-600">{team.city}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-silver-400 text-sm">Nema prijavljenih ekipa.</p>
              )}
            </div>
          </div>

          <div>
            <div className="rounded-xl border border-white/6 bg-navy-800/60 p-6">
              <h3 className="font-bold text-ice-100 mb-4 flex items-center gap-2">
                <Settings size={18} className="text-blue-500" />
                Pravila i format
              </h3>
              <div className="space-y-0">
                {[
                  { label: 'Format',          value: formatLabels[tournament.format] ?? tournament.format },
                  { label: 'Trajanje meča',   value: `${tournament.settings.matchDuration} min` },
                  { label: 'Bodovanje (P/N/I)', value: `${tournament.settings.pointsWin} / ${tournament.settings.pointsDraw} / ${tournament.settings.pointsLoss}` },
                  { label: 'Produžeci',        value: tournament.settings.extraTime ? 'Da' : 'Ne' },
                  { label: 'Penali',           value: tournament.settings.penalties ? 'Da' : 'Ne' },
                ].map((row, i, arr) => (
                  <div key={row.label} className={`flex justify-between items-center py-3 text-sm ${i < arr.length - 1 ? 'border-b border-white/6' : ''}`}>
                    <span className="text-silver-400">{row.label}</span>
                    <span className="font-semibold text-ice-100">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Groups */}
      {activeTab === 'groups' && (
        <div className="space-y-6 animate-fade-up">
          {tournamentGroups.length > 0 ? tournamentGroups.map(group => {
            const standings = getGroupStandings(group.id);
            return (
              <div key={group.id} className="rounded-xl border border-white/6 bg-navy-800/60 overflow-hidden">
                <div className="px-5 py-4 border-b border-white/6 bg-navy-700/50 flex justify-between items-center">
                  <h3 className="font-bold text-ice-100 flex items-center gap-2">
                    <Target size={16} className="text-blue-500" />
                    {group.name}
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-[10px] text-silver-600 uppercase bg-navy-900/80">
                      <tr>
                        <th className="px-4 py-3 w-10 text-center">#</th>
                        <th className="px-4 py-3">Ekipa</th>
                        {['O','P','N','I','GR','B'].map(h => (
                          <th key={h} className={`px-3 py-3 text-center ${h === 'B' ? 'text-blue-400' : ''}`}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {standings.map((s, idx) => {
                        const team = teams.find(t => t.id === s.teamId);
                        if (!team) return null;
                        const isAdvancing = idx < (tournament.advancingPerGroup ?? 2);
                        return (
                          <tr key={team.id} className={`border-t border-white/6 hover:bg-navy-700/50 transition-colors ${isAdvancing ? 'bg-emerald-500/5' : ''}`}>
                            <td className="px-4 py-3 text-center">
                              <span className={`w-6 h-6 rounded-md inline-flex items-center justify-center text-xs font-bold ${isAdvancing ? 'bg-emerald-500/15 text-emerald-400' : 'text-silver-600'}`}>
                                {idx + 1}
                              </span>
                            </td>
                            <td className="px-4 py-3 font-semibold text-ice-100">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-md bg-navy-900/80 border border-white/6 flex items-center justify-center text-[9px] font-bold text-silver-400"
                                  style={{ borderBottomColor: team.primaryColor ?? '#1D6FE8', borderBottomWidth: 2 }}>
                                  {team.shortName.charAt(0)}
                                </div>
                                {team.name}
                              </div>
                            </td>
                            <td className="px-3 py-3 text-center text-silver-400">{s.played}</td>
                            <td className="px-3 py-3 text-center text-silver-400">{s.won}</td>
                            <td className="px-3 py-3 text-center text-silver-400">{s.drawn}</td>
                            <td className="px-3 py-3 text-center text-silver-400">{s.lost}</td>
                            <td className="px-3 py-3 text-center text-silver-400">{s.goalsFor}:{s.goalsAgainst}</td>
                            <td className="px-3 py-3 text-center font-bold text-blue-400 stat-number text-lg">{s.points}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          }) : (
            <div className="text-center py-16 rounded-xl border border-dashed border-white/6">
              <Target size={36} className="mx-auto text-silver-600 mb-3" />
              <p className="text-silver-400 mb-4">Grupe još nisu žrebane.</p>
              <Button>Žrebaj grupe</Button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'bracket' && (
        <div className="text-center py-16 rounded-xl border border-dashed border-white/6 animate-fade-up">
          <Trophy size={40} className="mx-auto text-silver-600 mb-4" />
          <h3 className="font-bold text-ice-100 mb-2">Eliminaciona faza</h3>
          <p className="text-silver-400 text-sm">Bracket će biti dostupan kada se završi grupna faza.</p>
        </div>
      )}

      {activeTab === 'stats' && (
        <div className="text-center py-16 rounded-xl border border-dashed border-white/6 animate-fade-up">
          <Timer size={40} className="mx-auto text-silver-600 mb-4" />
          <p className="text-silver-400 text-sm">Statistike turnira će biti prikazane ovde.</p>
        </div>
      )}
    </div>
  );
}
