import { useEffect, useState } from 'react';

/* ─── DATA ──────────────────────────────────────────────────── */
const NAV_LINKS = [
  { label: 'Mogućnosti', href: '#features' },
  { label: 'Kako radi', href: '#how' },
  { label: 'Tabela', href: '#table' },
];

const FEATURES = [
  {
    n: '01',
    title: 'Žreb i raspored',
    desc: 'Formiraj grupe i generiši raspored za ligu ili eliminacije u nekoliko klikova — bez tabela u Excel-u.',
  },
  {
    n: '02',
    title: 'Kartoteka ekipa',
    desc: 'Grb, boje, sastav i istorija svake ekipe na jednom mestu, dostupno pre i posle svakog meča.',
  },
  {
    n: '03',
    title: 'Rezultati uživo',
    desc: 'Unesi rezultat sa terena i tabela grupe se sama preračuna, bez ručnog sabiranja bodova.',
  },
  {
    n: '04',
    title: 'Statistika i forma',
    desc: 'Strelci, asistencije i forma ekipa kroz sezonu — spremno za deljenje sa navijačima.',
  },
];

const STEPS = [
  {
    n: 'I',
    title: 'Kreiraj turnir',
    desc: 'Izaberi format — liga, grupe ili eliminacije — i broj ekipa koje igraju.',
  },
  {
    n: 'II',
    title: 'Pozovi ekipe',
    desc: 'Ekipe se prijavljuju sa sastavom, grbom i bojama kluba.',
  },
  {
    n: 'III',
    title: 'Odigraj kola',
    desc: 'Unosi rezultat posle svakog meča, tabela se sama ažurira.',
  },
  {
    n: 'IV',
    title: 'Proglasi šampiona',
    desc: 'Konačan plasman i statistika sezone, spremni za deljenje.',
  },
];

const STANDINGS = [
  { pos: 1, team: 'FK Vihor', p: 6, w: 4, d: 2, l: 0, gf: 14, ga: 5, pts: 14 },
  { pos: 2, team: 'FK Granit', p: 6, w: 3, d: 2, l: 1, gf: 11, ga: 7, pts: 11 },
  { pos: 3, team: 'FK Kometa', p: 6, w: 3, d: 1, l: 2, gf: 10, ga: 9, pts: 10 },
  { pos: 4, team: 'FK Zmaj', p: 6, w: 1, d: 3, l: 2, gf: 8, ga: 10, pts: 6 },
  { pos: 5, team: 'FK Lavovi', p: 6, w: 1, d: 2, l: 3, gf: 7, ga: 11, pts: 5 },
  { pos: 6, team: 'FK Tvrđava', p: 6, w: 0, d: 2, l: 4, gf: 4, ga: 12, pts: 2 },
];

/* ─── MAIN COMPONENT ────────────────────────────────────────── */
export default function Landing() {
  const [navScrolled, setNavScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setNavScrolled(window.scrollY > 30);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-ink-950 text-paper-100 overflow-x-hidden">
      <style>{`
        @keyframes riseIn {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .rise-1 { animation: riseIn 0.6s cubic-bezier(0.16,1,0.3,1) 0.05s both; }
        .rise-2 { animation: riseIn 0.6s cubic-bezier(0.16,1,0.3,1) 0.15s both; }
        .rise-3 { animation: riseIn 0.6s cubic-bezier(0.16,1,0.3,1) 0.25s both; }

        .feature-card {
          border-top: 1px solid var(--ink-700);
          transition: border-color 0.25s ease;
        }
        .feature-card:hover {
          border-top-color: var(--red-500);
        }

        .btn-solid {
          background: var(--red-500);
          color: var(--paper-100);
          font-weight: 600;
          transition: background-color 0.2s ease, transform 0.2s ease;
        }
        .btn-solid:hover { background: var(--red-400); transform: translateY(-2px); }
        .btn-solid:active { transform: translateY(0); }

        .btn-line {
          background: transparent;
          border: 1.5px solid var(--line);
          color: var(--paper-100);
          transition: border-color 0.2s ease, transform 0.2s ease;
        }
        .btn-line:hover { border-color: var(--paper-100); transform: translateY(-2px); }
        .btn-line:active { transform: translateY(0); }

        .btn-arrow { display: inline-block; transition: transform 0.2s ease; }
        a:hover .btn-arrow, button:hover .btn-arrow { transform: translateX(3px); }

        .quote-mark {
          font-family: Georgia, serif;
          line-height: 0.6;
        }

        .grain {
          position: fixed;
          inset: 0;
          pointer-events: none;
          opacity: 0.05;
          mix-blend-mode: overlay;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
        }
      `}</style>

      <div className="grain" />

      {/* ── NAVBAR ─────────────────────────────────────────────── */}
      <header className="fixed top-3 left-0 right-0 z-50 px-4 sm:px-6">
        <div
          className={`max-w-4xl mx-auto rounded-full border bg-ink-900 transition-colors duration-300 ${
            navScrolled ? 'border-red-500/40 shadow-[0_10px_28px_-10px_rgba(0,0,0,0.7)]' : 'border-ink-700'
          }`}
        >
          <div className="px-6 h-16 flex items-center justify-between">
            <a href="#" className="flex items-center">
              <img src="/logo.png" alt="DerbyMania" className="h-11 w-auto" />
            </a>

            <nav className="hidden md:flex items-center gap-8">
              {NAV_LINKS.map((l) => (
                <a
                  key={l.label}
                  href={l.href}
                  className="text-xs font-medium uppercase tracking-widest text-paper-500 hover:text-paper-100 transition-colors"
                >
                  {l.label}
                </a>
              ))}
            </nav>

            <a href="#start" className="hidden md:inline-flex btn-solid rounded-full px-5 py-2 text-sm items-center gap-1.5">
              Napravi turnir <span className="btn-arrow">→</span>
            </a>

            <button
              type="button"
              onClick={() => setMobileMenuOpen((v) => !v)}
              aria-label="Meni"
              aria-expanded={mobileMenuOpen}
              className="md:hidden flex flex-col items-center justify-center gap-1.5 w-9 h-9 -mr-1"
            >
              <span className="w-5 h-0.5 bg-paper-100" />
              <span className="w-5 h-0.5 bg-paper-100" />
              <span className="w-5 h-0.5 bg-paper-100" />
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden mt-2 max-w-4xl mx-auto rounded-3xl border border-ink-700 bg-ink-900">
            <nav className="flex flex-col p-3">
              {NAV_LINKS.map((l) => (
                <a
                  key={l.label}
                  href={l.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-3 text-sm font-medium uppercase tracking-widest text-paper-500 hover:text-paper-100 transition-colors"
                >
                  {l.label}
                </a>
              ))}
              <a
                href="#start"
                onClick={() => setMobileMenuOpen(false)}
                className="btn-solid rounded-full px-5 py-3 text-sm inline-flex items-center justify-center gap-1.5 mt-2"
              >
                Napravi turnir <span className="btn-arrow">→</span>
              </a>
            </nav>
          </div>
        )}
      </header>

      {/* ── HERO ────────────────────────────────────────────────── */}
      <section className="relative pt-24 overflow-hidden">
        <div
          className="absolute inset-x-0 top-24 bottom-0 bg-ink-700"
          style={{ clipPath: 'polygon(0 2%, 100% 0, 100% 99%, 0 100%)' }}
        />
        <div
          className="absolute inset-x-0 top-24 bottom-0 bg-red-600"
          style={{ clipPath: 'polygon(0 4%, 100% 0, 100% 96.5%, 0 100%)' }}
        />
        <div
          className="absolute inset-x-0 top-24 bottom-0 bg-gradient-to-b from-maroon-700 to-maroon-900"
          style={{ clipPath: 'polygon(0 6%, 100% 0, 100% 94%, 0 100%)' }}
        />

        <div className="relative z-10 max-w-3xl mx-auto px-6 py-16 sm:py-28 md:py-44 text-center">
          <h1 className="rise-1 font-display leading-[1.02] tracking-tight text-5xl sm:text-7xl md:text-8xl mb-8">
            Organizacija <span className="text-red-400">sportskih turnira</span>
          </h1>

          <p className="rise-2 text-paper-300 text-lg max-w-md mx-auto mb-10 leading-relaxed">
            DerbyMania vodi tvoj žreb, raspored i rezultate od prve do poslednje utakmice sezone.
          </p>

          <div className="rise-3 flex flex-col sm:flex-row gap-4 justify-center">
            <a href="#start" className="btn-solid px-8 py-4 text-base inline-flex items-center justify-center gap-2">
              Napravi prvi turnir <span className="btn-arrow">→</span>
            </a>
            <a href="#how" className="btn-line px-8 py-4 text-base inline-flex items-center justify-center gap-2">
              Vidi kako radi
            </a>
          </div>
        </div>
      </section>

      {/* ── STATEMENT ───────────────────────────────────────────── */}
      <section className="py-7 sm:py-10 md:py-14 border-b border-ink-700">
        <p className="max-w-xl mx-auto px-6 text-center text-base sm:text-lg font-medium text-paper-500">
          Organizacija turnira nikad nije bila lakša — <span className="text-red-400">uz DerbyManiju.</span>
        </p>
      </section>

      {/* ── FEATURES ────────────────────────────────────────────── */}
      <section id="features" className="pt-28 pb-12 md:py-36">
        <div className="max-w-6xl mx-auto px-6 grid lg:grid-cols-[320px_1fr] gap-12 lg:gap-32">
          <div>
            <span className="text-xs uppercase tracking-widest text-red-400 font-semibold">Funkcionalnosti</span>
            <h2 className="font-display text-4xl sm:text-5xl mt-4 leading-tight">Omogućavamo Vam</h2>
            <p className="text-paper-500 mt-5 leading-relaxed">
              Vođenje turnira bez Excel tabela za raspored i bez Viber grupe za svaki rezultat.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-x-12 gap-y-12">
            {FEATURES.map((f) => (
              <div key={f.n} className="feature-card pt-5">
                <div className="font-bold text-lg mb-2">{f.title}</div>
                <p className="text-paper-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── KAKO RADI ───────────────────────────────────────────── */}
      <section id="how" className="pt-12 pb-12 md:py-36 border-t border-ink-700">
        <div className="max-w-6xl mx-auto px-6 grid lg:grid-cols-[1fr_400px] gap-12 lg:gap-32">
          <div className="grid sm:grid-cols-2 gap-x-12 gap-y-12 order-2 lg:order-1">
            {STEPS.map((s) => (
              <div key={s.n}>
                <div className="text-red-400 font-black text-2xl mb-4 pb-4 border-b-2 border-red-500/30">{s.n}</div>
                <div className="font-bold text-lg mb-2">{s.title}</div>
                <p className="text-paper-500 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>

          <div className="order-1 lg:order-2">
            <span className="text-xs uppercase tracking-widest text-red-400 font-semibold">Kako radi</span>
            <h2 className="font-display text-4xl sm:text-5xl mt-4 leading-tight">Četiri lagana koraka.</h2>
            <p className="text-paper-500 mt-5 leading-relaxed">
              Od prijave ekipa do proglašenja šampiona, sve prati jedan tok bez preskakanja koraka.
            </p>
          </div>
        </div>
      </section>

      {/* ── TABELA ──────────────────────────────────────────────── */}
      <section id="table" className="relative pt-12 pb-28 md:py-36 overflow-hidden">
        <div
          className="absolute inset-0 bg-gradient-to-b from-maroon-700 to-maroon-900"
          style={{ clipPath: 'polygon(0 6%, 100% 0, 100% 94%, 0 100%)' }}
        />

        <div className="relative z-10 max-w-4xl mx-auto px-6">
          <div className="mb-14 max-w-lg">
            <h2 className="font-display text-4xl sm:text-5xl mt-4 leading-tight">Tabela ne laže.</h2>
          </div>

          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="text-paper-300/70 text-xs uppercase tracking-widest border-b border-paper-100/20">
                <th className="text-left font-medium pb-4 pr-3">#</th>
                <th className="text-left font-medium pb-4 pr-3">Ekipa</th>
                <th className="hidden sm:table-cell text-center font-medium pb-4 px-2">Utak.</th>
                <th className="hidden sm:table-cell text-center font-medium pb-4 px-2">Pob.</th>
                <th className="hidden sm:table-cell text-center font-medium pb-4 px-2">Ner.</th>
                <th className="hidden sm:table-cell text-center font-medium pb-4 px-2">Por.</th>
                <th className="text-center font-medium pb-4 px-2">Golovi</th>
                <th className="text-right font-medium pb-4 pl-2">Bod.</th>
              </tr>
            </thead>
            <tbody>
              {STANDINGS.map((row) => (
                <tr
                  key={row.team}
                  className={`border-b border-paper-100/10 ${row.pos <= 2 ? 'border-l-2 border-l-red-400' : ''}`}
                >
                  <td className="py-3 pr-3 pl-2 text-paper-300/70 tabular-nums">{row.pos}</td>
                  <td className="py-3 pr-3 font-semibold">{row.team}</td>
                  <td className="hidden sm:table-cell py-3 px-2 text-center tabular-nums text-paper-300/80">{row.p}</td>
                  <td className="hidden sm:table-cell py-3 px-2 text-center tabular-nums text-paper-300/80">{row.w}</td>
                  <td className="hidden sm:table-cell py-3 px-2 text-center tabular-nums text-paper-300/80">{row.d}</td>
                  <td className="hidden sm:table-cell py-3 px-2 text-center tabular-nums text-paper-300/80">{row.l}</td>
                  <td className="py-3 px-2 text-center tabular-nums text-paper-300/80">{row.gf}:{row.ga}</td>
                  <td className="py-3 pl-2 text-right font-black tabular-nums">{row.pts}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="border-t border-paper-100/15 mt-14 pt-14 max-w-2xl">
            <span className="quote-mark text-6xl text-red-400 block mb-2">&ldquo;</span>
            <p className="text-xl sm:text-2xl font-medium leading-snug mb-4">
              Prvi put da tabelu grupe ne računam ručno na klupi.
            </p>
            <p className="text-paper-300 text-sm uppercase tracking-widest">Organizator, Kup regije</p>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ───────────────────────────────────────────── */}
      <section id="start" className="py-28 md:py-36">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h2 className="font-display text-4xl sm:text-5xl md:text-6xl mt-5 mb-8 leading-tight max-w-2xl mx-auto">
            Tvoj turnir. <span className="text-red-400">Tvoja pravila.</span>
          </h2>
          <p className="text-paper-500 text-lg max-w-md mx-auto mb-10 leading-relaxed">
            Kreiraj prvi turnir za manje od pet minuta. Besplatno, bez komplikacija.
          </p>
          <a href="#" className="btn-solid px-9 py-4 text-base inline-flex items-center gap-2">
            Napravi turnir <span className="btn-arrow">→</span>
          </a>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────── */}
      <footer className="border-t border-ink-700 py-10">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-6">
          <span className="font-black tracking-tight">
            DERBY<span className="font-light text-paper-500">MANIA</span>
          </span>
          <div className="flex items-center gap-8">
            {NAV_LINKS.map((l) => (
              <a key={l.label} href={l.href} className="text-xs uppercase tracking-widest text-paper-700 hover:text-paper-100 transition-colors">
                {l.label}
              </a>
            ))}
          </div>
          <span className="text-xs text-paper-700 uppercase tracking-widest">© 2026 DerbyMania</span>
        </div>
      </footer>
    </div>
  );
}
