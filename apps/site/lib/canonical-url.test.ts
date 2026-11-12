import { describe, expect, it } from 'vitest';
import { canonicalUrl } from './canonical-url';

function ask(url: string, headers: Record<string, string> = {}) {
  const current = new URL(url);
  return canonicalUrl(current, current.host, headers['x-forwarded-proto'] ?? null)?.toString() ?? null;
}

describe('one address per page', () => {
  it('leaves the canonical address alone', () => {
    expect(ask('https://awaketab.com/')).toBeNull();
    expect(ask('https://awaketab.com/guides/lock-screen-vs-sleep?x=1')).toBeNull();
    expect(ask('https://awaketab.com/es')).toBeNull();
  });

  it('sends www to the bare domain and keeps the path and query', () => {
    expect(ask('https://www.awaketab.com/')).toBe('https://awaketab.com/');
    expect(ask('https://www.awaketab.com/for/cooking?preset=p30')).toBe('https://awaketab.com/for/cooking?preset=p30');
  });

  it('sends plain http to https', () => {
    expect(ask('https://awaketab.com/30m', { 'x-forwarded-proto': 'http' })).toBe('https://awaketab.com/30m');
  });

  it('drops the /en prefix, and never matches paths that only start with en', () => {
    expect(ask('https://awaketab.com/en')).toBe('https://awaketab.com/');
    expect(ask('https://awaketab.com/en/about')).toBe('https://awaketab.com/about');
    expect(ask('https://awaketab.com/energy')).toBeNull();
  });

  it('does not move the preview or local hosts to production', () => {
    expect(ask('https://play.awaketab.com/')).toBeNull();
    expect(ask('http://localhost:3000/', { 'x-forwarded-proto': 'http' })).toBeNull();
    expect(ask('https://play.awaketab.com/en/about')).toBe('https://play.awaketab.com/about');
  });
});
