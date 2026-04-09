import React from 'react';
import { Menu, Zap } from 'lucide-react';

interface MobileHeaderProps {
  setIsMobileOpen: (open: boolean) => void;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({ setIsMobileOpen }) => {
  return (
    <header className="lg:hidden flex items-center justify-between h-16 px-4 bg-gs-surface border-b border-gs-border sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-accent-gradient flex items-center justify-center shadow-glow-blue">
          <Zap size={16} className="text-white" fill="currentColor" />
        </div>
        <span className="font-display text-2xl font-bold tracking-wider text-gs-text-1">
          GOAL<span className="gradient-text">STORM</span>
        </span>
      </div>
      <button
        className="text-gs-text-2 hover:text-gs-text-1 p-2 rounded-lg hover:bg-gs-panel transition-all"
        onClick={() => setIsMobileOpen(true)}
      >
        <Menu size={22} />
      </button>
    </header>
  );
};
