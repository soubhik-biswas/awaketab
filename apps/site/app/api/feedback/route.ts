import { api, isSameOrigin } from '@/lib/server/api';
import { jsonError, jsonOk, rateLimited, readJsonBody, unavailable } from '@/lib/server/http';
import { clientIp, rateLimit } from '@/lib/server/ratelimit';

export const dynamic = 'force-dynamic';

const MAX_BODY_BYTES = 4 * 1024;
const KEEP_S = 2 * 365 * 86_400;

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

// KV refuses writes past its daily quota. The visitor is asked to try again, never thanked for a note nobody kept.
const notSaved = (): Response =>
  unavailable('storage_unavailable', 'Your feedback could not be saved. Please try again in a minute.');

export const POST = api(async (request, { env }) => {
  if (!isSameOrigin(request, env)) return jsonError('forbidden', 403);
  if (!(await rateLimit(env, 'feedback', clientIp(request), 5))) return rateLimited();
  const parsed = await readJsonBody(request, MAX_BODY_BYTES);
  if (!parsed.ok) return parsed.response;
  const raw = parsed.value;
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return jsonError('bad_request', 400);
  const body = raw as Record<string, unknown>;
  const rating = String(body.rating);
  if (!RATINGS.has(rating)) return jsonError('bad_request', 400);
  const topics = Array.isArray(body.topics) ? [...new Set(body.topics.map(String).filter((t) => TOPICS.has(t)))] : [];
  const text = typeof body.text === 'string' ? scrub(body.text) : '';
  const device = DEVICES.has(String(body.device)) ? String(body.device) : 'desktop';
  const browser = BROWSERS.has(String(body.browser)) ? String(body.browser) : 'Other';
  const sessions = Math.min(100_000, Math.max(0, Math.round(Number(body.sessions) || 0)));
  const version = typeof body.version === 'string' ? body.version.slice(0, 24) : 'web';
  const kv = env.LICENSES;
  if (!kv) return notSaved();
  try {
    await kv.put(
      `feedback:${crypto.randomUUID()}`,
      JSON.stringify({ rating, topics, text: text || undefined, device, browser, sessions, version, at: Date.now() }),
      { expirationTtl: KEEP_S },
    );
  } catch {
    return notSaved();
  }
  return jsonOk({ ok: true });
});
