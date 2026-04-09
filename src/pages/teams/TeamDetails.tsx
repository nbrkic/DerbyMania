import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Shield, MapPin, Calendar, Mail, Phone, Users, Trophy, ChevronLeft, Plus } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';

const tabs = [
  { id: 'profile', label: 'Profil' },
  { id: 'players', label: 'Igrači' },
  { id: 'matches', label: 'Istorija mečeva' },
  { id: 'stats',   label: 'Statistike' },
];

export default function TeamDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { teams, players, matches, tournaments } = useStore();
  const [activeTab, setActiveTab] = useState('profile');

  const team = teams.find(t => t.id === id);
  if (!team) {
    return (
      <div className="text-center py-20">
        <Shield size={48} className="mx-auto text-silver-600 mb-4" />
        <h2 className="text-xl font-bold text-ice-100 mb-4">Ekipa nije pronađena</h2>
        <Button onClick={() => navigate('/app/teams')}>Nazad na listu</Button>
      </div>
    );
  }

  const teamPlayers = players.filter(p => p.teamId === team.id);
  const teamMatches = matches.filter(m => m.homeTeamId === team.id || m.awayTeamId === team.id);
  const completedMatches = teamMatches.filter(m => m.status === 'completed');

  let wins = 0, draws = 0, losses = 0, goalsFor = 0, goalsAgainst = 0;
  completedMatches.forEach(m => {
    const isHome = m.homeTeamId === team.id;
    const ts = isHome ? m.homeScore : m.awayScore;
    const os = isHome ? m.awayScore : m.homeScore;
    if (ts !== null && os !== null) {
      goalsFor += ts; goalsAgainst += os;
      if (ts > os) wins++; else if (ts < os) losses++; else draws++;
    }
  });

  const color = team.primaryColor ?? '#1D6FE8';

  return (
    <div className="space-y-6 animate-fade-up">
      <button onClick={() => navigate('/app/teams')} className="flex items-center gap-1 text-sm text-silver-400 hover:text-ice-100 transition-colors">
        <ChevronLeft size={16} /> Nazad na ekipe
      </button>

      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl border border-white/6 bg-navy-800/60">
        <div className="h-1.5 w-full" style={{ background: `linear-gradient(90deg, ${color}, ${team.secondaryColor ?? '#00C2FF'})` }} />
        <div
          className="absolute top-0 right-0 w-56 h-56 opacity-10 translate-x-10 -translate-y-10 rounded-full blur-3xl pointer-events-none"
          style={{ backgroundColor: color }}
        />
        <div className="relative z-10 p-6 md:p-8 flex flex-col md:flex-row gap-6 items-start md:items-center">
          <div
            className="w-20 h-20 rounded-2xl border-2 flex items-center justify-center flex-shrink-0 relative overflow-hidden shadow-card"
            style={{ borderColor: color }}
          >
            <div className="absolute inset-0 opacity-20" style={{ background: `linear-gradient(135deg, ${color} 50%, ${team.secondaryColor ?? '#0C1525'} 50%)` }} />
            <Shield size={36} className="text-ice-100 relative z-10" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="font-display text-4xl font-black tracking-wide text-ice-100">{team.name}</h1>
              <span className="px-2 py-1 bg-navy-900/80 rounded-lg text-xs font-bold text-silver-400 border border-white/6">{team.shortName}</span>
            </div>
            <p className="text-silver-400 text-sm mb-4 max-w-2xl">{team.description ?? 'Nema opisa za ovu ekipu.'}</p>
            <div className="flex flex-wrap gap-4 text-xs text-silver-400">
              <span className="flex items-center gap-1.5"><MapPin size={13} className="text-blue-500" />{team.city}{team.country ? `, ${team.country}` : ''}</span>
              {team.foundedYear && <span className="flex items-center gap-1.5"><Calendar size={13} className="text-blue-500" />Osnovan {team.foundedYear}.</span>}
              <span className="flex items-center gap-1.5"><Users size={13} className="text-blue-500" />{teamPlayers.length} igrača</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto border-b border-white/6 gap-1">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-3 text-sm font-medium whitespace-nowrap transition-all border-b-2 -mb-px ${
              activeTab === tab.id ? 'border-white/6 text-blue-400' : 'border-transparent text-silver-400 hover:text-ice-100 hover:border-white/6'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Profile */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-up">
          {/* Contact */}
          <div className="rounded-xl border border-white/6 bg-navy-800/60 p-6">
            <h3 className="font-bold text-ice-100 mb-5 pb-4 border-b border-white/6">Kontakt informacije</h3>
            <div className="space-y-4">
              {[
                { icon: Users, label: 'Kontakt osoba', value: team.contactName },
                { icon: Phone, label: 'Telefon',        value: team.contactPhone },
                { icon: Mail,  label: 'Email',           value: team.contactEmail },
              ].map(row => (
                <div key={row.label} className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-navy-900/80 border border-white/6 flex items-center justify-center flex-shrink-0">
                    <row.icon size={15} className="text-blue-500" />
                  </div>
                  <div>
                    <p className="text-[10px] text-silver-600 uppercase tracking-wider">{row.label}</p>
                    <p className="text-sm font-medium text-ice-100">{row.value ?? 'Nije navedeno'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick stats */}
          <div className="rounded-xl border border-white/6 bg-navy-800/60 p-6">
            <h3 className="font-bold text-ice-100 mb-5 pb-4 border-b border-white/6">Brza statistika</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Odigrano', value: completedMatches.length, color: 'text-ice-100' },
                { label: 'Pobede',   value: wins,                    color: 'text-emerald-400' },
                { label: 'Dati golovi',     value: goalsFor,         color: 'text-blue-400' },
                { label: 'Primljeni golovi', value: goalsAgainst,    color: 'text-red-400' },
              ].map(s => (
                <div key={s.label} className="rounded-xl bg-navy-900/80 border border-white/6 p-4 text-center">
                  <p className={`stat-number text-3xl ${s.color} mb-1`}>{s.value}</p>
                  <p className="text-[11px] text-silver-600">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Players */}
      {activeTab === 'players' && (
        <div className="space-y-4 animate-fade-up">
          <div className="flex justify-end">
            <Button onClick={() => navigate('/app/players/new')} leftIcon={<Plus size={16} />}>Dodaj igrača</Button>
          </div>
          {teamPlayers.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {teamPlayers.map(player => (
                <div
                  key={player.id}
                  onClick={() => navigate(`/app/players/${player.id}`)}
                  className="flex items-center gap-3 p-4 rounded-xl border border-white/6 bg-navy-800/60 hover:border-white/6-bright transition-all cursor-pointer group"
                >
                  <div className="w-11 h-11 rounded-xl bg-navy-900/80 border border-white/6 flex items-center justify-center font-bold text-base text-blue-400 flex-shrink-0">
                    {player.jerseyNumber}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-ice-100 group-hover:text-blue-400 transition-colors flex items-center gap-2">
                      {player.firstName} {player.lastName}
                      {player.isCaptain && <span className="text-[10px] bg-navy-800/50 text-silver-400 px-1.5 py-0.5 rounded font-bold">C</span>}
                    </p>
                    <p className="text-xs text-silver-600">{player.position}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-14 rounded-xl border border-dashed border-white/6">
              <Users size={36} className="mx-auto text-silver-600 mb-3" />
              <p className="text-silver-400 text-sm">Ekipa trenutno nema registrovanih igrača.</p>
            </div>
          )}
        </div>
      )}

      {/* Match history */}
      {activeTab === 'matches' && (
        <div className="space-y-3 animate-fade-up">
          {teamMatches.length > 0 ? teamMatches.map(match => {
            const isHome = match.homeTeamId === team.id;
            const oppTeam = teams.find(t => t.id === (isHome ? match.awayTeamId : match.homeTeamId));
            const tournament = tournaments.find(t => t.id === match.tournamentId);
            if (!oppTeam) return null;
            const ts = isHome ? match.homeScore : match.awayScore;
            const os = isHome ? match.awayScore : match.homeScore;
            const resultColor = match.status === 'completed'
              ? ts! > os! ? 'text-emerald-400' : ts! < os! ? 'text-red-400' : 'text-amber-400'
              : 'text-silver-400';
            return (
              <div key={match.id} className="rounded-xl border border-white/6 bg-navy-800/60 px-5 py-4 flex flex-col sm:flex-row items-center gap-4">
                <div className="text-xs text-silver-400 sm:w-1/4">
                  <p className="font-semibold text-ice-100 truncate">{tournament?.name}</p>
                  <p className="text-silver-600">{match.date} · {match.time}</p>
                </div>
                <div className="flex items-center justify-center gap-4 sm:w-2/4">
                  <span className={`font-semibold text-sm ${isHome ? 'text-ice-100' : 'text-silver-600'}`}>{isHome ? team.name : oppTeam.name}</span>
                  <div className={`score-display text-xl px-4 py-1.5 rounded-lg bg-navy-900/80 border border-white/6 ${resultColor}`}>
                    {match.status === 'completed' ? `${match.homeScore} : ${match.awayScore}` : 'VS'}
                  </div>
                  <span className={`font-semibold text-sm ${!isHome ? 'text-ice-100' : 'text-silver-600'}`}>{!isHome ? team.name : oppTeam.name}</span>
                </div>
                <div className="sm:w-1/4 flex sm:justify-end">
                  <Badge variant={match.status === 'completed' ? 'secondary' : 'warning'}>
                    {match.status === 'completed' ? 'Završeno' : 'Zakazano'}
                  </Badge>
                </div>
              </div>
            );
          }) : (
            <div className="text-center py-14 rounded-xl border border-dashed border-white/6">
              <Trophy size={36} className="mx-auto text-silver-600 mb-3" />
              <p className="text-silver-400 text-sm">Ekipa još uvek nema odigranih mečeva.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'stats' && (
        <div className="text-center py-14 rounded-xl border border-dashed border-white/6 animate-fade-up">
          <p className="text-silver-400 text-sm">Detaljne statistike ekipe će biti prikazane ovde.</p>
        </div>
      )}
    </div>
  );
}
