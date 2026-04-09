import React from 'react';
import {
  Settings as SettingsIcon,
  Save,
  Moon,
  Bell,
  Shield,
  Database } from
'lucide-react';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Toggle } from '../components/ui/Toggle';
import { Input } from '../components/ui/Input';
export default function Settings() {
  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-3 rounded-xl bg-gs-accent/20 text-gs-highlight">
          <SettingsIcon size={24} />
        </div>
        <div>
          <h1 className="text-3xl font-heading font-bold text-white">
            Podešavanja
          </h1>
          <p className="text-gs-text-secondary">
            Konfigurišite sistem i korisnički nalog.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-2">
          <button className="w-full text-left px-4 py-3 rounded-lg bg-gs-accent/20 text-gs-highlight border border-gs-accent/30 font-medium flex items-center gap-3">
            <SettingsIcon size={18} /> Opšta podešavanja
          </button>
          <button className="w-full text-left px-4 py-3 rounded-lg text-gs-text-secondary hover:bg-gs-primary/50 hover:text-white transition-colors flex items-center gap-3">
            <Bell size={18} /> Notifikacije
          </button>
          <button className="w-full text-left px-4 py-3 rounded-lg text-gs-text-secondary hover:bg-gs-primary/50 hover:text-white transition-colors flex items-center gap-3">
            <Shield size={18} /> Bezbednost
          </button>
          <button className="w-full text-left px-4 py-3 rounded-lg text-gs-text-secondary hover:bg-gs-primary/50 hover:text-white transition-colors flex items-center gap-3">
            <Database size={18} /> Podaci i Backup
          </button>
        </div>

        <div className="md:col-span-2 space-y-6">
          <Card className="bg-gs-secondary border-gs-border">
            <CardContent className="p-6">
              <h3 className="text-xl font-bold text-white mb-6 border-b border-gs-border pb-2">
                Opšta podešavanja
              </h3>

              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-white flex items-center gap-2">
                      <Moon size={16} className="text-gs-accent" /> Tamna Tema
                    </p>
                    <p className="text-sm text-gs-text-secondary">
                      Aplikacija trenutno podržava samo tamnu temu.
                    </p>
                  </div>
                  <Toggle checked={true} disabled />
                </div>

                <div className="space-y-4 pt-4 border-t border-gs-border">
                  <h4 className="font-medium text-white">
                    Informacije o organizaciji
                  </h4>
                  <Input
                    label="Naziv organizacije"
                    defaultValue="GoalStorm Demo"
                    className="bg-gs-primary border-gs-border text-white" />
                  
                  <Input
                    label="Kontakt Email"
                    defaultValue="admin@goalstorm.com"
                    className="bg-gs-primary border-gs-border text-white" />
                  
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-gs-border flex justify-end">
                <Button
                  className="bg-gs-accent hover:bg-gs-highlight text-white border-none"
                  leftIcon={<Save size={18} />}>
                  
                  Sačuvaj promene
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gs-secondary border-gs-error/30">
            <CardContent className="p-6">
              <h3 className="text-xl font-bold text-gs-error mb-2">
                Opasna zona
              </h3>
              <p className="text-sm text-gs-text-secondary mb-4">
                Brisanje svih podataka je nepovratna akcija. Svi turniri, ekipe
                i igrači će biti obrisani.
              </p>

              <Button
                variant="destructive"
                className="bg-gs-error/10 text-gs-error hover:bg-gs-error hover:text-white border border-gs-error/30"
                onClick={() => {
                  if (
                  window.confirm(
                    'Da li ste sigurni da želite da obrišete sve podatke? Ova akcija je nepovratna.'
                  ))
                  {
                    localStorage.removeItem('goalstorm-storage');
                    window.location.reload();
                  }
                }}>
                
                Obriši sve podatke (Reset)
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>);

}