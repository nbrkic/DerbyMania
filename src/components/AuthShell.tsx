import { useEffect, useState, type ReactNode } from 'react';
import { SiteHeader } from './SiteHeader';
import { SiteFooter } from './SiteFooter';
import { DatePicker } from './DatePicker';
import { Dropdown } from './Dropdown';
import { supabase } from '../lib/supabase';

function EyeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a20.3 20.3 0 0 1 5.06-5.94M9.9 4.24A10.4 10.4 0 0 1 12 4c7 0 11 8 11 8a20.3 20.3 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <path d="M1 1l22 22" />
    </svg>
  );
}

// Matches the inset of the site nav's `max-w-6xl mx-auto px-6` container, so
// content lines up with the logo/nav-button edges instead of floating in its half.
// (Tailwind's scanner needs the full arbitrary-value class spelled out per usage —
// it reads raw source text, it can't resolve a JS template interpolation.)
const EDGE_PL = 'lg:pl-[max(1.5rem,calc(50vw_-_34.5rem))]';
const EDGE_PR = 'lg:pr-[max(1.5rem,calc(50vw_-_34.5rem))]';

function QuoteBlock({ text, author }: { text: string; author: string }) {
  return (
    <div className="relative z-10 mt-14 w-full border-t border-paper-100/10 pt-8">
      <span className="quote-mark text-5xl text-red-400 block mb-2">&ldquo;</span>
      <p className="text-paper-200 text-lg leading-snug">{text}</p>
      <p className="text-paper-500 text-xs uppercase tracking-widest mt-3">{author}</p>
    </div>
  );
}

function VsBadge() {
  return (
    <div className="hidden lg:block lg:absolute lg:inset-y-0 lg:left-1/2 lg:-translate-x-1/2 lg:z-20 border-l-2 border-dashed border-red-500/50" />
  );
}

type TicketFieldProps = {
  n: string;
  label: string;
  id: string;
  type: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete?: string;
  required?: boolean;
  minLength?: number;
  dateDefaultViewYear?: number;
  dateMax?: string;
  error?: string;
  prefix?: string;
  disabled?: boolean;
};

export function TicketField({ n, label, id, type, value, onChange, autoComplete, required, minLength, dateDefaultViewYear, dateMax, error, prefix, disabled }: TicketFieldProps) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';

  return (
    <div>
      <label htmlFor={id} className="flex items-baseline gap-2 text-[11px] uppercase tracking-widest text-paper-500 mb-2">
        <span className="text-red-400 font-bold">{n}</span> {label}
      </label>
      {type === 'date' ? (
        <DatePicker id={id} value={value} onChange={onChange} defaultViewYear={dateDefaultViewYear} max={dateMax} disabled={disabled} />
      ) : isPassword ? (
        <div className="relative">
          <input
            id={id}
            type={showPassword ? 'text' : 'password'}
            required={required}
            autoComplete={autoComplete}
            minLength={minLength}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className="field-input w-full pb-2.5 pr-9 text-base"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? 'Sakrij lozinku' : 'Prikaži lozinku'}
            className="absolute right-0 bottom-2 text-paper-500 hover:text-paper-100 transition-colors"
          >
            {showPassword ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
          </button>
        </div>
      ) : (
        <div className="relative">
          {prefix && <span className="absolute left-0 bottom-2.5 text-paper-500 select-none">{prefix}</span>}
          <input
            id={id}
            type={type}
            required={required}
            autoComplete={autoComplete}
            minLength={minLength}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className={`field-input w-full pb-2.5 text-base ${prefix ? 'pl-4' : ''}`}
          />
        </div>
      )}
      {error && <p className="text-[11px] text-red-400 mt-1.5">{error}</p>}
    </div>
  );
}

export const USERNAME_REGEX = /^[A-Za-z0-9]{3,}$/;

export function sanitizeUsernameInput(raw: string): string {
  return raw.replace(/[^A-Za-z0-9]/g, '');
}

export type UsernameStatus = 'idle' | 'checking' | 'available' | 'taken' | 'invalid';

function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12.5 2.5 2.5L16 9.5" />
    </svg>
  );
}

function XCircleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="m9.5 9.5 5 5m0-5-5 5" />
    </svg>
  );
}

function SpinnerIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={`animate-spin ${className ?? ''}`}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" strokeOpacity="0.25" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

type UsernameFieldProps = {
  n: string;
  label: string;
  id: string;
  value: string;
  onChange: (value: string) => void;
  /** Username already saved for this account, if any — typing back to this value skips the availability check. */
  currentUsername?: string | null;
  onStatusChange?: (status: UsernameStatus) => void;
  required?: boolean;
  /** Shown below the field when it's required but still empty (format/taken messages are handled internally). */
  error?: string;
  disabled?: boolean;
};

export function UsernameField({ n, label, id, value, onChange, currentUsername, onStatusChange, required, error, disabled }: UsernameFieldProps) {
  const [status, setStatus] = useState<UsernameStatus>('idle');

  useEffect(() => {
    if (!value) {
      setStatus('idle');
      onStatusChange?.('idle');
      return;
    }
    if (!USERNAME_REGEX.test(value)) {
      setStatus('invalid');
      onStatusChange?.('invalid');
      return;
    }
    if (currentUsername && value.toLowerCase() === currentUsername.toLowerCase()) {
      setStatus('available');
      onStatusChange?.('available');
      return;
    }

    setStatus('checking');
    onStatusChange?.('checking');
    const timeout = setTimeout(async () => {
      const { data, error } = await supabase.rpc('is_username_available', { p_username: value });
      if (error) {
        setStatus('idle');
        onStatusChange?.('idle');
        return;
      }
      const next: UsernameStatus = data ? 'available' : 'taken';
      setStatus(next);
      onStatusChange?.(next);
    }, 450);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, currentUsername]);

  return (
    <div>
      <label htmlFor={id} className="flex items-baseline gap-2 text-[11px] uppercase tracking-widest text-paper-500 mb-2">
        <span className="text-red-400 font-bold">{n}</span> {label}
      </label>
      <div className="relative">
        <span className="absolute left-0 bottom-2.5 text-paper-500 select-none">@</span>
        <input
          id={id}
          type="text"
          required={required}
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          value={value}
          onChange={(e) => onChange(sanitizeUsernameInput(e.target.value))}
          disabled={disabled}
          className="field-input w-full pb-2.5 pl-4 pr-9 text-base"
        />
        {!disabled && (
          <span className="absolute right-0 bottom-2 pointer-events-none">
            {status === 'checking' && <SpinnerIcon className="w-4 h-4 text-paper-500" />}
            {status === 'available' && <CheckCircleIcon className="w-4 h-4 text-green-400" />}
            {(status === 'taken' || status === 'invalid') && <XCircleIcon className="w-4 h-4 text-red-400" />}
          </span>
        )}
      </div>
      {status === 'invalid' && value && (
        <p className="text-[11px] text-red-400 mt-1.5">Najmanje 3 karaktera, samo slova i brojevi.</p>
      )}
      {status === 'taken' && <p className="text-[11px] text-red-400 mt-1.5">Ovo korisničko ime je zauzeto.</p>}
      {!value && error && <p className="text-[11px] text-red-400 mt-1.5">{error}</p>}
    </div>
  );
}

type TextAreaFieldProps = {
  n: string;
  label: string;
  id: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  rows?: number;
  placeholder?: string;
  error?: string;
};

export function TextAreaField({ n, label, id, value, onChange, required, rows = 4, placeholder, error }: TextAreaFieldProps) {
  return (
    <div>
      <label htmlFor={id} className="flex items-baseline gap-2 text-[11px] uppercase tracking-widest text-paper-500 mb-2">
        <span className="text-red-400 font-bold">{n}</span> {label}
      </label>
      <textarea
        id={id}
        required={required}
        rows={rows}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="field-input w-full pb-2.5 text-base resize-none"
      />
      {error && <p className="text-[11px] text-red-400 mt-1.5">{error}</p>}
    </div>
  );
}

type SelectFieldProps = {
  n: string;
  label: string;
  id: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  required?: boolean;
  placeholder?: string;
  error?: string;
};

export function SelectField({ n, label, id, value, onChange, options, placeholder, error }: SelectFieldProps) {
  return (
    <div>
      <label htmlFor={id} className="flex items-baseline gap-2 text-[11px] uppercase tracking-widest text-paper-500 mb-2">
        <span className="text-red-400 font-bold">{n}</span> {label}
      </label>
      <Dropdown id={id} value={value} onChange={onChange} options={options} placeholder={placeholder} />
      {error && <p className="text-[11px] text-red-400 mt-1.5">{error}</p>}
    </div>
  );
}

type MultiSelectPillsProps = {
  n: string;
  label: string;
  value: string[];
  onChange: (value: string[]) => void;
  options: { value: string; label: string }[];
};

export function MultiSelectPills({ n, label, value, onChange, options }: MultiSelectPillsProps) {
  function toggle(optionValue: string) {
    if (value.includes(optionValue)) {
      onChange(value.filter((v) => v !== optionValue));
    } else {
      onChange([...value, optionValue]);
    }
  }

  return (
    <div>
      <label className="flex items-baseline gap-2 text-[11px] uppercase tracking-widest text-paper-500 mb-3">
        <span className="text-red-400 font-bold">{n}</span> {label}
      </label>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const selected = value.includes(o.value);
          return (
            <button
              key={o.value}
              type="button"
              onClick={() => toggle(o.value)}
              className={`px-4 py-2 text-xs uppercase tracking-widest border transition-colors ${
                selected
                  ? 'bg-red-500 border-red-500 text-paper-100 font-semibold'
                  : 'border-ink-700 text-paper-500 hover:border-red-400/50 hover:text-paper-100'
              }`}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

type AuthShellProps = {
  flip?: boolean;
  headline: ReactNode;
  blurb: string;
  quote: { text: string; author: string };
  formTitle: string;
  children: ReactNode;
  footer: ReactNode;
};

export function AuthShell({ flip, headline, blurb, quote, formTitle, children, footer }: AuthShellProps) {
  return (
    <div className="min-h-screen flex flex-col bg-ink-950 text-paper-100 overflow-x-hidden">
      <div className="grain" />
      <SiteHeader />

      <main className="flex-1 pt-16 relative flex flex-col lg:grid lg:grid-cols-2">
        {/* ── ATMOSPHERE PANEL (hidden below lg) ────────────────── */}
        <div
          className={`hidden lg:flex relative overflow-hidden bg-gradient-to-b from-maroon-700 via-maroon-900 to-ink-950 py-20 flex-col justify-center ${
            flip ? `lg:order-2 lg:pl-10 ${EDGE_PR}` : `${EDGE_PL} lg:pr-10`
          }`}
        >
          <div className="relative z-10 w-full">
            <h1 className="rise-1 font-display text-4xl sm:text-5xl leading-[1.05] mb-6">{headline}</h1>
            <p className="rise-2 text-paper-300 leading-relaxed max-w-md">{blurb}</p>
          </div>

          <div className="w-full max-w-md">
            <QuoteBlock text={quote.text} author={quote.author} />
          </div>
        </div>

        <VsBadge />

        {/* ── FORM PANEL ───────────────────────────────────────── */}
        <div
          className={`relative flex-1 bg-ink-900 px-6 sm:px-12 py-16 lg:py-20 flex flex-col items-center justify-center ${
            flip ? `lg:order-1 ${EDGE_PL} lg:pr-10` : `lg:pl-10 ${EDGE_PR}`
          }`}
        >
          <div className="w-full max-w-sm lg:max-w-none">
            <h2 className="font-display text-3xl sm:text-4xl mb-10 leading-tight text-paper-100">{formTitle}</h2>

            {children}

            <div className="mt-10 pt-6 border-t border-paper-100/10 text-sm text-paper-500">{footer}</div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
