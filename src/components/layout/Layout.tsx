import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Trophy, Shield, Users, BarChart3, Settings, Menu, X, Zap, ArrowLeft } from 'lucide-react';

const NAV = [
  { to: '/app',             label: 'Dashboard',    icon: LayoutDashboard, end: true },
  { to: '/app/tournaments', label: 'Turniri',      icon: Trophy },
  { to: '/app/teams',       label: 'Ekipe',         icon: Shield },
  { to: '/app/players',     label: 'Igrači',        icon: Users },
  { to: '/app/statistics',  label: 'Statistike',    icon: BarChart3 },
  { to: '/app/settings',    label: 'Podešavanja',   icon: Settings },
];

export const Layout: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-navy-950 flex flex-col">
      {/* ── TOP NAVBAR ─────────────────────────────────────── */}
      <header className="glass-nav sticky top-0 z-50 flex-shrink-0">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">

          {/* Logo */}
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 flex-shrink-0 group"
          >
            <div className="w-6 h-6 rounded-md btn-primary flex items-center justify-center">
              <Zap size={12} fill="currentColor" className="text-white" />
            </div>
            <span className="font-display text-base font-bold text-white tracking-tight">
              Goal<span className="text-gradient">Storm</span>
            </span>
          </button>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1 flex-1 justify-center">
            {NAV.map(item => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150
                    ${isActive
                      ? 'bg-blue-600/15 text-white border border-blue-500/20'
                      : 'text-silver-400 hover:text-white hover:bg-white/5'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon size={15} className={isActive ? 'text-blue-400' : 'text-silver-500'} />
                      {item.label}
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => navigate('/')}
              className="hidden sm:flex items-center gap-1.5 btn-ghost px-3 py-1.5 rounded-lg text-xs font-medium"
            >
              <ArrowLeft size={13} />
              Početna
            </button>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden btn-ghost p-2 rounded-lg"
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-white/5 px-4 py-3 space-y-1">
            {NAV.map(item => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                    ${isActive
                      ? 'bg-blue-600/15 text-white border border-blue-500/20'
                      : 'text-silver-400 hover:text-white hover:bg-white/5'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon size={16} className={isActive ? 'text-blue-400' : 'text-silver-500'} />
                      {item.label}
                    </>
                  )}
                </NavLink>
              );
            })}
          </div>
        )}
      </header>

      {/* ── PAGE CONTENT ───────────────────────────────────── */}
      <main className="flex-1 w-full">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-8 md:py-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
