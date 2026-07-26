import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './lib/auth-context';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ScrollToTop } from './components/ScrollToTop';
import LandingPage from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Teams from './pages/Teams';
import CreateTeam from './pages/CreateTeam';
import TeamDetail from './pages/TeamDetail';
import Notifications from './pages/Notifications';
import Players from './pages/Players';
import PlayerDetail from './pages/PlayerDetail';
import Tournaments from './pages/Tournaments';
import CreateTournament from './pages/CreateTournament';
import TournamentDetail from './pages/TournamentDetail';
import TournamentGroups from './pages/TournamentGroups';
import TournamentElimination from './pages/TournamentElimination';
import TournamentLeague from './pages/TournamentLeague';
import Feedback from './pages/Feedback';

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route path="/timovi" element={<Teams />} />
          <Route
            path="/timovi/novi"
            element={
              <ProtectedRoute>
                <CreateTeam />
              </ProtectedRoute>
            }
          />
          <Route path="/timovi/:id" element={<TeamDetail />} />
          <Route path="/igraci" element={<Players />} />
          <Route path="/feedback" element={<Feedback />} />
          <Route path="/:handle" element={<PlayerDetail />} />
          <Route path="/turniri" element={<Tournaments />} />
          <Route
            path="/turniri/novi"
            element={
              <ProtectedRoute>
                <CreateTournament />
              </ProtectedRoute>
            }
          />
          <Route path="/turniri/:id" element={<TournamentDetail />} />
          <Route
            path="/turniri/:id/izmena"
            element={
              <ProtectedRoute>
                <CreateTournament />
              </ProtectedRoute>
            }
          />
          <Route path="/turniri/:id/grupe" element={<TournamentGroups />} />
          <Route path="/turniri/:id/eliminacija" element={<TournamentElimination />} />
          <Route path="/turniri/:id/liga" element={<TournamentLeague />} />
          <Route
            path="/obavestenja"
            element={
              <ProtectedRoute>
                <Notifications />
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
