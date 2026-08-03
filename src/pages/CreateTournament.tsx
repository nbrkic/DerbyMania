import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../lib/auth-context';
import { supabase } from '../lib/supabase';
import { SiteHeader } from '../components/SiteHeader';
import { SiteFooter } from '../components/SiteFooter';
import { TicketField, SelectField, ComboboxField, TextAreaField } from '../components/AuthShell';
import { ImageField, CrestField, type ImagePosition } from '../components/ImageFields';
import { BASKETBALL_SPORT_NAMES } from '../lib/positions';
import { normalizeForSearch } from '../lib/text';
import { FormSkeleton } from '../components/Skeleton';
import { compressImage, BANNER_MAX_DIMENSION, CREST_MAX_DIMENSION } from '../lib/imageCompression';

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const CURRENT_YEAR = new Date().getFullYear();

const FORMAT_OPTIONS = [
  { value: 'grupe_i_eliminacija', label: 'Grupna faza + eliminacija' },
  { value: 'liga', label: 'Liga' },
  { value: 'kup', label: 'Kup' },
];

const START_TIME_OPTIONS = Array.from({ length: 96 }, (_, i) => {
  const hours = String(Math.floor(i / 4)).padStart(2, '0');
  const minutes = String((i % 4) * 15).padStart(2, '0');
  const value = `${hours}:${minutes}`;
  return { value, label: value };
});

type Sport = { id: number; name: string };
type Position = ImagePosition;

const STEP_IDS = [
  'sport',
  'naziv',
  'format',
  'lokacija',
  'sastav',
  'trajanje',
  'termin',
  'kapacitet',
  'opis',
  'kotizacija',
  'grb',
  'baner',
  'pregled',
] as const;
type StepId = (typeof STEP_IDS)[number];
const STEP_LABELS: Record<StepId, string> = {
  sport: 'Sport',
  naziv: 'Naziv turnira',
  format: 'Format turnira',
  lokacija: 'Grad i lokacija',
  sastav: 'Sastav ekipa',
  trajanje: 'Trajanje',
  termin: 'Termin',
  kapacitet: 'Broj timova',
  opis: 'O turniru',
  kotizacija: 'Kotizacija',
  grb: 'Logo turnira',
  baner: 'Baner turnira',
  pregled: 'Pregled',
};

function BackArrowIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M19 12H5M11 18l-6-6 6-6" />
    </svg>
  );
}

function TournamentPreviewCard({
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

        <h3 className="font-display text-xl leading-tight mb-1">{name || 'Naziv turnira'}</h3>
        <p className="text-xs uppercase tracking-widest text-red-400 font-semibold mb-3">{sportName || 'Sport'}</p>

        <div className="flex items-center justify-between text-xs text-paper-500 pt-3 border-t border-ink-700">
          <span>{city || 'Grad'}</span>
        </div>
        <p className="text-xs text-paper-700 uppercase tracking-widest mt-2">0 timova</p>
      </div>
    </div>
  );
}

function TournamentCreatedCelebration({
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
          Turnir je spreman
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
            Čestitamo! Tvoj turnir je uspešno napravljen i spreman je za prijave ekipa.
          </p>
        </div>

        <button
          type="button"
          onClick={onContinue}
          className="fade-up-in ticket-submit mt-9 px-8 py-3.5 font-display text-sm tracking-widest uppercase inline-flex items-center justify-center gap-2"
          style={{ animationDelay: '0.8s' }}
        >
          Idi na stranicu turnira
        </button>
      </div>
    </div>
  );
}

export default function CreateTournament() {
  const { id: tournamentId } = useParams<{ id: string }>();
  const isEditMode = !!tournamentId;
  const { user } = useAuth();
  const navigate = useNavigate();

  const [sports, setSports] = useState<Sport[]>([]);
  const [cities, setCities] = useState<{ id: number; name: string }[]>([]);
  const [sportId, setSportId] = useState('');
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [location, setLocation] = useState('');
  const [format, setFormat] = useState('');
  const [playersPerTeam, setPlayersPerTeam] = useState('');
  const [substitutionsAllowed, setSubstitutionsAllowed] = useState('');
  const [matchDurationMinutes, setMatchDurationMinutes] = useState('');
  const [periodDurationMinutes, setPeriodDurationMinutes] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [maxTeams, setMaxTeams] = useState('');
  const [description, setDescription] = useState('');
  const [hasEntryFee, setHasEntryFee] = useState<boolean | null>(null);
  const [entryFeePerPlayer, setEntryFeePerPlayer] = useState('');
  const [crestFile, setCrestFile] = useState<File | null>(null);
  const [crestPreview, setCrestPreview] = useState<string | null>(null);
  const [crestPosition, setCrestPosition] = useState<Position>({ x: 50, y: 50 });
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loadingExisting, setLoadingExisting] = useState(isEditMode);
  const [isFinishedTournament, setIsFinishedTournament] = useState(false);

  const [stepIndex, setStepIndex] = useState(0);
  const [createdTournamentId, setCreatedTournamentId] = useState<string | null>(null);
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
    if (!tournamentId) return;

    async function loadExisting() {
      const { data } = await supabase
        .from('tournaments')
        .select(
          'sport_id, name, city, location, description, format, players_per_team, substitutions_allowed, match_duration_minutes, period_duration_minutes, start_date, start_time, max_teams, entry_fee_per_player, crest_url, crest_position_x, crest_position_y, banner_url, status'
        )
        .eq('id', tournamentId)
        .single();

      if (data) {
        setIsFinishedTournament(data.status === 'finished');
        setSportId(String(data.sport_id));
        setName(data.name);
        setCity(data.city ?? '');
        setLocation(data.location ?? '');
        setDescription(data.description ?? '');
        setFormat(data.format);
        setPlayersPerTeam(String(data.players_per_team));
        setSubstitutionsAllowed(String(data.substitutions_allowed));
        setMatchDurationMinutes(String(data.match_duration_minutes));
        setPeriodDurationMinutes(String(data.period_duration_minutes));
        setStartDate(data.start_date ?? '');
        setStartTime(data.start_time ? data.start_time.slice(0, 5) : '');
        setMaxTeams(data.max_teams != null ? String(data.max_teams) : '');
        setHasEntryFee(data.entry_fee_per_player != null ? true : false);
        setEntryFeePerPlayer(data.entry_fee_per_player != null ? String(data.entry_fee_per_player) : '');
        setCrestPreview(data.crest_url);
        setCrestPosition({ x: data.crest_position_x, y: data.crest_position_y });
        setBannerPreview(data.banner_url);
      }
      setLoadingExisting(false);
    }

    loadExisting();
  }, [tournamentId]);

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
      setError('Logo je prevelik (maks. 5MB).');
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

  async function uploadImage(tournamentId: string, file: File, kind: 'crest' | 'banner') {
    const compressed = await compressImage(file, kind === 'banner' ? BANNER_MAX_DIMENSION : CREST_MAX_DIMENSION);
    const ext = compressed.name.split('.').pop() || 'jpg';
    const path = `${user!.id}/${tournamentId}/${kind}.${ext}`;
    const { error: uploadError } = await supabase.storage.from('tournaments').upload(path, compressed, { upsert: true });
    if (uploadError) throw new Error(uploadError.message);
    const { data } = supabase.storage.from('tournaments').getPublicUrl(path);
    return data.publicUrl;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user) return;

    if (!sportId) {
      setError('Izaberi sport.');
      return;
    }
    if (!name.trim()) {
      setError('Unesi naziv turnira.');
      return;
    }
    const matchedCity = city.trim() ? cities.find((c) => normalizeForSearch(c.name) === normalizeForSearch(city)) : undefined;
    if (city.trim() && !matchedCity) {
      setError('Izaberi grad iz ponuđene liste.');
      return;
    }
    if (!format) {
      setError('Izaberi format turnira.');
      return;
    }
    if (!playersPerTeam || Number(playersPerTeam) < 1) {
      setError('Unesi broj igrača koji igraju.');
      return;
    }
    if (!substitutionsAllowed || Number(substitutionsAllowed) < 0) {
      setError('Unesi broj dozvoljenih izmena.');
      return;
    }
    if (!matchDurationMinutes || Number(matchDurationMinutes) < 1) {
      setError('Unesi trajanje utakmice.');
      return;
    }
    if (!periodDurationMinutes || Number(periodDurationMinutes) < 1) {
      setError('Unesi trajanje poluvremena/četvrtine.');
      return;
    }
    if (!startTime) {
      setError('Izaberi tačno vreme početka turnira.');
      return;
    }
    if (maxTeams && Number(maxTeams) < 2) {
      setError('Maksimalan broj timova mora biti bar 2.');
      return;
    }
    if (hasEntryFee && (!entryFeePerPlayer || Number(entryFeePerPlayer) <= 0)) {
      setError('Unesi iznos kotizacije po igraču.');
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      const id = tournamentId || crypto.randomUUID();
      const crestUrl = crestFile ? await uploadImage(id, crestFile, 'crest') : crestPreview;
      const bannerUrl = bannerFile ? await uploadImage(id, bannerFile, 'banner') : bannerPreview;

      const payload = {
        sport_id: Number(sportId),
        name: name.trim(),
        city: matchedCity ? matchedCity.name : null,
        location: location.trim() || null,
        description: description.trim() || null,
        format,
        players_per_team: Number(playersPerTeam),
        substitutions_allowed: Number(substitutionsAllowed),
        match_duration_minutes: Number(matchDurationMinutes),
        period_duration_minutes: Number(periodDurationMinutes),
        start_date: startDate || null,
        start_time: startTime || null,
        max_teams: maxTeams ? Number(maxTeams) : null,
        entry_fee_per_player: hasEntryFee ? Number(entryFeePerPlayer) : null,
        crest_url: crestUrl,
        crest_position_x: Math.round(crestPosition.x),
        crest_position_y: Math.round(crestPosition.y),
        banner_url: bannerUrl,
      };

      const { error: saveError } = isEditMode
        ? await supabase.from('tournaments').update(payload).eq('id', id)
        : await supabase.from('tournaments').insert({ id, owner_id: user.id, ...payload });

      if (saveError) throw new Error(saveError.message);

      navigate(isEditMode ? `/turniri/${id}` : '/turniri');
    } catch (err) {
      setSubmitting(false);
      setError(err instanceof Error ? err.message : 'Došlo je do greške pri čuvanju turnira.');
    }
  }

  async function handleCreateTournament() {
    if (!user) return;
    setError(null);
    setSubmitting(true);

    try {
      const id = crypto.randomUUID();
      const crestUrl = crestFile ? await uploadImage(id, crestFile, 'crest') : null;
      const bannerUrl = bannerFile ? await uploadImage(id, bannerFile, 'banner') : null;
      const matchedCity = city.trim() ? cities.find((c) => normalizeForSearch(c.name) === normalizeForSearch(city)) : undefined;

      const { error: insertError } = await supabase.from('tournaments').insert({
        id,
        owner_id: user.id,
        sport_id: Number(sportId),
        name: name.trim(),
        city: matchedCity ? matchedCity.name : null,
        location: location.trim() || null,
        description: description.trim() || null,
        format,
        players_per_team: Number(playersPerTeam),
        substitutions_allowed: Number(substitutionsAllowed),
        match_duration_minutes: Number(matchDurationMinutes),
        period_duration_minutes: Number(periodDurationMinutes),
        start_date: startDate || null,
        start_time: startTime || null,
        max_teams: maxTeams ? Number(maxTeams) : null,
        entry_fee_per_player: hasEntryFee ? Number(entryFeePerPlayer) : null,
        crest_url: crestUrl,
        crest_position_x: Math.round(crestPosition.x),
        crest_position_y: Math.round(crestPosition.y),
        banner_url: bannerUrl,
      });

      if (insertError) throw new Error(insertError.message);

      setSubmitting(false);
      setCreatedTournamentId(id);
    } catch (err) {
      setSubmitting(false);
      setError(err instanceof Error ? err.message : 'Došlo je do greške pri kreiranju turnira.');
    }
  }

  function handleStepSubmit(e: FormEvent) {
    e.preventDefault();

    if (step === 'naziv') {
      if (!name.trim()) {
        setError('Unesi naziv turnira.');
        return;
      }
      goNext();
      return;
    }

    if (step === 'lokacija') {
      const matchedCity = city.trim() ? cities.find((c) => normalizeForSearch(c.name) === normalizeForSearch(city)) : undefined;
      if (city.trim() && !matchedCity) {
        setError('Izaberi grad iz ponuđene liste.');
        return;
      }
      goNext();
      return;
    }

    if (step === 'sastav') {
      if (!playersPerTeam || Number(playersPerTeam) < 1) {
        setError('Unesi broj igrača koji igraju.');
        return;
      }
      if (!substitutionsAllowed || Number(substitutionsAllowed) < 0) {
        setError('Unesi broj dozvoljenih izmena.');
        return;
      }
      goNext();
      return;
    }

    if (step === 'trajanje') {
      if (!matchDurationMinutes || Number(matchDurationMinutes) < 1) {
        setError('Unesi trajanje utakmice.');
        return;
      }
      if (!periodDurationMinutes || Number(periodDurationMinutes) < 1) {
        setError('Unesi trajanje poluvremena/četvrtine.');
        return;
      }
      goNext();
      return;
    }

    if (step === 'termin') {
      if (!startTime) {
        setError('Izaberi tačno vreme početka turnira.');
        return;
      }
      goNext();
      return;
    }

    if (step === 'kapacitet') {
      if (maxTeams && Number(maxTeams) < 2) {
        setError('Maksimalan broj timova mora biti bar 2.');
        return;
      }
      goNext();
      return;
    }

    if (step === 'kotizacija') {
      if (hasEntryFee === null) {
        setError('Izaberi da li se plaća kotizacija.');
        return;
      }
      if (hasEntryFee && (!entryFeePerPlayer || Number(entryFeePerPlayer) <= 0)) {
        setError('Unesi iznos kotizacije po igraču.');
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
      handleCreateTournament();
    }
  }

  const selectedSportName = sports.find((s) => String(s.id) === sportId)?.name ?? null;
  const isBasketball = !!selectedSportName && BASKETBALL_SPORT_NAMES.includes(selectedSportName);
  const periodLabel = isBasketball ? 'Trajanje četvrtine (min)' : 'Trajanje poluvremena';

  if (loadingExisting) {
    return (
      <div className="min-h-screen flex flex-col bg-ink-950 text-paper-100 overflow-x-hidden">
        <div className="grain" />
        <SiteHeader />
        <main className="flex-1 pt-16 flex items-center py-16">
          <FormSkeleton fields={8} />
        </main>
        <SiteFooter />
      </div>
    );
  }

  if (isEditMode && isFinishedTournament) {
    return (
      <div className="min-h-screen flex flex-col bg-ink-950 text-paper-100 overflow-x-hidden">
        <div className="grain" />
        <SiteHeader />
        <main className="flex-1 pt-16 flex flex-col items-center justify-center gap-6 px-6 text-center">
          <p className="text-paper-500">Turnir je završen i ne može više da se menja.</p>
          <Link to={`/turniri/${tournamentId}`} className="btn-line px-6 py-3 text-sm uppercase tracking-widest">
            Nazad na turnir
          </Link>
        </main>
        <SiteFooter />
      </div>
    );
  }

  if (isEditMode) {
    return (
      <div className="min-h-screen flex flex-col bg-ink-950 text-paper-100 overflow-x-hidden">
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
                  <h2 className="font-display text-2xl sm:text-3xl mt-3 leading-tight">Ovako će izgledati tvoj turnir.</h2>
                </div>

                <TournamentPreviewCard
                  name={name}
                  sportName={selectedSportName}
                  city={city}
                  crestUrl={crestPreview}
                  crestPosition={crestPosition}
                  bannerUrl={bannerPreview}
                />
              </div>

              {/* ── FORM PANEL ──────────────────────────────────────── */}
              <div className="order-1 lg:order-1 flex-1 bg-ink-900 border-b lg:border-b-0 border-ink-700 px-6 sm:px-12 py-16 lg:py-20 flex flex-col items-center justify-center">
                <div className="w-full max-w-sm lg:max-w-none">
                  <h1 className="font-display text-3xl sm:text-4xl mb-10 leading-tight">Izmeni turnir</h1>

                  <form onSubmit={handleSubmit} className="flex flex-col gap-7">
                    <SelectField
                      n="01"
                      label="Sport"
                      id="sport"
                      required
                      placeholder="Izaberi sport"
                      value={sportId}
                      onChange={setSportId}
                      options={sports.map((s) => ({ value: String(s.id), label: s.name }))}
                    />
                    <TicketField n="02" label="Naziv turnira" id="name" type="text" required value={name} onChange={setName} />
                    <ComboboxField n="03" label="Grad" id="city" value={city} onChange={setCity} options={cities} />
                    <TicketField n="04" label="Lokacija" id="location" type="text" value={location} onChange={setLocation} />

                    <SelectField
                      n="05"
                      label="Format turnira"
                      id="format"
                      required
                      placeholder="Izaberi format"
                      value={format}
                      onChange={setFormat}
                      options={FORMAT_OPTIONS}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <TicketField
                        n="06"
                        label="Broj igrača na terenu"
                        id="players-per-team"
                        type="number"
                        required
                        value={playersPerTeam}
                        onChange={setPlayersPerTeam}
                      />
                      <TicketField
                        n="07"
                        label="Broj dozvoljenih izmena"
                        id="substitutions-allowed"
                        type="number"
                        required
                        value={substitutionsAllowed}
                        onChange={setSubstitutionsAllowed}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <TicketField
                        n="08"
                        label="Trajanje utakmice (min)"
                        id="match-duration"
                        type="number"
                        required
                        value={matchDurationMinutes}
                        onChange={setMatchDurationMinutes}
                      />
                      <TicketField
                        n="09"
                        label={periodLabel}
                        id="period-duration"
                        type="number"
                        required
                        value={periodDurationMinutes}
                        onChange={setPeriodDurationMinutes}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <TicketField
                        n="10"
                        label="Datum početka"
                        id="start-date"
                        type="date"
                        value={startDate}
                        onChange={setStartDate}
                        dateDefaultViewYear={CURRENT_YEAR}
                      />
                      <SelectField
                        n="11"
                        label="Vreme početka"
                        id="start-time"
                        required
                        placeholder="Izaberi vreme"
                        value={startTime}
                        onChange={setStartTime}
                        options={START_TIME_OPTIONS}
                      />
                    </div>

                    <TicketField
                      n="12"
                      label="Maks. broj timova"
                      id="max-teams"
                      type="number"
                      value={maxTeams}
                      onChange={setMaxTeams}
                    />

                    <TextAreaField
                      n="13"
                      label="O turniru (opciono)"
                      id="description"
                      value={description}
                      onChange={setDescription}
                      placeholder="Par rečenica o turniru…"
                    />

                    <SelectField
                      n="14"
                      label="Kotizacija"
                      id="entry-fee-choice"
                      required
                      placeholder="Da li se plaća kotizacija?"
                      value={hasEntryFee === true ? 'da' : hasEntryFee === false ? 'ne' : ''}
                      onChange={(v) => {
                        setHasEntryFee(v === 'da');
                        if (v !== 'da') setEntryFeePerPlayer('');
                      }}
                      options={[
                        { value: 'ne', label: 'Ne' },
                        { value: 'da', label: 'Da' },
                      ]}
                    />
                    {hasEntryFee && (
                      <TicketField
                        n="15"
                        label="Iznos po igraču (RSD)"
                        id="entry-fee-amount"
                        type="number"
                        required
                        value={entryFeePerPlayer}
                        onChange={setEntryFeePerPlayer}
                      />
                    )}

                    <CrestField
                      n="16"
                      label="Logo turnira"
                      previewUrl={crestPreview}
                      position={crestPosition}
                      onSelect={handleCrestSelect}
                      onPositionChange={setCrestPosition}
                    />
                    <ImageField
                      n="17"
                      label="Baner turnira"
                      shape="banner"
                      previewUrl={bannerPreview}
                      onSelect={handleBannerSelect}
                      hint="Preporučeno široka slika (npr. 1200×500), maks. 5MB."
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
                      to={`/turniri/${tournamentId}`}
                      className="btn-line w-full py-3.5 text-sm uppercase tracking-widest flex items-center justify-center"
                    >
                      Nazad na turnir
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

  if (createdTournamentId) {
    return (
      <div className="min-h-screen flex flex-col bg-ink-950 text-paper-100 overflow-x-hidden">
        <div className="grain" />
        <SiteHeader />
        <main className="flex-1 pt-16 flex flex-col items-center justify-center px-6 py-16">
          <TournamentCreatedCelebration
            name={name}
            crestUrl={crestPreview}
            crestPosition={crestPosition}
            onContinue={() => navigate(`/turniri/${createdTournamentId}`)}
          />
        </main>
        <SiteFooter />
      </div>
    );
  }

  const locationEmpty = !city.trim() && !location.trim();

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
                onClick={() => (stepIndex === 0 ? navigate('/turniri') : goBack())}
                className="text-paper-500 hover:text-paper-100 transition-colors inline-flex items-center gap-1.5 text-xs uppercase tracking-widest"
              >
                <BackArrowIcon className="w-3.5 h-3.5" />
                {stepIndex === 0 ? 'Nazad na turnire' : 'Nazad'}
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
                    <h1 className="font-display text-3xl sm:text-4xl mt-3 leading-tight">U kom sportu je turnir?</h1>
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
                    <h1 className="font-display text-3xl sm:text-4xl mt-3 leading-tight">Kako se zove turnir?</h1>
                  </div>
                  <div className="w-full max-w-xs text-left">
                    <TicketField n="" label="" id="name" type="text" required value={name} onChange={setName} />
                  </div>
                </>
              )}

              {step === 'format' && (
                <>
                  <div>
                    <span className="text-xs uppercase tracking-widest text-red-400 font-semibold">
                      {STEP_LABELS.format}
                    </span>
                    <h1 className="font-display text-3xl sm:text-4xl mt-3 leading-tight">Koji format igrate?</h1>
                  </div>
                  <div className="flex flex-col gap-3 w-full">
                    {FORMAT_OPTIONS.map((o) => (
                      <button
                        key={o.value}
                        type="button"
                        onClick={() => {
                          setFormat(o.value);
                          goNext();
                        }}
                        className={`px-4 py-5 border transition-colors text-sm font-medium ${
                          format === o.value
                            ? 'border-red-400 bg-red-500/10 text-paper-100'
                            : 'border-ink-700 hover:border-red-400/60 hover:bg-ink-800 text-paper-300'
                        }`}
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {step === 'lokacija' && (
                <>
                  <div>
                    <span className="text-xs uppercase tracking-widest text-red-400 font-semibold">
                      {STEP_LABELS.lokacija}
                    </span>
                    <h1 className="font-display text-3xl sm:text-4xl mt-3 leading-tight">Gde se igra?</h1>
                    <p className="text-paper-500 mt-3">Opciono — možeš i da preskočiš.</p>
                  </div>
                  <div className="w-full max-w-xs flex flex-col gap-6 text-left">
                    <ComboboxField n="" label="Grad" id="city" value={city} onChange={setCity} options={cities} />
                    <TicketField n="" label="Lokacija" id="location" type="text" value={location} onChange={setLocation} />
                  </div>
                </>
              )}

              {step === 'sastav' && (
                <>
                  <div>
                    <span className="text-xs uppercase tracking-widest text-red-400 font-semibold">
                      {STEP_LABELS.sastav}
                    </span>
                    <h1 className="font-display text-3xl sm:text-4xl mt-3 leading-tight">Koliki je sastav ekipa?</h1>
                  </div>
                  <div className="w-full max-w-xs grid grid-cols-2 gap-4 text-left">
                    <TicketField
                      n=""
                      label="Igrača na terenu"
                      id="players-per-team"
                      type="number"
                      required
                      value={playersPerTeam}
                      onChange={setPlayersPerTeam}
                    />
                    <TicketField
                      n=""
                      label="Dozvoljene izmene"
                      id="substitutions-allowed"
                      type="number"
                      required
                      value={substitutionsAllowed}
                      onChange={setSubstitutionsAllowed}
                    />
                  </div>
                </>
              )}

              {step === 'trajanje' && (
                <>
                  <div>
                    <span className="text-xs uppercase tracking-widest text-red-400 font-semibold">
                      {STEP_LABELS.trajanje}
                    </span>
                    <h1 className="font-display text-3xl sm:text-4xl mt-3 leading-tight">Koliko traje utakmica?</h1>
                  </div>
                  <div className="w-full max-w-xs grid grid-cols-2 gap-4 text-left">
                    <TicketField
                      n=""
                      label="Trajanje utakmice (min)"
                      id="match-duration"
                      type="number"
                      required
                      value={matchDurationMinutes}
                      onChange={setMatchDurationMinutes}
                    />
                    <TicketField
                      n=""
                      label={periodLabel}
                      id="period-duration"
                      type="number"
                      required
                      value={periodDurationMinutes}
                      onChange={setPeriodDurationMinutes}
                    />
                  </div>
                </>
              )}

              {step === 'termin' && (
                <>
                  <div>
                    <span className="text-xs uppercase tracking-widest text-red-400 font-semibold">
                      {STEP_LABELS.termin}
                    </span>
                    <h1 className="font-display text-3xl sm:text-4xl mt-3 leading-tight">Kada počinje turnir?</h1>
                  </div>
                  <div className="w-full max-w-xs flex flex-col gap-6 text-left">
                    <TicketField
                      n=""
                      label="Datum početka (opciono)"
                      id="start-date"
                      type="date"
                      value={startDate}
                      onChange={setStartDate}
                      dateDefaultViewYear={CURRENT_YEAR}
                    />
                    <SelectField
                      n=""
                      label="Vreme početka"
                      id="start-time"
                      required
                      placeholder="Izaberi vreme"
                      value={startTime}
                      onChange={setStartTime}
                      options={START_TIME_OPTIONS}
                    />
                  </div>
                </>
              )}

              {step === 'kapacitet' && (
                <>
                  <div>
                    <span className="text-xs uppercase tracking-widest text-red-400 font-semibold">
                      {STEP_LABELS.kapacitet}
                    </span>
                    <h1 className="font-display text-3xl sm:text-4xl mt-3 leading-tight">Koliko timova prihvatate?</h1>
                    <p className="text-paper-500 mt-3">Opciono — ostavi prazno za neograničen broj.</p>
                  </div>
                  <div className="w-full max-w-xs text-left">
                    <TicketField
                      n=""
                      label="Maks. broj timova"
                      id="max-teams"
                      type="number"
                      value={maxTeams}
                      onChange={setMaxTeams}
                    />
                  </div>
                </>
              )}

              {step === 'opis' && (
                <>
                  <div>
                    <span className="text-xs uppercase tracking-widest text-red-400 font-semibold">
                      {STEP_LABELS.opis}
                    </span>
                    <h1 className="font-display text-3xl sm:text-4xl mt-3 leading-tight">Par reči o turniru?</h1>
                    <p className="text-paper-500 mt-3">Opciono — možeš i da preskočiš.</p>
                  </div>
                  <div className="w-full max-w-sm text-left">
                    <TextAreaField
                      n=""
                      label=""
                      id="description"
                      value={description}
                      onChange={setDescription}
                      placeholder="Par rečenica o turniru…"
                    />
                  </div>
                </>
              )}

              {step === 'kotizacija' && (
                <>
                  <div>
                    <span className="text-xs uppercase tracking-widest text-red-400 font-semibold">
                      {STEP_LABELS.kotizacija}
                    </span>
                    <h1 className="font-display text-3xl sm:text-4xl mt-3 leading-tight">Da li se plaća kotizacija?</h1>
                  </div>
                  <div className="flex flex-col gap-3 w-full max-w-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setHasEntryFee(true);
                      }}
                      className={`px-4 py-5 border transition-colors text-sm font-medium ${
                        hasEntryFee === true
                          ? 'border-red-400 bg-red-500/10 text-paper-100'
                          : 'border-ink-700 hover:border-red-400/60 hover:bg-ink-800 text-paper-300'
                      }`}
                    >
                      Da
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setHasEntryFee(false);
                        setEntryFeePerPlayer('');
                      }}
                      className={`px-4 py-5 border transition-colors text-sm font-medium ${
                        hasEntryFee === false
                          ? 'border-red-400 bg-red-500/10 text-paper-100'
                          : 'border-ink-700 hover:border-red-400/60 hover:bg-ink-800 text-paper-300'
                      }`}
                    >
                      Ne
                    </button>
                  </div>
                  {hasEntryFee === true && (
                    <div className="w-full max-w-xs text-left">
                      <TicketField
                        n=""
                        label="Iznos po igraču (RSD)"
                        id="entry-fee-amount"
                        type="number"
                        required
                        value={entryFeePerPlayer}
                        onChange={setEntryFeePerPlayer}
                      />
                    </div>
                  )}
                </>
              )}

              {step === 'grb' && (
                <>
                  <div>
                    <span className="text-xs uppercase tracking-widest text-red-400 font-semibold">
                      {STEP_LABELS.grb}
                    </span>
                    <h1 className="font-display text-3xl sm:text-4xl mt-3 leading-tight">Postavi logo turnira</h1>
                    <p className="text-paper-500 mt-3">Opciono — možeš i da preskočiš.</p>
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
                    <h1 className="font-display text-3xl sm:text-4xl mt-3 leading-tight">Postavi baner turnira</h1>
                    <p className="text-paper-500 mt-3">Opciono — možeš i da preskočiš.</p>
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
                    <h1 className="font-display text-3xl sm:text-4xl mt-3 leading-tight">Ovako će izgledati tvoj turnir.</h1>
                  </div>
                  <TournamentPreviewCard
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

              {step !== 'sport' && step !== 'format' && (
                <button
                  type="submit"
                  disabled={submitting}
                  className="ticket-submit w-full max-w-xs py-4 font-display text-sm tracking-widest uppercase flex items-center justify-center gap-3"
                >
                  {step === 'pregled'
                    ? submitting
                      ? 'Kreiranje…'
                      : 'Napravi turnir'
                    : (step === 'lokacija' && locationEmpty) ||
                        (step === 'kapacitet' && !maxTeams.trim()) ||
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
