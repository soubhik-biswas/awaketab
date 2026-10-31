import { api } from '@/lib/server/api';
import { jsonError, jsonOk, rateLimited } from '@/lib/server/http';
import { clientIp, rateLimit } from '@/lib/server/ratelimit';

export const dynamic = 'force-dynamic';

const RATINGS = new Set(['love', 'good', 'bad']);
const TOPICS = new Set(['faces', 'ease', 'battery', 'other']);
const DEVICES = new Set(['desktop', 'tabletL', 'tabletP', 'phone']);
const BROWSERS = new Set(['Chrome', 'Edge', 'Firefox', 'Safari', 'Opera', 'Samsung Internet', 'Other']);

// Feedback is the only support channel and stays anonymous: anything that looks like an address or a phone number
// in the note is removed before it is stored.
function scrub(text: string): string {
  return text
    .replace(/[^\s@]+@[^\s@]+\.[^\s@]+/gu, '[removed]')
    .replace(/\+?\d[\d\s().-]{7,}\d/gu, '[removed]')
    .trim()
    .slice(0, 1000);
}

export const POST = api(async (request, { env }) => {
  if (!(await rateLimit(env, 'feedback', clientIp(request), 6))) return rateLimited();
  let body: Record<string, unknown>;
  try {
    const raw: unknown = await request.json();
    if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return jsonError('bad_request', 400);
    body = raw as Record<string, unknown>;
  } catch {
    return jsonError('bad_request', 400);
  }
  const rating = String(body.rating);
  if (!RATINGS.has(rating)) return jsonError('bad_request', 400);
  const topics = Array.isArray(body.topics) ? [...new Set(body.topics.map(String).filter((t) => TOPICS.has(t)))] : [];
  const text = typeof body.text === 'string' ? scrub(body.text) : '';
  const device = DEVICES.has(String(body.device)) ? String(body.device) : 'desktop';
  const browser = BROWSERS.has(String(body.browser)) ? String(body.browser) : 'Other';
  const sessions = Math.min(100_000, Math.max(0, Math.round(Number(body.sessions) || 0)));
  const version = typeof body.version === 'string' ? body.version.slice(0, 24) : 'web';
  const id = crypto.randomUUID();
  await env.LICENSES?.put(
    `feedback:${id}`,
    JSON.stringify({ rating, topics, text: text || undefined, device, browser, sessions, version, at: Date.now() }),
    { expirationTtl: 2 * 365 * 86_400 },
  );
  return jsonOk({ ok: true });
});
