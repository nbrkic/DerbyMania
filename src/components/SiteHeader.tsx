import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth-context';
import { NAV_LINKS, isNavLinkActive } from '../lib/site-nav';

function BellIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M6 8a6 6 0 0 1 12 0c0 4 1.5 5.5 2 6H4c.5-.5 2-2 2-6Z" />
      <path d="M10 20a2 2 0 0 0 4 0" />
    </svg>
  );
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4.4 3.6-8 8-8s8 3.6 8 8" />
    </svg>
  );
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '?';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
}

export function UserAvatar({
  name,
  avatarUrl,
  position,
  className,
}: {
  name: string;
  avatarUrl?: string | null;
  position?: { x: number; y: number };
  className?: string;
}) {
  return (
    <div
      title={name}
      className={`shrink-0 rounded-full overflow-hidden bg-red-600 flex items-center justify-center font-bold text-paper-100 ${className}`}
    >
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={name}
          className="w-full h-full object-cover"
          style={{ objectPosition: `${position?.x ?? 50}% ${position?.y ?? 50}%` }}
        />
      ) : (
        getInitials(name)
      )}
    </div>
  );
}

function LogoutIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5" />
      <path d="M21 12H9" />
    </svg>
  );
}

export function SiteHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, profile, signOut, unreadNotificationCount } = useAuth();
  const location = useLocation();
  const displayName = profile?.full_name || (user?.user_metadata?.full_name as string | undefined) || user?.email || '';

  async function handleLogout() {
    await signOut();
    setMobileMenuOpen(false);
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-ink-950">
      <div className="max-w-6xl mx-auto">
        <div className="px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center text-2xl font-black tracking-tight">
            DERBY<span className="font-light text-paper-500">MANIA</span>
          </Link>

          <nav className="hidden lg-nav:flex items-center gap-8">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.label}
                to={l.href}
                className={`text-xs font-medium uppercase tracking-widest transition-colors ${
                  isNavLinkActive(l.href, location.pathname) ? 'text-red-400' : 'text-paper-500 hover:text-paper-100'
                }`}
              >
                {l.label}
              </Link>
            ))}
          </nav>

          {user ? (
            <div className="hidden lg-nav:flex items-center gap-3">
              <Link to="/obavestenja" title="Obaveštenja" className="relative text-paper-500 hover:text-paper-100 transition-colors">
                <BellIcon className="w-5 h-5" />
                {unreadNotificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-paper-100 text-[10px] font-bold flex items-center justify-center">
                    {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
                  </span>
                )}
              </Link>
              <Link to="/profile" title="Tvoj profil">
                <UserAvatar
                  name={displayName}
                  avatarUrl={profile?.avatar_url}
                  position={profile ? { x: profile.avatar_position_x, y: profile.avatar_position_y } : undefined}
                  className="w-9 h-9 text-xs hover:ring-2 hover:ring-red-400/60 transition-shadow"
                />
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="btn-line rounded-full px-5 py-2 text-sm inline-flex items-center gap-2"
              >
                <LogoutIcon className="w-4 h-4" /> Odjava
              </button>
            </div>
          ) : (
            <div className="hidden lg-nav:flex items-center gap-5">
              <Link to="/login" className="text-sm font-medium text-paper-500 hover:text-paper-100 transition-colors">
                Prijavi se
              </Link>
              <Link to="/register" className="btn-solid rounded-full px-5 py-2 text-sm inline-flex items-center gap-2">
                <UserIcon className="w-4 h-4" /> Registracija
              </Link>
            </div>
          )}

          <button
            type="button"
            onClick={() => setMobileMenuOpen((v) => !v)}
            aria-label="Meni"
            aria-expanded={mobileMenuOpen}
            className="lg-nav:hidden flex flex-col items-center justify-center gap-1.5 w-9 h-9 -mr-1"
          >
            <span className="w-5 h-0.5 bg-paper-100" />
            <span className="w-5 h-0.5 bg-paper-100" />
            <span className="w-5 h-0.5 bg-paper-100" />
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="lg-nav:hidden mt-2 mx-3 rounded-3xl border border-ink-700 bg-ink-900">
          <nav className="flex flex-col items-center p-3">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.label}
                to={l.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`px-3 py-3 text-sm font-medium uppercase tracking-widest transition-colors ${
                  isNavLinkActive(l.href, location.pathname) ? 'text-red-400' : 'text-paper-500 hover:text-paper-100'
                }`}
              >
                {l.label}
              </Link>
            ))}
            {user ? (
              <>
                <Link
                  to="/obavestenja"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between px-3 py-3 mt-1 text-sm font-medium uppercase tracking-widest text-paper-500 hover:text-paper-100 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <BellIcon className="w-4 h-4" /> Obaveštenja
                  </span>
                  {unreadNotificationCount > 0 && (
                    <span className="w-5 h-5 rounded-full bg-red-500 text-paper-100 text-[10px] font-bold flex items-center justify-center">
                      {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
                    </span>
                  )}
                </Link>
                <Link
                  to="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-3 mt-1 hover:bg-ink-800 transition-colors"
                >
                  <UserAvatar
                    name={displayName}
                    avatarUrl={profile?.avatar_url}
                    position={profile ? { x: profile.avatar_position_x, y: profile.avatar_position_y } : undefined}
                    className="w-10 h-10 text-sm"
                  />
                  <span className="text-sm font-medium text-paper-100 truncate">{displayName}</span>
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="btn-line rounded-full px-5 py-3 text-sm inline-flex items-center justify-center gap-2 mt-1"
                >
                  <LogoutIcon className="w-4 h-4" /> Odjava
                </button>
              </>
            ) : (
              <div className="flex flex-col items-center gap-2 mt-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-sm font-medium text-paper-500 hover:text-paper-100 transition-colors px-3 py-2"
                >
                  Prijavi se
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="btn-solid rounded-full px-5 py-3 text-sm inline-flex items-center justify-center gap-2 w-full"
                >
                  <UserIcon className="w-4 h-4" /> Registracija
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
