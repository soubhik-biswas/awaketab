import { getCloudflareContext } from '@opennextjs/cloudflare';
import { api, options } from '@/lib/server/api';
import { mapEvent, parseBatch, requestFacts, writePoints } from '@/lib/server/events';
import { jsonError, jsonOk, rateLimited } from '@/lib/server/http';
import { clientIp, rateLimit } from '@/lib/server/ratelimit';

export const dynamic = 'force-dynamic';

// The route handler's request does not carry Cloudflare's request details, so the country is read from the Worker.
async function edgeCountry(): Promise<unknown> {
  try {
    const context = (await getCloudflareContext({ async: true })) as unknown as { cf?: { country?: unknown } };
    return context.cf?.country;
  } catch {
    return undefined;
  }
}

export const POST = api(async (request, { env }) => {
  const ip = clientIp(request);
  if (!(await rateLimit(env, 'e', ip))) return rateLimited();
  const parsed = await parseBatch(request);
  if (!parsed.ok) return jsonError(parsed.status === 413 ? 'too_large' : 'bad_request', parsed.status);
  const now = Date.now();
  const facts = await requestFacts(request, env, ip, now, await edgeCountry());
  const points = parsed.events
    .map((row) => mapEvent(row, now, facts))
    .filter((point): point is NonNullable<typeof point> => point !== null);
  writePoints(env, points);
  return jsonOk({ ok: true, n: points.length });
});
export const OPTIONS = options;
