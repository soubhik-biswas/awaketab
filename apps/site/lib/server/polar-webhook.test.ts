// @vitest-environment node
import { describe, expect, it } from 'vitest';
import type { IEnv, IKv } from './env';
import { polarWebhookRoute } from './polar-webhook';

const SECRET = 'whsec-test-secret';
const ENC_KEY = Buffer.alloc(32, 3).toString('base64');
const LICENSE_KEY = 'AWAKE-1111-2222-3333-TESTKEY';

class MemoryKv implements IKv {
  rows = new Map<string, string>();
  failPuts = 0;
  failGets = false;

  get(key: string): Promise<string | null> {
    if (this.failGets) return Promise.reject(new Error('KV read failed'));
    return Promise.resolve(this.rows.get(key) ?? null);
  }

  put(key: string, value: string): Promise<void> {
    if (this.failPuts > 0) {
      this.failPuts -= 1;
      return Promise.reject(new Error('KV PUT failed: 429 Too Many Requests'));
    }
    this.rows.set(key, value);
    return Promise.resolve();
  }

  delete(key: string): Promise<void> {
    this.rows.delete(key);
    return Promise.resolve();
  }
}

async function sign(id: string, ts: number, body: string, secret = SECRET): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${id}.${ts}.${body}`));
  return `v1,${Buffer.from(mac).toString('base64')}`;
}

interface IDelivery {
  id?: string;
  body?: string;
  ts?: number;
  signature?: string;
  secret?: string;
}

async function deliver(event: unknown, env: IEnv, options: IDelivery = {}): Promise<Response> {
  const id = options.id ?? 'evt_1';
  const ts = options.ts ?? Math.floor(Date.now() / 1000);
  const body = options.body ?? JSON.stringify(event);
  const signature = options.signature ?? (await sign(id, ts, body, options.secret));
  return polarWebhookRoute(
    new Request('https://awaketab.com/api/webhooks/polar', {
      method: 'POST',
      body,
      headers: {
        'content-type': 'application/json',
        'webhook-id': id,
        'webhook-timestamp': String(ts),
        'webhook-signature': signature,
      },
    }),
    env,
  );
}

const grantCreated = {
  type: 'benefit_grant.created',
  data: {
    id: 'grant_1',
    customer_id: 'cus_1',
    order_id: 'ord_1',
    subscription_id: 'sub_1',
    benefit_id: 'ben_1',
    properties: { license_key_id: 'lk_1' },
    license_key: { key: LICENSE_KEY, id: 'lk_1', limit_activations: 3 },
  },
};

const subscriptionRevoked = { type: 'subscription.revoked', data: { id: 'sub_1', customer_id: 'cus_1' } };

function setup(): { kv: MemoryKv; env: IEnv } {
  const kv = new MemoryKv();
  return { kv, env: { LICENSES: kv, POLAR_WEBHOOK_SECRET: SECRET, LICENSE_KEY_ENC_KEY: ENC_KEY } };
}

describe('Polar webhook: requests that are not Polar events', () => {
  it('answers 400 when the signature headers are missing or the timestamp is stale', async () => {
    const { env, kv } = setup();
    const bare = new Request('https://awaketab.com/api/webhooks/polar', { method: 'POST', body: '{}' });
    expect((await polarWebhookRoute(bare, env)).status).toBe(400);
    const old = Math.floor(Date.now() / 1000) - 3600;
    expect((await deliver(grantCreated, env, { ts: old })).status).toBe(400);
    expect(kv.rows.size).toBe(0);
  });

  it('answers 401 for a signature made with another secret, and stores nothing', async () => {
    const { env, kv } = setup();
    expect((await deliver(grantCreated, env, { secret: 'someone-else' })).status).toBe(401);
    expect((await deliver(grantCreated, env, { signature: 'v1,AAAA' })).status).toBe(401);
    expect(kv.rows.size).toBe(0);
  });

  it('answers 400 for a signed body that is not JSON', async () => {
    const { env, kv } = setup();
    expect((await deliver(null, env, { body: 'not json' })).status).toBe(400);
    expect(kv.rows.size).toBe(0);
  });
});

describe('Polar webhook: failures Polar must retry', () => {
  it('answers 503 while the webhook secret is not set', async () => {
    const { env, kv } = setup();
    for (const secret of [undefined, '']) {
      const response = await deliver(grantCreated, { ...env, POLAR_WEBHOOK_SECRET: secret });
      expect(response.status).toBe(503);
      expect(response.headers.get('retry-after')).toBe('60');
      expect(await response.json()).toMatchObject({ error: 'webhook_unconfigured' });
    }
    expect(kv.rows.size).toBe(0);
  });

  it('answers 503 while the KV binding is missing', async () => {
    const response = await deliver(grantCreated, { POLAR_WEBHOOK_SECRET: SECRET, LICENSE_KEY_ENC_KEY: ENC_KEY });
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ error: 'webhook_unconfigured' });
  });

  it('answers 503 before any write when a licence cannot be encrypted, then handles the retry', async () => {
    const { env, kv } = setup();
    const response = await deliver(grantCreated, { ...env, LICENSE_KEY_ENC_KEY: undefined });
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ error: 'webhook_unconfigured' });
    expect(kv.rows.size).toBe(0);

    expect((await deliver(grantCreated, env)).status).toBe(200);
    expect([...kv.rows.keys()].some((key) => key.startsWith('lic:'))).toBe(true);
  });

  it('answers 503 when KV refuses a write, leaves the event unmarked, and the retry completes it', async () => {
    const { env, kv } = setup();
    kv.failPuts = 1;
    const failed = await deliver(grantCreated, env);
    expect(failed.status).toBe(503);
    expect(await failed.json()).toMatchObject({ error: 'webhook_failed' });
    expect(kv.rows.has('wh:evt_1')).toBe(false);

    const retried = await deliver(grantCreated, env);
    expect(retried.status).toBe(200);
    expect(await retried.json()).toEqual({ ok: true });
    expect(kv.rows.has('wh:evt_1')).toBe(true);
  });

  it('answers 503 when KV cannot be read', async () => {
    const { env, kv } = setup();
    kv.failGets = true;
    expect((await deliver(grantCreated, env)).status).toBe(503);
  });
});

describe('Polar webhook: handled events', () => {
  it('stores the licence, marks the event, and answers a repeat without doing the work twice', async () => {
    const { env, kv } = setup();
    expect((await deliver(grantCreated, env)).status).toBe(200);
    const licence = [...kv.rows.entries()].find(([key]) => key.startsWith('lic:'));
    expect(JSON.parse(licence?.[1] ?? '{}')).toMatchObject({ status: 'active', limit: 3, customerId: 'cus_1' });
    expect(licence?.[1]).not.toContain(LICENSE_KEY);
    expect(kv.rows.has('wh:evt_1')).toBe(true);

    const before = new Map(kv.rows);
    const repeat = await deliver(grantCreated, env);
    expect(repeat.status).toBe(200);
    expect(await repeat.json()).toEqual({ ok: true, duplicate: true });
    expect(kv.rows).toEqual(before);
  });

  it('applies a later status change to the stored licence', async () => {
    const { env, kv } = setup();
    await deliver(grantCreated, env);
    expect((await deliver(subscriptionRevoked, env, { id: 'evt_2' })).status).toBe(200);
    const licence = [...kv.rows.entries()].find(([key]) => key.startsWith('lic:'));
    expect(JSON.parse(licence?.[1] ?? '{}')).toMatchObject({ status: 'revoked' });
  });

  it('acknowledges a signed event of a type it does not handle, without marking it', async () => {
    const { env, kv } = setup();
    const response = await deliver({ type: 'meter.created', data: {} }, env);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, ignored: true });
    expect(kv.rows.size).toBe(0);
  });
});
