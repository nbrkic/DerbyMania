import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Trophy, Shield, Users, BarChart3, Settings, X, Zap } from 'lucide-react';

interface SidebarProps {
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

const navItems = [
  { name: 'Dashboard',    path: '/',            icon: LayoutDashboard },
  { name: 'Turniri',      path: '/tournaments', icon: Trophy },
  { name: 'Ekipe',        path: '/teams',        icon: Shield },
  { name: 'Igrači',       path: '/players',      icon: Users },
  { name: 'Statistike',   path: '/statistics',   icon: BarChart3 },
  { name: 'Podešavanja',  path: '/settings',     icon: Settings },
];

export const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen, setIsMobileOpen }) => {
  return (
    <>
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 flex flex-col
        bg-gs-surface border-r border-gs-border
        transform transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:inset-0
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-gs-border flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-accent-gradient flex items-center justify-center shadow-glow-blue">
              <Zap size={16} className="text-white" fill="currentColor" />
            </div>
            <span className="font-display text-2xl font-bold tracking-wider text-gs-text-1">
              GOAL<span className="gradient-text">STORM</span>
            </span>
          </div>
          <button
            className="lg:hidden text-gs-text-2 hover:text-gs-text-1 transition-colors"
            onClick={() => setIsMobileOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        {/* Glow line */}
        <div className="glow-line flex-shrink-0" />

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <p className="text-gs-text-3 text-[10px] font-semibold uppercase tracking-widest px-3 mb-3">
            Navigacija
          </p>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                onClick={() => setIsMobileOpen(false)}
                className={({ isActive }) => `
                  relative flex items-center gap-3 px-3 py-2.5 rounded-lg
                  transition-all duration-200 group
                  ${isActive
                    ? 'bg-gs-blue/10 text-gs-blue-light'
                    : 'text-gs-text-2 hover:bg-gs-panel hover:text-gs-text-1'
                  }
                `}
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 nav-active-indicator h-5" />
                    )}
                    <Icon size={18} className={isActive ? 'text-gs-blue-light' : 'text-gs-text-3 group-hover:text-gs-text-2'} />
                    <span className="font-medium text-sm">{item.name}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom user */}
        <div className="p-4 border-t border-gs-border flex-shrink-0">
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-gs-panel">
            <div className="w-8 h-8 rounded-lg bg-accent-gradient flex items-center justify-center text-xs font-bold text-white shadow-glow-blue">
              A
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gs-text-1 truncate">Admin</p>
              <p className="text-xs text-gs-text-3 truncate">admin@goalstorm.com</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
