import { api, options } from '@/lib/server/api';
import { mapEvent, parseBatch, writePoints } from '@/lib/server/events';
import { jsonError, jsonOk, rateLimited } from '@/lib/server/http';
import { clientIp, rateLimit } from '@/lib/server/ratelimit';

export const dynamic = 'force-dynamic';

export const POST = api(async (request, { env }) => {
  if (!(await rateLimit(env, 'e', clientIp(request)))) return rateLimited();
  const parsed = await parseBatch(request);
  if (!parsed.ok) return jsonError(parsed.status === 413 ? 'too_large' : 'bad_request', parsed.status);
  const now = Date.now();
  const points = parsed.events
    .map((row) => mapEvent(row, now))
    .filter((point): point is NonNullable<typeof point> => point !== null);
  writePoints(env, points);
  return jsonOk({ ok: true, n: points.length });
});
export const OPTIONS = options;
