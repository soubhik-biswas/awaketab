import { changelog } from '@/lib/content';
import { ROUTES, SITE } from '@/lib/routes';

export const dynamic = 'force-static';

const escape = (text: string): string =>
  text.replace(/&/gu, '&amp;').replace(/</gu, '&lt;').replace(/>/gu, '&gt;').replace(/"/gu, '&quot;');

// The changelog as an RSS feed, for the footer's feed button: one item per release note, newest first.
export function GET() {
  const items = changelog()
    .slice(0, 40)
    .map((e) => {
      const link = `${SITE}${ROUTES.changelog}#rel-${e.id}`;
      const body = e.items.map((html) => `<p>${html}</p>`).join('');
      return `<item><title>${escape(e.title)}</title><link>${link}</link><guid isPermaLink="false">${escape(e.id)}</guid><pubDate>${new Date(`${e.date}T12:00:00Z`).toUTCString()}</pubDate><description>${escape(body)}</description></item>`;
    })
    .join('');
  const xml = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>AwakeTab changelog</title><link>${SITE}${ROUTES.changelog}</link><description>Every AwakeTab release, newest first.</description><language>en</language>${items}</channel></rss>`;
  return new Response(xml, { headers: { 'content-type': 'application/rss+xml; charset=utf-8' } });
}
