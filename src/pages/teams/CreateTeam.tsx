import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Save, ChevronLeft } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Team } from '../../types';
export default function CreateTeam() {
  const navigate = useNavigate();
  const { addTeam } = useStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Partial<Team>>({
    name: '',
    shortName: '',
    city: '',
    country: 'Srbija',
    primaryColor: '#1E5FA8',
    secondaryColor: '#FFFFFF',
    foundedYear: new Date().getFullYear(),
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    description: ''
  });
  const handleInputChange = (field: keyof Team, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
  };
  const handleSave = () => {
    setIsSubmitting(true);
    if (!formData.name || !formData.shortName || !formData.city) {
      alert('Molimo popunite sva obavezna polja (Naziv, Skraćenica, Grad).');
      setIsSubmitting(false);
      return;
    }
    const newTeam: Team = {
      ...(formData as Team),
      id: `t_${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    setTimeout(() => {
      addTeam(newTeam);
      navigate('/teams');
    }, 500);
  };
  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-3 rounded-xl bg-gs-accent/20 text-gs-highlight">
          <Shield size={24} />
        </div>
        <div>
          <h1 className="text-3xl font-heading font-bold text-white">
            Nova Ekipa
          </h1>
          <p className="text-gs-text-secondary">
            Registrujte novu ekipu u sistem.
          </p>
        </div>
      </div>

      <Card className="bg-gs-secondary border-gs-border">
        <CardContent className="p-6 md:p-8">
          <div className="space-y-8">
            {/* Osnovne Informacije */}
            <section>
              <h2 className="text-xl font-bold text-white mb-4 border-b border-gs-border pb-2">
                Osnovne Informacije
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Naziv ekipe *"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="npr. FK Radnički"
                  className="bg-gs-primary border-gs-border text-white" />
                
                <Input
                  label="Skraćenica (max 3 slova) *"
                  value={formData.shortName}
                  onChange={(e) =>
                  handleInputChange(
                    'shortName',
                    e.target.value.substring(0, 3).toUpperCase()
                  )
                  }
                  placeholder="npr. RAD"
                  maxLength={3}
                  className="bg-gs-primary border-gs-border text-white uppercase" />
                
                <Input
                  label="Grad *"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  placeholder="npr. Beograd"
                  className="bg-gs-primary border-gs-border text-white" />
                
                <Input
                  label="Država"
                  value={formData.country}
                  onChange={(e) => handleInputChange('country', e.target.value)}
                  className="bg-gs-primary border-gs-border text-white" />
                
                <Input
                  type="number"
                  label="Godina osnivanja"
                  value={formData.foundedYear}
                  onChange={(e) =>
                  handleInputChange('foundedYear', parseInt(e.target.value))
                  }
                  className="bg-gs-primary border-gs-border text-white" />
                
              </div>
            </section>

            {/* Vizuelni Identitet */}
            <section>
              <h2 className="text-xl font-bold text-white mb-4 border-b border-gs-border pb-2">
                Vizuelni Identitet
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gs-text-secondary mb-1">
                      Osnovna boja
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={formData.primaryColor}
                        onChange={(e) =>
                        handleInputChange('primaryColor', e.target.value)
                        }
                        className="w-10 h-10 rounded cursor-pointer bg-transparent border-0 p-0" />
                      
                      <Input
                        value={formData.primaryColor}
                        onChange={(e) =>
                        handleInputChange('primaryColor', e.target.value)
                        }
                        className="bg-gs-primary border-gs-border text-white flex-1" />
                      
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gs-text-secondary mb-1">
                      Sekundarna boja
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={formData.secondaryColor}
                        onChange={(e) =>
                        handleInputChange('secondaryColor', e.target.value)
                        }
                        className="w-10 h-10 rounded cursor-pointer bg-transparent border-0 p-0" />
                      
                      <Input
                        value={formData.secondaryColor}
                        onChange={(e) =>
                        handleInputChange('secondaryColor', e.target.value)
                        }
                        className="bg-gs-primary border-gs-border text-white flex-1" />
                      
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-center justify-center p-4 bg-gs-primary rounded-lg border border-gs-border border-dashed">
                  <p className="text-sm text-gs-text-secondary mb-4">
                    Pregled dresa / boja
                  </p>
                  <div
                    className="w-24 h-24 rounded-full border-4 flex items-center justify-center shadow-lg relative overflow-hidden"
                    style={{
                      borderColor: formData.primaryColor
                    }}>
                    
                    <div
                      className="absolute inset-0"
                      style={{
                        background: `linear-gradient(135deg, ${formData.primaryColor} 50%, ${formData.secondaryColor} 50%)`
                      }}>
                    </div>
                    <span className="relative z-10 font-bold text-white drop-shadow-md text-xl">
                      {formData.shortName || '???'}
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* Kontakt i Opis */}
            <section>
              <h2 className="text-xl font-bold text-white mb-4 border-b border-gs-border pb-2">
                Kontakt i Opis
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <Input
                  label="Kontakt osoba"
                  value={formData.contactName}
                  onChange={(e) =>
                  handleInputChange('contactName', e.target.value)
                  }
                  className="bg-gs-primary border-gs-border text-white" />
                
                <Input
                  label="Telefon"
                  value={formData.contactPhone}
                  onChange={(e) =>
                  handleInputChange('contactPhone', e.target.value)
                  }
                  className="bg-gs-primary border-gs-border text-white" />
                
                <Input
                  label="Email"
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) =>
                  handleInputChange('contactEmail', e.target.value)
                  }
                  className="bg-gs-primary border-gs-border text-white md:col-span-2" />
                
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-gs-text-secondary">
                  Kratki opis ekipe
                </label>
                <textarea
                  className="w-full bg-gs-primary border border-gs-border rounded-md p-3 text-white focus:ring-2 focus:ring-gs-accent focus:border-transparent outline-none"
                  rows={3}
                  value={formData.description}
                  onChange={(e) =>
                  handleInputChange('description', e.target.value)
                  } />
                
              </div>
            </section>
          </div>

          <div className="flex justify-between mt-8 pt-6 border-t border-gs-border">
            <Button
              variant="secondary"
              onClick={() => navigate('/teams')}
              className="bg-gs-primary text-white border-gs-border hover:bg-gs-border"
              leftIcon={<ChevronLeft size={18} />}>
              
              Otkaži
            </Button>

            <Button
              onClick={handleSave}
              loading={isSubmitting}
              className="bg-gs-success hover:bg-green-500 text-white border-none"
              leftIcon={<Save size={18} />}>
              
              Registruj Ekipu
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>);

}