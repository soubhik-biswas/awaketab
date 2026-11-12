// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { activateRoute } from './license-activate';
import { deactivateRoute } from './license-deactivate';
import { validateRoute } from './license-validate';

let caller = 0;

function post(path: string, body: string, contentType: string | null = 'application/json'): Request {
  caller += 1;
  const headers: Record<string, string> = { 'cf-connecting-ip': `192.0.2.${caller}` };
  if (contentType) headers['content-type'] = contentType;
  return new Request(`https://awaketab.com/api/license/${path}`, { method: 'POST', body, headers });
}

const ROUTES = [
  { name: 'activate', run: activateRoute },
  { name: 'validate', run: validateRoute },
  { name: 'deactivate', run: deactivateRoute },
] as const;

const errorOf = async (response: Response): Promise<unknown> => ((await response.json()) as { error?: unknown }).error;

describe.each(ROUTES)('POST /api/license/$name request body', ({ name, run }) => {
  it('refuses a body that is not JSON by its content type', async () => {
    const response = await run(post(name, '{"token":"x"}', 'text/plain'), {});
    expect(response.status).toBe(415);
    expect((await run(post(name, '{"token":"x"}', null), {})).status).toBe(415);
  });

  it('refuses a body over 2 KB', async () => {
    const response = await run(post(name, JSON.stringify({ token: 'x'.repeat(2100) })), {});
    expect(response.status).toBe(413);
    expect(await errorOf(response)).toBe('too_large');
  });

  it('refuses a body that does not parse', async () => {
    const response = await run(post(name, '{"token":'), {});
    expect(response.status).toBe(400);
    expect(await errorOf(response)).toBe('bad_request');
  });
});

describe('licence routes past the body checks', () => {
  it('reads a token of ordinary size and goes on to the licence store', async () => {
    const token = `${'a'.repeat(60)}.${'b'.repeat(600)}.${'c'.repeat(86)}`;
    const validated = await validateRoute(post('validate', JSON.stringify({ token })), {});
    expect(validated.status).toBe(502);
    expect(await errorOf(validated)).toBe('polar_unavailable');
    const deactivated = await deactivateRoute(post('deactivate', JSON.stringify({ token, deviceId: 'd' })), {});
    expect(deactivated.status).toBe(502);
  });

  it('reads an activation and goes on to the licence store', async () => {
    const body = {
      key: 'AWAKE-1111-2222-3333-TESTKEY',
      deviceId: '0b0e7a52-6d0f-4c1e-9a53-0d6f1d3c2b1a',
      deviceLabel: 'Chrome on Mac',
    };
    const response = await activateRoute(post('activate', JSON.stringify(body)), {});
    expect(response.status).toBe(502);
    expect((await activateRoute(post('activate', JSON.stringify({ key: 'short' })), {})).status).toBe(400);
  });
});
