// Regenerates all favicon variants and the default social share image from the
// source brand assets (public/ikona.png = square mark, public/logo.png = wordmark).
// Run with: node scripts/generate-icons.mjs
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const publicDir = join(root, 'public');

const ICON_SRC = join(publicDir, 'ikona.png');
const LOGO_SRC = join(publicDir, 'logo.png');

const INK_950 = '#0B0706';
const RED_600 = '#9E1B26';
const RED_400 = '#E8293A';
const PAPER_100 = '#F4EBE1';

mkdirSync(publicDir, { recursive: true });

async function makePngIcon(size, outName) {
  await sharp(ICON_SRC)
    .resize(size, size, { fit: 'cover' })
    .png()
    .toFile(join(publicDir, outName));
  console.log('wrote', outName, `${size}x${size}`);
}

async function makeFavicoIco() {
  // Multi-resolution .ico built from 16/32/48 PNG buffers.
  const sizes = [16, 32, 48];
  const buffers = await Promise.all(
    sizes.map((s) => sharp(ICON_SRC).resize(s, s, { fit: 'cover' }).png().toBuffer())
  );
  const ico = pngsToIco(buffers, sizes);
  const { writeFileSync } = await import('node:fs');
  writeFileSync(join(publicDir, 'favicon.ico'), ico);
  console.log('wrote favicon.ico (16/32/48)');
}

// Minimal ICO container: header + directory entries + raw PNG payloads.
function pngsToIco(pngBuffers, sizes) {
  const count = pngBuffers.length;
  const headerSize = 6;
  const dirEntrySize = 16;
  let offset = headerSize + dirEntrySize * count;
  const header = Buffer.alloc(headerSize);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(count, 4);

  const dirEntries = [];
  const payloads = [];
  for (let i = 0; i < count; i++) {
    const size = sizes[i];
    const buf = pngBuffers[i];
    const entry = Buffer.alloc(dirEntrySize);
    entry.writeUInt8(size === 256 ? 0 : size, 0);
    entry.writeUInt8(size === 256 ? 0 : size, 1);
    entry.writeUInt8(0, 2);
    entry.writeUInt8(0, 3);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(buf.length, 8);
    entry.writeUInt32LE(offset, 12);
    offset += buf.length;
    dirEntries.push(entry);
    payloads.push(buf);
  }

  return Buffer.concat([header, ...dirEntries, ...payloads]);
}

async function makeManifestIcons() {
  await makePngIcon(192, 'android-chrome-192x192.png');
  await makePngIcon(512, 'android-chrome-512x512.png');
  await makePngIcon(180, 'apple-touch-icon.png');
  await makePngIcon(32, 'favicon-32x32.png');
  await makePngIcon(16, 'favicon-16x16.png');
}

async function makeOgImage() {
  const width = 1200;
  const height = 630;

  const bg = Buffer.from(
    `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${INK_950}"/>
          <stop offset="55%" stop-color="#2A080C"/>
          <stop offset="100%" stop-color="${RED_600}"/>
        </linearGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#g)"/>
      <rect x="0" y="${height - 14}" width="${width}" height="14" fill="${RED_400}"/>
      <text x="80" y="${height - 64}" font-family="Arial, sans-serif" font-size="30" fill="${PAPER_100}" opacity="0.85">Organizacija sportskih turnira</text>
    </svg>`
  );

  const logo = await sharp(LOGO_SRC).resize({ width: 760 }).png().toBuffer();
  const logoMeta = await sharp(logo).metadata();
  const logoLeft = Math.round((width - (logoMeta.width ?? 760)) / 2);
  const logoTop = Math.round((height - (logoMeta.height ?? 171)) / 2) - 30;

  await sharp(bg)
    .composite([{ input: logo, left: logoLeft, top: logoTop }])
    .png()
    .toFile(join(publicDir, 'og-image.png'));
  console.log('wrote og-image.png 1200x630');
}

await makeManifestIcons();
await makeFavicoIco();
await makeOgImage();
console.log('done');
