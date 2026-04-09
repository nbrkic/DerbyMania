import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Trophy,
  Shield,
  Users,
  BarChart3,
  Settings,
  X } from
'lucide-react';
interface SidebarProps {
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}
export const Sidebar: React.FC<SidebarProps> = ({
  isMobileOpen,
  setIsMobileOpen
}) => {
  const navItems = [
  {
    name: 'Dashboard',
    path: '/',
    icon: LayoutDashboard
  },
  {
    name: 'Turniri',
    path: '/tournaments',
    icon: Trophy
  },
  {
    name: 'Ekipe',
    path: '/teams',
    icon: Shield
  },
  {
    name: 'Igrači',
    path: '/players',
    icon: Users
  },
  {
    name: 'Statistike',
    path: '/statistics',
    icon: BarChart3
  },
  {
    name: 'Podešavanja',
    path: '/settings',
    icon: Settings
  }];

  const sidebarClasses = `
    fixed inset-y-0 left-0 z-50 w-64 bg-gs-secondary border-r border-gs-border
    transform transition-transform duration-300 ease-in-out
    lg:translate-x-0 lg:static lg:inset-0
    ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
  `;
  return (
    <>
      {/* Mobile overlay */}
      {isMobileOpen &&
      <div
        className="fixed inset-0 bg-black/50 z-40 lg:hidden"
        onClick={() => setIsMobileOpen(false)} />

      }

      <aside className={sidebarClasses}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-gs-border bg-gs-primary/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gs-accent flex items-center justify-center text-white font-bold text-xl">
              ⚽
            </div>
            <span className="text-xl font-heading font-bold text-white tracking-wide">
              GOAL<span className="text-gs-highlight">STORM</span>
            </span>
          </div>
          <button
            className="lg:hidden text-gs-text-secondary hover:text-white"
            onClick={() => setIsMobileOpen(false)}>
            
            <X size={24} />
          </button>
        </div>

        <nav className="p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileOpen(false)}
                className={({ isActive }) => `
                  flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200
                  ${isActive ? 'bg-gs-accent/20 text-gs-highlight border border-gs-accent/30' : 'text-gs-text-secondary hover:bg-gs-primary/50 hover:text-white'}
                `}>
                
                <Icon size={20} />
                <span className="font-medium">{item.name}</span>
              </NavLink>);

          })}
        </nav>

        <div className="absolute bottom-0 w-full p-4 border-t border-gs-border bg-gs-primary/30">
          <div className="flex items-center gap-3 px-4 py-2">
            <div className="w-8 h-8 rounded-full bg-gs-border flex items-center justify-center text-sm font-bold">
              A
            </div>
            <div>
              <p className="text-sm font-medium text-white">Admin User</p>
              <p className="text-xs text-gs-text-secondary">
                admin@goalstorm.com
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>);

};