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
      navigate('/tournaments');
    }, 500);
  };
  const renderStepIndicator = () =>
  <div className="flex items-center justify-center mb-8">
      {[1, 2, 3].map((s) =>
    <Fragment key={s}>
          <div
        className={`flex items-center justify-center w-10 h-10 rounded-full font-bold ${step === s ? 'bg-gs-accent text-white ring-4 ring-gs-accent/20' : step > s ? 'bg-gs-success text-white' : 'bg-gs-primary text-gs-text-secondary border border-gs-border'}`}>
        
            {step > s ? '✓' : s}
          </div>
          {s < 3 &&
      <div
        className={`w-16 h-1 mx-2 rounded ${step > s ? 'bg-gs-success' : 'bg-gs-border'}`} />

      }
        </Fragment>
    )}
    </div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-3 rounded-xl bg-gs-accent/20 text-gs-highlight">
          <Trophy size={24} />
        </div>
        <div>
          <h1 className="text-3xl font-heading font-bold text-white">
            Novi Turnir
          </h1>
          <p className="text-gs-text-secondary">
            Kreirajte i konfigurišite novo takmičenje.
          </p>
        </div>
      </div>

      <Card className="bg-gs-secondary border-gs-border">
        <CardContent className="p-6 md:p-8">
          {renderStepIndicator()}

          <div className="space-y-6">
            {step === 1 &&
            <div className="space-y-4 animate-slide-in">
                <h2 className="text-xl font-bold text-white mb-4 border-b border-gs-border pb-2">
                  Osnovne Informacije
                </h2>

                <Input
                label="Naziv turnira *"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="npr. Letnja Liga 2025"
                className="bg-gs-primary border-gs-border text-white" />
              

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gs-text-secondary">
                    Opis turnira
                  </label>
                  <textarea
                  className="w-full bg-gs-primary border border-gs-border rounded-md p-3 text-white focus:ring-2 focus:ring-gs-accent focus:border-transparent outline-none"
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
                className="bg-gs-primary border-gs-border text-white" />
              
              </div>
            }

            {step === 2 &&
            <div className="space-y-4 animate-slide-in">
                <h2 className="text-xl font-bold text-white mb-4 border-b border-gs-border pb-2">
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
                  className="bg-gs-primary border-gs-border text-white" />
                
                  <Input
                  type="date"
                  label="Datum završetka *"
                  value={formData.endDate}
                  onChange={(e) =>
                  handleInputChange('endDate', e.target.value)
                  }
                  className="bg-gs-primary border-gs-border text-white" />
                
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
                  className="bg-gs-primary border-gs-border text-white" />
                

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
                    className="bg-gs-primary border-gs-border text-white" />
                  
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
                    className="bg-gs-primary border-gs-border text-white" />
                  
                    </>
                }
                </div>
              </div>
            }

            {step === 3 &&
            <div className="space-y-4 animate-slide-in">
                <h2 className="text-xl font-bold text-white mb-4 border-b border-gs-border pb-2">
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
                  className="bg-gs-primary border-gs-border text-white" />
                
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
                  className="bg-gs-primary border-gs-border text-white" />
                
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
                  className="bg-gs-primary border-gs-border text-white" />
                
                </div>

                <div className="space-y-4 bg-gs-primary p-4 rounded-lg border border-gs-border">
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
                  className="bg-gs-secondary border-gs-border text-white max-w-[200px]" />
                

                  <div className="flex items-center justify-between py-2 border-b border-gs-border">
                    <div>
                      <p className="font-medium text-white">Produžeci</p>
                      <p className="text-xs text-gs-text-secondary">
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
                      <p className="font-medium text-white">Penali</p>
                      <p className="text-xs text-gs-text-secondary">
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

          <div className="flex justify-between mt-8 pt-6 border-t border-gs-border">
            <Button
              variant="secondary"
              onClick={() =>
              step > 1 ? setStep(step - 1) : navigate('/tournaments')
              }
              className="bg-gs-primary text-white border-gs-border hover:bg-gs-border"
              leftIcon={step > 1 ? <ChevronLeft size={18} /> : undefined}>
              
              {step > 1 ? 'Nazad' : 'Otkaži'}
            </Button>

            {step < 3 ?
            <Button
              onClick={() => setStep(step + 1)}
              className="bg-gs-accent hover:bg-gs-highlight text-white border-none"
              rightIcon={<ChevronRight size={18} />}>
              
                Dalje
              </Button> :

            <div className="flex gap-3">
                <Button
                variant="secondary"
                onClick={() => handleSave('draft')}
                loading={isSubmitting}
                className="bg-gs-primary text-white border-gs-border hover:bg-gs-border">
                
                  Sačuvaj kao Draft
                </Button>
                <Button
                onClick={() => handleSave('upcoming')}
                loading={isSubmitting}
                className="bg-gs-success hover:bg-green-500 text-white border-none"
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