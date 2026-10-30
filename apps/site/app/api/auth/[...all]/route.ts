import { api } from '@/lib/server/api';
import { authStatus, getAuth } from '@/lib/auth/server';
import { SIGNIN_COOLDOWN_S } from '@/lib/auth/shared';
import { normaliseEmail } from '@/lib/server/email-address';
import type { IEnv } from '@/lib/server/env';
import { jsonError, rateLimited } from '@/lib/server/http';
import { sha256Hex } from '@/lib/server/license';
import { clientIp, rateLimit } from '@/lib/server/ratelimit';

export const dynamic = 'force-dynamic';

// Sign-in requests keep the old endpoint's limits on top of Better Auth's own: five a window per address of the
// caller, and one email per inbox per minute, so the form cannot be used to flood someone's mail.
async function guardMagicLink(request: Request, env: IEnv): Promise<Response | string | null> {
  if (!(await rateLimit(env, 'auth', clientIp(request), 5))) return rateLimited();
  let email: string | null;
  try {
    email = normaliseEmail(((await request.clone().json()) as { email?: unknown } | null)?.email);
  } catch {
    return jsonError('bad_request', 400);
  }
  if (!email) return jsonError('bad_email', 400);
  if (!authStatus(env).email) return jsonError('email_unavailable', 503, { code: 'EMAIL_UNAVAILABLE' });
  const kv = env.LICENSES;
  if (kv) {
    const cool = `authmail:${await sha256Hex(email)}`;
    if (await kv.get(cool)) return rateLimited();
    return cool;
  }
  return null;
}

async function handle(request: Request, env: IEnv): Promise<Response> {
  const auth = getAuth(env, new URL(request.url).origin);
  const { pathname } = new URL(request.url);
  // Without sign-in configured nobody can be signed in, so the session check every page makes answers plainly.
  if (!auth && request.method === 'GET' && pathname.endsWith('/get-session')) return Response.json(null);
  if (!auth) return jsonError('auth_unavailable', 503, { code: 'AUTH_UNAVAILABLE' });
  if (request.method === 'POST' && pathname.endsWith('/sign-in/magic-link')) {
    const guard = await guardMagicLink(request, env);
    if (guard instanceof Response) return guard;
    const response = await auth.handler(request);
    if (response.ok && guard && env.LICENSES) await env.LICENSES.put(guard, '1', { expirationTtl: SIGNIN_COOLDOWN_S });
    return response;
  }
  if (request.method === 'GET' && pathname.endsWith('/magic-link/verify')) {
    if (!(await rateLimit(env, 'auth-verify', clientIp(request), 10))) return rateLimited();
  }
  return auth.handler(request);
}

export const GET = api((request, { env }) => handle(request, env));
export const POST = api((request, { env }) => handle(request, env));
