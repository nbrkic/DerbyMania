import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { ImageCropper } from './ImageCropper';
import { BANNER_MAX_DIMENSION, CREST_MAX_DIMENSION } from '../lib/imageCompression';

export type ImagePosition = { x: number; y: number };

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const BANNER_ASPECT = 21 / 9;

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
  const [cropState, setCropState] = useState<{ src: string; fileName: string } | null>(null);

  useEffect(() => {
    return () => {
      if (cropState) URL.revokeObjectURL(cropState.src);
    };
  }, [cropState]);

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    // Prevelike originale prepusti roditelju (prikaže grešku); ostalo isecamo.
    if (file.size > MAX_IMAGE_SIZE) {
      onSelect(file);
      return;
    }
    setCropState({ src: URL.createObjectURL(file), fileName: file.name });
  }

  function handleCropConfirm(file: File) {
    if (cropState) URL.revokeObjectURL(cropState.src);
    setCropState(null);
    onSelect(file);
  }

  function handleCropCancel() {
    if (cropState) URL.revokeObjectURL(cropState.src);
    setCropState(null);
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
      <p className="text-xs text-paper-500 mt-2 leading-relaxed">
        {previewUrl ? 'Klikni na sliku da je promeniš.' : hint}
      </p>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleChange}
        className="sr-only"
      />

      {cropState && (
        <ImageCropper
          src={cropState.src}
          fileName={cropState.fileName}
          aspect={shape === 'banner' ? BANNER_ASPECT : 1}
          round={shape === 'circle'}
          outputMaxDimension={shape === 'banner' ? BANNER_MAX_DIMENSION : CREST_MAX_DIMENSION}
          title={shape === 'banner' ? 'Podesi baner' : 'Podesi sliku'}
          onCancel={handleCropCancel}
          onConfirm={handleCropConfirm}
        />
      )}
    </div>
  );
}

export function CrestField({
  n,
  label,
  previewUrl,
  position,
  onSelect,
  emptyHint = 'JPG / PNG / WEBP - Maksimalno 5MB',
}: {
  n: string;
  label: string;
  previewUrl: string | null;
  position: ImagePosition;
  onSelect: (file: File) => void;
  onPositionChange?: (position: ImagePosition) => void;
  emptyHint?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [cropState, setCropState] = useState<{ src: string; fileName: string } | null>(null);

  useEffect(() => {
    return () => {
      if (cropState) URL.revokeObjectURL(cropState.src);
    };
  }, [cropState]);

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > MAX_IMAGE_SIZE) {
      onSelect(file);
      return;
    }
    setCropState({ src: URL.createObjectURL(file), fileName: file.name });
  }

  function handleCropConfirm(file: File) {
    if (cropState) URL.revokeObjectURL(cropState.src);
    setCropState(null);
    onSelect(file);
  }

  function handleCropCancel() {
    if (cropState) URL.revokeObjectURL(cropState.src);
    setCropState(null);
  }

  return (
    <div className="flex flex-col items-center text-center">
      <label className="flex items-baseline gap-2 text-[11px] uppercase tracking-widest text-paper-500 mb-3">
        <span className="text-red-400 font-bold">{n}</span> {label}
      </label>

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="group relative w-24 h-24 rounded-full overflow-hidden bg-ink-800 border-2 border-dashed border-red-500/40 hover:border-red-400 transition-colors flex items-center justify-center"
      >
        {previewUrl ? (
          <>
            <img
              src={previewUrl}
              alt=""
              className="w-full h-full object-cover"
              style={{ objectPosition: `${position.x}% ${position.y}%` }}
            />
            <span className="absolute inset-0 rounded-full bg-ink-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 text-paper-100">
              <CameraIcon className="w-5 h-5" />
              <span className="text-[10px] uppercase tracking-widest">Promeni</span>
            </span>
          </>
        ) : (
          <CameraIcon className="w-6 h-6 text-red-400" />
        )}
      </button>

      <p className="text-xs text-paper-500 mt-2 leading-relaxed max-w-[14rem]">
        {previewUrl ? 'Klikni na sliku da je promeniš.' : emptyHint}
      </p>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleChange}
        className="sr-only"
      />

      {cropState && (
        <ImageCropper
          src={cropState.src}
          fileName={cropState.fileName}
          aspect={1}
          round
          outputMaxDimension={CREST_MAX_DIMENSION}
          title="Podesi grb"
          onCancel={handleCropCancel}
          onConfirm={handleCropConfirm}
        />
      )}
    </div>
  );
}
