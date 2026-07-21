import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { SiteHeader } from './SiteHeader';
import { SiteFooter } from './SiteFooter';
import { DatePicker } from './DatePicker';

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
};

export function TicketField({ n, label, id, type, value, onChange, autoComplete, required, minLength }: TicketFieldProps) {
  return (
    <div>
      <label htmlFor={id} className="flex items-baseline gap-2 text-[11px] uppercase tracking-widest text-paper-500 mb-2">
        <span className="text-red-400 font-bold">{n}</span> {label}
      </label>
      {type === 'date' ? (
        <DatePicker id={id} value={value} onChange={onChange} />
      ) : (
        <input
          id={id}
          type={type}
          required={required}
          autoComplete={autoComplete}
          minLength={minLength}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="field-input w-full pb-2.5 text-base"
        />
      )}
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

            <Link
              to="/"
              className="btn-line w-full mt-6 py-3.5 text-sm uppercase tracking-widest flex items-center justify-center"
            >
              Nazad na početnu
            </Link>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
