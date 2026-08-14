import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../lib/auth-context';
import { supabase } from '../lib/supabase';
import { SiteHeader } from '../components/SiteHeader';
import { SiteFooter } from '../components/SiteFooter';
import { TicketField, ComboboxField, TextAreaField } from '../components/AuthShell';
import { Seo } from '../components/Seo';
import { ImageField, CrestField, type ImagePosition } from '../components/ImageFields';
import { normalizeForSearch } from '../lib/text';
import { FormSkeleton } from '../components/Skeleton';
import { compressImage, BANNER_MAX_DIMENSION, CREST_MAX_DIMENSION } from '../lib/imageCompression';
import { playerCountLabel } from './Teams';

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const CURRENT_YEAR = new Date().getFullYear();
const TEAM_NAME_REGEX = /^[A-Za-z0-9ČĆŽŠĐčćžšđ|&#-]+(?: [A-Za-z0-9ČĆŽŠĐčćžšđ|&#-]+)*$/;
const MIN_TEAM_NAME_LENGTH = 3;
const MIN_DESCRIPTION_LENGTH = 10;

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
  founderName,
  foundedYear,
  playerCount,
}: {
  name: string;
  sportName: string | null;
  city: string;
  crestUrl: string | null;
  crestPosition: Position;
  bannerUrl: string | null;
  founderName: string | null;
  foundedYear: number;
  playerCount: number;
}) {
  return (
    <div className="relative z-10 w-full max-w-sm bg-ink-900 border border-ink-700 overflow-hidden text-left">
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

        <div className="grid grid-cols-2 gap-y-1.5 text-xs text-paper-500 pt-3 border-t border-ink-700">
          <span className="truncate pr-2">{city || 'Grad'}</span>
          <span className="text-right">Osnovan {foundedYear}.</span>
          <span className="truncate pr-2 text-paper-100">{founderName || '—'}</span>
          <span className="text-right">{playerCountLabel(playerCount)}</span>
        </div>
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
    <div className="relative w-full max-w-lg overflow-hidden bg-ink-900 border border-red-500/40 mt-10 sm:mt-16">
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
  const { id: teamId } = useParams<{ id: string }>();
  const isEditMode = !!teamId;
  const { user, profile } = useAuth();
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
  const [foundedYear, setFoundedYear] = useState<number>(CURRENT_YEAR);
  const [existingPlayerCount, setExistingPlayerCount] = useState(0);
  const [existingFounderName, setExistingFounderName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [editAttempted, setEditAttempted] = useState(false);
  const [loadingExisting, setLoadingExisting] = useState(isEditMode);
  const [accessDenied, setAccessDenied] = useState(false);

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
    if (!teamId) return;

    async function loadExisting() {
      const { data } = await supabase
        .from('teams')
        .select('owner_id, sport_id, name, city, description, founded_year, crest_url, crest_position_x, crest_position_y, banner_url')
        .eq('id', teamId)
        .is('deleted_at', null)
        .single();

      if (!data || (user && data.owner_id !== user.id)) {
        setAccessDenied(true);
        setLoadingExisting(false);
        return;
      }

      setSportId(String(data.sport_id));
      setName(data.name);
      setCity(data.city ?? '');
      setDescription(data.description ?? '');
      setFoundedYear(data.founded_year ?? CURRENT_YEAR);
      setCrestPreview(data.crest_url);
      setCrestPosition({ x: data.crest_position_x, y: data.crest_position_y });
      setBannerPreview(data.banner_url);

      const { count } = await supabase
        .from('team_members')
        .select('user_id', { count: 'exact', head: true })
        .eq('team_id', teamId);
      setExistingPlayerCount(count ?? 0);

      const { data: founder } = await supabase
        .from('public_profiles')
        .select('full_name')
        .eq('id', data.owner_id)
        .single();
      setExistingFounderName(founder?.full_name ?? null);

      setLoadingExisting(false);
    }

    loadExisting();
  }, [teamId, user]);

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
    setAttempted(false);
    setStepIndex((i) => Math.max(0, i - 1));
  }

  function goNext() {
    setError(null);
    setAttempted(false);
    setStepIndex((i) => Math.min(STEP_IDS.length - 1, i + 1));
  }

  function getStepFieldError(): string | undefined {
    if (step === 'naziv') {
      const trimmed = name.trim();
      if (!trimmed) return 'Unesi naziv tima.';
      if (!TEAM_NAME_REGEX.test(trimmed)) return 'Naziv tima može sadržati slova, brojeve, razmak i simbole - | & #.';
      if (trimmed.length < MIN_TEAM_NAME_LENGTH) return `Naziv tima mora imati najmanje ${MIN_TEAM_NAME_LENGTH} karaktera.`;
      return undefined;
    }

    if (step === 'grad') {
      const trimmed = city.trim();
      if (!trimmed) return 'Unesi grad tima.';
      const matchedCity = cities.find((c) => normalizeForSearch(c.name) === normalizeForSearch(trimmed));
      if (!matchedCity) return 'Izaberi grad iz ponuđene liste.';
      return undefined;
    }

    if (step === 'opis') {
      const normalizedLength = description.trim().replace(/\s+/g, ' ').length;
      if (normalizedLength < MIN_DESCRIPTION_LENGTH) return `Opis mora imati najmanje ${MIN_DESCRIPTION_LENGTH} karaktera.`;
      return undefined;
    }

    return undefined;
  }

  const fieldError = attempted ? getStepFieldError() : undefined;

  type EditFieldErrors = { name?: string; city?: string; description?: string };

  function getEditFieldErrors(): EditFieldErrors {
    const errors: EditFieldErrors = {};

    const trimmedName = name.trim();
    if (!trimmedName) errors.name = 'Unesi naziv tima.';
    else if (!TEAM_NAME_REGEX.test(trimmedName)) errors.name = 'Naziv tima može sadržati slova, brojeve, razmak i simbole - | & #.';
    else if (trimmedName.length < MIN_TEAM_NAME_LENGTH) errors.name = `Naziv tima mora imati najmanje ${MIN_TEAM_NAME_LENGTH} karaktera.`;

    const trimmedCity = city.trim();
    if (!trimmedCity) {
      errors.city = 'Unesi grad tima.';
    } else {
      const matchedCity = cities.find((c) => normalizeForSearch(c.name) === normalizeForSearch(trimmedCity));
      if (!matchedCity) errors.city = 'Izaberi grad iz ponuđene liste.';
    }

    const normalizedDescriptionLength = description.trim().replace(/\s+/g, ' ').length;
    if (normalizedDescriptionLength < MIN_DESCRIPTION_LENGTH) {
      errors.description = `Opis mora imati najmanje ${MIN_DESCRIPTION_LENGTH} karaktera.`;
    }

    return errors;
  }

  const EDIT_FIELD_IDS: { key: keyof EditFieldErrors; id: string }[] = [
    { key: 'name', id: 'name' },
    { key: 'city', id: 'city' },
    { key: 'description', id: 'description' },
  ];

  const editFieldErrors = editAttempted ? getEditFieldErrors() : {};

  async function handleSaveTeam(e: FormEvent) {
    e.preventDefault();
    if (!user || !teamId) return;

    setEditAttempted(true);
    const errors = getEditFieldErrors();
    const firstInvalid = EDIT_FIELD_IDS.find(({ key }) => errors[key]);
    if (firstInvalid) {
      document.getElementById(firstInvalid.id)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    const matchedCity = cities.find((c) => normalizeForSearch(c.name) === normalizeForSearch(city.trim()));

    setError(null);
    setSubmitting(true);

    try {
      const crestUrl = crestFile ? await uploadImage(teamId, crestFile, 'crest') : crestPreview;
      const bannerUrl = bannerFile ? await uploadImage(teamId, bannerFile, 'banner') : bannerPreview;

      const { error: updateError } = await supabase
        .from('teams')
        .update({
          name: name.trim(),
          city: matchedCity ? matchedCity.name : null,
          description: description.trim() || null,
          crest_url: crestUrl,
          crest_position_x: Math.round(crestPosition.x),
          crest_position_y: Math.round(crestPosition.y),
          banner_url: bannerUrl,
        })
        .eq('id', teamId);

      if (updateError) throw new Error(updateError.message);

      navigate(`/timovi/${teamId}`);
    } catch (err) {
      setSubmitting(false);
      setError(err instanceof Error ? err.message : 'Došlo je do greške pri čuvanju tima.');
    }
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
    const compressed = await compressImage(file, kind === 'banner' ? BANNER_MAX_DIMENSION : CREST_MAX_DIMENSION);
    const ext = compressed.name.split('.').pop() || 'jpg';
    const path = `${user!.id}/${teamId}/${kind}.${ext}`;
    const { error: uploadError } = await supabase.storage.from('teams').upload(path, compressed, { upsert: true });
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
        captain_id: user.id,
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
    setError(null);

    if (step === 'naziv' || step === 'grad' || step === 'opis') {
      setAttempted(true);
      if (getStepFieldError()) return;
      goNext();
      return;
    }

    if (step === 'grb' || step === 'baner') {
      goNext();
      return;
    }

    if (step === 'pregled') {
      handleCreateTeam();
    }
  }

  const selectedSportName = sports.find((s) => String(s.id) === sportId)?.name ?? null;

  if (loadingExisting) {
    return (
      <div className="min-h-screen flex flex-col bg-ink-950 text-paper-100 overflow-x-hidden">
        <div className="grain" />
        <SiteHeader />
        <main className="flex-1 pt-16 flex items-center py-16">
          <FormSkeleton fields={5} />
        </main>
        <SiteFooter />
      </div>
    );
  }

  if (isEditMode && accessDenied) {
    return (
      <div className="min-h-screen flex flex-col bg-ink-950 text-paper-100 overflow-x-hidden">
        <div className="grain" />
        <SiteHeader />
        <main className="flex-1 pt-16 flex flex-col items-center justify-center gap-6 px-6 text-center">
          <p className="text-paper-500">Nemaš pristup izmeni ovog tima.</p>
          <Link to={`/timovi/${teamId}`} className="btn-line px-6 py-3 text-sm uppercase tracking-widest">
            Nazad na tim
          </Link>
        </main>
        <SiteFooter />
      </div>
    );
  }

  if (isEditMode) {
    return (
      <div className="min-h-screen flex flex-col bg-ink-950 text-paper-100 overflow-x-hidden">
        <Seo
          title="Izmena tima"
          description="Izmeni podatke tima na DerbyManiji."
          path={`/timovi/${teamId}/izmena`}
          noindex
        />
        <div className="grain" />
        <SiteHeader />

        <main className="flex-1 pt-16 flex flex-col">
          <div className="flex-1 flex flex-col max-w-6xl mx-auto w-full">
            <div className="flex-1 flex flex-col lg:grid lg:grid-cols-2 mx-6 lg:border-x border-ink-700">
              {/* ── PREVIEW PANEL ───────────────────────────────────── */}
              <div className="order-2 lg:order-2 flex-1 relative overflow-hidden bg-ink-950 lg:border-l border-ink-700 flex flex-col items-center justify-center px-6 py-14 lg:py-20">
                <div
                  className="absolute inset-x-0 top-10 h-64 opacity-[0.08] pointer-events-none"
                  style={{
                    backgroundImage:
                      'repeating-linear-gradient(135deg, var(--paper-100) 0, var(--paper-100) 1px, transparent 1px, transparent 28px)',
                    WebkitMaskImage: 'radial-gradient(ellipse at center, black 35%, transparent 80%)',
                    maskImage: 'radial-gradient(ellipse at center, black 35%, transparent 80%)',
                  }}
                />

                <div className="relative z-10 text-center mb-8 max-w-sm">
                  <span className="text-xs uppercase tracking-widest text-red-400 font-semibold">Pregled</span>
                  <h2 className="font-display text-2xl sm:text-3xl mt-3 leading-tight">Ovako će izgledati tvoj tim.</h2>
                </div>

                <TeamPreviewCard
                  name={name}
                  sportName={selectedSportName}
                  city={city}
                  crestUrl={crestPreview}
                  crestPosition={crestPosition}
                  bannerUrl={bannerPreview}
                  founderName={existingFounderName ?? profile?.full_name ?? null}
                  foundedYear={foundedYear}
                  playerCount={existingPlayerCount}
                />
              </div>

              {/* ── FORM PANEL ──────────────────────────────────────── */}
              <div className="order-1 lg:order-1 flex-1 bg-ink-900 border-b lg:border-b-0 border-ink-700 px-6 sm:px-12 py-16 lg:py-20 flex flex-col items-center justify-center">
                <div className="w-full max-w-sm lg:max-w-none">
                  <h1 className="font-display text-3xl sm:text-4xl mb-10 leading-tight">Izmeni tim</h1>

                  <form onSubmit={handleSaveTeam} noValidate className="flex flex-col gap-7">
                    <TicketField
                      n="01"
                      label="Naziv tima"
                      id="name"
                      type="text"
                      required
                      value={name}
                      onChange={setName}
                      error={editFieldErrors.name}
                    />
                    <ComboboxField
                      n="02"
                      label="Grad"
                      id="city"
                      value={city}
                      onChange={setCity}
                      options={cities}
                      error={editFieldErrors.city}
                    />
                    <TextAreaField
                      n="03"
                      label="O timu"
                      id="description"
                      required
                      value={description}
                      onChange={setDescription}
                      placeholder="Par rečenica o timu…"
                      error={editFieldErrors.description}
                    />

                    <CrestField
                      n="04"
                      label="Grb tima"
                      previewUrl={crestPreview}
                      position={crestPosition}
                      onSelect={handleCrestSelect}
                      onPositionChange={setCrestPosition}
                    />
                    <ImageField
                      n="05"
                      label="Baner tima"
                      shape="banner"
                      previewUrl={bannerPreview}
                      onSelect={handleBannerSelect}
                      hint="JPG / PNG / WEBP - Maksimalno 5MB"
                    />

                    {error && (
                      <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 px-3 py-2">{error}</p>
                    )}

                    <button
                      type="submit"
                      disabled={submitting}
                      className="ticket-submit w-full mt-2 py-4 font-display text-sm tracking-widest uppercase flex items-center justify-center gap-3"
                    >
                      {submitting ? 'Čuvanje…' : 'Sačuvaj izmene'}
                    </button>

                    <Link
                      to={`/timovi/${teamId}`}
                      className="btn-line w-full py-3.5 text-sm uppercase tracking-widest flex items-center justify-center"
                    >
                      Nazad na tim
                    </Link>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </main>

        <SiteFooter />
      </div>
    );
  }

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
      <Seo title="Novi tim" description="Napravi novi tim na DerbyManiji." path="/timovi/novi" noindex />
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

            <form key={step} onSubmit={handleStepSubmit} noValidate className="rise-1 flex flex-col items-center text-center gap-8">
              {step === 'sport' && (
                <>
                  <div>
                    <span className="text-xs uppercase tracking-widest text-red-400 font-semibold">
                      {STEP_LABELS.sport}
                    </span>
                    <h1 className="font-display text-3xl sm:text-4xl mt-3 leading-tight">Koji sport će igrati tvoj tim?</h1>
                  </div>
                  <div className="grid grid-cols-2 gap-3 w-full">
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
                    <h1 className="font-display text-3xl sm:text-4xl mt-3 leading-tight">Kako će se zvati tvoj tim?</h1>
                  </div>
                  <div className="w-full max-w-xs text-left">
                    <TicketField n="" label="" id="name" type="text" value={name} onChange={setName} error={fieldError} />
                  </div>
                </>
              )}

              {step === 'grad' && (
                <>
                  <div>
                    <span className="text-xs uppercase tracking-widest text-red-400 font-semibold">
                      {STEP_LABELS.grad}
                    </span>
                    <h1 className="font-display text-3xl sm:text-4xl mt-3 leading-tight">Iz kog grada je tvoj tim?</h1>
                  </div>
                  <div className="w-full max-w-xs text-left">
                    <ComboboxField n="" label="" id="city" value={city} onChange={setCity} options={cities} error={fieldError} />
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
                      error={fieldError}
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
                      hint="JPG / PNG / WEBP - Maksimalno 5MB"
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
                    founderName={profile?.full_name ?? null}
                    foundedYear={CURRENT_YEAR}
                    playerCount={0}
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
                    : (step === 'grb' && !crestPreview) || (step === 'baner' && !bannerPreview)
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
