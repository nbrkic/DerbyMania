import { useEffect, useRef, useState } from 'react';

const MONTHS = [
  'Januar', 'Februar', 'Mart', 'April', 'Maj', 'Jun',
  'Jul', 'Avgust', 'Septembar', 'Oktobar', 'Novembar', 'Decembar',
];
const WEEKDAYS = ['Pon', 'Uto', 'Sre', 'Čet', 'Pet', 'Sub', 'Ned'];

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function toISO(year: number, month: number, day: number) {
  return `${year}-${pad(month + 1)}-${pad(day)}`;
}

function formatDisplay(iso: string) {
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}.`;
}

type DatePickerProps = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  defaultViewYear?: number;
};

export function DatePicker({ id, value, onChange, defaultViewYear }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const now = new Date();
  const [year, selectedMonth, selectedDay] = value ? value.split('-').map(Number) : [];

  const [viewYear, setViewYear] = useState(year ?? defaultViewYear ?? now.getFullYear() - 25);
  const [viewMonth, setViewMonth] = useState(selectedMonth ? selectedMonth - 1 : 0);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  function openPicker() {
    if (year) {
      setViewYear(year);
      setViewMonth(selectedMonth - 1);
    }
    setOpen(true);
  }

  function changeMonth(delta: number) {
    let m = viewMonth + delta;
    let y = viewYear;
    if (m < 0) { m = 11; y -= 1; }
    if (m > 11) { m = 0; y += 1; }
    setViewMonth(m);
    setViewYear(y);
  }

  function pickDay(day: number) {
    onChange(toISO(viewYear, viewMonth, day));
    setOpen(false);
  }

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstWeekday = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7;
  const cells: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const years = Array.from({ length: 101 }, (_, i) => now.getFullYear() - i);

  const isSelected = (day: number) =>
    year === viewYear && selectedMonth === viewMonth + 1 && selectedDay === day;
  const isToday = (day: number) =>
    now.getFullYear() === viewYear && now.getMonth() === viewMonth && now.getDate() === day;

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        id={id}
        onClick={() => (open ? setOpen(false) : openPicker())}
        className="field-input w-full pb-2.5 text-base text-left flex items-center justify-between gap-3"
      >
        <span className={value ? 'text-paper-100' : 'text-[rgba(244,235,225,0.3)]'}>
          {value ? formatDisplay(value) : 'Izaberi datum'}
        </span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-red-400 shrink-0">
          <rect x="3" y="5" width="18" height="16" rx="1" />
          <path d="M8 3v4M16 3v4M3 10h18" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-50 mt-2 w-full min-w-[280px] bg-ink-900 border border-red-500/30 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.85)] p-4">
          <div className="flex items-center justify-between gap-2 mb-4">
            <button
              type="button"
              onClick={() => changeMonth(-1)}
              aria-label="Prethodni mesec"
              className="w-7 h-7 flex items-center justify-center text-red-400 hover:text-paper-100 transition-colors"
            >
              ‹
            </button>

            <div className="flex items-center gap-2">
              <select
                value={viewMonth}
                onChange={(e) => setViewMonth(Number(e.target.value))}
                className="bg-ink-800 border border-ink-700 text-paper-100 text-xs uppercase tracking-widest px-2 py-1 focus:outline-none focus:border-red-400"
              >
                {MONTHS.map((m, i) => (
                  <option key={m} value={i}>{m}</option>
                ))}
              </select>
              <select
                value={viewYear}
                onChange={(e) => setViewYear(Number(e.target.value))}
                className="bg-ink-800 border border-ink-700 text-paper-100 text-xs px-2 py-1 focus:outline-none focus:border-red-400"
              >
                {years.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={() => changeMonth(1)}
              aria-label="Sledeći mesec"
              className="w-7 h-7 flex items-center justify-center text-red-400 hover:text-paper-100 transition-colors"
            >
              ›
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-1">
            {WEEKDAYS.map((w) => (
              <div key={w} className="text-paper-500 text-[10px] uppercase tracking-widest text-center py-1">
                {w}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {cells.map((day, i) => (
              <div key={i} className="flex items-center justify-center">
                {day && (
                  <button
                    type="button"
                    onClick={() => pickDay(day)}
                    className={`w-8 h-8 text-sm transition-colors ${
                      isSelected(day)
                        ? 'bg-red-500 text-paper-100 font-bold'
                        : isToday(day)
                          ? 'border border-red-400 text-red-400'
                          : 'text-paper-300 hover:bg-red-500/20 hover:text-paper-100'
                    }`}
                  >
                    {day}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
