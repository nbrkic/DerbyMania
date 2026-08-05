import { useState } from 'react';
import type { EligibilityPool } from '../lib/tournamentRoster';

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function PlayerAvatar({ url, name }: { url: string | null; name: string | null }) {
  return (
    <div className="w-10 h-10 rounded-full overflow-hidden bg-ink-800 ring-1 ring-red-500/30 shrink-0 flex items-center justify-center">
      {url ? (
        <img src={url} alt="" className="w-full h-full object-cover" />
      ) : (
        <span className="font-display text-sm text-paper-500">{(name || '?')[0]?.toUpperCase()}</span>
      )}
    </div>
  );
}

const REASON_LABELS: Record<string, (conflictTeamName?: string) => string> = {
  age: () => 'Ne ispunjava starosno ograničenje turnira',
  already_playing: (conflictTeamName) => `Već igra za „${conflictTeamName ?? 'drugi tim'}“ na ovom turniru`,
};

export function SquadSelectionModal({
  teamName,
  requiredSize,
  pool,
  submitting,
  onConfirm,
  onCancel,
}: {
  teamName: string;
  requiredSize: number;
  pool: EligibilityPool;
  submitting: boolean;
  onConfirm: (userIds: string[]) => void;
  onCancel: () => void;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set(pool.eligible.slice(0, requiredSize).map((p) => p.id)));

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else if (next.size < requiredSize) {
        next.add(id);
      }
      return next;
    });
  }

  const canConfirm = selected.size === requiredSize && !submitting;

  return (
    <div
      className="fixed inset-0 z-50 bg-ink-950/90 backdrop-blur-sm flex items-center justify-center px-4 py-10"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-lg max-h-full flex flex-col bg-ink-900 border border-red-500/30 shadow-[0_24px_60px_-15px_rgba(0,0,0,0.85)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-ink-700">
          <div>
            <span className="text-xs uppercase tracking-widest text-red-400 font-semibold">Sastav za turnir</span>
            <h2 className="font-display text-xl leading-tight mt-2">{teamName}</h2>
            <p className="text-xs text-paper-500 mt-1">
              Tim ima više igrača nego što je dozvoljeno — izaberi tačno{' '}
              <span className="text-paper-100 font-medium">{requiredSize}</span> koji putuju na turnir.
            </p>
          </div>
          <button type="button" onClick={onCancel} aria-label="Zatvori" className="text-paper-700 hover:text-paper-100 transition-colors shrink-0">
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="flex flex-col gap-2">
            {pool.eligible.map((p) => {
              const checked = selected.has(p.id);
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => toggle(p.id)}
                  disabled={!checked && selected.size >= requiredSize}
                  className={`flex items-center gap-3 px-3 py-2.5 border transition-colors text-left disabled:opacity-40 disabled:cursor-not-allowed ${
                    checked ? 'border-red-500/50 bg-red-500/10' : 'border-ink-700 hover:border-paper-500'
                  }`}
                >
                  <PlayerAvatar url={p.avatar_url} name={p.full_name} />
                  <span className="flex-1 min-w-0 truncate text-sm text-paper-100">{p.full_name || 'Igrač'}</span>
                  {p.birthYear && <span className="text-xs text-paper-500 shrink-0">{p.birthYear}.</span>}
                  <span
                    className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                      checked ? 'bg-red-500 border-red-500' : 'border-ink-600'
                    }`}
                  >
                    {checked && <CheckIcon className="w-3 h-3 text-paper-100" />}
                  </span>
                </button>
              );
            })}
          </div>

          {pool.ineligible.length > 0 && (
            <div className="mt-6">
              <span className="text-[10px] uppercase tracking-widest text-paper-500">Ne mogu da igraju na ovom turniru</span>
              <div className="flex flex-col gap-2 mt-2">
                {pool.ineligible.map((p) => (
                  <div key={p.id} className="flex items-center gap-3 px-3 py-2.5 border border-ink-800 opacity-50">
                    <PlayerAvatar url={p.avatar_url} name={p.full_name} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-paper-100 truncate">{p.full_name || 'Igrač'}</p>
                      <p className="text-[11px] text-red-400 truncate">{REASON_LABELS[p.reason](p.conflictTeamName)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-4 px-6 py-4 border-t border-ink-700">
          <span className="text-xs uppercase tracking-widest text-paper-500">
            Izabrano <span className="text-paper-100">{selected.size}</span> / {requiredSize}
          </span>
          <div className="flex items-center gap-3">
            <button type="button" onClick={onCancel} className="text-xs uppercase tracking-widest text-paper-500 hover:text-paper-100 transition-colors">
              Otkaži
            </button>
            <button
              type="button"
              onClick={() => onConfirm([...selected])}
              disabled={!canConfirm}
              className="btn-solid px-5 py-2.5 text-xs uppercase tracking-widest disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {submitting ? 'Prijavljivanje…' : 'Potvrdi sastav'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
