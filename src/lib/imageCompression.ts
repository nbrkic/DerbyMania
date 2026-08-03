export const BANNER_MAX_DIMENSION = 1600;
export const CREST_MAX_DIMENSION = 500;

const JPEG_QUALITY = 0.88;

/**
 * Downscales an image to maxDimension (longest side) and re-encodes it before upload.
 * PNGs are kept as PNG (lossless, preserves transparency) — only resized.
 * JPEG/WebP are re-encoded as JPEG at a high quality (visually lossless, much smaller file).
 * Falls back to the original file on any failure, or if compression didn't actually help.
 */
export async function compressImage(file: File, maxDimension: number): Promise<File> {
  if (!file.type.startsWith('image/') || file.type === 'image/svg+xml') return file;

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    return file;
  }

  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    bitmap.close();
    return file;
  }
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const isPng = file.type === 'image/png';
  const outputType = isPng ? 'image/png' : 'image/jpeg';
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, outputType, isPng ? undefined : JPEG_QUALITY)
  );
  if (!blob || blob.size >= file.size) return file;

  const baseName = file.name.replace(/\.[a-zA-Z0-9]+$/, '');
  const newName = `${baseName}${isPng ? '.png' : '.jpg'}`;
  return new File([blob], newName, { type: outputType });
}
