export type ScheduleStatus = 'pending' | 'in_progress' | 'finished';

export type ScheduleItem = {
  id: string;
  time: string;
  label: string;
  sublabel?: string;
  status: ScheduleStatus;
  onStart?: () => void;
  starting?: boolean;
};

export function addMinutesToClock(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number);
  const total = (((h * 60 + m + minutes) % 1440) + 1440) % 1440;
  const hh = Math.floor(total / 60);
  const mm = total % 60;
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

export function ScheduleSection({ items }: { items: ScheduleItem[] }) {
  if (items.length === 0) return null;
  return (
    <div className="mt-16">
      <span className="text-xs uppercase tracking-widest text-red-400 font-semibold">Raspored</span>
      <div className="w-10 h-0.5 bg-red-500 mt-3 mb-2" />
      <p className="text-xs text-paper-500 mb-5">Okvirna vremena početka, na osnovu termina turnira i trajanja utakmice.</p>
      <div className="flex flex-col gap-2">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-4 bg-ink-900 border border-ink-700 border-l-2 border-l-red-500/50 px-4 py-3"
          >
            <p className="w-14 shrink-0 text-center font-display text-lg leading-none">{item.time}</p>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-paper-100 truncate">{item.label}</p>
              {item.sublabel && <p className="text-[10px] uppercase tracking-widest text-paper-500 mt-0.5">{item.sublabel}</p>}
            </div>
            {item.status === 'in_progress' && (
              <span className="shrink-0 flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-red-400 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" /> Uživo
              </span>
            )}
            {item.status === 'finished' && (
              <span className="shrink-0 text-[10px] uppercase tracking-widest text-paper-500">Odigrano</span>
            )}
            {item.status === 'pending' && item.onStart && (
              <button
                type="button"
                onClick={item.onStart}
                disabled={item.starting}
                className="shrink-0 px-3 py-1.5 text-[10px] uppercase tracking-widest text-paper-100 bg-red-500 hover:bg-red-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {item.starting ? 'Pokretanje…' : 'Započni'}
              </button>
            )}
            {item.status === 'pending' && !item.onStart && (
              <span className="shrink-0 text-[10px] uppercase tracking-widest text-paper-700">Zakazano</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
