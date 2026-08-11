import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth-context';
import { AuthShell, TicketField, USERNAME_REGEX, sanitizeUsernameInput } from '../components/AuthShell';
import { Seo } from '../components/Seo';

type LoginMode = 'username' | 'email';

function LoginModeToggle({ mode, onChange }: { mode: LoginMode; onChange: (mode: LoginMode) => void }) {
  return (
    <div>
      <label className="flex items-baseline gap-2 text-[11px] uppercase tracking-widest text-paper-500 mb-3">
        <span className="text-red-400 font-bold">1</span> Prijava putem
      </label>
      <div className="grid grid-cols-2 gap-2">
        {(['username', 'email'] as const).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={`px-4 py-2.5 text-xs uppercase tracking-widest border transition-colors ${
              mode === option
                ? 'bg-red-500 border-red-500 text-paper-100 font-semibold'
                : 'border-ink-700 text-paper-500 hover:border-red-400/50 hover:text-paper-100'
            }`}
          >
            {option === 'username' ? 'Korisničko ime' : 'Email'}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function Login() {
  const { signIn, signInWithUsername } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<LoginMode>('username');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [attempted, setAttempted] = useState(false);

  type FieldErrors = {
    identifier?: string;
    password?: string;
  };

  function getFieldErrors(): FieldErrors {
    const errors: FieldErrors = {};

    if (mode === 'username') {
      if (!username.trim()) {
        errors.identifier = 'Unesi korisničko ime.';
      } else if (!USERNAME_REGEX.test(username)) {
        errors.identifier = 'Unesi ispravno korisničko ime (samo slova i brojevi, najmanje 3 karaktera).';
      }
    } else {
      if (!email.trim()) {
        errors.identifier = 'Unesi email.';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.identifier = 'Unesi ispravan email.';
      }
    }

    if (!password) {
      errors.password = 'Unesi lozinku.';
    }

    return errors;
  }

  const fieldErrors = attempted ? getFieldErrors() : {};

  function handleModeChange(nextMode: LoginMode) {
    setMode(nextMode);
    setAuthError(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setAuthError(null);
    setAttempted(true);

    if (Object.keys(getFieldErrors()).length > 0) return;

    setSubmitting(true);
    const { error } = mode === 'username' ? await signInWithUsername(username, password) : await signIn(email, password);
    setSubmitting(false);
    if (error) {
      setAuthError(error);
      return;
    }
    navigate('/');
  }

  return (
    <>
      <Seo
        title="Prijava"
        description="Uloguj se na svoj DerbyMania nalog i nastavi da vodiš svoje turnire, timove i rezultate."
        path="/login"
        noindex
      />
      <AuthShell
      headline={
        <>
          Nazad u <span className="text-red-400">igru.</span>
        </>
      }
      blurb="Uloguj se i preuzmi kontrolu nad svojim turnirom. Raspored, rezultati i tabela te čekaju tačno tamo gde si stao."
      quote={{
        text: 'Prvi put da tabelu grupe ne crtam na papiru.',
        author: 'Organizator, Turnira',
      }}
      formTitle="Prijavi se"
      footer={
        <>
          Nemaš nalog?{' '}
          <Link to="/register" className="text-paper-100 font-semibold hover:text-red-400 transition-colors">
            Registruj se
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-7">
        <LoginModeToggle mode={mode} onChange={handleModeChange} />

        {mode === 'username' ? (
          <TicketField
            n="2"
            label="Korisničko ime"
            id="username"
            type="text"
            autoComplete="username"
            prefix="@"
            value={username}
            onChange={(v) => setUsername(sanitizeUsernameInput(v))}
            error={fieldErrors.identifier}
          />
        ) : (
          <TicketField
            n="2"
            label="Email"
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={setEmail}
            error={fieldErrors.identifier}
          />
        )}

        <TicketField
          n="3"
          label="Lozinka"
          id="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={setPassword}
          error={fieldErrors.password ?? authError ?? undefined}
        />

        <button type="submit" disabled={submitting} className="ticket-submit w-full mt-2 py-4 font-display text-sm tracking-widest uppercase flex items-center justify-center gap-3">
          {submitting ? 'Prijavljivanje…' : 'Prijavi se'}
        </button>
      </form>
      </AuthShell>
    </>
  );
}
