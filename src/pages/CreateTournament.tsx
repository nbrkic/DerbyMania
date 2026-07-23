import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../lib/auth-context';
import { supabase } from '../lib/supabase';
import { SiteHeader } from '../components/SiteHeader';
import { SiteFooter } from '../components/SiteFooter';
import { TicketField, SelectField, TextAreaField } from '../components/AuthShell';
import { ImageField, CrestField, type ImagePosition } from '../components/ImageFields';
import { BASKETBALL_SPORT_NAMES } from '../lib/positions';

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

export default function CreateTournament() {
  const { id: tournamentId } = useParams<{ id: string }>();
  const isEditMode = !!tournamentId;
  const { user } = useAuth();
  const navigate = useNavigate();

  const [sports, setSports] = useState<Sport[]>([]);
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
  const [crestFile, setCrestFile] = useState<File | null>(null);
  const [crestPreview, setCrestPreview] = useState<string | null>(null);
  const [crestPosition, setCrestPosition] = useState<Position>({ x: 50, y: 50 });
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loadingExisting, setLoadingExisting] = useState(isEditMode);
  const [isFinishedTournament, setIsFinishedTournament] = useState(false);

  useEffect(() => {
    supabase
      .from('sports')
      .select('id, name')
      .order('name')
      .then(({ data }) => setSports(data ?? []));
  }, []);

  useEffect(() => {
    if (!tournamentId) return;

    async function loadExisting() {
      const { data } = await supabase
        .from('tournaments')
        .select(
          'sport_id, name, city, location, description, format, players_per_team, substitutions_allowed, match_duration_minutes, period_duration_minutes, start_date, start_time, max_teams, crest_url, crest_position_x, crest_position_y, banner_url, status'
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
      if (bannerPreview) URL.revokeObjectURL(bannerPreview);
    };
  }, [crestPreview, bannerPreview]);

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
    const ext = file.name.split('.').pop() || 'jpg';
    const path = `${user!.id}/${tournamentId}/${kind}.${ext}`;
    const { error: uploadError } = await supabase.storage.from('tournaments').upload(path, file, { upsert: true });
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

    setError(null);
    setSubmitting(true);

    try {
      const id = tournamentId || crypto.randomUUID();
      const crestUrl = crestFile ? await uploadImage(id, crestFile, 'crest') : crestPreview;
      const bannerUrl = bannerFile ? await uploadImage(id, bannerFile, 'banner') : bannerPreview;

      const payload = {
        sport_id: Number(sportId),
        name: name.trim(),
        city: city.trim() || null,
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

  const selectedSportName = sports.find((s) => String(s.id) === sportId)?.name ?? null;
  const isBasketball = !!selectedSportName && BASKETBALL_SPORT_NAMES.includes(selectedSportName);
  const periodLabel = isBasketball ? 'Trajanje četvrtine (min)' : 'Trajanje poluvremena';

  if (loadingExisting) {
    return (
      <div className="min-h-screen flex flex-col bg-ink-950 text-paper-100 overflow-x-hidden">
        <div className="grain" />
        <SiteHeader />
        <main className="flex-1 pt-16 flex items-center justify-center">
          <p className="text-paper-500">Učitavanje…</p>
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
            <h1 className="font-display text-3xl sm:text-4xl mb-10 leading-tight">{isEditMode ? 'Izmeni turnir' : 'Napravi turnir'}</h1>

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
              <TicketField n="03" label="Grad" id="city" type="text" value={city} onChange={setCity} />
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

              <CrestField
                n="14"
                label="Logo turnira"
                previewUrl={crestPreview}
                position={crestPosition}
                onSelect={handleCrestSelect}
                onPositionChange={setCrestPosition}
              />
              <ImageField
                n="15"
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
                {submitting ? (isEditMode ? 'Čuvanje…' : 'Kreiranje…') : isEditMode ? 'Sačuvaj izmene' : 'Napravi turnir'}
              </button>

              <Link
                to={isEditMode ? `/turniri/${tournamentId}` : '/turniri'}
                className="btn-line w-full py-3.5 text-sm uppercase tracking-widest flex items-center justify-center"
              >
                {isEditMode ? 'Nazad na turnir' : 'Nazad na turnire'}
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
