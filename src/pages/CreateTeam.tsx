import { useEffect, useRef, useState, type ChangeEvent, type FormEvent, type PointerEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth-context';
import { supabase } from '../lib/supabase';
import { SiteHeader } from '../components/SiteHeader';
import { SiteFooter } from '../components/SiteFooter';
import { TicketField, SelectField } from '../components/AuthShell';

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const CURRENT_YEAR = new Date().getFullYear();

function CameraIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M4 8h3l2-2h6l2 2h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z" />
      <circle cx="12" cy="14" r="3.5" />
    </svg>
  );
}

type Sport = { id: number; name: string };
type Position = { x: number; y: number };

function ImageField({
  n,
  label,
  hint,
  shape,
  previewUrl,
  onSelect,
}: {
  n: string;
  label: string;
  hint: string;
  shape: 'circle' | 'banner';
  previewUrl: string | null;
  onSelect: (file: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) onSelect(file);
  }

  return (
    <div className={shape === 'circle' ? 'flex flex-col items-center text-center' : undefined}>
      <label className="flex items-baseline gap-2 text-[11px] uppercase tracking-widest text-paper-500 mb-3">
        <span className="text-red-400 font-bold">{n}</span> {label}
      </label>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className={
          shape === 'circle'
            ? 'relative w-24 h-24 rounded-full overflow-hidden bg-ink-800 border-2 border-dashed border-red-500/40 hover:border-red-400 transition-colors flex items-center justify-center'
            : 'relative w-full aspect-[21/9] overflow-hidden bg-ink-800 border-2 border-dashed border-red-500/40 hover:border-red-400 transition-colors flex items-center justify-center'
        }
      >
        {previewUrl ? (
          <img src={previewUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <CameraIcon className="w-6 h-6 text-red-400" />
        )}
      </button>
      <p className="text-xs text-paper-500 mt-2 leading-relaxed">{hint}</p>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleChange}
        className="sr-only"
      />
    </div>
  );
}

function CrestField({
  n,
  label,
  previewUrl,
  position,
  onSelect,
  onPositionChange,
}: {
  n: string;
  label: string;
  previewUrl: string | null;
  position: Position;
  onSelect: (file: File) => void;
  onPositionChange: (position: Position) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const lastPointRef = useRef({ x: 0, y: 0 });

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) onSelect(file);
  }

  function handlePointerDown(e: PointerEvent<HTMLDivElement>) {
    if (!previewUrl) {
      inputRef.current?.click();
      return;
    }
    draggingRef.current = true;
    lastPointRef.current = { x: e.clientX, y: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: PointerEvent<HTMLDivElement>) {
    if (!draggingRef.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const deltaXPercent = ((e.clientX - lastPointRef.current.x) / rect.width) * 100;
    const deltaYPercent = ((e.clientY - lastPointRef.current.y) / rect.height) * 100;
    lastPointRef.current = { x: e.clientX, y: e.clientY };

    onPositionChange({
      x: Math.min(100, Math.max(0, position.x - deltaXPercent)),
      y: Math.min(100, Math.max(0, position.y - deltaYPercent)),
    });
  }

  function handlePointerUp() {
    draggingRef.current = false;
  }

  return (
    <div className="flex flex-col items-center text-center">
      <label className="flex items-baseline gap-2 text-[11px] uppercase tracking-widest text-paper-500 mb-3">
        <span className="text-red-400 font-bold">{n}</span> {label}
      </label>

      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        className={`relative w-24 h-24 rounded-full overflow-hidden bg-ink-800 border-2 border-dashed border-red-500/40 hover:border-red-400 transition-colors flex items-center justify-center touch-none ${
          previewUrl ? 'cursor-move' : 'cursor-pointer'
        }`}
      >
        {previewUrl ? (
          <img
            src={previewUrl}
            alt=""
            draggable={false}
            className="w-full h-full object-cover select-none"
            style={{ objectPosition: `${position.x}% ${position.y}%` }}
          />
        ) : (
          <CameraIcon className="w-6 h-6 text-red-400 pointer-events-none" />
        )}
      </div>

      <p className="text-xs text-paper-500 mt-2 leading-relaxed max-w-[14rem]">
        {previewUrl ? 'Prevuci sliku da podesiš poziciju.' : 'JPG, PNG ili WEBP, maks. 5MB.'}
      </p>
      {previewUrl && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="text-xs text-red-400 hover:text-red-300 transition-colors mt-1 uppercase tracking-widest"
        >
          Promeni sliku
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleChange}
        className="sr-only"
      />
    </div>
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

export default function CreateTeam() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [sports, setSports] = useState<Sport[]>([]);
  const [sportId, setSportId] = useState('');
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [crestFile, setCrestFile] = useState<File | null>(null);
  const [crestPreview, setCrestPreview] = useState<string | null>(null);
  const [crestPosition, setCrestPosition] = useState<Position>({ x: 50, y: 50 });
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    supabase
      .from('sports')
      .select('id, name')
      .order('name')
      .then(({ data }) => setSports(data ?? []));
  }, []);

  useEffect(() => {
    return () => {
      if (crestPreview) URL.revokeObjectURL(crestPreview);
      if (bannerPreview) URL.revokeObjectURL(bannerPreview);
    };
  }, [crestPreview, bannerPreview]);

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

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user) return;

    if (!sportId) {
      setError('Izaberi sport.');
      return;
    }
    if (!name.trim()) {
      setError('Unesi naziv tima.');
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      const teamId = crypto.randomUUID();
      const crestUrl = crestFile ? await uploadImage(teamId, crestFile, 'crest') : null;
      const bannerUrl = bannerFile ? await uploadImage(teamId, bannerFile, 'banner') : null;

      const { error: insertError } = await supabase.from('teams').insert({
        id: teamId,
        owner_id: user.id,
        sport_id: Number(sportId),
        name: name.trim(),
        city: city.trim() || null,
        founded_year: CURRENT_YEAR,
        crest_url: crestUrl,
        crest_position_x: Math.round(crestPosition.x),
        crest_position_y: Math.round(crestPosition.y),
        banner_url: bannerUrl,
      });

      if (insertError) throw new Error(insertError.message);

      navigate('/timovi');
    } catch (err) {
      setSubmitting(false);
      setError(err instanceof Error ? err.message : 'Došlo je do greške pri kreiranju tima.');
    }
  }

  const selectedSportName = sports.find((s) => String(s.id) === sportId)?.name ?? null;

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
            <h2 className="font-display text-2xl sm:text-3xl mt-3 leading-tight">Ovako će izgledati tvoj tim.</h2>
          </div>

          <TeamPreviewCard
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
            <h1 className="font-display text-3xl sm:text-4xl mb-10 leading-tight">Napravi svoj tim</h1>

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
              <TicketField n="02" label="Naziv tima" id="name" type="text" required value={name} onChange={setName} />
              <TicketField n="03" label="Grad" id="city" type="text" value={city} onChange={setCity} />

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
                {submitting ? 'Kreiranje…' : 'Napravi tim'}
              </button>

              <Link
                to="/timovi"
                className="btn-line w-full py-3.5 text-sm uppercase tracking-widest flex items-center justify-center"
              >
                Nazad na timove
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
