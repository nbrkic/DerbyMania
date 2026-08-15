import { supabase } from './supabase';
import { compressImage } from './imageCompression';

/**
 * Compresses and uploads an image to `${folder}/${kind}.{ext}`, then removes any other
 * file in that folder starting with `${kind}.` (e.g. a leftover crest.png after the new
 * upload is crest.jpg) so replacing an image doesn't leave orphaned files in storage.
 * Cleanup failures are swallowed — they shouldn't block saving the new image.
 * Returns a cache-busted public URL so pages pick up the new file immediately.
 */
export async function uploadImageWithCleanup(
  bucket: string,
  folder: string,
  kind: string,
  file: File,
  maxDimension: number
): Promise<string> {
  const compressed = await compressImage(file, maxDimension);
  const ext = compressed.name.split('.').pop() || 'jpg';
  const fileName = `${kind}.${ext}`;
  const path = `${folder}/${fileName}`;

  const { error: uploadError } = await supabase.storage.from(bucket).upload(path, compressed, { upsert: true });
  if (uploadError) throw new Error(uploadError.message);

  try {
    const { data: existing } = await supabase.storage.from(bucket).list(folder);
    const stale = (existing ?? [])
      .filter((f) => f.name !== fileName && f.name.startsWith(`${kind}.`))
      .map((f) => `${folder}/${f.name}`);
    if (stale.length) await supabase.storage.from(bucket).remove(stale);
  } catch {
    // ne blokiraj čuvanje ako čišćenje starih fajlova ne uspe
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return `${data.publicUrl}?v=${Date.now()}`;
}
