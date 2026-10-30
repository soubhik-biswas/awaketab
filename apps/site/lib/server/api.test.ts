import { describe, expect, it } from 'vitest';
import { extensionCorsHeaders, finish, isExtensionOrigin, preflight } from './api';

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
