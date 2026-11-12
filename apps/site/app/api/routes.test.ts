// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { POST as csp } from './csp/route';
import { POST as feedback } from './feedback/route';
import { GET as health } from './health/route';
import { POST as rating } from './rating/route';

interface IFakeKv {
  rows: Map<string, { value: string; ttl: number | undefined }>;
  fail: boolean;
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
  delete(key: string): Promise<void>;
}

function fakeKv(): IFakeKv {
  const rows: IFakeKv['rows'] = new Map();
  const kv: IFakeKv = {
    rows,
    fail: false,
    get: (key) => Promise.resolve(rows.get(key)?.value ?? null),
    put: (key, value, options) => {
      if (kv.fail) return Promise.reject(new Error('KV PUT failed: 429 Too Many Requests'));
      rows.set(key, { value, ttl: options?.expirationTtl });
      return Promise.resolve();
    },
    delete: (key) => {
      rows.delete(key);
      return Promise.resolve();
    },
  };
  return kv;
}

const cloudflare = vi.hoisted(() => ({
  env: {},
  ctx: { waitUntil: (): void => undefined },
}));

vi.mock('@opennextjs/cloudflare', () => ({
  getCloudflareContext: (options?: { async?: boolean }) => (options?.async ? Promise.resolve(cloudflare) : cloudflare),
}));

const SITE = 'https://awaketab.com';
const TWO_YEARS_S = 2 * 365 * 86_400;
let caller = 0;
let kv: IFakeKv;
let points: unknown[];

beforeEach(() => {
  kv = fakeKv();
  points = [];
  cloudflare.env = {
    LICENSES: kv,
    EVENTS: { writeDataPoint: (point: unknown) => points.push(point) },
    PUBLIC_SITE_URL: SITE,
    PUBLIC_POLAR_SERVER: 'production',
  };
});

// A new caller address for each request keeps the limiter out of tests that are not about it.
function post(path: string, body: unknown, headers: Record<string, string> = {}): Request {
  caller += 1;
  return new Request(`${SITE}${path}`, {
    method: 'POST',
    body: typeof body === 'string' ? body : JSON.stringify(body),
    headers: {
      'content-type': 'application/json',
      origin: SITE,
      'cf-connecting-ip': `203.0.113.${caller}`,
      ...headers,
    },
  });
}

const errorOf = async (response: Response): Promise<unknown> => ((await response.json()) as { error?: unknown }).error;

const NOTE = { rating: 'good', topics: ['faces', 'nope'], text: 'Mail me: a@b.co', device: 'phone', browser: 'Edge' };

describe('POST /api/feedback', () => {
  it('stores one scrubbed record for two years and says so', async () => {
    const response = await feedback(post('/api/feedback', { ...NOTE, sessions: 3, version: '1.2.3' }));
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(kv.rows.size).toBe(1);
    const [key, row] = [...kv.rows.entries()][0] ?? ['', { value: '{}', ttl: 0 }];
    expect(key).toMatch(/^feedback:[0-9a-f-]{36}$/u);
    expect(row.ttl).toBe(TWO_YEARS_S);
    expect(JSON.parse(row.value)).toMatchObject({
      rating: 'good',
      topics: ['faces'],
      text: 'Mail me: [removed]',
      device: 'phone',
      browser: 'Edge',
      sessions: 3,
      version: '1.2.3',
    });
  });

  it('answers 503 with a retry message when KV refuses the write or is not bound', async () => {
    kv.fail = true;
    const refused = await feedback(post('/api/feedback', NOTE));
    expect(refused.status).toBe(503);
    expect(refused.headers.get('retry-after')).toBe('60');
    expect(await refused.json()).toEqual({
      error: 'storage_unavailable',
      message: 'Your feedback could not be saved. Please try again in a minute.',
    });
    cloudflare.env = { PUBLIC_SITE_URL: SITE };
    expect((await feedback(post('/api/feedback', NOTE))).status).toBe(503);
  });

  it('refuses another site before reading anything', async () => {
    const response = await feedback(post('/api/feedback', NOTE, { origin: 'https://evil.example' }));
    expect(response.status).toBe(403);
    expect(await errorOf(response)).toBe('forbidden');
    expect(kv.rows.size).toBe(0);
  });

  it('refuses a body over 4 KB, a body that is not JSON, and an unknown rating', async () => {
    const large = await feedback(post('/api/feedback', { ...NOTE, text: 'x'.repeat(5000) }));
    expect(large.status).toBe(413);
    const form = await feedback(post('/api/feedback', 'rating=good', { 'content-type': 'text/plain' }));
    expect(form.status).toBe(415);
    expect((await feedback(post('/api/feedback', '{"rating":'))).status).toBe(400);
    expect((await feedback(post('/api/feedback', [NOTE]))).status).toBe(400);
    expect((await feedback(post('/api/feedback', { rating: 'meh' }))).status).toBe(400);
    expect(kv.rows.size).toBe(0);
  });

  it('keeps a note of the full length in any script', async () => {
    const response = await feedback(post('/api/feedback', { ...NOTE, text: '画面を消さない'.repeat(140) }));
    expect(response.status).toBe(200);
  });

  it('answers 429 after five notes a minute from one caller', async () => {
    const headers = { 'cf-connecting-ip': '198.51.100.77' };
    const statuses: number[] = [];
    for (let i = 0; i < 6; i++) statuses.push((await feedback(post('/api/feedback', NOTE, headers))).status);
    expect(statuses).toEqual([200, 200, 200, 200, 200, 429]);
  });
});

describe('POST /api/rating', () => {
  it('stores the rating with the deployed version', async () => {
    const response = await rating(post('/api/rating', { stars: 4, text: 'Solid', locale: 'de' }));
    expect(response.status).toBe(200);
    const body = (await response.json()) as { ok: boolean; id: string };
    expect(kv.rows.get(`rating:${body.id}`)?.ttl).toBe(TWO_YEARS_S);
    expect(JSON.parse(kv.rows.get(`rating:${body.id}`)?.value ?? '{}')).toMatchObject({
      stars: 4,
      text: 'Solid',
      locale: 'de',
      ver: 'dev',
    });
  });

  it('refuses another site, a body over 1 KB, another content type and stars out of range', async () => {
    expect((await rating(post('/api/rating', { stars: 5 }, { origin: 'https://evil.example' }))).status).toBe(403);
    expect((await rating(post('/api/rating', { stars: 5, text: 'x'.repeat(1100) }))).status).toBe(413);
    expect((await rating(post('/api/rating', 'stars=5', { 'content-type': 'text/plain' }))).status).toBe(415);
    expect((await rating(post('/api/rating', { stars: 6 }))).status).toBe(400);
    expect((await rating(post('/api/rating', 'null'))).status).toBe(400);
    expect(kv.rows.size).toBe(0);
  });

  it('answers 503 when the rating cannot be stored', async () => {
    kv.fail = true;
    const response = await rating(post('/api/rating', { stars: 5 }));
    expect(response.status).toBe(503);
    expect(await errorOf(response)).toBe('storage_unavailable');
  });
});

describe('POST /api/csp', () => {
  const report = [{ type: 'csp-violation', body: { documentURL: 'https://awaketab.com/de/learn?x=1' } }];

  it('records a report from the Reporting API and from the older report-uri', async () => {
    const modern = await csp(post('/api/csp', report, { 'content-type': 'application/reports+json' }));
    const legacy = await csp(
      post(
        '/api/csp',
        { 'csp-report': { 'document-uri': 'https://awaketab.com/pro' } },
        { 'content-type': 'application/csp-report' },
      ),
    );
    expect([modern.status, legacy.status]).toEqual([200, 200]);
    expect(points).toHaveLength(2);
  });

  it('refuses another content type and a report over 8 KB', async () => {
    expect((await csp(post('/api/csp', 'x', { 'content-type': 'text/plain' }))).status).toBe(415);
    const large = [{ body: { documentURL: 'https://awaketab.com/', sample: 'x'.repeat(9000) } }];
    expect((await csp(post('/api/csp', large, { 'content-type': 'application/reports+json' }))).status).toBe(413);
    expect(points).toHaveLength(0);
  });
});

describe('GET /api/health', () => {
  it('reports the build commit, which is dev outside a build', async () => {
    const response = await health(new Request(`${SITE}/api/health`));
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(await response.json()).toEqual({ ok: true, version: 'dev', polar: 'production' });
  });
});
