import { api, isSameOrigin, VERSION } from '@/lib/server/api';
import { jsonError, jsonOk, rateLimited, readJsonBody, unavailable } from '@/lib/server/http';
import { clientIp, rateLimit } from '@/lib/server/ratelimit';

export const dynamic = 'force-dynamic';

const MAX_BODY_BYTES = 1024;
const KEEP_S = 2 * 365 * 86_400;

const notSaved = (): Response =>
  unavailable('storage_unavailable', 'Your rating could not be saved. Please try again in a minute.');

export const POST = api(async (request, { env }) => {
  if (!isSameOrigin(request, env)) return jsonError('forbidden', 403);
  if (!(await rateLimit(env, 'rating', clientIp(request), 5))) return rateLimited();
  const parsed = await readJsonBody(request, MAX_BODY_BYTES);
  if (!parsed.ok) return parsed.response;
  const raw = parsed.value;
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return jsonError('bad_request', 400);
  const body = raw as Record<string, unknown>;
  const stars = Number(body.stars);
  if (!Number.isInteger(stars) || stars < 1 || stars > 5) return jsonError('bad_request', 400);
  const text = typeof body.text === 'string' ? body.text.slice(0, 500) : '';
  const locale = typeof body.locale === 'string' ? body.locale.slice(0, 16) : 'en';
  const kv = env.LICENSES;
  if (!kv) return notSaved();
  const id = crypto.randomUUID();
  try {
    await kv.put(
      `rating:${id}`,
      JSON.stringify({ stars, text: text || undefined, locale, ver: VERSION, at: Date.now() }),
      { expirationTtl: KEEP_S },
    );
  } catch {
    return notSaved();
  }
  return jsonOk({ ok: true, id });
});
