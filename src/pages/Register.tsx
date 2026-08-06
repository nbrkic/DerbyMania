import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth-context';
import { AuthShell, TicketField, UsernameField, type UsernameStatus } from '../components/AuthShell';
import { Seo } from '../components/Seo';

const MIN_AGE_YEARS = 8;

function todayISO() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function latestAllowedBirthDateISO() {
  const now = new Date();
  return `${now.getFullYear() - MIN_AGE_YEARS}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export default function Register() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>('idle');
  const [birthDate, setBirthDate] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const errorRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (error) {
      errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [error]);

  type FieldErrors = {
    fullName?: string;
    username?: string;
    birthDate?: string;
    phone?: string;
    email?: string;
    password?: string;
  };

  function getFieldErrors(): FieldErrors {
    const errors: FieldErrors = {};

    if (!fullName.trim()) {
      errors.fullName = 'Unesi ime i prezime.';
    } else if (!/^[A-Za-zČĆŽŠĐčćžšđ]+(?: [A-Za-zČĆŽŠĐčćžšđ]+)*$/.test(fullName.trim())) {
      errors.fullName = 'Ime i prezime mogu sadržati samo slova i razmak.';
    }

    if (!username) {
      errors.username = 'Unesi korisničko ime.';
    } else if (usernameStatus === 'invalid') {
      errors.username = 'Najmanje 3 karaktera, samo slova i brojevi.';
    } else if (usernameStatus === 'taken') {
      errors.username = 'Ovo korisničko ime je zauzeto.';
    } else if (usernameStatus === 'checking') {
      errors.username = 'Sačekaj da se završi provera dostupnosti.';
    }

    if (!birthDate) {
      errors.birthDate = 'Unesi datum rođenja.';
    } else if (birthDate > todayISO()) {
      errors.birthDate = 'Datum rođenja ne može biti u budućnosti.';
    } else if (birthDate > latestAllowedBirthDateISO()) {
      errors.birthDate = `Moraš imati bar ${MIN_AGE_YEARS} godina.`;
    }

    if (!phone.trim()) {
      errors.phone = 'Unesi broj telefona.';
    } else if (!/^[0-9+\-\s()]+$/.test(phone) || phone.replace(/[^0-9]/g, '').length < 8) {
      errors.phone = 'Unesi ispravan broj telefona.';
    }

    if (!email.trim()) {
      errors.email = 'Unesi email.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Unesi ispravan email.';
    }

    if (!password) {
      errors.password = 'Unesi lozinku.';
    } else if (password.length < 6) {
      errors.password = 'Lozinka mora imati bar 6 karaktera.';
    }

    return errors;
  }

  const fieldErrors = attempted ? getFieldErrors() : {};

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setAttempted(true);

    if (Object.keys(getFieldErrors()).length > 0) return;

    setSubmitting(true);

    const { error, user } = await signUp(email, password, fullName, birthDate, phone, username);
    setSubmitting(false);
    if (error || !user) {
      setError(error ?? 'Došlo je do greške pri registraciji.');
      return;
    }

    navigate('/profile');
  }

  return (
    <>
      <Seo
        title="Registracija"
        description="Napravi besplatan DerbyMania nalog i pokreni prvi turnir za manje od pet minuta."
        path="/register"
        noindex
      />
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
        <TicketField n="1" label="Ime i prezime" id="fullName" type="text" autoComplete="name" value={fullName} onChange={setFullName} error={fieldErrors.fullName} />
        <UsernameField
          n="2"
          label="Korisničko ime"
          id="username"
          value={username}
          onChange={setUsername}
          onStatusChange={setUsernameStatus}
          error={fieldErrors.username}
        />
        <TicketField n="3" label="Email" id="email" type="email" autoComplete="email" value={email} onChange={setEmail} error={fieldErrors.email} />
        <TicketField n="4" label="Datum rođenja" id="birthDate" type="date" autoComplete="bday" value={birthDate} onChange={setBirthDate} dateMax={todayISO()} error={fieldErrors.birthDate} />
        <TicketField n="5" label="Broj telefona" id="phone" type="tel" autoComplete="tel" value={phone} onChange={setPhone} error={fieldErrors.phone} />
        <TicketField
          n="6"
          label="Lozinka"
          id="password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={setPassword}
          error={fieldErrors.password}
        />

        {error && (
          <p ref={errorRef} className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 px-3 py-2">{error}</p>
        )}

        <button type="submit" disabled={submitting} className="ticket-submit w-full mt-2 py-4 font-display text-sm tracking-widest uppercase flex items-center justify-center gap-3">
          {submitting ? 'Kreiranje naloga…' : 'Registruj se'}
        </button>
      </form>
      </AuthShell>
    </>
  );
}
