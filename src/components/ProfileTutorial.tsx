import { useCallback, useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react';

export type TutorialStep = {
  /** Element to spotlight for this step. */
  ref: RefObject<HTMLElement | null>;
  title: string;
  body: string;
};

type Rect = { top: number; left: number; width: number; height: number };

// Razmak (px) oko istaknutog elementa i debljina zaobljenja rupe.
const PAD = 10;
const RADIUS = 14;
// Razmak između rupe i kartice sa uputstvom.
const CARD_GAP = 18;
// Fiksni header (z-50) je iznad tutorijala — UI drži ispod njegove visine.
const HEADER_SAFE = 72;

/**
 * Vođeni mini-tutorijal preko /profile stranice: sve je zamućeno i zatamnjeno
 * osim trenutnog polja, koje ostaje oštro i interaktivno (kroz „rupu" u overlay-u).
 * Kartica prikazuje „Korak X/N", opis i dugmad za kretanje; gore desno je „Preskoči".
 */
export function ProfileTutorial({
  steps,
  onClose,
  onFinish,
}: {
  steps: TutorialStep[];
  /** Preskoči tutorijal — zatvara bez čuvanja. */
  onClose: () => void;
  /** Poslednji korak — zatvara i odmah čuva profil. */
  onFinish: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [viewport, setViewport] = useState({ w: window.innerWidth, h: window.innerHeight });
  const [cardSize, setCardSize] = useState({ w: 340, h: 220 });
  const cardRef = useRef<HTMLDivElement>(null);

  const total = steps.length;
  const step = steps[Math.min(index, total - 1)];
  const isFirst = index === 0;
  const isLast = index >= total - 1;

  // Ako se broj koraka smanji (npr. korisnik odčekira sport), vrati index u opseg.
  useEffect(() => {
    if (index > total - 1) setIndex(Math.max(0, total - 1));
  }, [total, index]);

  const measure = useCallback(() => {
    const el = step?.ref.current;
    setViewport({ w: window.innerWidth, h: window.innerHeight });
    if (!el) {
      setRect(null);
      return;
    }
    const r = el.getBoundingClientRect();
    setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
  }, [step]);

  // Na promenu koraka: izmeri odmah (pre iscrtavanja, bez treptaja), dovedi element
  // u vidno polje pa prati njegovu poziciju kratko vreme dok traje glatko skrolovanje.
  useLayoutEffect(() => {
    measure();
    const el = step?.ref.current;
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    let raf = 0;
    const start = performance.now();
    const tick = (t: number) => {
      measure();
      if (t - start < 800) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [index, measure, step]);

  // Prati skrol/resize da highlight ostane zalepljen za element.
  useEffect(() => {
    const onChange = () => measure();
    window.addEventListener('scroll', onChange, true);
    window.addEventListener('resize', onChange);
    return () => {
      window.removeEventListener('scroll', onChange, true);
      window.removeEventListener('resize', onChange);
    };
  }, [measure]);

  // Escape preskače tutorijal.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Zaključaj skrolovanje stranice dok traje tutorijal — pomera se samo programski
  // (scrollIntoView po koraku). Blokiramo točkić, prevlačenje prstom i skrol-tastere,
  // ali ne diramo kucanje po poljima.
  useEffect(() => {
    const SCROLL_KEYS = new Set(['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' ', 'Spacebar']);
    // Nađi najbliži sopstveni skrolabilni kontejner (npr. lista gradova u padajućem
    // meniju); vrati null ako ga nema — tada blokiramo skrol cele stranice.
    const getScrollableAncestor = (node: EventTarget | null): HTMLElement | null => {
      let el = node instanceof Element ? (node as HTMLElement) : null;
      while (el && el !== document.body && el !== document.documentElement) {
        const oy = getComputedStyle(el).overflowY;
        if ((oy === 'auto' || oy === 'scroll') && el.scrollHeight > el.clientHeight) return el;
        el = el.parentElement;
      }
      return null;
    };
    const preventScroll = (e: Event) => {
      const scrollable = getScrollableAncestor(e.target);
      if (!scrollable) {
        e.preventDefault();
        return;
      }
      // Spreči „scroll chaining" na stranicu kada se dođe do ivice liste i nastavi
      // da se skroluje u istom smeru (npr. do dna liste pa još naniže na točkiću).
      if (e.type === 'wheel') {
        const we = e as WheelEvent;
        const atTop = scrollable.scrollTop <= 0;
        const atBottom = scrollable.scrollTop + scrollable.clientHeight >= scrollable.scrollHeight - 1;
        if ((we.deltaY < 0 && atTop) || (we.deltaY > 0 && atBottom)) e.preventDefault();
      }
    };
    const preventScrollKeys = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      const interactive = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || tag === 'BUTTON' || target?.isContentEditable;
      if (!interactive && SCROLL_KEYS.has(e.key)) e.preventDefault();
    };
    window.addEventListener('wheel', preventScroll, { passive: false });
    window.addEventListener('touchmove', preventScroll, { passive: false });
    window.addEventListener('keydown', preventScrollKeys);

    // Sakrij scroll-traku (na desktopu i telefonu) da se ne može uhvatiti i povući.
    document.documentElement.classList.add('tutorial-no-scrollbar');
    document.body.classList.add('tutorial-no-scrollbar');

    return () => {
      window.removeEventListener('wheel', preventScroll);
      window.removeEventListener('touchmove', preventScroll);
      window.removeEventListener('keydown', preventScrollKeys);
      document.documentElement.classList.remove('tutorial-no-scrollbar');
      document.body.classList.remove('tutorial-no-scrollbar');
    };
  }, []);

  // Meri stvarnu veličinu kartice radi tačnog pozicioniranja.
  useLayoutEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const update = () => setCardSize({ w: el.offsetWidth, h: el.offsetHeight });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [index]);

  function next() {
    if (isLast) onFinish();
    else setIndex((i) => Math.min(i + 1, total - 1));
  }
  function prev() {
    setIndex((i) => Math.max(i - 1, 0));
  }

  // Rupa oko elementa (sa razmakom), ograničena na vidljivi ekran.
  const hole = rect
    ? {
        x: Math.max(0, rect.left - PAD),
        y: Math.max(0, rect.top - PAD),
        w: Math.min(viewport.w, rect.width + PAD * 2),
        h: Math.min(viewport.h, rect.height + PAD * 2),
      }
    : null;

  // Pozicija kartice: ispod rupe ako ima mesta, inače iznad, inače centrirano.
  let cardTop: number;
  let cardLeft: number;
  if (hole) {
    const spaceBelow = viewport.h - (hole.y + hole.h);
    const spaceAbove = hole.y;
    const placeBelow = spaceBelow >= cardSize.h + CARD_GAP + 16 || spaceBelow >= spaceAbove;
    cardTop = placeBelow
      ? Math.min(hole.y + hole.h + CARD_GAP, viewport.h - cardSize.h - 16)
      : Math.max(HEADER_SAFE, hole.y - cardSize.h - CARD_GAP);
    cardLeft = hole.x + hole.w / 2 - cardSize.w / 2;
    cardLeft = Math.max(16, Math.min(cardLeft, viewport.w - cardSize.w - 16));
  } else {
    cardTop = viewport.h / 2 - cardSize.h / 2;
    cardLeft = viewport.w / 2 - cardSize.w / 2;
  }

  const panelClass = 'fixed bg-ink-950/70 backdrop-blur-[3px] pointer-events-auto';

  return (
    <div className="fixed inset-0 z-40 pointer-events-none">
      {/* Zamućeni paneli oko rupe (ili ceo ekran kad nema elementa). */}
      {hole ? (
        <>
          <div className={panelClass} style={{ left: 0, top: 0, width: '100vw', height: hole.y }} />
          <div className={panelClass} style={{ left: 0, top: hole.y + hole.h, width: '100vw', bottom: 0 }} />
          <div className={panelClass} style={{ left: 0, top: hole.y, width: hole.x, height: hole.h }} />
          <div className={panelClass} style={{ left: hole.x + hole.w, top: hole.y, right: 0, height: hole.h }} />
          {/* Prsten oko istaknutog elementa. */}
          <div
            className="fixed pointer-events-none border-2 border-red-400"
            style={{
              left: hole.x,
              top: hole.y,
              width: hole.w,
              height: hole.h,
              borderRadius: RADIUS,
              boxShadow: '0 0 0 2px rgba(232,41,58,0.25), 0 0 32px 6px rgba(194,31,46,0.45)',
            }}
          />
        </>
      ) : (
        <div className={`${panelClass} inset-0`} style={{ width: '100vw', height: '100vh' }} />
      )}

      {/* Dugme „Preskoči tutorijal" gore desno. */}
      <button
        type="button"
        onClick={onClose}
        style={{ top: HEADER_SAFE }}
        className="fixed right-3 sm:right-4 z-20 pointer-events-auto px-4 py-2 text-[11px] uppercase tracking-widest text-paper-300 bg-ink-900/90 border border-ink-700 hover:border-red-400/60 hover:text-paper-100 transition-colors"
      >
        Preskoči tutorijal
      </button>

      {/* Kartica sa uputstvom. */}
      <div
        ref={cardRef}
        className="fixed z-10 pointer-events-auto w-[min(360px,calc(100vw-2rem))] bg-ink-900 border border-red-500/30 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.85)] fade-up-in"
        style={{ top: cardTop, left: cardLeft }}
      >
        <div className="px-5 pt-4 pb-3 border-b border-ink-700 flex items-center justify-between gap-3">
          <span className="text-[11px] uppercase tracking-widest text-red-400 font-bold">
            Korak {index + 1}/{total}
          </span>
          <div className="flex items-center gap-1.5">
            {steps.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all duration-200 ${
                  i === index ? 'w-5 bg-red-400' : 'w-1.5 bg-ink-700'
                }`}
              />
            ))}
          </div>
        </div>

        <div className="px-5 py-4">
          <h3 className="font-display text-xl leading-tight mb-2">{step?.title}</h3>
          <p className="text-sm text-paper-300 leading-relaxed">{step?.body}</p>
        </div>

        <div className="px-5 pb-4 pt-1 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={prev}
            disabled={isFirst}
            className="px-3 py-2 text-[11px] uppercase tracking-widest text-paper-500 hover:text-paper-100 transition-colors disabled:opacity-0 disabled:pointer-events-none"
          >
            Nazad
          </button>
          <button
            type="button"
            onClick={next}
            className="btn-solid px-6 py-2.5 text-[11px] uppercase tracking-widest font-semibold"
          >
            {isLast ? 'Završi & Sačuvaj' : 'Dalje'}
          </button>
        </div>
      </div>
    </div>
  );
}
