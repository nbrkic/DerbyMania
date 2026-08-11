export const SITE_URL = 'https://derbymania.xyz';
export const SITE_NAME = 'DerbyMania';
export const DEFAULT_LOCALE = 'sr_RS';
export const DEFAULT_LANG = 'sr';

export const DEFAULT_TITLE = 'DerbyMania × Organizacija sportskih turnira';
export const DEFAULT_DESCRIPTION = 'DerbyMania je platforma za organizaciju sportskih turnira. Prati rezultate uživo i drži tabelu ažurnom, bez ijedne ručno vođene tabele.';
export const DEFAULT_KEYWORDS = [
  'organizacija turnira',
  'sportski turniri',
  'fudbalski turnir',
  'košarkaški turnir',
  'raspored turnira',
  'tabela turnira uživo',
  'vođenje turnira online',
  'prijava ekipa na turnir',
  'DerbyMania',
];
export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`;
export const DEFAULT_OG_IMAGE_ALT = 'DerbyMania × Organizacija sportskih turnira';

export function absoluteUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

export function pageTitle(title: string, opts: { isHome?: boolean } = {}): string {
  if (opts.isHome) return title;
  return `${title} | ${SITE_NAME}`;
}

export function truncateDescription(text: string, max = 160): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1).trimEnd()}…`;
}