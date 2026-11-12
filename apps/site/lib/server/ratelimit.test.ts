// @vitest-environment node
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RATE_WINDOW_S } from './env';
import { rateLimited } from './http';
import { clientIp, rateLimit } from './ratelimit';

const cloudflare = vi.hoisted(() => ({ env: undefined as Record<string, unknown> | undefined }));

vi.mock('@opennextjs/cloudflare', () => ({
  getCloudflareContext: () => {
    if (!cloudflare.env) throw new Error('no Cloudflare context');
    return { env: cloudflare.env };
  },
}));

interface IFakeLimiter {
  keys: string[];
  limit(options: { key: string }): Promise<{ success: boolean }>;
}

function limiter(allow: (seen: number) => boolean): IFakeLimiter {
  const keys: string[] = [];
  return {
    keys,
    limit: ({ key }) => {
      keys.push(key);
      return Promise.resolve({ success: allow(keys.length) });
    },
  };
}

const ENV = { RATE_LIMIT_SALT: 'salt' };

beforeEach(() => {
  cloudflare.env = undefined;
});

afterEach(() => {
  vi.useRealTimers();
});

describe('rate limiter with the Workers binding', () => {
  it('asks the binding of the route and passes its verdict on', async () => {
    const events = limiter((seen) => seen <= 2);
    const feedback = limiter(() => true);
    const license = limiter(() => false);
    cloudflare.env = { RL_EVENTS: events, RL_FEEDBACK: feedback, RL_LICENSE: license };

    expect(await rateLimit(ENV, 'e', '203.0.113.1')).toBe(true);
    expect(await rateLimit(ENV, 'csp', '203.0.113.1')).toBe(true);
    expect(await rateLimit(ENV, 'e', '203.0.113.1')).toBe(false);
    expect(await rateLimit(ENV, 'feedback', '203.0.113.1', 5)).toBe(true);
    expect(await rateLimit(ENV, 'rating', '203.0.113.1', 5)).toBe(true);
    expect(await rateLimit(ENV, 'license', '203.0.113.1', 10)).toBe(false);
    expect(await rateLimit(ENV, 'checkout', '203.0.113.1', 10)).toBe(false);

    expect(events.keys).toHaveLength(3);
    expect(feedback.keys).toHaveLength(2);
    expect(license.keys).toHaveLength(2);
  });

  it('keys by route and a salted hash, never by the address itself', async () => {
    const feedback = limiter(() => true);
    cloudflare.env = { RL_FEEDBACK: feedback };
    await rateLimit(ENV, 'feedback', '203.0.113.7');
    await rateLimit(ENV, 'rating', '203.0.113.7');
    await rateLimit(ENV, 'feedback', '203.0.113.8');
    await rateLimit({ RATE_LIMIT_SALT: 'other' }, 'feedback', '203.0.113.7');

    const [first, rating, neighbour, resalted] = feedback.keys;
    expect(first).toMatch(/^feedback:[0-9a-f]{64}$/u);
    expect(rating).toBe(first?.replace('feedback:', 'rating:'));
    expect(new Set([first, neighbour, resalted]).size).toBe(3);
    expect(feedback.keys.join(' ')).not.toContain('203.0.113');
  });

  it('lets the request through when the binding throws or answers nonsense', async () => {
    cloudflare.env = {
      RL_EVENTS: { limit: () => Promise.reject(new Error('limiter down')) },
      RL_FEEDBACK: { limit: () => Promise.resolve(undefined) },
      RL_LICENSE: {
        limit: () => {
          throw new Error('limiter down');
        },
      },
    };
    expect(await rateLimit(ENV, 'e', '203.0.113.2')).toBe(true);
    expect(await rateLimit(ENV, 'feedback', '203.0.113.2')).toBe(true);
    expect(await rateLimit(ENV, 'license', '203.0.113.2')).toBe(true);
  });

  it('never touches KV', async () => {
    const kv = { get: vi.fn(), put: vi.fn(), delete: vi.fn() };
    cloudflare.env = { RL_EVENTS: limiter(() => true) };
    await rateLimit({ ...ENV, LICENSES: kv }, 'e', '203.0.113.3');
    cloudflare.env = undefined;
    await rateLimit({ ...ENV, LICENSES: kv }, 'e', '203.0.113.3');
    expect(kv.get).not.toHaveBeenCalled();
    expect(kv.put).not.toHaveBeenCalled();
  });
});

describe('rate limiter without the binding', () => {
  it('counts in memory per route and caller, and starts again in the next window', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(Date.UTC(2026, 10, 13, 9, 30, 5)));
    const calls = async (route: string, ip: string, max: number, times: number): Promise<boolean[]> => {
      const out: boolean[] = [];
      for (let i = 0; i < times; i++) out.push(await rateLimit(ENV, route, ip, max));
      return out;
    };

    expect(await calls('feedback', '198.51.100.1', 3, 5)).toEqual([true, true, true, false, false]);
    expect(await rateLimit(ENV, 'rating', '198.51.100.1', 3)).toBe(true);
    expect(await rateLimit(ENV, 'feedback', '198.51.100.2', 3)).toBe(true);

    vi.setSystemTime(Date.now() + RATE_WINDOW_S * 1000);
    expect(await rateLimit(ENV, 'feedback', '198.51.100.1', 3)).toBe(true);
  });

  it('counts when a context exists but the binding is missing', async () => {
    cloudflare.env = {};
    expect(await rateLimit(ENV, 'license', '198.51.100.9', 1)).toBe(true);
    expect(await rateLimit(ENV, 'license', '198.51.100.9', 1)).toBe(false);
  });

  it('lets the request through when hashing fails', async () => {
    const digest = vi.spyOn(crypto.subtle, 'digest').mockRejectedValueOnce(new Error('no crypto'));
    expect(await rateLimit(ENV, 'license', '198.51.100.10', 0)).toBe(true);
    digest.mockRestore();
  });
});

describe('rate limit answers', () => {
  it('tells a blocked caller to wait one window', () => {
    const response = rateLimited();
    expect(response.status).toBe(429);
    expect(response.headers.get('retry-after')).toBe(String(RATE_WINDOW_S));
    expect(response.headers.get('cache-control')).toBe('no-store');
  });

  it('reads the caller address Cloudflare reports first', () => {
    const request = new Request('https://awaketab.com/api/e', {
      headers: { 'cf-connecting-ip': '203.0.113.5', 'x-forwarded-for': '198.51.100.5, 10.0.0.1' },
    });
    expect(clientIp(request)).toBe('203.0.113.5');
    expect(clientIp(new Request('https://awaketab.com/api/e'))).toBe('0.0.0.0');
  });
});

interface IRateLimitBinding {
  name: string;
  namespace_id: string;
  simple: { limit: number; period: number };
}

interface IWranglerConfig {
  ratelimits?: IRateLimitBinding[];
  env: { preview: { ratelimits?: IRateLimitBinding[] } };
}

describe('rate limit bindings in wrangler.jsonc', () => {
  const parsed = ts.parseConfigFileTextToJson(
    'wrangler.jsonc',
    readFileSync(`${import.meta.dirname}/../../wrangler.jsonc`, 'utf8'),
  );
  const production = parsed.config as IWranglerConfig;
  const budgets = { RL_EVENTS: 30, RL_FEEDBACK: 5, RL_LICENSE: 10 };

  it('declares every budget for production and for the preview, which inherits no bindings', () => {
    for (const bindings of [production.ratelimits, production.env.preview.ratelimits]) {
      expect(Object.fromEntries((bindings ?? []).map((row) => [row.name, row.simple.limit]))).toEqual(budgets);
      expect((bindings ?? []).every((row) => row.simple.period === RATE_WINDOW_S)).toBe(true);
    }
  });

  it('gives every limiter its own counter', () => {
    const ids = [...(production.ratelimits ?? []), ...(production.env.preview.ratelimits ?? [])].map(
      (row) => row.namespace_id,
    );
    expect(ids).toHaveLength(6);
    expect(new Set(ids).size).toBe(6);
    expect(ids.every((id) => /^[1-9]\d*$/u.test(id))).toBe(true);
  });
});
