import { consumeToken } from '../../_lib/auth';
import type { IEnv } from '../../_lib/env';
import { jsonError, jsonOk, rateLimited } from '../../_lib/http';
import { clientIp, rateLimit } from '../../_lib/ratelimit';

export const onRequestPost: PagesFunction<IEnv> = async (context) => {
  const { env, request } = context;
  if (!(await rateLimit(env, 'auth-verify', await clientIp(request), 10))) return rateLimited();
  let token: unknown;
  try {
    token = ((await request.json()) as { token?: unknown } | null)?.token;
  } catch {
    return jsonError('bad_request', 400);
  }
  if (typeof token !== 'string') return jsonError('bad_request', 400);
  const kv = env.LICENSES;
  if (!kv) return jsonError('expired', 410);
  const result = await consumeToken(kv, token);
  if (!result.ok) return jsonError('expired', 410);
  return jsonOk({ ok: true, email: result.email });
};
