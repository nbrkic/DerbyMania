import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../lib/auth-context';
import { supabase } from '../lib/supabase';
import { compressImage, BANNER_MAX_DIMENSION } from '../lib/imageCompression';

type GalleryImage = { id: string; image_url: string; created_at: string };

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M18 6 6 18" />
      <path d="M6 6l12 12" />
    </svg>
  );
}

function ChevronIcon({ className, direction }: { className?: string; direction: 'left' | 'right' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d={direction === 'left' ? 'M15 18l-6-6 6-6' : 'M9 18l6-6-6-6'} />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M4 7h16" />
      <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
      <path d="M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13" />
    </svg>
  );
}

export function TournamentGallery({ tournamentId, ownerId, isOwner }: { tournamentId: string; ownerId: string; isOwner: boolean }) {
  const { user } = useAuth();
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase
      .from('tournament_gallery_images')
      .select('id, image_url, created_at')
      .eq('tournament_id', tournamentId)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        setImages((data as GalleryImage[]) ?? []);
        setLoading(false);
      });
  }, [tournamentId]);

  useEffect(() => {
    if (lightboxIndex === null) return;
    const { body } = document;
    const prevOverflow = body.style.overflow;
    body.style.overflow = 'hidden';

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setLightboxIndex(null);
      if (e.key === 'ArrowLeft') setLightboxIndex((i) => (i === null ? i : (i - 1 + images.length) % images.length));
      if (e.key === 'ArrowRight') setLightboxIndex((i) => (i === null ? i : (i + 1) % images.length));
    }
    document.addEventListener('keydown', onKeyDown);
    return () => {
      body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [lightboxIndex, images.length]);

  async function handleFilesSelected(fileList: FileList | null) {
    if (!fileList || !fileList.length || !user) return;
    setUploading(true);
    setUploadError(null);

    const files = Array.from(fileList);
    const uploaded: GalleryImage[] = [];

    for (const file of files) {
      const compressed = await compressImage(file, BANNER_MAX_DIMENSION);
      const ext = compressed.name.split('.').pop() || 'jpg';
      const path = `${ownerId}/${tournamentId}/gallery/${crypto.randomUUID()}.${ext}`;

      const { error: uploadErr } = await supabase.storage.from('tournaments').upload(path, compressed);
      if (uploadErr) continue;

      const { data: publicUrl } = supabase.storage.from('tournaments').getPublicUrl(path);
      const { data: row, error: insertErr } = await supabase
        .from('tournament_gallery_images')
        .insert({ tournament_id: tournamentId, image_url: publicUrl.publicUrl })
        .select('id, image_url, created_at')
        .single();
      if (!insertErr && row) uploaded.push(row as GalleryImage);
    }

    setUploading(false);
    if (uploaded.length) setImages((prev) => [...prev, ...uploaded]);
    if (uploaded.length < files.length) setUploadError('Neke slike nisu uspele da se otpreme. Pokušaj ponovo.');
    if (inputRef.current) inputRef.current.value = '';
  }

  async function handleDelete(image: GalleryImage) {
    setDeletingId(image.id);
    const { error } = await supabase.from('tournament_gallery_images').delete().eq('id', image.id);
    setDeletingId(null);
    if (error) return;
    setImages((prev) => prev.filter((i) => i.id !== image.id));
    setLightboxIndex(null);

    const path = image.image_url.split('/tournaments/')[1];
    if (path) await supabase.storage.from('tournaments').remove([path]);
  }

  if (loading || (!isOwner && images.length === 0)) return null;

  return (
    <div className="mb-10">
      <div className="flex items-center justify-between gap-4 flex-wrap mb-5">
        <div>
          <span className="text-xs uppercase tracking-widest text-red-400 font-semibold">Galerija</span>
          <div className="w-10 h-0.5 bg-red-500 mt-3" />
        </div>
        {isOwner && (
          <>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="btn-line px-4 py-2.5 text-xs uppercase tracking-widest inline-flex items-center gap-2 disabled:opacity-50"
            >
              <PlusIcon className="w-4 h-4" />
              {uploading ? 'Otpremanje…' : 'Dodaj slike'}
            </button>
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={(e) => handleFilesSelected(e.target.files)}
              className="sr-only"
            />
          </>
        )}
      </div>

      {uploadError && <p className="text-xs text-red-400 mb-4">{uploadError}</p>}

      {images.length === 0 ? (
        <p className="text-sm text-paper-500">Još uvek nema slika sa ovog turnira.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {images.map((image, index) => (
            <div
              key={image.id}
              role="button"
              tabIndex={0}
              onClick={() => setLightboxIndex(index)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setLightboxIndex(index); } }}
              className="group relative aspect-square overflow-hidden bg-ink-800 border border-ink-700 hover:border-red-500/50 transition-colors cursor-pointer"
            >
              <img
                src={image.image_url}
                alt=""
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              {isOwner && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleDelete(image); }}
                  disabled={deletingId === image.id}
                  aria-label="Obriši sliku"
                  className="absolute top-1.5 right-1.5 w-7 h-7 flex items-center justify-center bg-ink-950/70 text-paper-100 opacity-0 group-hover:opacity-100 hover:text-red-400 hover:bg-ink-950/90 transition-all disabled:opacity-100 disabled:cursor-wait"
                >
                  <CloseIcon className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {lightboxIndex !== null && images[lightboxIndex] && (
        <div
          className="fixed inset-0 z-50 bg-ink-950/90 backdrop-blur-sm flex items-center justify-center px-4 py-10"
          onClick={() => setLightboxIndex(null)}
        >
          <button
            type="button"
            onClick={() => setLightboxIndex(null)}
            aria-label="Zatvori"
            className="absolute top-4 right-4 sm:top-6 sm:right-6 text-paper-100 hover:text-red-400 transition-colors"
          >
            <CloseIcon className="w-7 h-7" />
          </button>

          {isOwner && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); handleDelete(images[lightboxIndex]); }}
              disabled={deletingId === images[lightboxIndex].id}
              aria-label="Obriši sliku"
              className="absolute top-4 left-4 sm:top-6 sm:left-6 text-paper-100 hover:text-red-400 transition-colors disabled:opacity-50"
            >
              <TrashIcon className="w-6 h-6" />
            </button>
          )}

          {images.length > 1 && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setLightboxIndex((i) => (i === null ? i : (i - 1 + images.length) % images.length)); }}
              aria-label="Prethodna slika"
              className="absolute left-2 sm:left-6 text-paper-100 hover:text-red-400 transition-colors"
            >
              <ChevronIcon direction="left" className="w-8 h-8" />
            </button>
          )}

          <img
            src={images[lightboxIndex].image_url}
            alt=""
            onClick={(e) => e.stopPropagation()}
            className="max-h-[85vh] max-w-[90vw] object-contain"
          />

          {images.length > 1 && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setLightboxIndex((i) => (i === null ? i : (i + 1) % images.length)); }}
              aria-label="Sledeća slika"
              className="absolute right-2 sm:right-6 text-paper-100 hover:text-red-400 transition-colors"
            >
              <ChevronIcon direction="right" className="w-8 h-8" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
