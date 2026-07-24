import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth-context';
import { AuthShell, TicketField } from '../components/AuthShell';

export default function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email && !password) {
      setError('Niste uneli email i lozinku.');
      return;
    }
    if (!email) {
      setError('Niste uneli email.');
      return;
    }
    if (!password) {
      setError('Niste uneli lozinku.');
      return;
    }

    setSubmitting(true);
    const { error } = await signIn(email, password);
    setSubmitting(false);
    if (error) {
      setError(error);
      return;
    }
    navigate('/');
  }

  return (
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
        <TicketField n="1" label="Email" id="email" type="email" autoComplete="email" value={email} onChange={setEmail} />
        <TicketField
          n="2"
          label="Lozinka"
          id="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={setPassword}
        />

        {error && (
          <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 px-3 py-2">{error}</p>
        )}

        <button type="submit" disabled={submitting} className="ticket-submit w-full mt-2 py-4 font-display text-sm tracking-widest uppercase flex items-center justify-center gap-3">
          {submitting ? 'Prijavljivanje…' : 'Prijavi se'}
        </button>
      </form>
    </AuthShell>
  );
}
