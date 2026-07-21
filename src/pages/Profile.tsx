import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../lib/auth-context';
import { supabase } from '../lib/supabase';
import { SiteHeader, UserAvatar } from '../components/SiteHeader';
import { SiteFooter } from '../components/SiteFooter';
import { TicketField } from '../components/AuthShell';

const MAX_AVATAR_SIZE = 5 * 1024 * 1024;

function CameraIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M4 8h3l2-2h6l2 2h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z" />
      <circle cx="12" cy="14" r="3.5" />
    </svg>
  );
}

type SavedValues = { fullName: string; birthDate: string; phone: string; email: string };

export default function Profile() {
  const { user, profile, refreshProfile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const seededRef = useRef(false);

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [fullName, setFullName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [saved, setSaved] = useState<SavedValues | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!seededRef.current && profile && user) {
      const initial = {
        fullName: profile.full_name ?? '',
        birthDate: profile.birth_date ?? '',
        phone: profile.phone ?? '',
        email: user.email ?? '',
      };
      setFullName(initial.fullName);
      setBirthDate(initial.birthDate);
      setPhone(initial.phone);
      setEmail(initial.email);
      setSaved(initial);
      seededRef.current = true;
    }
  }, [profile, user]);

  const hasChanges =
    !!avatarFile ||
    (saved !== null &&
      (fullName !== saved.fullName ||
        birthDate !== saved.birthDate ||
        phone !== saved.phone ||
        email !== saved.email));

  useEffect(() => {
    return () => {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    };
  }, [avatarPreview]);

  function handleAvatarChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_AVATAR_SIZE) {
      setError('Slika je prevelika (maks. 5MB).');
      return;
    }
    setError(null);
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!user) return;

    setError(null);
    setSuccess(null);
    setSaving(true);

    let avatarUrl = profile?.avatar_url ?? null;

    if (avatarFile) {
      const ext = avatarFile.name.split('.').pop() || 'jpg';
      const path = `${user.id}/avatar.${ext}`;
      const { error: uploadError } = await supabase.storage.from('avatars').upload(path, avatarFile, { upsert: true });
      if (uploadError) {
        setSaving(false);
        setError(`Otpremanje slike nije uspelo: ${uploadError.message}`);
        return;
      }
      const { data: publicUrl } = supabase.storage.from('avatars').getPublicUrl(path);
      avatarUrl = `${publicUrl.publicUrl}?t=${Date.now()}`;
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        full_name: fullName,
        birth_date: birthDate || null,
        phone,
        avatar_url: avatarUrl,
        email,
      })
      .eq('id', user.id);

    if (updateError) {
      setSaving(false);
      setError(`Čuvanje podataka nije uspelo: ${updateError.message}`);
      return;
    }

    if (email !== user.email) {
      const { error: emailError } = await supabase.auth.updateUser({ email });
      if (emailError) {
        setSaving(false);
        setError(`Email nije promenjen: ${emailError.message}`);
        return;
      }
    }

    await refreshProfile();
    setAvatarFile(null);
    setSaved({ fullName, birthDate, phone, email });
    setSaving(false);
    setSuccess('Promene su sačuvane.');
  }

  const displayName = fullName || user?.email || '';

  return (
    <div className="min-h-screen flex flex-col bg-ink-950 text-paper-100 overflow-x-hidden">
      <div className="grain" />
      <SiteHeader />

      <main className="flex-1 pt-16 flex flex-col">
        <section className="flex-1 relative overflow-hidden bg-ink-900 border-b border-ink-700">
          <div
            className="absolute inset-x-0 top-10 h-64 opacity-[0.08] pointer-events-none"
            style={{
              backgroundImage:
                'repeating-linear-gradient(135deg, var(--paper-100) 0, var(--paper-100) 1px, transparent 1px, transparent 28px)',
              WebkitMaskImage: 'radial-gradient(ellipse at center, black 35%, transparent 80%)',
              maskImage: 'radial-gradient(ellipse at center, black 35%, transparent 80%)',
            }}
          />

          <div className="relative max-w-2xl mx-auto px-6 py-16 sm:py-20">
            <div className="flex flex-col items-center text-center mb-12">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="relative w-28 h-28 sm:w-32 sm:h-32 group"
              >
                <UserAvatar
                  name={displayName}
                  avatarUrl={avatarPreview ?? profile?.avatar_url}
                  className="w-full h-full text-3xl ring-4 ring-ink-950"
                />
                <span className="absolute inset-0 rounded-full bg-ink-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 text-paper-100">
                  <CameraIcon className="w-6 h-6" />
                  <span className="text-[10px] uppercase tracking-widest">Promeni</span>
                </span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleAvatarChange}
                className="sr-only"
              />

              <h1 className="font-display text-3xl sm:text-4xl mt-6 mb-1 leading-tight">Tvoj profil</h1>
              <p className="text-paper-500 text-sm">{user?.email}</p>
            </div>

            <form onSubmit={handleSave} className="flex flex-col gap-7">
              <TicketField n="01" label="Ime i prezime" id="fullName" type="text" autoComplete="name" required value={fullName} onChange={setFullName} />
              <TicketField n="02" label="Datum rođenja" id="birthDate" type="date" autoComplete="bday" value={birthDate} onChange={setBirthDate} />
              <TicketField n="03" label="Broj telefona" id="phone" type="tel" autoComplete="tel" value={phone} onChange={setPhone} />
              <TicketField n="04" label="Email" id="email" type="email" autoComplete="email" required value={email} onChange={setEmail} />

              {error && (
                <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 px-3 py-2">{error}</p>
              )}
              {success && (
                <p className="text-sm text-paper-100 bg-ink-800 border border-paper-100/15 px-3 py-2">{success}</p>
              )}

              <button
                type="submit"
                disabled={saving || !hasChanges}
                className="ticket-submit w-full mt-2 py-4 font-display text-sm tracking-widest uppercase flex items-center justify-center gap-3"
              >
                {saving ? 'Čuvanje…' : 'Sačuvaj promene'}
              </button>

              <Link
                to="/"
                className="btn-line w-full py-3.5 text-sm uppercase tracking-widest flex items-center justify-center"
              >
                Nazad na početnu
              </Link>
            </form>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
