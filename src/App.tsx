import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './lib/auth-context';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ScrollToTop } from './components/ScrollToTop';
import { SkeletonCircle } from './components/Skeleton';
import LandingPage from './pages/Landing';

// Route-level code splitting: every page but the landing page (the SEO entry
// point, kept eager for the fastest first paint) loads on demand.
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Profile = lazy(() => import('./pages/Profile'));
const Teams = lazy(() => import('./pages/Teams'));
const CreateTeam = lazy(() => import('./pages/CreateTeam'));
const TeamDetail = lazy(() => import('./pages/TeamDetail'));
const Notifications = lazy(() => import('./pages/Notifications'));
const Players = lazy(() => import('./pages/Players'));
const PlayerDetail = lazy(() => import('./pages/PlayerDetail'));
const Tournaments = lazy(() => import('./pages/Tournaments'));
const CreateTournament = lazy(() => import('./pages/CreateTournament'));
const TournamentDetail = lazy(() => import('./pages/TournamentDetail'));
const Feedback = lazy(() => import('./pages/Feedback'));

function RouteFallback() {
  return (
    <div className="min-h-screen bg-ink-950 flex items-center justify-center">
      <SkeletonCircle className="w-10 h-10" />
    </div>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ScrollToTop />
        <Suspense fallback={<RouteFallback />}>
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
          <Route
            path="/timovi/:id/izmena"
            element={
              <ProtectedRoute>
                <CreateTeam />
              </ProtectedRoute>
            }
          />
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
          <Route
            path="/obavestenja"
            element={
              <ProtectedRoute>
                <Notifications />
              </ProtectedRoute>
            }
          />
        </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}
