import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth-context';
import { NAV_LINKS, isNavLinkActive } from '../lib/site-nav';

const MENU_TRANSITION_MS = 400;

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

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M18 6 6 18" />
      <path d="M6 6l12 12" />
    </svg>
  );
}

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [entered, setEntered] = useState(false);
  const closeTimeoutRef = useRef<number>();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const { user, profile, signOut, unreadNotificationCount } = useAuth();
  const location = useLocation();
  const displayName = profile?.full_name || (user?.user_metadata?.full_name as string | undefined) || user?.email || '';

  function openMenu() {
    if (closeTimeoutRef.current) window.clearTimeout(closeTimeoutRef.current);
    setMounted(true);
    setOpen(true);
  }

  function closeMenu() {
    setOpen(false);
    setEntered(false);
    closeTimeoutRef.current = window.setTimeout(() => setMounted(false), MENU_TRANSITION_MS);
  }

  useEffect(() => () => {
    if (closeTimeoutRef.current) window.clearTimeout(closeTimeoutRef.current);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const raf = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(raf);
  }, [mounted]);

  useEffect(() => {
    if (!open) {
      triggerRef.current?.focus();
      return;
    }
    const scrollY = window.scrollY;
    const { body } = document;
    const html = document.documentElement;
    body.style.position = 'fixed';
    body.style.top = `-${scrollY}px`;
    body.style.left = '0';
    body.style.right = '0';
    body.style.overflow = 'hidden';
    html.style.overflow = 'hidden';
    closeRef.current?.focus();
    return () => {
      body.style.position = '';
      body.style.top = '';
      body.style.left = '';
      body.style.right = '';
      body.style.overflow = '';
      html.style.overflow = '';
      window.scrollTo(0, scrollY);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeMenu();
        return;
      }
      if (e.key !== 'Tab' || !panelRef.current) return;
      const focusable = panelRef.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled])');
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open]);

  async function handleLogout() {
    await signOut();
    closeMenu();
  }

  return (
    <>
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
            ref={triggerRef}
            type="button"
            onClick={openMenu}
            aria-label="Otvori meni"
            aria-expanded={open}
            aria-hidden={open}
            tabIndex={open ? -1 : 0}
            className="lg-nav:hidden flex flex-col items-center justify-center gap-1.5 w-9 h-9 -mr-1"
          >
            <span className="w-5 h-0.5 bg-paper-100" />
            <span className="w-5 h-0.5 bg-paper-100" />
            <span className="w-5 h-0.5 bg-paper-100" />
          </button>
        </div>
      </div>
    </header>

    {mounted && (
      <>
        <div
          onClick={closeMenu}
          aria-hidden="true"
          className={`lg-nav:hidden fixed inset-0 z-50 bg-ink-950/70 backdrop-blur-sm transition-opacity duration-300 ${
            entered ? 'opacity-100' : 'opacity-0'
          }`}
        />
        <nav
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label="Mobilna navigacija"
          className={`lg-nav:hidden fixed right-0 top-0 z-50 flex h-full w-[86%] max-w-sm flex-col bg-ink-950 border-l border-ink-700 p-6 shadow-2xl transition-transform duration-[400ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${
            entered ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-lg font-black tracking-tight">
              DERBY<span className="font-light text-paper-500">MANIA</span>
            </span>
            <button
              ref={closeRef}
              type="button"
              onClick={closeMenu}
              aria-label="Zatvori meni"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-ink-900 text-paper-100 hover:text-red-400 transition-colors"
            >
              <CloseIcon className="w-5 h-5" />
            </button>
          </div>

          <ul className="mt-8 space-y-1">
            {NAV_LINKS.map((l, i) => (
              <li key={l.label} className="fade-up-in" style={{ animationDelay: `${0.08 + i * 0.05}s` }}>
                <Link
                  to={l.href}
                  onClick={closeMenu}
                  className={`block rounded-2xl px-4 py-3 font-display text-base transition-colors ${
                    isNavLinkActive(l.href, location.pathname)
                      ? 'bg-red-500/10 text-red-400'
                      : 'text-paper-100 hover:bg-ink-800 hover:text-red-400'
                  }`}
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>

          {user ? (
            <div className="mt-2 space-y-1">
              <Link
                to="/obavestenja"
                onClick={closeMenu}
                className="flex items-center justify-between rounded-2xl px-4 py-3 font-display text-base text-paper-100 hover:bg-ink-800 hover:text-red-400 transition-colors"
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
                onClick={closeMenu}
                className="flex items-center gap-3 rounded-2xl px-4 py-3 hover:bg-ink-800 transition-colors"
              >
                <UserAvatar
                  name={displayName}
                  avatarUrl={profile?.avatar_url}
                  position={profile ? { x: profile.avatar_position_x, y: profile.avatar_position_y } : undefined}
                  className="w-10 h-10 text-sm"
                />
                <span className="text-base font-semibold text-paper-100 truncate">{displayName}</span>
              </Link>
            </div>
          ) : (
            <div className="mt-2">
              <Link
                to="/login"
                onClick={closeMenu}
                className="block rounded-2xl px-4 py-3 text-sm font-medium text-paper-500 hover:bg-ink-800 hover:text-paper-100 transition-colors"
              >
                Prijavi se
              </Link>
            </div>
          )}

          {user ? (
            <button
              type="button"
              onClick={handleLogout}
              className="btn-line mt-auto rounded-2xl px-6 py-4 text-sm font-semibold inline-flex items-center justify-center gap-2"
            >
              <LogoutIcon className="w-4 h-4" /> Odjava
            </button>
          ) : (
            <Link
              to="/register"
              onClick={closeMenu}
              className="btn-solid mt-auto rounded-2xl px-6 py-4 text-sm font-semibold inline-flex items-center justify-center gap-2"
            >
              <UserIcon className="w-4 h-4" /> Registracija
            </Link>
          )}
        </nav>
      </>
    )}
    </>
  );
}
