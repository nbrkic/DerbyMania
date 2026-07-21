import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth-context';
import { UserAvatar } from '../components/SiteHeader';

export default function Dashboard() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  const displayName = profile?.full_name || user?.email || '';

  async function handleSignOut() {
    await signOut();
    navigate('/login');
  }

  return (
    <div className="min-h-screen bg-ink-950 text-paper-100 flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm text-center">
        <Link to="/profile" className="inline-block mb-6">
          <UserAvatar name={displayName} avatarUrl={profile?.avatar_url} className="w-20 h-20 text-2xl mx-auto" />
        </Link>

        <h1 className="font-display text-3xl mb-3">Dobrodošli</h1>
        <p className="text-paper-500 mb-10">{user?.email}</p>

        <div className="flex flex-col gap-3">
          <Link to="/profile" className="btn-line rounded-full px-6 py-3 text-sm font-semibold">
            Tvoj profil
          </Link>
          <button
            type="button"
            onClick={handleSignOut}
            className="btn-line rounded-full px-6 py-3 text-sm font-semibold"
          >
            Odjava
          </button>
        </div>
      </div>
    </div>
  );
}
