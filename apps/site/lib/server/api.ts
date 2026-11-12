import { serverContext, type IEnv, type IServerContext } from './env';

// The commit this build was made from (next.config.ts inlines it); `dev` on a local server.
export const VERSION = (process.env.COMMIT_SHA || 'dev').slice(0, 12);

const EXTENSION_ORIGIN = /^chrome-extension:\/\/[a-p]{32}$/u;
const PRODUCTION_HOSTS = new Set(['awaketab.com', 'www.awaketab.com']);
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);

const EXTENSION_CORS_ROUTES = [
  '/api/e',
  '/api/license/activate',
  '/api/license/validate',
  '/api/license/deactivate',
] as const;

export function isExtensionOrigin(origin: string | null): origin is string {
  return origin !== null && EXTENSION_ORIGIN.test(origin);
}

export function extensionCorsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get('origin');
  if (!isExtensionOrigin(origin)) return {};
  const { pathname } = new URL(request.url);
  if (!(EXTENSION_CORS_ROUTES as readonly string[]).includes(pathname)) return {};
  return { 'access-control-allow-origin': origin, vary: 'Origin' };
}

function urlOf(value: string | undefined): URL | null {
  try {
    return value ? new URL(value) : null;
  } catch {
    return null;
  }
}

// A browser names the page behind a POST in Origin, and another site cannot fake it. Only scripts send none; a
// local server and the preview accept those so the routes can be tried by hand, production does not.
export function isSameOrigin(request: Request, env: IEnv): boolean {
  const here = new URL(request.url);
  const site = urlOf(env.PUBLIC_SITE_URL);
  const origin = request.headers.get('origin');
  if (origin !== null) return origin === here.origin || origin === site?.origin;
  if (LOCAL_HOSTS.has(here.hostname)) return true;
  return site !== null && !PRODUCTION_HOSTS.has(site.hostname);
}

export function preflight(request: Request): Response {
  const headers = extensionCorsHeaders(request);
  if (!headers['access-control-allow-origin'])
    return new Response(null, { status: 403, headers: { 'cache-control': 'no-store', 'x-robots-tag': 'noindex' } });
  return new Response(null, {
    status: 204,
    headers: {
      ...headers,
      'access-control-allow-methods': 'POST, OPTIONS',
      'access-control-allow-headers': 'content-type',
      'access-control-max-age': '86400',
      'cache-control': 'no-store',
      'x-robots-tag': 'noindex',
    },
  });
}

// Every API answer gets the same treatment the Pages middleware gave it: extension CORS, noindex, and no-store
// unless the handler chose its own cache policy.
export function finish(request: Request, response: Response): Response {
  const next = new Response(response.body, response);
  for (const [key, value] of Object.entries(extensionCorsHeaders(request))) next.headers.set(key, value);
  next.headers.set('x-robots-tag', 'noindex');
  if (!next.headers.has('cache-control')) next.headers.set('cache-control', 'no-store');
  return next;
}

export type TApiHandler = (request: Request, ctx: IServerContext) => Promise<Response> | Response;

export function api(handler: TApiHandler): (request: Request) => Promise<Response> {
  return async (request) => {
    const ctx = await serverContext();
    return finish(request, await handler(request, ctx));
  };
}

export const options = (request: Request): Response => preflight(request);
