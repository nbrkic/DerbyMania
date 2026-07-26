import { useEffect, useState, type FormEvent } from 'react';
import { useAuth } from '../lib/auth-context';
import { supabase } from '../lib/supabase';
import { SiteHeader } from '../components/SiteHeader';
import { SiteFooter } from '../components/SiteFooter';
import { TicketField, SelectField, TextAreaField } from '../components/AuthShell';

const CATEGORY_OPTIONS = [
  { value: 'komentar', label: 'Komentar' },
  { value: 'primedba', label: 'Primedba' },
  { value: 'sugestija', label: 'Sugestija' },
  { value: 'pohvala', label: 'Pohvala' },
];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NAME_REGEX = /^[A-Za-zČĆŽŠĐčćžšđ]+(?: [A-Za-zČĆŽŠĐčćžšđ]+)*$/;
const MIN_MESSAGE_LENGTH = 10;

type FieldErrors = {
  category?: string;
  fullName?: string;
  email?: string;
  message?: string;
};

export default function Feedback() {
  const { user, profile } = useAuth();

  const [category, setCategory] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [attempted, setAttempted] = useState(false);

  useEffect(() => {
    if (!user) return;
    setFullName(profile?.full_name || (user.user_metadata?.full_name as string | undefined) || '');
    setEmail(user.email || '');
  }, [user, profile]);

  function getFieldErrors(): FieldErrors {
    const errors: FieldErrors = {};

    if (!category) {
      errors.category = 'Izaberi vrstu poruke.';
    }

    if (!user) {
      if (!fullName.trim()) {
        errors.fullName = 'Unesi ime i prezime.';
      } else if (!NAME_REGEX.test(fullName.trim())) {
        errors.fullName = 'Ime i prezime mogu sadržati samo slova i razmak.';
      }

      if (!email.trim()) {
        errors.email = 'Unesi email.';
      } else if (!EMAIL_REGEX.test(email.trim())) {
        errors.email = 'Unesi ispravan email.';
      }
    }

    if (message.length < MIN_MESSAGE_LENGTH) {
      errors.message = `Poruka mora imati najmanje ${MIN_MESSAGE_LENGTH} karaktera.`;
    }

    return errors;
  }

  const fieldErrors = attempted ? getFieldErrors() : {};

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setAttempted(true);

    if (Object.keys(getFieldErrors()).length > 0) return;

    setSuccess(null);
    setSubmitting(true);

    const { error: insertError } = await supabase.from('feedback').insert({
      user_id: user?.id ?? null,
      full_name: fullName.trim(),
      email: email.trim(),
      category,
      message: message.trim(),
    });

    setSubmitting(false);

    if (insertError) {
      setError('Došlo je do greške pri slanju poruke. Pokušaj ponovo.');
      return;
    }

    setAttempted(false);
    setCategory('');
    setMessage('');
    if (!user) {
      setFullName('');
      setEmail('');
    }
    setSuccess('Hvala na poruci! Uzećemo je u obzir.');
  }

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
            <div className="text-center mb-12">
              <span className="text-xs uppercase tracking-widest text-red-400 font-semibold">Feedback</span>
              <h1 className="font-display text-3xl sm:text-4xl mt-3 leading-tight">Pošalji nam poruku</h1>
              <p className="text-paper-500 mt-3 max-w-md mx-auto">
                Komentar, primedba, sugestija ili pohvala — sve nam pomaže da DerbyManiju učinimo boljom.
              </p>
            </div>

            <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-7">
              <SelectField
                n="1"
                label="Vrsta poruke"
                id="category"
                placeholder="Izaberi vrstu poruke"
                value={category}
                onChange={setCategory}
                options={CATEGORY_OPTIONS}
                error={fieldErrors.category}
              />
              <TicketField
                n="2"
                label="Ime i prezime"
                id="fullName"
                type="text"
                autoComplete="name"
                disabled={!!user}
                value={fullName}
                onChange={setFullName}
                error={fieldErrors.fullName}
              />
              <TicketField
                n="3"
                label="Email"
                id="email"
                type="email"
                autoComplete="email"
                disabled={!!user}
                value={email}
                onChange={setEmail}
                error={fieldErrors.email}
              />
              <TextAreaField
                n="4"
                label="Poruka"
                id="message"
                rows={6}
                placeholder="Napiši svoju poruku…"
                value={message}
                onChange={setMessage}
                error={fieldErrors.message}
              />

              {error && (
                <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 px-3 py-2">{error}</p>
              )}
              {success && (
                <p className="text-sm text-green-400 bg-green-500/10 border border-green-500/30 px-3 py-2 text-center">
                  {success}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="ticket-submit w-full mt-2 py-4 font-display text-sm tracking-widest uppercase flex items-center justify-center gap-3"
              >
                {submitting ? 'Slanje…' : 'Pošalji poruku'}
              </button>
            </form>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
