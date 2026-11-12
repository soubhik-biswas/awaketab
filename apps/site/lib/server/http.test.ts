// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { isJsonRequest, readJsonBody, stringField, unavailable } from './http';

const post = (body: BodyInit | null, headers: Record<string, string> = { 'content-type': 'application/json' }) =>
  new Request('https://awaketab.com/api/feedback', { method: 'POST', body, headers });

async function errorOf(request: Request, max: number): Promise<{ status: number; error: unknown }> {
  const read = await readJsonBody(request, max);
  if (read.ok) return { status: 200, error: null };
  const { error } = (await read.response.json()) as { error: unknown };
  return { status: read.response.status, error };
}

describe('readJsonBody', () => {
  it('returns the parsed body when it is JSON and within the limit', async () => {
    const read = await readJsonBody(post(JSON.stringify({ rating: 'good' })), 64);
    expect(read).toEqual({ ok: true, value: { rating: 'good' } });
  });

  it('answers 415 unless the content type is JSON', async () => {
    expect(await errorOf(post('{}', {}), 64)).toEqual({ status: 415, error: 'unsupported_media_type' });
    expect(await errorOf(post('{}', { 'content-type': 'text/plain' }), 64)).toMatchObject({ status: 415 });
    expect(await errorOf(post('a=1', { 'content-type': 'application/x-www-form-urlencoded' }), 64)).toMatchObject({
      status: 415,
    });
  });

  it('answers 413 for a body that declares more than the limit, without reading it', async () => {
    let pulled = 0;
    const body = new ReadableStream<Uint8Array>({
      pull(controller) {
        pulled += 1;
        controller.enqueue(new Uint8Array(1024));
      },
    });
    const request = new Request('https://awaketab.com/api/feedback', {
      method: 'POST',
      body,
      headers: { 'content-type': 'application/json', 'content-length': '5000' },
      duplex: 'half',
    } as RequestInit);
    expect(await errorOf(request, 4096)).toEqual({ status: 413, error: 'too_large' });
    expect(pulled).toBeLessThanOrEqual(1);
  });

  it('answers 413 for a body that grows past the limit, whatever it declared', async () => {
    const large = JSON.stringify({ text: 'x'.repeat(5000) });
    expect(await errorOf(post(large), 4096)).toEqual({ status: 413, error: 'too_large' });
    expect(await errorOf(post(JSON.stringify({ text: 'x'.repeat(100) })), 4096)).toMatchObject({ status: 200 });
  });

  it('counts bytes, not characters', async () => {
    const body = JSON.stringify({ text: '日本語'.repeat(20) });
    expect(body.length).toBeLessThan(100);
    expect(await errorOf(post(body), 100)).toMatchObject({ status: 413 });
  });

  it('answers 400 for a body that does not parse', async () => {
    expect(await errorOf(post('{"rating":'), 64)).toEqual({ status: 400, error: 'bad_request' });
    expect(await errorOf(post(null), 64)).toEqual({ status: 400, error: 'bad_request' });
  });
});

describe('isJsonRequest', () => {
  const typed = (type: string): Request => post('{}', { 'content-type': type });

  it('accepts JSON and its structured-syntax types, with parameters and any case', () => {
    expect(isJsonRequest(typed('application/json'))).toBe(true);
    expect(isJsonRequest(typed('Application/JSON; charset=utf-8'))).toBe(true);
    expect(isJsonRequest(typed('application/reports+json'))).toBe(true);
  });

  it('accepts another type only when the route names it', () => {
    expect(isJsonRequest(typed('application/csp-report'))).toBe(false);
    expect(isJsonRequest(typed('application/csp-report'), ['application/csp-report'])).toBe(true);
    expect(isJsonRequest(typed('text/json'))).toBe(false);
    expect(isJsonRequest(typed('application/jsonp'))).toBe(false);
  });
});

describe('small helpers', () => {
  it('reads a string field and nothing else', () => {
    expect(stringField({ token: 'abc' }, 'token')).toBe('abc');
    expect(stringField({ token: 7 }, 'token')).toBe('');
    expect(stringField(null, 'token')).toBe('');
    expect(stringField('token', 'token')).toBe('');
  });

  it('answers 503 with a message and a retry time', async () => {
    const response = unavailable('storage_unavailable', 'Try again in a minute.');
    expect(response.status).toBe(503);
    expect(response.headers.get('retry-after')).toBe('60');
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(await response.json()).toEqual({ error: 'storage_unavailable', message: 'Try again in a minute.' });
  });
});
