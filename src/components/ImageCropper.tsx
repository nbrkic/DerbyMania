import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;

type Point = { x: number; y: number };

/**
 * LinkedIn-stil isecanje slike: korisnik može da zumira (slider, točkić miša,
 * pinch na dodirnim uređajima) i da pomera sliku prevlačenjem. Na potvrdu vraća
 * isečak zadatog odnosa stranica (aspect) kao JPEG File spreman za otpremanje.
 *
 * - `aspect` = širina / visina okvira (1 za krug/kvadrat, 21/9 za baner).
 * - `round` prikazuje kružnu masku (za profilne slike / grbove).
 * - `outputMaxDimension` je duža strana izlaznog isečka u pikselima.
 */
export function ImageCropper({
  src,
  fileName,
  aspect = 1,
  round = aspect === 1,
  outputMaxDimension = 500,
  title = 'Podesi sliku',
  onCancel,
  onConfirm,
}: {
  src: string;
  fileName: string;
  aspect?: number;
  round?: boolean;
  outputMaxDimension?: number;
  title?: string;
  onCancel: () => void;
  onConfirm: (file: File) => void;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const [frameW, setFrameW] = useState(0);
  const frameH = frameW ? frameW / aspect : 0;
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState<Point>({ x: 0, y: 0 });
  const [processing, setProcessing] = useState(false);

  // Aktivni pokazivači (miš/prst) za prevlačenje i pinch-zoom.
  const pointersRef = useRef<Map<number, Point>>(new Map());
  const dragStartRef = useRef<{ pointer: Point; offset: Point } | null>(null);
  const pinchStartRef = useRef<{ dist: number; zoom: number } | null>(null);

  // Izmeri stvarnu širinu okvira u pikselima (za geometriju isecanja).
  useLayoutEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const measure = () => setFrameW(el.clientWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Učitaj dimenzije slike.
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      setNatural({ w: img.naturalWidth, h: img.naturalHeight });
    };
    img.src = src;
  }, [src]);

  // Skala pri kojoj slika tačno prekriva okvir na zoom-u 1 ("cover").
  const baseScale = natural && frameW ? Math.max(frameW / natural.w, frameH / natural.h) : 0;
  const dispW = natural ? natural.w * baseScale * zoom : 0;
  const dispH = natural ? natural.h * baseScale * zoom : 0;
  const maxOffsetX = Math.max(0, (dispW - frameW) / 2);
  const maxOffsetY = Math.max(0, (dispH - frameH) / 2);

  const clampOffset = useCallback(
    (o: Point): Point => ({
      x: Math.max(-maxOffsetX, Math.min(maxOffsetX, o.x)),
      y: Math.max(-maxOffsetY, Math.min(maxOffsetY, o.y)),
    }),
    [maxOffsetX, maxOffsetY]
  );

  // Reklampuj pomeraj kad se zoom smanji (slika mora da prekriva okvir).
  useEffect(() => {
    setOffset((o) => clampOffset(o));
  }, [clampOffset]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onCancel]);

  function distanceBetween(a: Point, b: Point) {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  function handlePointerDown(e: React.PointerEvent) {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const pts = [...pointersRef.current.values()];
    if (pts.length === 1) {
      dragStartRef.current = { pointer: pts[0], offset };
      pinchStartRef.current = null;
    } else if (pts.length === 2) {
      pinchStartRef.current = { dist: distanceBetween(pts[0], pts[1]), zoom };
      dragStartRef.current = null;
    }
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!pointersRef.current.has(e.pointerId)) return;
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const pts = [...pointersRef.current.values()];

    if (pts.length >= 2 && pinchStartRef.current) {
      const dist = distanceBetween(pts[0], pts[1]);
      const ratio = dist / pinchStartRef.current.dist;
      setZoom(Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, pinchStartRef.current.zoom * ratio)));
      return;
    }

    if (dragStartRef.current) {
      const { pointer, offset: startOffset } = dragStartRef.current;
      setOffset(clampOffset({ x: startOffset.x + (e.clientX - pointer.x), y: startOffset.y + (e.clientY - pointer.y) }));
    }
  }

  function handlePointerUp(e: React.PointerEvent) {
    pointersRef.current.delete(e.pointerId);
    const pts = [...pointersRef.current.values()];
    pinchStartRef.current = null;
    if (pts.length === 1) {
      dragStartRef.current = { pointer: pts[0], offset };
    } else {
      dragStartRef.current = null;
    }
  }

  function handleWheel(e: React.WheelEvent) {
    setZoom((z) => Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, z - e.deltaY * 0.0015)));
  }

  async function handleConfirm() {
    const img = imgRef.current;
    if (!img || !natural || !baseScale) return;
    setProcessing(true);

    const displayScale = baseScale * zoom;
    // Gornji-levi ugao slike u koordinatama okvira.
    const imgLeft = frameW / 2 + offset.x - dispW / 2;
    const imgTop = frameH / 2 + offset.y - dispH / 2;
    // Izvorni (natural) region koji odgovara vidljivom okviru.
    const sx = -imgLeft / displayScale;
    const sy = -imgTop / displayScale;
    const sW = frameW / displayScale;
    const sH = frameH / displayScale;

    const outW = aspect >= 1 ? outputMaxDimension : Math.round(outputMaxDimension * aspect);
    const outH = aspect >= 1 ? Math.round(outputMaxDimension / aspect) : outputMaxDimension;

    const canvas = document.createElement('canvas');
    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setProcessing(false);
      return;
    }
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, sx, sy, sW, sH, 0, 0, outW, outH);

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.9));
    if (!blob) {
      setProcessing(false);
      return;
    }
    const baseName = fileName.replace(/\.[a-zA-Z0-9]+$/, '') || 'slika';
    onConfirm(new File([blob], `${baseName}.jpg`, { type: 'image/jpeg' }));
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center" role="dialog" aria-modal="true">
      <button type="button" aria-label="Zatvori" onClick={onCancel} className="absolute inset-0 bg-ink-950/80" />
      <div className="relative z-10 w-full sm:max-w-md bg-ink-900 border-t sm:border border-red-500/30 sm:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.85)] sm:mx-6 rise-1">
        <div className="px-6 py-4 border-b border-ink-700 text-center">
          <span className="text-xs uppercase tracking-widest text-red-400 font-semibold">{title}</span>
        </div>

        <div className="p-6 flex flex-col items-center gap-5">
          <div
            ref={frameRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onWheel={handleWheel}
            style={{ height: frameH || undefined }}
            className={`relative w-full ${round ? 'max-w-[320px]' : 'max-w-md'} overflow-hidden bg-ink-950 rounded-lg cursor-move touch-none select-none`}
          >
            {natural && frameW > 0 && (
              <img
                src={src}
                alt="Isecanje slike"
                draggable={false}
                className="absolute max-w-none pointer-events-none"
                style={{
                  width: dispW,
                  height: dispH,
                  left: frameW / 2 + offset.x - dispW / 2,
                  top: frameH / 2 + offset.y - dispH / 2,
                }}
              />
            )}
            {/* Maska koja pokazuje vidljivi deo. */}
            {round ? (
              <>
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{ boxShadow: '0 0 0 9999px rgba(10,10,10,0.55)', borderRadius: '9999px' }}
                />
                <div className="absolute inset-0 pointer-events-none rounded-full ring-2 ring-paper-100/70" />
              </>
            ) : (
              <div className="absolute inset-0 pointer-events-none rounded-lg ring-2 ring-paper-100/40" />
            )}
          </div>

          <div className="flex items-center gap-3 w-full max-w-[320px]">
            <button
              type="button"
              aria-label="Umanji"
              onClick={() => setZoom((z) => Math.max(MIN_ZOOM, z - 0.2))}
              className="text-paper-300 hover:text-paper-100 transition-colors shrink-0"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-5 h-5">
                <path d="M5 12h14" />
              </svg>
            </button>
            <input
              type="range"
              min={MIN_ZOOM}
              max={MAX_ZOOM}
              step={0.01}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              aria-label="Zumiranje"
              className="flex-1 accent-red-500"
            />
            <button
              type="button"
              aria-label="Uvećaj"
              onClick={() => setZoom((z) => Math.min(MAX_ZOOM, z + 0.2))}
              className="text-paper-300 hover:text-paper-100 transition-colors shrink-0"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-5 h-5">
                <path d="M12 5v14" />
                <path d="M5 12h14" />
              </svg>
            </button>
          </div>

          <p className="text-xs text-paper-500 text-center">Prevuci da pomeriš sliku, koristi klizač da zumiraš.</p>
        </div>

        <div className="flex divide-x divide-ink-700 border-t border-ink-700">
          <button
            type="button"
            onClick={onCancel}
            disabled={processing}
            className="flex-1 px-6 py-4 text-sm uppercase tracking-widest text-paper-500 hover:text-paper-100 transition-colors"
          >
            Otkaži
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={processing || !natural}
            className="flex-1 px-6 py-4 text-sm uppercase tracking-widest text-red-400 font-semibold hover:bg-red-500/10 transition-colors disabled:opacity-50"
          >
            {processing ? 'Obrada…' : 'Sačuvaj'}
          </button>
        </div>
      </div>
    </div>
  );
}
