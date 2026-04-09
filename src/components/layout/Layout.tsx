import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { MobileHeader } from './MobileHeader';
export const Layout: React.FC = () => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  return (
    <div className="flex h-screen w-full overflow-hidden bg-gs-primary text-gs-text-primary">
      <Sidebar isMobileOpen={isMobileOpen} setIsMobileOpen={setIsMobileOpen} />

      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <MobileHeader setIsMobileOpen={setIsMobileOpen} />

        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 custom-scrollbar">
          <div className="max-w-7xl mx-auto w-full animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>);

};