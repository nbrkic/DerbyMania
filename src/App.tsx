import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { ToastProvider } from './components/ui/ToastProvider';

const LandingPage   = lazy(() => import('./pages/Landing'));
const Dashboard     = lazy(() => import('./pages/Dashboard'));
const TournamentList    = lazy(() => import('./pages/tournaments/TournamentList'));
const CreateTournament  = lazy(() => import('./pages/tournaments/CreateTournament'));
const TournamentDetails = lazy(() => import('./pages/tournaments/TournamentDetails'));
const TeamList    = lazy(() => import('./pages/teams/TeamList'));
const CreateTeam  = lazy(() => import('./pages/teams/CreateTeam'));
const TeamDetails = lazy(() => import('./pages/teams/TeamDetails'));
const PlayerList    = lazy(() => import('./pages/players/PlayerList'));
const CreatePlayer  = lazy(() => import('./pages/players/CreatePlayer'));
const PlayerDetails = lazy(() => import('./pages/players/PlayerDetails'));
const Statistics = lazy(() => import('./pages/Statistics'));
const Settings   = lazy(() => import('./pages/Settings'));

const PageLoader = () => (
  <div className="flex items-center justify-center h-screen bg-navy-950">
    <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
  </div>
);

export function App() {
  return (
    <BrowserRouter>
      <ToastProvider />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/app" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="tournaments">
              <Route index element={<TournamentList />} />
              <Route path="new" element={<CreateTournament />} />
              <Route path=":id" element={<TournamentDetails />} />
            </Route>
            <Route path="teams">
              <Route index element={<TeamList />} />
              <Route path="new" element={<CreateTeam />} />
              <Route path=":id" element={<TeamDetails />} />
            </Route>
            <Route path="players">
              <Route index element={<PlayerList />} />
              <Route path="new" element={<CreatePlayer />} />
              <Route path=":id" element={<PlayerDetails />} />
            </Route>
            <Route path="statistics" element={<Statistics />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
