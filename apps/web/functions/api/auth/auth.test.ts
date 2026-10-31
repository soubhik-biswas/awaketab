import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { onRequestPost as onSignin } from './signin';
import { onRequestPost as onVerify } from './verify';
import { onRequestGet as onLink } from '../../auth/[token]';
import * as send from '../../_lib/email/send';
import { newToken, storeToken, SIGNIN_TTL_S } from '../../_lib/auth';
import { harness, invoke, jsonRequest } from '../../../test/functions/harness';

const T0 = Date.parse('2026-10-30T10:00:00.000Z');

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(T0);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('POST /api/auth/signin', () => {
  it('refuses a malformed address without touching KV', async () => {
    const h = harness();
    const res = await invoke(onSignin, h.env, jsonRequest('/api/auth/signin', { email: 'sam@example' }));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'bad_email' });
    expect(h.kv.keys('auth')).toEqual([]);
  });

  it('says email is unavailable while no provider is configured and keeps no token', async () => {
    const h = harness();
    const res = await invoke(onSignin, h.env, jsonRequest('/api/auth/signin', { email: 'Sam@Example.com ' }));
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ error: 'email_unavailable' });
    expect(h.kv.keys('auth:')).toEqual([]);
  });

  it('stores a hashed single-use token for 15 minutes and mails the link when sending works', async () => {
    const h = harness();
    const spy = vi.spyOn(send, 'sendEmail').mockResolvedValue({ ok: true });
    const res = await invoke(onSignin, h.env, jsonRequest('/api/auth/signin', { email: 'sam@example.com' }));
    expect(res.status).toBe(202);
    expect(await res.json()).toEqual({ sent: true, minutes: 15 });
    const put = h.kv.writesTo('auth:')[0];
    expect(put?.expirationTtl).toBe(SIGNIN_TTL_S);
    const mail = spy.mock.calls[0]?.[1];
    expect(mail?.to).toBe('sam@example.com');
    const link = /https:\/\/awaketab\.com\/auth\/([A-Za-z0-9_-]{43})/u.exec(mail?.text ?? '');
    expect(link).not.toBeNull();
    expect(put?.key).not.toContain(link?.[1] ?? '');
  });

  it('sends at most one link per address per minute', async () => {
    const h = harness();
    vi.spyOn(send, 'sendEmail').mockResolvedValue({ ok: true });
    await invoke(onSignin, h.env, jsonRequest('/api/auth/signin', { email: 'sam@example.com' }));
    const again = await invoke(onSignin, h.env, jsonRequest('/api/auth/signin', { email: 'SAM@example.com' }));
    expect(again.status).toBe(429);
  });
});

describe('POST /api/auth/verify', () => {
  it('works once, then answers expired', async () => {
    const h = harness();
    const token = newToken();
    await storeToken(h.kv as unknown as KVNamespace, token, 'sam@example.com');
    const first = await invoke(onVerify, h.env, jsonRequest('/api/auth/verify', { token }));
    expect(first.status).toBe(200);
    expect(await first.json()).toEqual({ ok: true, email: 'sam@example.com' });
    const second = await invoke(onVerify, h.env, jsonRequest('/api/auth/verify', { token }));
    expect(second.status).toBe(410);
  });

  it('refuses a token past its expiry even if KV still holds it', async () => {
    const h = harness();
    const token = newToken();
    await storeToken(h.kv as unknown as KVNamespace, token, 'sam@example.com', T0 - SIGNIN_TTL_S * 1000 - 1);
    const res = await invoke(onVerify, h.env, jsonRequest('/api/auth/verify', { token }));
    expect(res.status).toBe(410);
  });
});

describe('GET /auth/:token', () => {
  it('hands a well-formed token to /signin in the fragment and spends nothing', async () => {
    const h = harness();
    const token = newToken();
    await storeToken(h.kv as unknown as KVNamespace, token, 'sam@example.com');
    const res = await onLink({ params: { token }, env: h.env } as unknown as Parameters<typeof onLink>[0]);
    expect(res.status).toBe(303);
    expect(res.headers.get('location')).toBe(`/signin#token=${token}`);
    expect(h.kv.keys('auth:')).toHaveLength(1);
  });

  it('sends anything else to the expired state', () => {
    const res = onLink({ params: { token: '../x' }, env: {} } as unknown as Parameters<typeof onLink>[0]);
    expect((res as Response).headers.get('location')).toBe('/signin?link=expired');
  });
});
