// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { extensionCorsHeaders, finish, isExtensionOrigin, isSameOrigin, preflight } from './api';

const EXT = 'chrome-extension://abcdefghijklmnopabcdefghijklmnop';

const req = (path: string, method = 'POST', origin?: string): Request =>
  new Request(`https://awaketab.com${path}`, { method, headers: origin ? { origin } : {} });

describe('API headers', () => {
  it('recognises only Chrome extension origins', () => {
    expect(isExtensionOrigin(EXT)).toBe(true);
    expect(isExtensionOrigin('https://evil.example')).toBe(false);
    expect(isExtensionOrigin(null)).toBe(false);
  });

  it('allows the extension on the licence and events routes only', () => {
    expect(extensionCorsHeaders(req('/api/license/activate', 'POST', EXT))['access-control-allow-origin']).toBe(EXT);
    expect(extensionCorsHeaders(req('/api/rating', 'POST', EXT))).toEqual({});
  });

  it('refuses a preflight from anywhere else', () => {
    expect(preflight(req('/api/e', 'OPTIONS', 'https://evil.example')).status).toBe(403);
    expect(preflight(req('/api/e', 'OPTIONS', EXT)).status).toBe(204);
  });

  it('marks every answer noindex and no-store unless the handler set a cache policy', () => {
    const plain = finish(req('/api/health', 'GET'), Response.json({ ok: true }));
    expect(plain.headers.get('x-robots-tag')).toBe('noindex');
    expect(plain.headers.get('cache-control')).toBe('no-store');
    const cached = finish(
      req('/api/embed/config', 'GET'),
      Response.json({}, { headers: { 'cache-control': 'public, max-age=300' } }),
    );
    expect(cached.headers.get('cache-control')).toBe('public, max-age=300');
  });
});

describe('same-origin check', () => {
  const PRODUCTION = { PUBLIC_SITE_URL: 'https://awaketab.com' };
  const PREVIEW = { PUBLIC_SITE_URL: 'https://play.awaketab.com' };
  const post = (url: string, headers: Record<string, string> = {}): Request =>
    new Request(url, { method: 'POST', headers });

  it('accepts a post from the site itself', () => {
    const url = 'https://awaketab.com/api/feedback';
    expect(isSameOrigin(post(url, { origin: 'https://awaketab.com' }), PRODUCTION)).toBe(true);
    expect(isSameOrigin(post('http://localhost:3000/api/feedback', { origin: 'http://localhost:3000' }), {})).toBe(
      true,
    );
    expect(
      isSameOrigin(post('https://play.awaketab.com/api/rating', { origin: 'https://play.awaketab.com' }), PREVIEW),
    ).toBe(true);
  });

  it('refuses another site, an extension and an opaque origin', () => {
    const url = 'https://awaketab.com/api/feedback';
    expect(isSameOrigin(post(url, { origin: 'https://evil.example' }), PRODUCTION)).toBe(false);
    expect(isSameOrigin(post(url, { origin: 'https://awaketab.com.evil.example' }), PRODUCTION)).toBe(false);
    expect(isSameOrigin(post(url, { origin: 'http://awaketab.com' }), PRODUCTION)).toBe(false);
    expect(isSameOrigin(post(url, { origin: EXT }), PRODUCTION)).toBe(false);
    expect(isSameOrigin(post(url, { origin: 'null' }), PRODUCTION)).toBe(false);
  });

  it('does not let a matching Referer stand in for Origin', () => {
    const url = 'https://awaketab.com/api/feedback';
    expect(isSameOrigin(post(url, { referer: 'https://awaketab.com/' }), PRODUCTION)).toBe(false);
    expect(
      isSameOrigin(post(url, { origin: 'https://evil.example', referer: 'https://awaketab.com/' }), PRODUCTION),
    ).toBe(false);
  });

  it('accepts a script with no Origin on the preview and on a local server only', () => {
    expect(isSameOrigin(post('https://awaketab.com/api/feedback'), PRODUCTION)).toBe(false);
    expect(
      isSameOrigin(post('https://www.awaketab.com/api/feedback'), { PUBLIC_SITE_URL: 'https://www.awaketab.com' }),
    ).toBe(false);
    expect(isSameOrigin(post('https://awaketab.com/api/feedback'), {})).toBe(false);
    expect(isSameOrigin(post('https://play.awaketab.com/api/feedback'), PREVIEW)).toBe(true);
    expect(isSameOrigin(post('http://localhost:3000/api/feedback'), PRODUCTION)).toBe(true);
    expect(isSameOrigin(post('http://127.0.0.1:3000/api/feedback'), {})).toBe(true);
  });
});
