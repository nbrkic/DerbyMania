import React from 'react';
import { Menu } from 'lucide-react';
interface MobileHeaderProps {
  setIsMobileOpen: (open: boolean) => void;
}
export const MobileHeader: React.FC<MobileHeaderProps> = ({
  setIsMobileOpen
}) => {
  return (
    <header className="lg:hidden flex items-center justify-between h-16 px-4 bg-gs-secondary border-b border-gs-border sticky top-0 z-30">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-gs-accent flex items-center justify-center text-white font-bold text-xl">
          ⚽
        </div>
        <span className="text-xl font-heading font-bold text-white tracking-wide">
          GOAL<span className="text-gs-highlight">STORM</span>
        </span>
      </div>
      <button
        className="text-gs-text-secondary hover:text-white p-2"
        onClick={() => setIsMobileOpen(true)}>
        
        <Menu size={24} />
      </button>
    </header>);

};