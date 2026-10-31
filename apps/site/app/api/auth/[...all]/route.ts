import { api } from '@/lib/server/api';
import { getAuth } from '@/lib/auth/server';
import type { IEnv } from '@/lib/server/env';
import { jsonError, rateLimited } from '@/lib/server/http';
import { clientIp, rateLimit } from '@/lib/server/ratelimit';

export const dynamic = 'force-dynamic';

async function handle(request: Request, env: IEnv): Promise<Response> {
  const auth = getAuth(env, new URL(request.url).origin);
  const { pathname } = new URL(request.url);
  // Without sign-in configured nobody can be signed in, so the session check every page makes answers plainly.
  if (!auth && request.method === 'GET' && pathname.endsWith('/get-session')) return Response.json(null);
  if (!auth) return jsonError('auth_unavailable', 503, { code: 'AUTH_UNAVAILABLE' });
  // A new passkey can start a new account, so asking for one is limited per caller on top of Better Auth's own limit.
  if (pathname.endsWith('/passkey/generate-register-options')) {
    if (!(await rateLimit(env, 'auth-passkey', clientIp(request), 10))) return rateLimited();
  }
  return auth.handler(request);
}

export const GET = api((request, { env }) => handle(request, env));
export const POST = api((request, { env }) => handle(request, env));
