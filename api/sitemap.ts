// Vercel serverless function (Node runtime) that builds sitemap.xml on every
// request straight from Supabase, so new tournaments/teams/players show up
// without a redeploy. Exposed at /sitemap.xml via the rewrite in vercel.json.
interface VercelRequest {
  headers: Record<string, string | string[] | undefined>;
}

interface VercelResponse {
  status(code: number): VercelResponse;
  setHeader(name: string, value: string): VercelResponse;
  send(body: string): void;
}

const SITE_URL = 'https://derbymania.xyz';

type Row = { id: string; created_at?: string | null };
type UsernameRow = { username: string };

async function fetchTable(path: string): Promise<unknown[]> {
  const supabaseUrl = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) return [];

  const res = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
      Range: '0-4999',
    },
  });
  if (!res.ok) return [];
  return (await res.json()) as unknown[];
}

function xmlEscape(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function urlEntry(loc: string, opts: { changefreq: string; priority: string; lastmod?: string | null }): string {
  const lastmodTag = opts.lastmod ? `\n    <lastmod>${new Date(opts.lastmod).toISOString().slice(0, 10)}</lastmod>` : '';
  return `  <url>\n    <loc>${xmlEscape(loc)}</loc>${lastmodTag}\n    <changefreq>${opts.changefreq}</changefreq>\n    <priority>${opts.priority}</priority>\n  </url>`;
}

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  const [tournaments, teams, players] = await Promise.all([
    fetchTable('tournaments?select=id,created_at&order=created_at.desc'),
    fetchTable('teams?select=id,created_at&deleted_at=is.null&order=created_at.desc'),
    fetchTable('player_usernames?select=username'),
  ]);

  const entries: string[] = [
    urlEntry(`${SITE_URL}/`, { changefreq: 'daily', priority: '1.0' }),
    urlEntry(`${SITE_URL}/turniri`, { changefreq: 'daily', priority: '0.9' }),
    urlEntry(`${SITE_URL}/timovi`, { changefreq: 'daily', priority: '0.8' }),
    urlEntry(`${SITE_URL}/igraci`, { changefreq: 'daily', priority: '0.8' }),
    urlEntry(`${SITE_URL}/feedback`, { changefreq: 'monthly', priority: '0.3' }),
  ];

  (tournaments as Row[]).forEach((t) => {
    if (!t.id) return;
    entries.push(urlEntry(`${SITE_URL}/turniri/${t.id}`, { changefreq: 'hourly', priority: '0.7', lastmod: t.created_at }));
  });

  (teams as Row[]).forEach((t) => {
    if (!t.id) return;
    entries.push(urlEntry(`${SITE_URL}/timovi/${t.id}`, { changefreq: 'weekly', priority: '0.6', lastmod: t.created_at }));
  });

  (players as UsernameRow[]).forEach((p) => {
    if (!p.username) return;
    entries.push(urlEntry(`${SITE_URL}/@${p.username}`, { changefreq: 'weekly', priority: '0.5' }));
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join('\n')}\n</urlset>`;

  res
    .status(200)
    .setHeader('Content-Type', 'application/xml; charset=utf-8')
    .setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400')
    .send(xml);
}
