import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth-context';
import { supabase } from '../lib/supabase';
import { SiteHeader } from '../components/SiteHeader';
import { SiteFooter } from '../components/SiteFooter';
import { TicketField, ComboboxField, TextAreaField } from '../components/AuthShell';
import { ImageField, CrestField, type ImagePosition } from '../components/ImageFields';
import { normalizeForSearch } from '../lib/text';

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const CURRENT_YEAR = new Date().getFullYear();

type Sport = { id: number; name: string };
type Position = ImagePosition;

const STEP_IDS = ['sport', 'naziv', 'grad', 'opis', 'grb', 'baner', 'pregled'] as const;
type StepId = (typeof STEP_IDS)[number];
const STEP_LABELS: Record<StepId, string> = {
  sport: 'Sport',
  naziv: 'Naziv tima',
  grad: 'Grad',
  opis: 'O timu',
  grb: 'Grb tima',
  baner: 'Baner tima',
  pregled: 'Pregled',
};

function BackArrowIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M19 12H5M11 18l-6-6 6-6" />
    </svg>
  );
}

function TeamPreviewCard({
  name,
  sportName,
  city,
  crestUrl,
  crestPosition,
  bannerUrl,
}: {
  name: string;
  sportName: string | null;
  city: string;
  crestUrl: string | null;
  crestPosition: Position;
  bannerUrl: string | null;
}) {
  return (
    <div className="relative z-10 w-full max-w-sm bg-ink-900 border border-ink-700 overflow-hidden">
      <div className="aspect-[21/9] bg-ink-800">
        {bannerUrl && <img src={bannerUrl} alt="" className="w-full h-full object-cover" />}
      </div>

      <div className="px-5 pb-5 relative">
        <div className="w-16 h-16 -mt-8 mb-3 rounded-full overflow-hidden bg-ink-800 border-4 border-ink-900 flex items-center justify-center">
          {crestUrl ? (
            <img
              src={crestUrl}
              alt=""
              className="w-full h-full object-cover"
              style={{ objectPosition: `${crestPosition.x}% ${crestPosition.y}%` }}
            />
          ) : (
            <span className="font-display text-lg text-paper-500">{name ? name[0].toUpperCase() : '?'}</span>
          )}
        </div>

        <h3 className="font-display text-xl leading-tight mb-1">{name || 'Naziv tima'}</h3>
        <p className="text-xs uppercase tracking-widest text-red-400 font-semibold mb-3">{sportName || 'Sport'}</p>

        <div className="flex items-center justify-between text-xs text-paper-500 pt-3 border-t border-ink-700">
          <span>{city || 'Grad'}</span>
          <span>Osnovan {CURRENT_YEAR}.</span>
        </div>
        <p className="text-xs text-paper-700 uppercase tracking-widest mt-2">0 igrača</p>
      </div>
    </div>
  );
}

function TeamCreatedCelebration({
  name,
  crestUrl,
  crestPosition,
  onContinue,
}: {
  name: string;
  crestUrl: string | null;
  crestPosition: Position;
  onContinue: () => void;
}) {
  return (
    <div className="relative w-full max-w-lg overflow-hidden bg-ink-900 border border-red-500/40">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(circle at 50% 30%, rgba(194,31,46,0.16), transparent 62%)' }}
      />

      <div className="relative z-10 text-center px-6 py-14 sm:py-16">
        <span className="fade-up-in text-xs uppercase tracking-[0.3em] text-red-400 font-semibold">
          Tim je spreman
        </span>

        <div className="mt-7 flex flex-col items-center gap-5">
          <div className="relative w-28 h-28">
            <div className="stamp-ring-pulse absolute inset-0 rounded-full border-2 border-red-400/70 pointer-events-none" />
            <div className="stamp-in relative w-28 h-28 rounded-full overflow-hidden bg-ink-800 ring-4 ring-red-500/60 flex items-center justify-center font-display text-3xl">
              {crestUrl ? (
                <img
                  src={crestUrl}
                  alt=""
                  className="w-full h-full object-cover"
                  style={{ objectPosition: `${crestPosition.x}% ${crestPosition.y}%` }}
                />
              ) : (
                <span className="text-paper-500">{name ? name[0].toUpperCase() : '?'}</span>
              )}
            </div>
          </div>

          <h2 className="fade-up-in font-display text-3xl sm:text-4xl leading-tight" style={{ animationDelay: '0.5s' }}>
            {name}
          </h2>
          <p className="fade-up-in text-paper-300 max-w-sm" style={{ animationDelay: '0.65s' }}>
            Čestitamo! Tvoj tim je uspešno napravljen i spreman je za akciju.
          </p>
        </div>

        <button
          type="button"
          onClick={onContinue}
          className="fade-up-in ticket-submit mt-9 px-8 py-3.5 font-display text-sm tracking-widest uppercase inline-flex items-center justify-center gap-2"
          style={{ animationDelay: '0.8s' }}
        >
          Idi na stranicu tima
        </button>
      </div>
    </div>
  );
}

export default function CreateTeam() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [sports, setSports] = useState<Sport[]>([]);
  const [cities, setCities] = useState<{ id: number; name: string }[]>([]);
  const [sportId, setSportId] = useState('');
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [description, setDescription] = useState('');
  const [crestFile, setCrestFile] = useState<File | null>(null);
  const [crestPreview, setCrestPreview] = useState<string | null>(null);
  const [crestPosition, setCrestPosition] = useState<Position>({ x: 50, y: 50 });
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [stepIndex, setStepIndex] = useState(0);
  const [createdTeamId, setCreatedTeamId] = useState<string | null>(null);
  const step = STEP_IDS[stepIndex];

  useEffect(() => {
    supabase
      .from('sports')
      .select('id, name')
      .order('name')
      .then(({ data }) => setSports(data ?? []));
  }, []);

  useEffect(() => {
    supabase
      .from('city')
      .select('id, name')
      .then(({ data }) => {
        const rows = (data ?? []).slice().sort((a, b) => a.name.localeCompare(b.name, 'sr'));
        setCities(rows);
      });
  }, []);

  useEffect(() => {
    return () => {
      if (crestPreview) URL.revokeObjectURL(crestPreview);
    };
  }, [crestPreview]);

  useEffect(() => {
    return () => {
      if (bannerPreview) URL.revokeObjectURL(bannerPreview);
    };
  }, [bannerPreview]);

  function goBack() {
    setError(null);
    setStepIndex((i) => Math.max(0, i - 1));
  }

  function goNext() {
    setError(null);
    setStepIndex((i) => Math.min(STEP_IDS.length - 1, i + 1));
  }

  function handleCrestSelect(file: File) {
    if (file.size > MAX_IMAGE_SIZE) {
      setError('Grb je prevelik (maks. 5MB).');
      return;
    }
    setError(null);
    setCrestFile(file);
    setCrestPreview(URL.createObjectURL(file));
    setCrestPosition({ x: 50, y: 50 });
  }

  function handleBannerSelect(file: File) {
    if (file.size > MAX_IMAGE_SIZE) {
      setError('Baner je prevelik (maks. 5MB).');
      return;
    }
    setError(null);
    setBannerFile(file);
    setBannerPreview(URL.createObjectURL(file));
  }

  async function uploadImage(teamId: string, file: File, kind: 'crest' | 'banner') {
    const ext = file.name.split('.').pop() || 'jpg';
    const path = `${user!.id}/${teamId}/${kind}.${ext}`;
    const { error: uploadError } = await supabase.storage.from('teams').upload(path, file, { upsert: true });
    if (uploadError) throw new Error(uploadError.message);
    const { data } = supabase.storage.from('teams').getPublicUrl(path);
    return data.publicUrl;
  }

  async function handleCreateTeam() {
    if (!user) return;
    setError(null);
    setSubmitting(true);

    try {
      const teamId = crypto.randomUUID();
      const crestUrl = crestFile ? await uploadImage(teamId, crestFile, 'crest') : null;
      const bannerUrl = bannerFile ? await uploadImage(teamId, bannerFile, 'banner') : null;

      const matchedCity = city.trim() ? cities.find((c) => normalizeForSearch(c.name) === normalizeForSearch(city)) : undefined;

      const { error: insertError } = await supabase.from('teams').insert({
        id: teamId,
        owner_id: user.id,
        sport_id: Number(sportId),
        name: name.trim(),
        city: matchedCity ? matchedCity.name : null,
        description: description.trim() || null,
        founded_year: CURRENT_YEAR,
        crest_url: crestUrl,
        crest_position_x: Math.round(crestPosition.x),
        crest_position_y: Math.round(crestPosition.y),
        banner_url: bannerUrl,
      });

      if (insertError) throw new Error(insertError.message);

      setSubmitting(false);
      setCreatedTeamId(teamId);
    } catch (err) {
      setSubmitting(false);
      setError(err instanceof Error ? err.message : 'Došlo je do greške pri kreiranju tima.');
    }
  }

  function handleStepSubmit(e: FormEvent) {
    e.preventDefault();

    if (step === 'naziv') {
      if (!name.trim()) {
        setError('Unesi naziv tima.');
        return;
      }
      goNext();
      return;
    }

    if (step === 'grad') {
      const matchedCity = city.trim() ? cities.find((c) => normalizeForSearch(c.name) === normalizeForSearch(city)) : undefined;
      if (city.trim() && !matchedCity) {
        setError('Izaberi grad iz ponuđene liste.');
        return;
      }
      goNext();
      return;
    }

    if (step === 'opis' || step === 'grb' || step === 'baner') {
      goNext();
      return;
    }

    if (step === 'pregled') {
      handleCreateTeam();
    }
  }

  const selectedSportName = sports.find((s) => String(s.id) === sportId)?.name ?? null;

  if (createdTeamId) {
    return (
      <div className="min-h-screen flex flex-col bg-ink-950 text-paper-100 overflow-x-hidden">
        <div className="grain" />
        <SiteHeader />
        <main className="flex-1 pt-16 flex flex-col items-center justify-center px-6 py-16">
          <TeamCreatedCelebration
            name={name}
            crestUrl={crestPreview}
            crestPosition={crestPosition}
            onContinue={() => navigate(`/timovi/${createdTeamId}`)}
          />
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-ink-950 text-paper-100 overflow-x-hidden">
      <div className="grain" />
      <SiteHeader />

      <main className="flex-1 pt-16 flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center px-6 pt-8 pb-20">
          <div className="w-full max-w-lg">
            <div className="relative h-10 mb-3 overflow-hidden">
              <div
                className="absolute inset-0 opacity-[0.06] pointer-events-none"
                style={{
                  backgroundImage:
                    'repeating-linear-gradient(135deg, var(--paper-100) 0, var(--paper-100) 1px, transparent 1px, transparent 28px)',
                  WebkitMaskImage: 'radial-gradient(ellipse at 50% 50%, black 30%, transparent 80%)',
                  maskImage: 'radial-gradient(ellipse at 50% 50%, black 30%, transparent 80%)',
                }}
              />
            </div>

            <div className="flex items-center gap-1.5 mb-8">
              {STEP_IDS.map((s, i) => (
                <div
                  key={s}
                  className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                    i <= stepIndex ? 'bg-red-500' : 'bg-ink-700'
                  }`}
                />
              ))}
            </div>

            <div className="flex items-center justify-between mb-8">
              <button
                type="button"
                onClick={() => (stepIndex === 0 ? navigate('/timovi') : goBack())}
                className="text-paper-500 hover:text-paper-100 transition-colors inline-flex items-center gap-1.5 text-xs uppercase tracking-widest"
              >
                <BackArrowIcon className="w-3.5 h-3.5" />
                {stepIndex === 0 ? 'Nazad na timove' : 'Nazad'}
              </button>
              <span className="text-xs uppercase tracking-widest text-paper-700">
                Korak {stepIndex + 1} / {STEP_IDS.length}
              </span>
            </div>

            <form key={step} onSubmit={handleStepSubmit} className="rise-1 flex flex-col items-center text-center gap-8">
              {step === 'sport' && (
                <>
                  <div>
                    <span className="text-xs uppercase tracking-widest text-red-400 font-semibold">
                      {STEP_LABELS.sport}
                    </span>
                    <h1 className="font-display text-3xl sm:text-4xl mt-3 leading-tight">U kom sportu igra tvoj tim?</h1>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full">
                    {sports.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          setSportId(String(s.id));
                          goNext();
                        }}
                        className={`px-4 py-6 border transition-colors text-sm font-medium ${
                          sportId === String(s.id)
                            ? 'border-red-400 bg-red-500/10 text-paper-100'
                            : 'border-ink-700 hover:border-red-400/60 hover:bg-ink-800 text-paper-300'
                        }`}
                      >
                        {s.name}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {step === 'naziv' && (
                <>
                  <div>
                    <span className="text-xs uppercase tracking-widest text-red-400 font-semibold">
                      {STEP_LABELS.naziv}
                    </span>
                    <h1 className="font-display text-3xl sm:text-4xl mt-3 leading-tight">Kako se zove tvoj tim?</h1>
                  </div>
                  <div className="w-full max-w-xs text-left">
                    <TicketField n="" label="" id="name" type="text" required value={name} onChange={setName} />
                  </div>
                </>
              )}

              {step === 'grad' && (
                <>
                  <div>
                    <span className="text-xs uppercase tracking-widest text-red-400 font-semibold">
                      {STEP_LABELS.grad}
                    </span>
                    <h1 className="font-display text-3xl sm:text-4xl mt-3 leading-tight">Odakle je tim?</h1>
                  </div>
                  <div className="w-full max-w-xs text-left">
                    <ComboboxField n="" label="" id="city" value={city} onChange={setCity} options={cities} />
                  </div>
                </>
              )}

              {step === 'opis' && (
                <>
                  <div>
                    <span className="text-xs uppercase tracking-widest text-red-400 font-semibold">
                      {STEP_LABELS.opis}
                    </span>
                    <h1 className="font-display text-3xl sm:text-4xl mt-3 leading-tight">Par reči o timu?</h1>
                  </div>
                  <div className="w-full max-w-sm text-left">
                    <TextAreaField
                      n=""
                      label=""
                      id="description"
                      value={description}
                      onChange={setDescription}
                      placeholder="Par rečenica o tvom timu…"
                    />
                  </div>
                </>
              )}

              {step === 'grb' && (
                <>
                  <div>
                    <span className="text-xs uppercase tracking-widest text-red-400 font-semibold">
                      {STEP_LABELS.grb}
                    </span>
                    <h1 className="font-display text-3xl sm:text-4xl mt-3 leading-tight">Postavi grb tima</h1>
                  </div>
                  <CrestField
                    n=""
                    label=""
                    previewUrl={crestPreview}
                    position={crestPosition}
                    onSelect={handleCrestSelect}
                    onPositionChange={setCrestPosition}
                  />
                </>
              )}

              {step === 'baner' && (
                <>
                  <div>
                    <span className="text-xs uppercase tracking-widest text-red-400 font-semibold">
                      {STEP_LABELS.baner}
                    </span>
                    <h1 className="font-display text-3xl sm:text-4xl mt-3 leading-tight">Postavi baner tima</h1>
                  </div>
                  <div className="w-full max-w-md">
                    <ImageField
                      n=""
                      label=""
                      shape="banner"
                      previewUrl={bannerPreview}
                      onSelect={handleBannerSelect}
                      hint="Preporučeno široka slika (npr. 1200×500), maks. 5MB."
                    />
                  </div>
                </>
              )}

              {step === 'pregled' && (
                <>
                  <div>
                    <span className="text-xs uppercase tracking-widest text-red-400 font-semibold">
                      {STEP_LABELS.pregled}
                    </span>
                    <h1 className="font-display text-3xl sm:text-4xl mt-3 leading-tight">Ovako će izgledati tvoj tim.</h1>
                  </div>
                  <TeamPreviewCard
                    name={name}
                    sportName={selectedSportName}
                    city={city}
                    crestUrl={crestPreview}
                    crestPosition={crestPosition}
                    bannerUrl={bannerPreview}
                  />
                </>
              )}

              {error && (
                <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 px-3 py-2 w-full max-w-xs">
                  {error}
                </p>
              )}

              {step !== 'sport' && (
                <button
                  type="submit"
                  disabled={submitting}
                  className="ticket-submit w-full max-w-xs py-4 font-display text-sm tracking-widest uppercase flex items-center justify-center gap-3"
                >
                  {step === 'pregled'
                    ? submitting
                      ? 'Kreiranje…'
                      : 'Napravi tim'
                    : step === 'naziv'
                      ? 'Dalje'
                      : (step === 'grad' && !city.trim()) ||
                          (step === 'opis' && !description.trim()) ||
                          (step === 'grb' && !crestPreview) ||
                          (step === 'baner' && !bannerPreview)
                        ? 'Preskoči'
                        : 'Dalje'}
                </button>
              )}
            </form>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
