import { useRef, type ChangeEvent, type PointerEvent } from 'react';

export type ImagePosition = { x: number; y: number };

function CameraIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M4 8h3l2-2h6l2 2h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z" />
      <circle cx="12" cy="14" r="3.5" />
    </svg>
  );
}

export function ImageField({
  n,
  label,
  hint,
  shape,
  previewUrl,
  onSelect,
}: {
  n: string;
  label: string;
  hint: string;
  shape: 'circle' | 'banner';
  previewUrl: string | null;
  onSelect: (file: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) onSelect(file);
  }

  return (
    <div className={shape === 'circle' ? 'flex flex-col items-center text-center' : undefined}>
      <label className="flex items-baseline gap-2 text-[11px] uppercase tracking-widest text-paper-500 mb-3">
        <span className="text-red-400 font-bold">{n}</span> {label}
      </label>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className={
          shape === 'circle'
            ? 'relative w-24 h-24 rounded-full overflow-hidden bg-ink-800 border-2 border-dashed border-red-500/40 hover:border-red-400 transition-colors flex items-center justify-center'
            : 'relative w-full aspect-[21/9] overflow-hidden bg-ink-800 border-2 border-dashed border-red-500/40 hover:border-red-400 transition-colors flex items-center justify-center'
        }
      >
        {previewUrl ? (
          <img src={previewUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <CameraIcon className="w-6 h-6 text-red-400" />
        )}
      </button>
      <p className="text-xs text-paper-500 mt-2 leading-relaxed">{hint}</p>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleChange}
        className="sr-only"
      />
    </div>
  );
}

export function CrestField({
  n,
  label,
  previewUrl,
  position,
  onSelect,
  onPositionChange,
  emptyHint = 'JPG / PNG / WEBP - Maksimalno 5MB',
}: {
  n: string;
  label: string;
  previewUrl: string | null;
  position: ImagePosition;
  onSelect: (file: File) => void;
  onPositionChange: (position: ImagePosition) => void;
  emptyHint?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const lastPointRef = useRef({ x: 0, y: 0 });

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) onSelect(file);
  }

  function handlePointerDown(e: PointerEvent<HTMLDivElement>) {
    if (!previewUrl) {
      inputRef.current?.click();
      return;
    }
    draggingRef.current = true;
    lastPointRef.current = { x: e.clientX, y: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: PointerEvent<HTMLDivElement>) {
    if (!draggingRef.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const deltaXPercent = ((e.clientX - lastPointRef.current.x) / rect.width) * 100;
    const deltaYPercent = ((e.clientY - lastPointRef.current.y) / rect.height) * 100;
    lastPointRef.current = { x: e.clientX, y: e.clientY };

    onPositionChange({
      x: Math.min(100, Math.max(0, position.x - deltaXPercent)),
      y: Math.min(100, Math.max(0, position.y - deltaYPercent)),
    });
  }

  function handlePointerUp() {
    draggingRef.current = false;
  }

  return (
    <div className="flex flex-col items-center text-center">
      <label className="flex items-baseline gap-2 text-[11px] uppercase tracking-widest text-paper-500 mb-3">
        <span className="text-red-400 font-bold">{n}</span> {label}
      </label>

      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        className={`relative w-24 h-24 rounded-full overflow-hidden bg-ink-800 border-2 border-dashed border-red-500/40 hover:border-red-400 transition-colors flex items-center justify-center touch-none ${
          previewUrl ? 'cursor-move' : 'cursor-pointer'
        }`}
      >
        {previewUrl ? (
          <img
            src={previewUrl}
            alt=""
            draggable={false}
            className="w-full h-full object-cover select-none"
            style={{ objectPosition: `${position.x}% ${position.y}%` }}
          />
        ) : (
          <CameraIcon className="w-6 h-6 text-red-400 pointer-events-none" />
        )}
      </div>

      <p className="text-xs text-paper-500 mt-2 leading-relaxed max-w-[14rem]">
        {previewUrl ? 'Prevuci sliku da podesiš poziciju.' : emptyHint}
      </p>
      {previewUrl && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="text-xs text-red-400 hover:text-red-300 transition-colors mt-1 uppercase tracking-widest"
        >
          Promeni sliku
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleChange}
        className="sr-only"
      />
    </div>
  );
}
