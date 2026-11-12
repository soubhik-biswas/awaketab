import { getCloudflareContext } from '@opennextjs/cloudflare';
import { RATE_MAX, RATE_WINDOW_S, type IEnv } from './env';

interface IRateLimiter {
  limit(options: { key: string }): Promise<{ success?: boolean }>;
}

type TBinding = 'RL_EVENTS' | 'RL_FEEDBACK' | 'RL_LICENSE';

// One Workers rate limit binding per budget; wrangler.jsonc sets each limit per caller and minute. A route not
// named here counts against the licence and account budget.
const BINDINGS: Record<string, TBinding> = {
  e: 'RL_EVENTS',
  csp: 'RL_EVENTS',
  feedback: 'RL_FEEDBACK',
  rating: 'RL_FEEDBACK',
};

const MEMORY_KEYS = 5000;
const counters = new Map<string, { bucket: number; count: number }>();

export function clientIp(request: Request): string {
  return (
    request.headers.get('cf-connecting-ip') ??
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    '0.0.0.0'
  );
}

async function ipHash(env: IEnv, ip: string): Promise<string> {
  const salt = env.RATE_LIMIT_SALT ?? 'dev';
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${salt}${ip}`));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function binding(route: string): IRateLimiter | undefined {
  try {
    const bindings = getCloudflareContext().env as unknown as Partial<Record<TBinding, IRateLimiter>>;
    return bindings[BINDINGS[route] ?? 'RL_LICENSE'];
  } catch {
    return undefined;
  }
}

// Without the binding (a local server, tests) each isolate counts for itself in the same one-minute window.
function countInMemory(key: string, max: number, now: number): boolean {
  const bucket = Math.floor(now / 1000 / RATE_WINDOW_S);
  const entry = counters.get(key);
  const count = entry?.bucket === bucket ? entry.count : 0;
  if (count >= max) return false;
  if (!entry && counters.size >= MEMORY_KEYS) {
    for (const [name, row] of counters) if (row.bucket !== bucket) counters.delete(name);
    if (counters.size >= MEMORY_KEYS) counters.clear();
  }
  counters.set(key, { bucket, count: count + 1 });
  return true;
}

// True lets the request through. The binding enforces its own limit, so `max` only steers the in-memory count.
// A limiter that fails lets the request through: it must never take a route down with it.
export async function rateLimit(env: IEnv, route: string, ip: string, max = RATE_MAX): Promise<boolean> {
  try {
    const key = `${route}:${await ipHash(env, ip)}`;
    const limiter = binding(route);
    if (limiter) return (await limiter.limit({ key })).success !== false;
    return countInMemory(key, max, Date.now());
  } catch {
    return true;
  }
}
