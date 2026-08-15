import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../lib/auth-context';
import { supabase } from '../lib/supabase';
import { SiteHeader } from '../components/SiteHeader';
import { SiteFooter } from '../components/SiteFooter';
import { TicketField, SelectField, ComboboxField, TextAreaField } from '../components/AuthShell';
import { Seo } from '../components/Seo';
import { ImageField, CrestField, type ImagePosition } from '../components/ImageFields';
import { BASKETBALL_SPORT_NAMES } from '../lib/positions';
import { normalizeForSearch } from '../lib/text';
import { FormSkeleton } from '../components/Skeleton';
import { BANNER_MAX_DIMENSION, CREST_MAX_DIMENSION } from '../lib/imageCompression';
import { uploadImageWithCleanup } from '../lib/storageUpload';
import { formatStartDate, teamCountLabel } from './Tournaments';

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const CURRENT_YEAR = new Date().getFullYear();
const NAME_REGEX = /^[A-Za-z0-9ČĆŽŠĐčćžšđ|&#-]+(?: [A-Za-z0-9ČĆŽŠĐčćžšđ|&#-]+)*$/;
const MIN_NAME_LENGTH = 3;
const MIN_DESCRIPTION_LENGTH = 10;
const MIN_PLAYERS_PER_TEAM = 1;
const MAX_PLAYERS_PER_TEAM = 20;
const MIN_SUBSTITUTIONS = 0;
const MAX_SUBSTITUTIONS = 20;
const MIN_MATCH_DURATION = 1;
const MIN_PERIOD_DURATION = 0;
const MIN_MAX_TEAMS = 2;
const AGE_CLEAR = '__clear__';
const MIN_ENTRY_FEE = 1;
const MIN_AGE_YEARS = 8;
const MAX_AGE_YEARS = 80;
const AGE_OPTIONS = Array.from({ length: MAX_AGE_YEARS - MIN_AGE_YEARS + 1 }, (_, i) => {
  const age = MIN_AGE_YEARS + i;
  return { value: String(age), label: String(age) };
});

function tomorrowISO() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

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
  'starost',
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
  starost: 'Starosno ograničenje',
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
  startDate,
  founderName,
  maxTeams,
  crestUrl,
  crestPosition,
  bannerUrl,
}: {
  name: string;
  sportName: string | null;
  city: string;
  startDate: string;
  founderName: string | null;
  maxTeams: number | null;
  crestUrl: string | null;
  crestPosition: Position;
  bannerUrl: string | null;
}) {
  const dateRange = formatStartDate(startDate || null);
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

        <h3 className="font-display text-xl leading-tight mb-1">{name || 'Naziv turnira'}</h3>
        <p className="text-xs uppercase tracking-widest text-red-400 font-semibold mb-3">{sportName || 'Sport'}</p>

        <div className="flex items-center justify-between text-xs text-paper-500 pt-3 border-t border-ink-700">
          <span>{city || 'Grad'}</span>
          <span>{dateRange || ''}</span>
        </div>
        <div className="flex items-center justify-between text-xs text-paper-500 mt-2">
          <span className="text-paper-100">{founderName || ''}</span>
          <span>{teamCountLabel(0, maxTeams)}</span>
        </div>
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
  const { user, profile } = useAuth();
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
  const [capacityMode, setCapacityMode] = useState<'limited' | 'unlimited'>('unlimited');
  const [hasAgeRestriction, setHasAgeRestriction] = useState<boolean | null>(null);
  const [minAge, setMinAge] = useState('');
  const [maxAge, setMaxAge] = useState('');
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
  const [attempted, setAttempted] = useState(false);
  const [editAttempted, setEditAttempted] = useState(false);

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
          'sport_id, name, city, location, description, format, players_per_team, substitutions_allowed, match_duration_minutes, period_duration_minutes, start_date, start_time, max_teams, min_birth_year, max_birth_year, entry_fee_per_player, crest_url, crest_position_x, crest_position_y, banner_url, status'
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
        setCapacityMode(data.max_teams != null ? 'limited' : 'unlimited');
        setHasAgeRestriction(data.min_birth_year != null || data.max_birth_year != null);
        setMinAge(data.max_birth_year != null ? String(CURRENT_YEAR - data.max_birth_year) : '');
        setMaxAge(data.min_birth_year != null ? String(CURRENT_YEAR - data.min_birth_year) : '');
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
    setAttempted(false);
    setStepIndex((i) => Math.max(0, i - 1));
  }

  function goNext() {
    setError(null);
    setAttempted(false);
    setStepIndex((i) => Math.min(STEP_IDS.length - 1, i + 1));
  }

  type StepFieldErrors = {
    sport?: string;
    name?: string;
    city?: string;
    location?: string;
    format?: string;
    playersPerTeam?: string;
    substitutionsAllowed?: string;
    matchDuration?: string;
    periodDuration?: string;
    startDate?: string;
    startTime?: string;
    maxTeams?: string;
    ageRestrictionChoice?: string;
    ageRestrictionRange?: string;
    description?: string;
    entryFeeChoice?: string;
    entryFeeAmount?: string;
  };

  function getStepFieldErrors(): StepFieldErrors {
    const errors: StepFieldErrors = {};

    if (step === 'naziv') {
      const trimmed = name.trim();
      if (!trimmed) errors.name = 'Unesi naziv turnira.';
      else if (!NAME_REGEX.test(trimmed)) errors.name = 'Naziv turnira može sadržati slova, brojeve, razmak i simbole - | & #.';
      else if (trimmed.length < MIN_NAME_LENGTH) errors.name = `Naziv turnira mora imati najmanje ${MIN_NAME_LENGTH} karaktera.`;
    }

    if (step === 'lokacija') {
      const trimmedCity = city.trim();
      if (!trimmedCity) {
        errors.city = 'Unesi grad turnira.';
      } else {
        const matchedCity = cities.find((c) => normalizeForSearch(c.name) === normalizeForSearch(trimmedCity));
        if (!matchedCity) errors.city = 'Izaberi grad iz ponuđene liste.';
      }
      if (!location.trim()) errors.location = 'Unesi lokaciju turnira.';
    }

    if (step === 'sastav') {
      if (!playersPerTeam.trim()) errors.playersPerTeam = 'Unesi broj igrača na terenu.';
      else if (Number(playersPerTeam) < MIN_PLAYERS_PER_TEAM || Number(playersPerTeam) > MAX_PLAYERS_PER_TEAM) {
        errors.playersPerTeam = `Broj igrača mora biti između ${MIN_PLAYERS_PER_TEAM} i ${MAX_PLAYERS_PER_TEAM}.`;
      }
      if (!substitutionsAllowed.trim()) errors.substitutionsAllowed = 'Unesi broj dozvoljenih izmena.';
      else if (Number(substitutionsAllowed) < MIN_SUBSTITUTIONS || Number(substitutionsAllowed) > MAX_SUBSTITUTIONS) {
        errors.substitutionsAllowed = `Broj izmena mora biti između ${MIN_SUBSTITUTIONS} i ${MAX_SUBSTITUTIONS}.`;
      }
    }

    if (step === 'trajanje') {
      if (!matchDurationMinutes.trim()) errors.matchDuration = 'Unesi trajanje utakmice.';
      else if (Number(matchDurationMinutes) < MIN_MATCH_DURATION) errors.matchDuration = `Trajanje utakmice mora biti bar ${MIN_MATCH_DURATION} minut.`;
      if (showPeriodField) {
        if (!periodDurationMinutes.trim()) errors.periodDuration = 'Unesi trajanje pauze.';
        else if (Number(periodDurationMinutes) < MIN_PERIOD_DURATION) errors.periodDuration = 'Trajanje pauze ne može biti negativno.';
      }
    }

    if (step === 'termin') {
      if (!startDate) errors.startDate = 'Unesi datum početka turnira.';
      if (!startTime) errors.startTime = 'Izaberi tačno vreme početka turnira.';
    }

    if (step === 'kapacitet' && capacityMode === 'limited') {
      if (!maxTeams.trim()) errors.maxTeams = 'Unesi broj timova.';
      else if (Number(maxTeams) < MIN_MAX_TEAMS) errors.maxTeams = `Turnir mora imati bar ${MIN_MAX_TEAMS} tima.`;
    }

    if (step === 'starost') {
      if (hasAgeRestriction === null) {
        errors.ageRestrictionChoice = 'Izaberi da li turnir ima starosno ograničenje.';
      } else if (hasAgeRestriction) {
        if (!minAge && !maxAge) {
          errors.ageRestrictionRange = 'Izaberi bar jednu granicu starosti.';
        } else if (minAge && maxAge && Number(minAge) > Number(maxAge)) {
          errors.ageRestrictionRange = 'Minimalna starost mora biti manja ili jednaka maksimalnoj.';
        }
      }
    }

    if (step === 'opis') {
      const normalizedLength = description.trim().replace(/\s+/g, ' ').length;
      if (normalizedLength < MIN_DESCRIPTION_LENGTH) errors.description = `Opis mora imati najmanje ${MIN_DESCRIPTION_LENGTH} karaktera.`;
    }

    if (step === 'kotizacija') {
      if (hasEntryFee === null) errors.entryFeeChoice = 'Izaberi da li se plaća kotizacija.';
      else if (hasEntryFee && (!entryFeePerPlayer.trim() || Number(entryFeePerPlayer) < MIN_ENTRY_FEE)) {
        errors.entryFeeAmount = `Iznos kotizacije mora biti bar ${MIN_ENTRY_FEE} din.`;
      }
    }

    return errors;
  }

  const selectedSportName = sports.find((s) => String(s.id) === sportId)?.name ?? null;
  const isBasketball = !!selectedSportName && BASKETBALL_SPORT_NAMES.includes(selectedSportName);
  const isBasket = selectedSportName === 'Basket';
  // Basket se igra do određenog broja poena / vremena, bez poluvremena — pauza nema smisla, pa je polje sakriveno.
  const showPeriodField = !isBasket;
  const periodLabel = isBasketball ? 'Trajanje pauze između četvrtina (min)' : 'Trajanje pauze između poluvremena (min)';

  const fieldErrors = attempted ? getStepFieldErrors() : {};

  function getEditFieldErrors(): StepFieldErrors {
    const errors: StepFieldErrors = {};

    if (!sportId) errors.sport = 'Izaberi sport.';

    const trimmedName = name.trim();
    if (!trimmedName) errors.name = 'Unesi naziv turnira.';
    else if (!NAME_REGEX.test(trimmedName)) errors.name = 'Naziv turnira može sadržati slova, brojeve, razmak i simbole - | & #.';
    else if (trimmedName.length < MIN_NAME_LENGTH) errors.name = `Naziv turnira mora imati najmanje ${MIN_NAME_LENGTH} karaktera.`;

    const trimmedCity = city.trim();
    if (!trimmedCity) {
      errors.city = 'Unesi grad turnira.';
    } else {
      const matchedCity = cities.find((c) => normalizeForSearch(c.name) === normalizeForSearch(trimmedCity));
      if (!matchedCity) errors.city = 'Izaberi grad iz ponuđene liste.';
    }
    if (!location.trim()) errors.location = 'Unesi lokaciju turnira.';

    if (!format) errors.format = 'Izaberi format turnira.';

    if (!playersPerTeam.trim()) errors.playersPerTeam = 'Unesi broj igrača na terenu.';
    else if (Number(playersPerTeam) < MIN_PLAYERS_PER_TEAM || Number(playersPerTeam) > MAX_PLAYERS_PER_TEAM) {
      errors.playersPerTeam = `Broj igrača mora biti između ${MIN_PLAYERS_PER_TEAM} i ${MAX_PLAYERS_PER_TEAM}.`;
    }
    if (!substitutionsAllowed.trim()) errors.substitutionsAllowed = 'Unesi broj dozvoljenih izmena.';
    else if (Number(substitutionsAllowed) < MIN_SUBSTITUTIONS || Number(substitutionsAllowed) > MAX_SUBSTITUTIONS) {
      errors.substitutionsAllowed = `Broj izmena mora biti između ${MIN_SUBSTITUTIONS} i ${MAX_SUBSTITUTIONS}.`;
    }

    if (!matchDurationMinutes.trim()) errors.matchDuration = 'Unesi trajanje utakmice.';
    else if (Number(matchDurationMinutes) < MIN_MATCH_DURATION) errors.matchDuration = `Trajanje utakmice mora biti bar ${MIN_MATCH_DURATION} minut.`;
    if (showPeriodField) {
      if (!periodDurationMinutes.trim()) errors.periodDuration = 'Unesi trajanje pauze.';
      else if (Number(periodDurationMinutes) < MIN_PERIOD_DURATION) errors.periodDuration = 'Trajanje pauze ne može biti negativno.';
    }

    if (!startDate) errors.startDate = 'Unesi datum početka turnira.';
    if (!startTime) errors.startTime = 'Izaberi tačno vreme početka turnira.';

    if (capacityMode === 'limited') {
      if (!maxTeams.trim()) errors.maxTeams = 'Unesi broj timova.';
      else if (Number(maxTeams) < MIN_MAX_TEAMS) errors.maxTeams = `Turnir mora imati bar ${MIN_MAX_TEAMS} tima.`;
    }

    if (hasAgeRestriction === null) {
      errors.ageRestrictionChoice = 'Izaberi da li turnir ima starosno ograničenje.';
    } else if (hasAgeRestriction) {
      if (!minAge && !maxAge) {
        errors.ageRestrictionRange = 'Izaberi bar jednu granicu starosti.';
      } else if (minAge && maxAge && Number(minAge) > Number(maxAge)) {
        errors.ageRestrictionRange = 'Minimalna starost mora biti manja ili jednaka maksimalnoj.';
      }
    }

    const normalizedDescriptionLength = description.trim().replace(/\s+/g, ' ').length;
    if (normalizedDescriptionLength < MIN_DESCRIPTION_LENGTH) {
      errors.description = `Opis mora imati najmanje ${MIN_DESCRIPTION_LENGTH} karaktera.`;
    }

    if (hasEntryFee === null) errors.entryFeeChoice = 'Izaberi da li se plaća kotizacija.';
    else if (hasEntryFee && (!entryFeePerPlayer.trim() || Number(entryFeePerPlayer) < MIN_ENTRY_FEE)) {
      errors.entryFeeAmount = `Iznos kotizacije mora biti bar ${MIN_ENTRY_FEE} din.`;
    }

    return errors;
  }

  const EDIT_FIELD_IDS: { key: keyof StepFieldErrors; id: string }[] = [
    { key: 'sport', id: 'sport' },
    { key: 'name', id: 'name' },
    { key: 'city', id: 'city' },
    { key: 'location', id: 'location' },
    { key: 'format', id: 'format' },
    { key: 'playersPerTeam', id: 'players-per-team' },
    { key: 'substitutionsAllowed', id: 'substitutions-allowed' },
    { key: 'matchDuration', id: 'match-duration' },
    { key: 'periodDuration', id: 'period-duration' },
    { key: 'startDate', id: 'start-date' },
    { key: 'startTime', id: 'start-time' },
    { key: 'maxTeams', id: 'max-teams' },
    { key: 'ageRestrictionChoice', id: 'age-restriction-choice' },
    { key: 'ageRestrictionRange', id: 'min-age' },
    { key: 'description', id: 'description' },
    { key: 'entryFeeChoice', id: 'entry-fee-choice' },
    { key: 'entryFeeAmount', id: 'entry-fee-amount' },
  ];

  const editFieldErrors = editAttempted ? getEditFieldErrors() : {};

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
    return uploadImageWithCleanup(
      'tournaments',
      `${user!.id}/${tournamentId}`,
      kind,
      file,
      kind === 'banner' ? BANNER_MAX_DIMENSION : CREST_MAX_DIMENSION
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user) return;

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
        period_duration_minutes: showPeriodField ? Number(periodDurationMinutes) : 0,
        start_date: startDate || null,
        start_time: startTime || null,
        max_teams: capacityMode === 'limited' && maxTeams ? Number(maxTeams) : null,
        min_birth_year: hasAgeRestriction && maxAge ? CURRENT_YEAR - Number(maxAge) : null,
        max_birth_year: hasAgeRestriction && minAge ? CURRENT_YEAR - Number(minAge) : null,
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
        period_duration_minutes: showPeriodField ? Number(periodDurationMinutes) : 0,
        start_date: startDate || null,
        start_time: startTime || null,
        max_teams: maxTeams ? Number(maxTeams) : null,
        entry_fee_per_player: hasEntryFee ? Number(entryFeePerPlayer) : null,
        min_birth_year: hasAgeRestriction && maxAge ? CURRENT_YEAR - Number(maxAge) : null,
        max_birth_year: hasAgeRestriction && minAge ? CURRENT_YEAR - Number(minAge) : null,
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
    setError(null);

    if (
      step === 'naziv' ||
      step === 'lokacija' ||
      step === 'sastav' ||
      step === 'trajanje' ||
      step === 'termin' ||
      step === 'kapacitet' ||
      step === 'starost' ||
      step === 'opis' ||
      step === 'kotizacija'
    ) {
      setAttempted(true);
      if (Object.keys(getStepFieldErrors()).length > 0) return;
      goNext();
      return;
    }

    if (step === 'grb' || step === 'baner') {
      goNext();
      return;
    }

    if (step === 'pregled') {
      handleCreateTournament();
    }
  }

  // Opcija „Poništi" na vrhu liste omogućava da se već izabrana godina obriše nazad na prazno.
  const minAgeOptions = [
    ...(minAge ? [{ value: AGE_CLEAR, label: 'Poništi' }] : []),
    ...AGE_OPTIONS.map((o) => ({ ...o, disabled: maxAge !== '' && Number(o.value) > Number(maxAge) })),
  ];
  const maxAgeOptions = [
    ...(maxAge ? [{ value: AGE_CLEAR, label: 'Poništi' }] : []),
    ...AGE_OPTIONS.map((o) => ({ ...o, disabled: minAge !== '' && Number(o.value) < Number(minAge) })),
  ];
  const handleMinAgeChange = (v: string) => setMinAge(v === AGE_CLEAR ? '' : v);
  const handleMaxAgeChange = (v: string) => setMaxAge(v === AGE_CLEAR ? '' : v);

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
                  startDate={startDate}
                  founderName={profile?.full_name ?? null}
                  maxTeams={maxTeams ? Number(maxTeams) : null}
                  crestUrl={crestPreview}
                  crestPosition={crestPosition}
                  bannerUrl={bannerPreview}
                />
              </div>

              {/* ── FORM PANEL ──────────────────────────────────────── */}
              <div className="order-1 lg:order-1 flex-1 bg-ink-900 border-b lg:border-b-0 border-ink-700 px-6 sm:px-12 py-16 lg:py-20 flex flex-col items-center justify-center">
                <div className="w-full max-w-sm lg:max-w-none">
                  <h1 className="font-display text-3xl sm:text-4xl mb-10 leading-tight">Izmeni turnir</h1>

                  <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-7">
                    <SelectField
                      n="01"
                      label="Sport"
                      id="sport"
                      required
                      disabled
                      placeholder="Izaberi sport"
                      value={sportId}
                      onChange={setSportId}
                      options={sports.map((s) => ({ value: String(s.id), label: s.name }))}
                      error={editFieldErrors.sport}
                    />
                    <TicketField n="02" label="Naziv turnira" id="name" type="text" required value={name} onChange={setName} error={editFieldErrors.name} />
                    <ComboboxField n="03" label="Grad" id="city" value={city} onChange={setCity} options={cities} error={editFieldErrors.city} />
                    <TicketField n="04" label="Lokacija" id="location" type="text" value={location} onChange={setLocation} error={editFieldErrors.location} />

                    <SelectField
                      n="05"
                      label="Format turnira"
                      id="format"
                      required
                      placeholder="Izaberi format"
                      value={format}
                      onChange={setFormat}
                      options={FORMAT_OPTIONS}
                      error={editFieldErrors.format}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <TicketField
                        n="06"
                        label="Broj igrača na terenu"
                        id="players-per-team"
                        type="number"
                        required
                        min={MIN_PLAYERS_PER_TEAM}
                        max={MAX_PLAYERS_PER_TEAM}
                        value={playersPerTeam}
                        onChange={setPlayersPerTeam}
                        error={editFieldErrors.playersPerTeam}
                      />
                      <TicketField
                        n="07"
                        label="Broj dozvoljenih izmena"
                        id="substitutions-allowed"
                        type="number"
                        required
                        min={MIN_SUBSTITUTIONS}
                        max={MAX_SUBSTITUTIONS}
                        value={substitutionsAllowed}
                        onChange={setSubstitutionsAllowed}
                        error={editFieldErrors.substitutionsAllowed}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <TicketField
                        n="08"
                        label="Trajanje utakmice (min)"
                        id="match-duration"
                        type="number"
                        required
                        min={MIN_MATCH_DURATION}
                        value={matchDurationMinutes}
                        onChange={setMatchDurationMinutes}
                        error={editFieldErrors.matchDuration}
                      />
                      {showPeriodField && (
                        <TicketField
                          n="09"
                          label={periodLabel}
                          id="period-duration"
                          type="number"
                          required
                          min={MIN_PERIOD_DURATION}
                          value={periodDurationMinutes}
                          onChange={setPeriodDurationMinutes}
                          error={editFieldErrors.periodDuration}
                        />
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <TicketField
                        n="10"
                        label="Datum početka"
                        id="start-date"
                        type="date"
                        required
                        value={startDate}
                        onChange={setStartDate}
                        dateDefaultViewYear={CURRENT_YEAR}
                        error={editFieldErrors.startDate}
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
                        error={editFieldErrors.startTime}
                      />
                    </div>

                    <SelectField
                      n="12"
                      label="Broj timova"
                      id="capacity-mode"
                      required
                      placeholder="Izaberi"
                      value={capacityMode}
                      onChange={(v) => {
                        setCapacityMode(v as 'limited' | 'unlimited');
                        if (v === 'unlimited') setMaxTeams('');
                      }}
                      options={[
                        { value: 'unlimited', label: 'Neograničeno' },
                        { value: 'limited', label: 'Ograničen broj' },
                      ]}
                    />
                    {capacityMode === 'limited' && (
                      <TicketField
                        n="13"
                        label="Maks. broj timova"
                        id="max-teams"
                        type="number"
                        required
                        min={MIN_MAX_TEAMS}
                        value={maxTeams}
                        onChange={setMaxTeams}
                        error={editFieldErrors.maxTeams}
                      />
                    )}

                    <SelectField
                      n="14"
                      label="Starosno ograničenje"
                      id="age-restriction-choice"
                      required
                      placeholder="Da li turnir ima starosno ograničenje?"
                      value={hasAgeRestriction === true ? 'da' : hasAgeRestriction === false ? 'ne' : ''}
                      onChange={(v) => {
                        setHasAgeRestriction(v === 'da');
                        if (v !== 'da') {
                          setMinAge('');
                          setMaxAge('');
                        }
                      }}
                      options={[
                        { value: 'ne', label: 'Ne' },
                        { value: 'da', label: 'Da' },
                      ]}
                      error={editFieldErrors.ageRestrictionChoice}
                    />
                    {hasAgeRestriction === true && (
                      <div className="flex flex-col gap-1.5">
                        <div className="grid grid-cols-2 gap-4">
                          <SelectField
                            n="15"
                            label="Minimalna starost (GOD)"
                            id="min-age"
                            value={minAge}
                            onChange={handleMinAgeChange}
                            options={minAgeOptions}
                            placeholder="Bez donje granice"
                          />
                          <SelectField
                            n="16"
                            label="Maksimalna starost (GOD)"
                            id="max-age"
                            value={maxAge}
                            onChange={handleMaxAgeChange}
                            options={maxAgeOptions}
                            placeholder="Bez gornje granice"
                          />
                        </div>
                        {editFieldErrors.ageRestrictionRange && (
                          <p className="text-[11px] text-red-400">{editFieldErrors.ageRestrictionRange}</p>
                        )}
                      </div>
                    )}

                    <TextAreaField
                      n="17"
                      label="O turniru"
                      id="description"
                      required
                      value={description}
                      onChange={setDescription}
                      placeholder="Par rečenica o turniru…"
                      error={editFieldErrors.description}
                    />

                    <SelectField
                      n="18"
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
                      error={editFieldErrors.entryFeeChoice}
                    />
                    {hasEntryFee && (
                      <TicketField
                        n="19"
                        label="Iznos po igraču (RSD)"
                        id="entry-fee-amount"
                        type="number"
                        required
                        value={entryFeePerPlayer}
                        onChange={setEntryFeePerPlayer}
                        error={editFieldErrors.entryFeeAmount}
                      />
                    )}

                    <CrestField
                      n="20"
                      label="Logo turnira"
                      previewUrl={crestPreview}
                      position={crestPosition}
                      onSelect={handleCrestSelect}
                      onPositionChange={setCrestPosition}
                    />
                    <ImageField
                      n="21"
                      label="Baner turnira"
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

  return (
    <div className="min-h-screen flex flex-col bg-ink-950 text-paper-100 overflow-x-hidden">
      <Seo
        title={tournamentId ? 'Izmena turnira' : 'Novi turnir'}
        description={tournamentId ? 'Izmeni podatke turnira na DerbyManiji.' : 'Napravi novi turnir na DerbyManiji.'}
        path={tournamentId ? `/turniri/${tournamentId}/izmena` : '/turniri/novi'}
        noindex
      />
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

            <form key={step} onSubmit={handleStepSubmit} noValidate className="rise-1 flex flex-col items-center text-center gap-8">
              {step === 'sport' && (
                <>
                  <div>
                    <span className="text-xs uppercase tracking-widest text-red-400 font-semibold">
                      {STEP_LABELS.sport}
                    </span>
                    <h1 className="font-display text-3xl sm:text-4xl mt-3 leading-tight">Za koji sport praviš turnir?</h1>
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
                    <h1 className="font-display text-3xl sm:text-4xl mt-3 leading-tight">Kako se zove turnir?</h1>
                  </div>
                  <div className="w-full max-w-xs text-left">
                    <TicketField n="" label="" id="name" type="text" value={name} onChange={setName} error={fieldErrors.name} />
                  </div>
                </>
              )}

              {step === 'format' && (
                <>
                  <div>
                    <span className="text-xs uppercase tracking-widest text-red-400 font-semibold">
                      {STEP_LABELS.format}
                    </span>
                    <h1 className="font-display text-3xl sm:text-4xl mt-3 leading-tight">U kom formatu se igra turnir?</h1>
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
                  </div>
                  <div className="w-full max-w-xs flex flex-col gap-6 text-left">
                    <ComboboxField n="" label="Grad" id="city" value={city} onChange={setCity} options={cities} error={fieldErrors.city} />
                    <TicketField n="" label="Lokacija" id="location" type="text" value={location} onChange={setLocation} error={fieldErrors.location} />
                  </div>
                </>
              )}

              {step === 'sastav' && (
                <>
                  <div>
                    <span className="text-xs uppercase tracking-widest text-red-400 font-semibold">
                      {STEP_LABELS.sastav}
                    </span>
                    <h1 className="font-display text-3xl sm:text-4xl mt-3 leading-tight">Koliki je sastav svake ekipe?</h1>
                  </div>
                  <div className="w-full max-w-xs grid grid-cols-2 gap-4 text-left">
                    <TicketField
                      n=""
                      label="Igrača na terenu"
                      id="players-per-team"
                      type="number"
                      min={MIN_PLAYERS_PER_TEAM}
                      max={MAX_PLAYERS_PER_TEAM}
                      value={playersPerTeam}
                      onChange={setPlayersPerTeam}
                      error={fieldErrors.playersPerTeam}
                    />
                    <TicketField
                      n=""
                      label="Dozvoljene izmene"
                      id="substitutions-allowed"
                      type="number"
                      min={MIN_SUBSTITUTIONS}
                      max={MAX_SUBSTITUTIONS}
                      value={substitutionsAllowed}
                      onChange={setSubstitutionsAllowed}
                      error={fieldErrors.substitutionsAllowed}
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
                  <div className="w-full max-w-xs flex flex-col gap-6 text-left">
                    <TicketField
                      n=""
                      label="Trajanje utakmice (min)"
                      id="match-duration"
                      type="number"
                      min={MIN_MATCH_DURATION}
                      value={matchDurationMinutes}
                      onChange={setMatchDurationMinutes}
                      error={fieldErrors.matchDuration}
                    />
                    {showPeriodField && (
                      <TicketField
                        n=""
                        label={periodLabel}
                        id="period-duration"
                        type="number"
                        min={MIN_PERIOD_DURATION}
                        value={periodDurationMinutes}
                        onChange={setPeriodDurationMinutes}
                        error={fieldErrors.periodDuration}
                      />
                    )}
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
                      label="Datum početka"
                      id="start-date"
                      type="date"
                      required
                      value={startDate}
                      onChange={setStartDate}
                      dateDefaultViewYear={CURRENT_YEAR}
                      dateMin={tomorrowISO()}
                      error={fieldErrors.startDate}
                    />
                    <SelectField
                      n=""
                      label="Vreme početka"
                      id="start-time"
                      placeholder="Izaberi vreme"
                      value={startTime}
                      onChange={setStartTime}
                      options={START_TIME_OPTIONS}
                      error={fieldErrors.startTime}
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
                    <h1 className="font-display text-3xl sm:text-4xl mt-3 leading-tight">Koliko ekipa prima turnir?</h1>
                  </div>
                  <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
                    <button
                      type="button"
                      onClick={() => setCapacityMode('limited')}
                      className={`px-4 py-4 border transition-colors text-sm font-medium ${
                        capacityMode === 'limited'
                          ? 'border-red-400 bg-red-500/10 text-paper-100'
                          : 'border-ink-700 hover:border-red-400/60 hover:bg-ink-800 text-paper-300'
                      }`}
                    >
                      Broj timova
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCapacityMode('unlimited');
                        setMaxTeams('');
                      }}
                      className={`px-4 py-4 border transition-colors text-sm font-medium ${
                        capacityMode === 'unlimited'
                          ? 'border-red-400 bg-red-500/10 text-paper-100'
                          : 'border-ink-700 hover:border-red-400/60 hover:bg-ink-800 text-paper-300'
                      }`}
                    >
                      Neograničeno
                    </button>
                  </div>
                  {capacityMode === 'limited' && (
                    <div className="w-full max-w-xs text-left">
                      <TicketField
                        n=""
                        label="Maks. broj timova"
                        id="max-teams"
                        type="number"
                        min={MIN_MAX_TEAMS}
                        value={maxTeams}
                        onChange={setMaxTeams}
                        error={fieldErrors.maxTeams}
                      />
                    </div>
                  )}
                </>
              )}

              {step === 'starost' && (
                <>
                  <div>
                    <span className="text-xs uppercase tracking-widest text-red-400 font-semibold">
                      {STEP_LABELS.starost}
                    </span>
                    <h1 className="font-display text-3xl sm:text-4xl mt-3 leading-tight">Da li turnir ima starosno ograničenje?</h1>
                  </div>
                  <div className="flex flex-col gap-3 w-full max-w-xs">
                    <button
                      type="button"
                      onClick={() => setHasAgeRestriction(true)}
                      className={`px-4 py-5 border transition-colors text-sm font-medium ${
                        hasAgeRestriction === true
                          ? 'border-red-400 bg-red-500/10 text-paper-100'
                          : 'border-ink-700 hover:border-red-400/60 hover:bg-ink-800 text-paper-300'
                      }`}
                    >
                      Da
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setHasAgeRestriction(false);
                        setMinAge('');
                        setMaxAge('');
                      }}
                      className={`px-4 py-5 border transition-colors text-sm font-medium ${
                        hasAgeRestriction === false
                          ? 'border-red-400 bg-red-500/10 text-paper-100'
                          : 'border-ink-700 hover:border-red-400/60 hover:bg-ink-800 text-paper-300'
                      }`}
                    >
                      Ne
                    </button>
                    {fieldErrors.ageRestrictionChoice && (
                      <p className="text-[11px] text-red-400 text-left mt-1">{fieldErrors.ageRestrictionChoice}</p>
                    )}
                  </div>
                  {hasAgeRestriction === true && (
                    <div className="w-full max-w-xs flex flex-col gap-6 text-left">
                      <SelectField
                        n=""
                        label="Minimalna starost (GOD)"
                        id="min-age"
                        value={minAge}
                        onChange={handleMinAgeChange}
                        options={minAgeOptions}
                        placeholder="Bez donje granice"
                      />
                      <SelectField
                        n=""
                        label="Maksimalna starost (GOD)"
                        id="max-age"
                        value={maxAge}
                        onChange={handleMaxAgeChange}
                        options={maxAgeOptions}
                        placeholder="Bez gornje granice"
                      />
                      {fieldErrors.ageRestrictionRange && (
                        <p className="text-[11px] text-red-400">{fieldErrors.ageRestrictionRange}</p>
                      )}
                    </div>
                  )}
                </>
              )}

              {step === 'opis' && (
                <>
                  <div>
                    <span className="text-xs uppercase tracking-widest text-red-400 font-semibold">
                      {STEP_LABELS.opis}
                    </span>
                    <h1 className="font-display text-3xl sm:text-4xl mt-3 leading-tight">Par reči o turniru?</h1>
                  </div>
                  <div className="w-full max-w-sm text-left">
                    <TextAreaField
                      n=""
                      label=""
                      id="description"
                      value={description}
                      onChange={setDescription}
                      error={fieldErrors.description}
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
                    <h1 className="font-display text-3xl sm:text-4xl mt-3 leading-tight">Da li ekipe plaćaju kotizaciju?</h1>
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
                    {fieldErrors.entryFeeChoice && (
                      <p className="text-[11px] text-red-400 text-left mt-1">{fieldErrors.entryFeeChoice}</p>
                    )}
                  </div>
                  {hasEntryFee === true && (
                    <div className="w-full max-w-xs text-left">
                      <TicketField
                        n=""
                        label="Iznos po igraču (RSD)"
                        id="entry-fee-amount"
                        type="number"
                        min={MIN_ENTRY_FEE}
                        value={entryFeePerPlayer}
                        onChange={setEntryFeePerPlayer}
                        error={fieldErrors.entryFeeAmount}
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
                  </div>
                  <CrestField
                    n=""
                    label=""
                    previewUrl={crestPreview}
                    position={crestPosition}
                    onSelect={handleCrestSelect}
                    onPositionChange={setCrestPosition}
                    emptyHint="JPG / PNG / WEBP - Maksimalno 5MB"
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
                    <h1 className="font-display text-3xl sm:text-4xl mt-3 leading-tight">Ovako će izgledati tvoj turnir.</h1>
                  </div>
                  <TournamentPreviewCard
                    name={name}
                    sportName={selectedSportName}
                    city={city}
                    startDate={startDate}
                    founderName={profile?.full_name ?? null}
                    maxTeams={maxTeams ? Number(maxTeams) : null}
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
