import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Save, ChevronLeft } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Toggle } from '../../components/ui/Toggle';
import { Player, PlayerPosition } from '../../types';
export default function CreatePlayer() {
  const navigate = useNavigate();
  const { addPlayer, teams } = useStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Partial<Player>>({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    jerseyNumber: 1,
    position: 'CM',
    teamId: '',
    isCaptain: false,
    dominantFoot: 'right',
    height: undefined,
    weight: undefined,
    email: '',
    phone: '',
    bio: ''
  });
  const handleInputChange = (field: keyof Player, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
  };
  const handleSave = () => {
    setIsSubmitting(true);
    if (
    !formData.firstName ||
    !formData.lastName ||
    !formData.dateOfBirth ||
    !formData.teamId)
    {
      alert(
        'Molimo popunite sva obavezna polja (Ime, Prezime, Datum rođenja, Ekipa).'
      );
      setIsSubmitting(false);
      return;
    }
    const newPlayer: Player = {
      ...(formData as Player),
      id: `p_${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    setTimeout(() => {
      addPlayer(newPlayer);
      navigate('/players');
    }, 500);
  };
  const teamOptions = teams.map((t) => ({
    value: t.id,
    label: t.name
  }));
  const positionOptions = [
  {
    value: 'GK',
    label: 'Golman (GK)'
  },
  {
    value: 'CB',
    label: 'Štoper (CB)'
  },
  {
    value: 'LB',
    label: 'Levi bek (LB)'
  },
  {
    value: 'RB',
    label: 'Desni bek (RB)'
  },
  {
    value: 'CDM',
    label: 'Zadnji vezni (CDM)'
  },
  {
    value: 'CM',
    label: 'Centralni vezni (CM)'
  },
  {
    value: 'CAM',
    label: 'Ofanzivni vezni (CAM)'
  },
  {
    value: 'LW',
    label: 'Levo krilo (LW)'
  },
  {
    value: 'RW',
    label: 'Desno krilo (RW)'
  },
  {
    value: 'ST',
    label: 'Napadač (ST)'
  }];

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-3 rounded-xl bg-gs-accent/20 text-gs-highlight">
          <Users size={24} />
        </div>
        <div>
          <h1 className="text-3xl font-heading font-bold text-white">
            Novi Igrač
          </h1>
          <p className="text-gs-text-secondary">
            Registrujte novog igrača u sistem.
          </p>
        </div>
      </div>

      <Card className="bg-gs-secondary border-gs-border">
        <CardContent className="p-6 md:p-8">
          <div className="space-y-8">
            {/* Lični Podaci */}
            <section>
              <h2 className="text-xl font-bold text-white mb-4 border-b border-gs-border pb-2">
                Lični Podaci
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Ime *"
                  value={formData.firstName}
                  onChange={(e) =>
                  handleInputChange('firstName', e.target.value)
                  }
                  className="bg-gs-primary border-gs-border text-white" />
                
                <Input
                  label="Prezime *"
                  value={formData.lastName}
                  onChange={(e) =>
                  handleInputChange('lastName', e.target.value)
                  }
                  className="bg-gs-primary border-gs-border text-white" />
                
                <Input
                  type="date"
                  label="Datum rođenja *"
                  value={formData.dateOfBirth}
                  onChange={(e) =>
                  handleInputChange('dateOfBirth', e.target.value)
                  }
                  className="bg-gs-primary border-gs-border text-white" />
                
                <Input
                  label="Nacionalnost"
                  value={formData.nationality}
                  onChange={(e) =>
                  handleInputChange('nationality', e.target.value)
                  }
                  className="bg-gs-primary border-gs-border text-white" />
                
              </div>
            </section>

            {/* Fudbalski Podaci */}
            <section>
              <h2 className="text-xl font-bold text-white mb-4 border-b border-gs-border pb-2">
                Fudbalski Podaci
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <Select
                  label="Ekipa *"
                  value={formData.teamId}
                  onChange={(val) => handleInputChange('teamId', val)}
                  options={teamOptions}
                  placeholder="Izaberite ekipu" />
                
                <Select
                  label="Pozicija *"
                  value={formData.position}
                  onChange={(val) =>
                  handleInputChange('position', val as PlayerPosition)
                  }
                  options={positionOptions} />
                
                <Input
                  type="number"
                  label="Broj dresa *"
                  value={formData.jerseyNumber}
                  onChange={(e) =>
                  handleInputChange('jerseyNumber', parseInt(e.target.value))
                  }
                  min={1}
                  max={99}
                  className="bg-gs-primary border-gs-border text-white" />
                
                <Select
                  label="Dominantna noga"
                  value={formData.dominantFoot}
                  onChange={(val) => handleInputChange('dominantFoot', val)}
                  options={[
                  {
                    value: 'right',
                    label: 'Desna'
                  },
                  {
                    value: 'left',
                    label: 'Leva'
                  },
                  {
                    value: 'both',
                    label: 'Obe'
                  }]
                  } />
                
                <Input
                  type="number"
                  label="Visina (cm)"
                  value={formData.height || ''}
                  onChange={(e) =>
                  handleInputChange('height', parseInt(e.target.value))
                  }
                  className="bg-gs-primary border-gs-border text-white" />
                
                <Input
                  type="number"
                  label="Težina (kg)"
                  value={formData.weight || ''}
                  onChange={(e) =>
                  handleInputChange('weight', parseInt(e.target.value))
                  }
                  className="bg-gs-primary border-gs-border text-white" />
                
              </div>

              <div className="flex items-center justify-between p-4 bg-gs-primary rounded-lg border border-gs-border">
                <div>
                  <p className="font-medium text-white">Kapiten</p>
                  <p className="text-xs text-gs-text-secondary">
                    Da li je ovaj igrač kapiten ekipe?
                  </p>
                </div>
                <Toggle
                  checked={formData.isCaptain}
                  onChange={(val) => handleInputChange('isCaptain', val)} />
                
              </div>
            </section>
          </div>

          <div className="flex justify-between mt-8 pt-6 border-t border-gs-border">
            <Button
              variant="secondary"
              onClick={() => navigate('/players')}
              className="bg-gs-primary text-white border-gs-border hover:bg-gs-border"
              leftIcon={<ChevronLeft size={18} />}>
              
              Otkaži
            </Button>

            <Button
              onClick={handleSave}
              loading={isSubmitting}
              className="bg-gs-success hover:bg-green-500 text-white border-none"
              leftIcon={<Save size={18} />}>
              
              Registruj Igrača
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>);

}