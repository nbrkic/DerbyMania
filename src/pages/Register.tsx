import { useEffect, useRef, useState, type ChangeEvent, type FormEvent, type PointerEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth-context';
import { supabase } from '../lib/supabase';
import { AuthShell, TicketField } from '../components/AuthShell';

const MAX_AVATAR_SIZE = 5 * 1024 * 1024;
const ALLOWED_AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const MIN_AGE_YEARS = 13;

function todayISO() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function latestAllowedBirthDateISO() {
  const now = new Date();
  return `${now.getFullYear() - MIN_AGE_YEARS}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function CameraIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M4 8h3l2-2h6l2 2h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z" />
      <circle cx="12" cy="14" r="3.5" />
    </svg>
  );
}

type Position = { x: number; y: number };

function AvatarField({
  file,
  previewUrl,
  position,
  onSelect,
  onPositionChange,
}: {
  file: File | null;
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
    const picked = e.target.files?.[0];
    if (picked) onSelect(picked);
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
    <div>
      <label className="flex items-baseline gap-2 text-[11px] uppercase tracking-widest text-paper-500 mb-3">
        <span className="text-red-400 font-bold">1</span> Profilna slika
      </label>
      <div className="flex items-center gap-4">
        <div
          ref={containerRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          className={`relative w-20 h-20 shrink-0 rounded-full overflow-hidden bg-ink-800 border-2 border-dashed border-red-500/40 hover:border-red-400 transition-colors flex items-center justify-center touch-none ${
            previewUrl ? 'cursor-move' : 'cursor-pointer'
          }`}
        >
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Pregled profilne slike"
              draggable={false}
              className="w-full h-full object-cover select-none"
              style={{ objectPosition: `${position.x}% ${position.y}%` }}
            />
          ) : (
            <CameraIcon className="w-6 h-6 text-red-400 pointer-events-none" />
          )}
        </div>
        <div className="flex flex-col gap-2 items-start">
          <p className="text-xs text-paper-500 leading-relaxed">
            {file
              ? 'Prevuci sliku da podesiš poziciju.'
              : 'JPG, PNG ili WEBP, maksimalno 5MB. Možeš je dodati i kasnije.'}
          </p>
          {previewUrl && (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="ticket-submit px-4 py-1.5 text-[11px] uppercase tracking-widest"
            >
              Promeni sliku
            </button>
          )}
        </div>
      </div>
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

export default function Register() {
  const { signUp, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarPosition, setAvatarPosition] = useState<Position>({ x: 50, y: 50 });
  const [fullName, setFullName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [createdUserId, setCreatedUserId] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    };
  }, [avatarPreview]);

  function handleAvatarSelect(file: File) {
    if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
      setError('Slika nije ispravnog formata. Dozvoljeni formati su JPG, PNG ili WEBP.');
      return;
    }
    if (file.size > MAX_AVATAR_SIZE) {
      setError('Slika je prevelika (maksimalno 5MB).');
      return;
    }
    setError(null);
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    setAvatarPosition({ x: 50, y: 50 });
  }

  async function uploadAvatar(userId: string, file: File, position: Position) {
    const ext = file.name.split('.').pop() || 'jpg';
    const path = `${userId}/avatar.${ext}`;
    const { error: uploadError } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
    if (uploadError) {
      console.error('Avatar upload failed:', uploadError);
      return { error: uploadError.message };
    }

    const { data: publicUrl } = supabase.storage.from('avatars').getPublicUrl(path);
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        avatar_url: publicUrl.publicUrl,
        avatar_position_x: Math.round(position.x),
        avatar_position_y: Math.round(position.y),
      })
      .eq('id', userId);
    if (updateError) {
      console.error('Saving avatar_url failed:', updateError);
      return { error: updateError.message };
    }

    await refreshProfile();
    return { error: null };
  }

  async function handleRetryAvatar() {
    if (!avatarFile || !createdUserId) return;
    setSubmitting(true);
    const { error: retryError } = await uploadAvatar(createdUserId, avatarFile, avatarPosition);
    setSubmitting(false);
    if (retryError) {
      setError(`Otpremanje slike nije uspelo: ${retryError}`);
      return;
    }
    navigate('/profile');
  }

  function getValidationProblems(): string[] {
    const problems: string[] = [];
    if (!fullName.trim()) problems.push('ime i prezime');
    if (!birthDate) {
      problems.push('datum rođenja');
    } else if (birthDate > todayISO()) {
      problems.push('datum rođenja (ne može biti u budućnosti)');
    } else if (birthDate > latestAllowedBirthDateISO()) {
      problems.push(`datum rođenja (moraš imati bar ${MIN_AGE_YEARS} godina)`);
    }
    if (!phone.trim()) {
      problems.push('broj telefona');
    } else if (!/^[0-9+\-\s()]+$/.test(phone) || phone.replace(/[^0-9]/g, '').length < 6) {
      problems.push('ispravan broj telefona');
    }
    if (!email.trim()) {
      problems.push('email');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      problems.push('ispravan email');
    }
    if (!password) {
      problems.push('lozinku');
    } else if (password.length < 6) {
      problems.push('lozinku (bar 6 karaktera)');
    }
    return problems;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const problems = getValidationProblems();
    if (problems.length === 1) {
      setError(`Niste uneli ${problems[0]}.`);
      return;
    }
    if (problems.length > 1) {
      setError(`Niste uneli: ${problems.join(', ')}.`);
      return;
    }

    setSubmitting(true);

    const { error, user } = await signUp(email, password, fullName, birthDate, phone, city);
    if (error || !user) {
      setSubmitting(false);
      setError(error ?? 'Došlo je do greške pri registraciji.');
      return;
    }

    if (!avatarFile) {
      setSubmitting(false);
      navigate('/profile');
      return;
    }

    const { error: avatarError } = await uploadAvatar(user.id, avatarFile, avatarPosition);
    setSubmitting(false);

    if (avatarError) {
      setCreatedUserId(user.id);
      setError(`Nalog je napravljen, ali otpremanje slike nije uspelo: ${avatarError}`);
      return;
    }

    navigate('/profile');
  }

  return (
    <AuthShell
      flip
      headline={
        <>
          Uđi u <span className="text-red-400">ekipu.</span>
        </>
      }
      blurb="Napravi nalog i pokreni prvi turnir za manje od pet minuta. Bez Excel tabela za raspored, bez Viber grupe za svaki rezultat."
      quote={{
        text: 'Napravili smo turnir za dvadeset ekipa za jedno veče.',
        author: 'Organizator, Turnira',
      }}
      formTitle="Napravi nalog"
      footer={
        <>
          Već imaš nalog?{' '}
          <Link to="/login" className="text-paper-100 font-semibold hover:text-red-400 transition-colors">
            Prijavi se
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-7">
        <AvatarField
          file={avatarFile}
          previewUrl={avatarPreview}
          position={avatarPosition}
          onSelect={handleAvatarSelect}
          onPositionChange={setAvatarPosition}
        />
        <TicketField n="2" label="Ime i prezime" id="fullName" type="text" autoComplete="name" value={fullName} onChange={setFullName} />
        <TicketField n="3" label="Datum rođenja" id="birthDate" type="date" autoComplete="bday" value={birthDate} onChange={setBirthDate} dateMax={todayISO()} />
        <TicketField n="4" label="Broj telefona" id="phone" type="tel" autoComplete="tel" value={phone} onChange={setPhone} />
        <TicketField n="5" label="Mesto/grad" id="city" type="text" autoComplete="address-level2" value={city} onChange={setCity} />
        <TicketField n="6" label="Email" id="email" type="email" autoComplete="email" value={email} onChange={setEmail} />
        <TicketField
          n="7"
          label="Lozinka"
          id="password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={setPassword}
        />

        {error && (
          <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 px-3 py-2">{error}</p>
        )}

        {createdUserId ? (
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={handleRetryAvatar}
              disabled={submitting}
              className="ticket-submit w-full py-4 font-display text-sm tracking-widest uppercase flex items-center justify-center gap-3"
            >
              {submitting ? 'Otpremanje…' : 'Pokušaj ponovo'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/profile')}
              className="text-xs uppercase tracking-widest text-paper-500 hover:text-paper-100 transition-colors"
            >
              Nastavi bez slike (možeš je dodati kasnije)
            </button>
          </div>
        ) : (
          <button type="submit" disabled={submitting} className="ticket-submit w-full mt-2 py-4 font-display text-sm tracking-widest uppercase flex items-center justify-center gap-3">
            {submitting ? 'Kreiranje naloga…' : 'Registruj se'}
          </button>
        )}
      </form>
    </AuthShell>
  );
}
