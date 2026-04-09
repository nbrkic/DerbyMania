import React, { useState, Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, ChevronLeft, Save, Trophy } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Toggle } from '../../components/ui/Toggle';
import {
  Tournament,
  TournamentType,
  AgeCategory,
  TournamentFormat } from
'../../types';
export default function CreateTournament() {
  const navigate = useNavigate();
  const { addTournament } = useStore();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Partial<Tournament>>({
    name: '',
    description: '',
    type: 'amateur',
    ageCategory: 'senior',
    city: '',
    startDate: '',
    endDate: '',
    format: 'group_knockout',
    teamCount: 16,
    groupsCount: 4,
    advancingPerGroup: 2,
    settings: {
      matchDuration: 90,
      extraTime: false,
      penalties: true,
      pointsWin: 3,
      pointsDraw: 1,
      pointsLoss: 0
    },
    status: 'draft',
    teamIds: []
  });
  const handleInputChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof Tournament] as any),
          [child]: value
        }
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [field]: value
      }));
    }
  };
  const handleSave = (status: 'draft' | 'upcoming') => {
    setIsSubmitting(true);
    // Basic validation
    if (!formData.name || !formData.startDate || !formData.endDate) {
      alert(
        'Molimo popunite sva obavezna polja (Naziv, Datum početka, Datum završetka).'
      );
      setIsSubmitting(false);
      return;
    }
    const newTournament: Tournament = {
      ...(formData as Tournament),
      id: `tr_${Date.now()}`,
      status,
      createdAt: new Date().toISOString()
    };
    setTimeout(() => {
      addTournament(newTournament);
      navigate('/app/tournaments');
    }, 500);
  };
  const renderStepIndicator = () =>
  <div className="flex items-center justify-center mb-8">
      {[1, 2, 3].map((s) =>
    <Fragment key={s}>
          <div
        className={`flex items-center justify-center w-10 h-10 rounded-full font-bold ${step === s ? 'bg-navy-800/50 text-silver-4001 ring-4 ring-blue-500/20' : step > s ? 'bg-navy-800/50 text-silver-4001' : 'bg-navy-800/50 text-silver-4002 border border-white/6'}`}>
        
            {step > s ? '✓' : s}
          </div>
          {s < 3 &&
      <div
        className={`w-16 h-1 mx-2 rounded ${step > s ? 'bg-navy-800/50' : 'bg-navy-800/50'}`} />

      }
        </Fragment>
    )}
    </div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-3 rounded-xl bg-navy-800/50/20 text-silver-400">
          <Trophy size={24} />
        </div>
        <div>
          <h1 className="text-3xl font-heading font-bold text-silver-4001">
            Novi Turnir
          </h1>
          <p className="text-silver-4002">
            Kreirajte i konfigurišite novo takmičenje.
          </p>
        </div>
      </div>

      <Card className="bg-navy-800/50 border-white/6">
        <CardContent className="p-6 md:p-8">
          {renderStepIndicator()}

          <div className="space-y-6">
            {step === 1 &&
            <div className="space-y-4 animate-slide-in">
                <h2 className="text-xl font-bold text-silver-4001 mb-4 border-b border-white/6 pb-2">
                  Osnovne Informacije
                </h2>

                <Input
                label="Naziv turnira *"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="npr. Letnja Liga 2025"
                className="bg-navy-800/50 border-white/6 text-silver-4001" />
              

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-silver-4002">
                    Opis turnira
                  </label>
                  <textarea
                  className="w-full bg-navy-800/50 border border-white/6 rounded-md p-3 text-silver-4001 focus:ring-2 focus:ring-blue-500 focus:border-white/6 outline-none"
                  rows={3}
                  value={formData.description}
                  onChange={(e) =>
                  handleInputChange('description', e.target.value)
                  }
                  placeholder="Kratak opis takmičenja..." />
                
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select
                  label="Tip turnira"
                  value={formData.type}
                  onChange={(val) => handleInputChange('type', val)}
                  options={[
                  {
                    value: 'amateur',
                    label: 'Amaterski'
                  },
                  {
                    value: 'semi-pro',
                    label: 'Poluprofesionalni'
                  },
                  {
                    value: 'pro',
                    label: 'Profesionalni'
                  },
                  {
                    value: 'youth',
                    label: 'Omladinski'
                  },
                  {
                    value: 'womens',
                    label: 'Ženski'
                  }]
                  } />
                
                  <Select
                  label="Uzrasna kategorija"
                  value={formData.ageCategory}
                  onChange={(val) => handleInputChange('ageCategory', val)}
                  options={[
                  {
                    value: 'senior',
                    label: 'Seniori'
                  },
                  {
                    value: 'u21',
                    label: 'U-21'
                  },
                  {
                    value: 'u19',
                    label: 'U-19'
                  },
                  {
                    value: 'u17',
                    label: 'U-17'
                  },
                  {
                    value: 'u15',
                    label: 'U-15'
                  }]
                  } />
                
                </div>

                <Input
                label="Grad / Lokacija"
                value={formData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                placeholder="npr. Beograd"
                className="bg-navy-800/50 border-white/6 text-silver-4001" />
              
              </div>
            }

            {step === 2 &&
            <div className="space-y-4 animate-slide-in">
                <h2 className="text-xl font-bold text-silver-4001 mb-4 border-b border-white/6 pb-2">
                  Format i Vreme
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                  type="date"
                  label="Datum početka *"
                  value={formData.startDate}
                  onChange={(e) =>
                  handleInputChange('startDate', e.target.value)
                  }
                  className="bg-navy-800/50 border-white/6 text-silver-4001" />
                
                  <Input
                  type="date"
                  label="Datum završetka *"
                  value={formData.endDate}
                  onChange={(e) =>
                  handleInputChange('endDate', e.target.value)
                  }
                  className="bg-navy-800/50 border-white/6 text-silver-4001" />
                
                </div>

                <Select
                label="Format takmičenja"
                value={formData.format}
                onChange={(val) => handleInputChange('format', val)}
                options={[
                {
                  value: 'group_knockout',
                  label: 'Grupna faza + Eliminacija'
                },
                {
                  value: 'league',
                  label: 'Samo liga (Round-robin)'
                },
                {
                  value: 'knockout',
                  label: 'Samo eliminacija (Kup)'
                }]
                } />
              

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                  type="number"
                  label="Broj ekipa *"
                  value={formData.teamCount}
                  onChange={(e) =>
                  handleInputChange('teamCount', parseInt(e.target.value))
                  }
                  min={2}
                  max={64}
                  className="bg-navy-800/50 border-white/6 text-silver-4001" />
                

                  {formData.format === 'group_knockout' &&
                <>
                      <Input
                    type="number"
                    label="Broj grupa"
                    value={formData.groupsCount}
                    onChange={(e) =>
                    handleInputChange(
                      'groupsCount',
                      parseInt(e.target.value)
                    )
                    }
                    min={1}
                    max={16}
                    className="bg-navy-800/50 border-white/6 text-silver-4001" />
                  
                      <Input
                    type="number"
                    label="Prolaze iz grupe"
                    value={formData.advancingPerGroup}
                    onChange={(e) =>
                    handleInputChange(
                      'advancingPerGroup',
                      parseInt(e.target.value)
                    )
                    }
                    min={1}
                    max={4}
                    className="bg-navy-800/50 border-white/6 text-silver-4001" />
                  
                    </>
                }
                </div>
              </div>
            }

            {step === 3 &&
            <div className="space-y-4 animate-slide-in">
                <h2 className="text-xl font-bold text-silver-4001 mb-4 border-b border-white/6 pb-2">
                  Pravila i Bodovanje
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <Input
                  type="number"
                  label="Bodovi za pobedu"
                  value={formData.settings?.pointsWin}
                  onChange={(e) =>
                  handleInputChange(
                    'settings.pointsWin',
                    parseInt(e.target.value)
                  )
                  }
                  className="bg-navy-800/50 border-white/6 text-silver-4001" />
                
                  <Input
                  type="number"
                  label="Bodovi za remi"
                  value={formData.settings?.pointsDraw}
                  onChange={(e) =>
                  handleInputChange(
                    'settings.pointsDraw',
                    parseInt(e.target.value)
                  )
                  }
                  className="bg-navy-800/50 border-white/6 text-silver-4001" />
                
                  <Input
                  type="number"
                  label="Bodovi za poraz"
                  value={formData.settings?.pointsLoss}
                  onChange={(e) =>
                  handleInputChange(
                    'settings.pointsLoss',
                    parseInt(e.target.value)
                  )
                  }
                  className="bg-navy-800/50 border-white/6 text-silver-4001" />
                
                </div>

                <div className="space-y-4 bg-navy-800/50 p-4 rounded-lg border border-white/6">
                  <Input
                  type="number"
                  label="Trajanje meča (minuti)"
                  value={formData.settings?.matchDuration}
                  onChange={(e) =>
                  handleInputChange(
                    'settings.matchDuration',
                    parseInt(e.target.value)
                  )
                  }
                  className="bg-navy-800/50 border-white/6 text-silver-4001 max-w-[200px]" />
                

                  <div className="flex items-center justify-between py-2 border-b border-white/6">
                    <div>
                      <p className="font-medium text-silver-4001">Produžeci</p>
                      <p className="text-xs text-silver-4002">
                        Da li se igraju produžeci u eliminacionoj fazi?
                      </p>
                    </div>
                    <Toggle
                    checked={formData.settings?.extraTime}
                    onChange={(val) =>
                    handleInputChange('settings.extraTime', val)
                    } />
                  
                  </div>

                  <div className="flex items-center justify-between py-2">
                    <div>
                      <p className="font-medium text-silver-4001">Penali</p>
                      <p className="text-xs text-silver-4002">
                        Da li se izvode penali u slučaju nerešenog rezultata?
                      </p>
                    </div>
                    <Toggle
                    checked={formData.settings?.penalties}
                    onChange={(val) =>
                    handleInputChange('settings.penalties', val)
                    } />
                  
                  </div>
                </div>
              </div>
            }
          </div>

          <div className="flex justify-between mt-8 pt-6 border-t border-white/6">
            <Button
              variant="secondary"
              onClick={() =>
              step > 1 ? setStep(step - 1) : navigate('/app/tournaments')
              }
              className="bg-navy-800/50 text-silver-4001 border-white/6 hover:bg-navy-800/50"
              leftIcon={step > 1 ? <ChevronLeft size={18} /> : undefined}>
              
              {step > 1 ? 'Nazad' : 'Otkaži'}
            </Button>

            {step < 3 ?
            <Button
              onClick={() => setStep(step + 1)}
              className="bg-navy-800/50 hover:bg-navy-800/50 text-silver-4001 border-transparent"
              rightIcon={<ChevronRight size={18} />}>
              
                Dalje
              </Button> :

            <div className="flex gap-3">
                <Button
                variant="secondary"
                onClick={() => handleSave('draft')}
                loading={isSubmitting}
                className="bg-navy-800/50 text-silver-4001 border-white/6 hover:bg-navy-800/50">
                
                  Sačuvaj kao Draft
                </Button>
                <Button
                onClick={() => handleSave('upcoming')}
                loading={isSubmitting}
                className="bg-navy-800/50 hover:bg-green-500 text-silver-4001 border-transparent"
                leftIcon={<Save size={18} />}>
                
                  Objavi Turnir
                </Button>
              </div>
            }
          </div>
        </CardContent>
      </Card>
    </div>);

}