import React, { useState } from 'react';
import { Settings as SettingsIcon, Save, Moon, Bell, Shield, Database, ChevronRight } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Toggle } from '../components/ui/Toggle';
import { Input } from '../components/ui/Input';

const menuItems = [
  { id: 'general',       label: 'Opšta podešavanja',    icon: SettingsIcon },
  { id: 'notifications', label: 'Notifikacije',           icon: Bell },
  { id: 'security',      label: 'Bezbednost',             icon: Shield },
  { id: 'data',          label: 'Podaci i Backup',        icon: Database },
];

export default function Settings() {
  const [activeMenu, setActiveMenu] = useState('general');

  return (
    <div className="space-y-6 animate-fade-up max-w-5xl mx-auto">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center">
          <SettingsIcon size={22} className="text-blue-400" />
        </div>
        <div>
          <h1 className="font-display text-4xl font-black tracking-wide text-ice-100">PODEŠAVANJA</h1>
          <p className="text-silver-400 text-sm">Konfigurišite sistem i korisnički nalog.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Sidebar nav */}
        <div className="space-y-1">
          {menuItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveMenu(item.id)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                activeMenu === item.id
                  ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20'
                  : 'text-silver-400 hover:bg-navy-800/60 hover:text-ice-100 border border-transparent'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <item.icon size={16} />
                {item.label}
              </span>
              <ChevronRight size={14} className="opacity-50" />
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="md:col-span-3 space-y-5">
          {/* General settings */}
          <div className="rounded-xl border border-white/6 bg-navy-800/60 p-6">
            <h3 className="font-bold text-ice-100 mb-6 pb-4 border-b border-white/6">Opšta podešavanja</h3>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-ice-100 flex items-center gap-2 text-sm">
                    <Moon size={15} className="text-blue-500" /> Tamna tema
                  </p>
                  <p className="text-xs text-silver-600 mt-0.5">Aplikacija trenutno podržava samo tamnu temu.</p>
                </div>
                <Toggle checked={true} disabled />
              </div>

              <div className="space-y-4 pt-5 border-t border-white/6">
                <h4 className="font-semibold text-sm text-ice-100">Informacije o organizaciji</h4>
                <Input label="Naziv organizacije" defaultValue="GoalStorm Demo" />
                <Input label="Kontakt Email" defaultValue="admin@goalstorm.com" type="email" />
              </div>
            </div>

            <div className="mt-8 pt-5 border-t border-white/6 flex justify-end">
              <Button leftIcon={<Save size={16} />}>Sačuvaj promene</Button>
            </div>
          </div>

          {/* Danger zone */}
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-6">
            <h3 className="font-bold text-red-400 mb-2 flex items-center gap-2">
              <Shield size={16} />
              Opasna zona
            </h3>
            <p className="text-xs text-silver-400 mb-5 max-w-lg">
              Brisanje svih podataka je nepovratna akcija. Svi turniri, ekipe i igrači će biti trajno obrisani.
            </p>
            <Button
              variant="destructive"
              onClick={() => {
                if (window.confirm('Da li ste sigurni? Ova akcija je nepovratna.')) {
                  localStorage.removeItem('goalstorm-storage');
                  window.location.reload();
                }
              }}
            >
              Obriši sve podatke (Reset)
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
