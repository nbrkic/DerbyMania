import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth-context';
import { supabase } from '../lib/supabase';
import { AuthShell, TicketField } from '../components/AuthShell';

const MAX_AVATAR_SIZE = 5 * 1024 * 1024;

function CameraIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M4 8h3l2-2h6l2 2h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z" />
      <circle cx="12" cy="14" r="3.5" />
    </svg>
  );
}

function AvatarField({ file, previewUrl, onSelect }: { file: File | null; previewUrl: string | null; onSelect: (file: File) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const picked = e.target.files?.[0];
    if (picked) onSelect(picked);
  }

  return (
    <div>
      <label className="flex items-baseline gap-2 text-[11px] uppercase tracking-widest text-paper-500 mb-3">
        <span className="text-red-400 font-bold">01</span> Profilna slika (opciono)
      </label>
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="relative w-20 h-20 shrink-0 rounded-full overflow-hidden bg-ink-800 border-2 border-dashed border-red-500/40 hover:border-red-400 transition-colors flex items-center justify-center"
        >
          {previewUrl ? (
            <img src={previewUrl} alt="Pregled profilne slike" className="w-full h-full object-cover" />
          ) : (
            <CameraIcon className="w-6 h-6 text-red-400" />
          )}
        </button>
        <p className="text-xs text-paper-500 leading-relaxed">
          {file ? file.name : 'Opciono — JPG, PNG ili WEBP, maks. 5MB. Možeš je dodati i kasnije iz svog naloga.'}
        </p>
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
  const [fullName, setFullName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [phone, setPhone] = useState('');
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
    if (file.size > MAX_AVATAR_SIZE) {
      setError('Slika je prevelika (maks. 5MB).');
      return;
    }
    setError(null);
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  async function uploadAvatar(userId: string, file: File) {
    const ext = file.name.split('.').pop() || 'jpg';
    const path = `${userId}/avatar.${ext}`;
    const { error: uploadError } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
    if (uploadError) {
      console.error('Avatar upload failed:', uploadError);
      return { error: uploadError.message };
    }

    const { data: publicUrl } = supabase.storage.from('avatars').getPublicUrl(path);
    const { error: updateError } = await supabase.from('profiles').update({ avatar_url: publicUrl.publicUrl }).eq('id', userId);
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
    const { error: retryError } = await uploadAvatar(createdUserId, avatarFile);
    setSubmitting(false);
    if (retryError) {
      setError(`Otpremanje slike nije uspelo: ${retryError}`);
      return;
    }
    navigate('/');
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!birthDate) {
      setError('Unesi datum rođenja.');
      return;
    }

    if (password.length < 6) {
      setError('Lozinka mora imati bar 6 karaktera.');
      return;
    }

    setSubmitting(true);

    const { error, user } = await signUp(email, password, fullName, birthDate, phone);
    if (error || !user) {
      setSubmitting(false);
      setError(error ?? 'Došlo je do greške pri registraciji.');
      return;
    }

    if (!avatarFile) {
      setSubmitting(false);
      navigate('/');
      return;
    }

    const { error: avatarError } = await uploadAvatar(user.id, avatarFile);
    setSubmitting(false);

    if (avatarError) {
      setCreatedUserId(user.id);
      setError(`Nalog je napravljen, ali otpremanje slike nije uspelo: ${avatarError}`);
      return;
    }

    navigate('/');
  }

  return (
    <AuthShell
      flip
      headline={
        <>
          Uđi u
          <br /><span className="text-red-400">ekipu.</span>
        </>
      }
      blurb="Napravi nalog i pokreni prvi turnir za manje od pet minuta — bez Excel tabela za raspored, bez Viber grupe za svaki rezultat."
      quote={{
        text: 'Napravili smo turnir za dvadeset ekipa za jedno veče.',
        author: 'Organizator, Ulična liga',
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
      <form onSubmit={handleSubmit} className="flex flex-col gap-7">
        <AvatarField file={avatarFile} previewUrl={avatarPreview} onSelect={handleAvatarSelect} />
        <TicketField n="02" label="Ime i prezime" id="fullName" type="text" autoComplete="name" required value={fullName} onChange={setFullName} />
        <TicketField n="03" label="Datum rođenja" id="birthDate" type="date" autoComplete="bday" required value={birthDate} onChange={setBirthDate} />
        <TicketField n="04" label="Broj telefona" id="phone" type="tel" autoComplete="tel" required value={phone} onChange={setPhone} />
        <TicketField n="05" label="Email" id="email" type="email" autoComplete="email" required value={email} onChange={setEmail} />
        <TicketField
          n="06"
          label="Lozinka"
          id="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={6}
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
              onClick={() => navigate('/')}
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
