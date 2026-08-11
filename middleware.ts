// Vercel Edge Middleware. Regular users always get the normal SPA (this file
// only ever short-circuits requests from known social-media crawlers).
//
// Facebook, Twitter/X, LinkedIn, Slack, Discord, etc. don't execute
// JavaScript when they unfurl a link, so the per-tournament / per-team /
// per-player <Seo> tags set client-side (see src/components/Seo.tsx) never
// reach them — they'd only ever see the generic homepage tags baked into
// index.html. This middleware detects those bots on the three dynamic
// detail routes, fetches the record straight from Supabase at the edge, and
// returns a tiny standalone HTML document with the correct title/description
// /og:image for that specific tournament, team, or player. Everyone else
// (including Googlebot, which does render JS) falls through to the SPA.
import { next } from '@vercel/edge';

export const config = {
  matcher: ['/turniri/:id', '/timovi/:id', '/:handle'],
};

const SITE_URL = 'https://derbymania.xyz';
const SITE_NAME = 'DerbyMania';
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`;

const BOT_UA =
  /facebookexternalhit|Facebot|Twitterbot|LinkedInBot|Slackbot|TelegramBot|Discordbot|WhatsApp|SkypeUriPreview|Pinterest|redditbot|Viber|Applebot|vkShare|Embedly/i;

const STATIC_TOP_LEVEL = new Set([
  'turniri',
  'timovi',
  'igraci',
  'feedback',
  'login',
  'register',
  'dashboard',
  'profile',
  'obavestenja',
]);

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function esc(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderHtml(opts: { title: string; description: string; url: string; image: string }): Response {
  const { title, description, url, image } = opts;
  const html = `<!doctype html>
<html lang="sr">
<head>
<meta charset="utf-8" />
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}" />
<link rel="canonical" href="${esc(url)}" />
<meta property="og:type" content="website" />
<meta property="og:title" content="${esc(title)}" />
<meta property="og:description" content="${esc(description)}" />
<meta property="og:url" content="${esc(url)}" />
<meta property="og:image" content="${esc(image)}" />
<meta property="og:site_name" content="${SITE_NAME}" />
<meta property="og:locale" content="sr_RS" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${esc(title)}" />
<meta name="twitter:description" content="${esc(description)}" />
<meta name="twitter:image" content="${esc(image)}" />
</head>
<body></body>
</html>`;
  return new Response(html, { status: 200, headers: { 'content-type': 'text/html; charset=utf-8' } });
}

type SupabaseRow = Record<string, unknown>;

async function supabaseGet(path: string): Promise<SupabaseRow[]> {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) return [];
  const res = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
    headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
  });
  if (!res.ok) return [];
  return (await res.json()) as SupabaseRow[];
}

async function tournamentResponse(id: string, url: string, invite: boolean): Promise<Response | undefined> {
  const rows = await supabaseGet(
    `tournaments?id=eq.${encodeURIComponent(id)}&select=name,description,city,banner_url,crest_url`
  );
  const t = rows[0] as { name?: string; description?: string; city?: string; banner_url?: string; crest_url?: string } | undefined;
  if (!t?.name) return undefined;

  const title = invite ? `Pridruži se turniru ${t.name} u DerbyManiji` : `Pogledaj turnir ${t.name} | ${SITE_NAME}`;
  const description = invite
    ? `Prijavi svoj tim na turnir ${t.name}${t.city ? ` u gradu ${t.city}` : ''} i zaigraj na DerbyManiji.`
    : t.description?.trim() ||
      `Pogledaj turnir ${t.name}${t.city ? ` u gradu ${t.city}` : ''}. Raspored, tabela i rezultati uživo na DerbyManiji.`;
  const image = t.banner_url || t.crest_url || DEFAULT_OG_IMAGE;

  return renderHtml({ title, description, url, image });
}

async function teamResponse(id: string, url: string, invite: boolean): Promise<Response | undefined> {
  const rows = await supabaseGet(`teams?id=eq.${encodeURIComponent(id)}&deleted_at=is.null&select=name,description,city,banner_url,crest_url`);
  const t = rows[0] as { name?: string; description?: string; city?: string; banner_url?: string; crest_url?: string } | undefined;
  if (!t?.name) return undefined;

  const title = invite ? `Pridruži se timu ${t.name} u DerbyManiji` : `Pogledaj tim ${t.name} | ${SITE_NAME}`;
  const description = invite
    ? `${t.name} te poziva da im se pridružiš na DerbyManiji${t.city ? ` (${t.city})` : ''}. Klikni i pridruži se timu.`
    : t.description?.trim() ||
      `Pogledaj tim ${t.name}${t.city ? ` iz grada ${t.city}` : ''}. Sastav, istorija i turniri na DerbyManiji.`;
  const image = t.banner_url || t.crest_url || DEFAULT_OG_IMAGE;

  return renderHtml({ title, description, url, image });
}

async function playerResponse(handle: string, url: string): Promise<Response | undefined> {
  const cleanHandle = handle.startsWith('@') ? handle.slice(1) : handle;

  let profileId = cleanHandle;
  if (!UUID_REGEX.test(cleanHandle)) {
    const lookup = await supabaseGet(`player_usernames?username=eq.${encodeURIComponent(cleanHandle)}&select=id`);
    const id = (lookup[0] as { id?: string } | undefined)?.id;
    if (!id) return undefined;
    profileId = id;
  }

  const rows = await supabaseGet(
    `public_profiles?id=eq.${encodeURIComponent(profileId)}&select=full_name,city,avatar_url`
  );
  const p = rows[0] as { full_name?: string; city?: string; avatar_url?: string } | undefined;
  if (!p) return undefined;

  const name = p.full_name?.trim() || cleanHandle;
  const title = `Pogledaj igrača ${name} | ${SITE_NAME}`;
  const description = `Pogledaj profil igrača ${name}${p.city ? ` iz grada ${p.city}` : ''}. Statistika golova, asistencija i nastupa na DerbyManiji.`;
  const image = p.avatar_url || DEFAULT_OG_IMAGE;

  return renderHtml({ title, description, url, image });
}

export default async function middleware(request: Request): Promise<Response | undefined> {
  const ua = request.headers.get('user-agent') ?? '';
  if (!BOT_UA.test(ua)) return next();

  const url = new URL(request.url);
  const segments = url.pathname.split('/').filter(Boolean);
  const canonicalUrl = `${SITE_URL}${url.pathname}`;
  const invite = url.searchParams.get('invite') === '1';

  try {
    if (segments[0] === 'turniri' && segments[1] && segments.length === 2) {
      return (await tournamentResponse(segments[1], canonicalUrl, invite)) ?? next();
    }
    if (segments[0] === 'timovi' && segments[1] && segments.length === 2) {
      return (await teamResponse(segments[1], canonicalUrl, invite)) ?? next();
    }
    if (segments.length === 1 && !STATIC_TOP_LEVEL.has(segments[0])) {
      return (await playerResponse(segments[0], canonicalUrl)) ?? next();
    }
  } catch {
    return next();
  }

  return next();
}
