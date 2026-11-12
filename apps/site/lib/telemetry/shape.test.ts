// @vitest-environment node
import { describe, expect, it } from 'vitest';
import {
  errorName,
  hostName,
  isToolPath,
  localeOf,
  pagePath,
  referrerHost,
  refFromSearch,
  refValue,
  tidyMessage,
  token,
  viewportClass,
} from './shape';

describe('what a page view carries', () => {
  it('keeps the path without a query, a hash or a trailing slash', () => {
    expect(pagePath('/')).toBe('/');
    expect(pagePath('/guides/')).toBe('/guides');
    expect(pagePath('/de/for/presentations?ref=x#top')).toBe('/de/for/presentations');
    expect(pagePath(`/${'a'.repeat(300)}`)).toHaveLength(200);
  });

  it('reads the language from the path, English at the root', () => {
    expect(localeOf('/')).toBe('en');
    expect(localeOf('/guides')).toBe('en');
    expect(localeOf('/pt-br')).toBe('pt-br');
    expect(localeOf('/ja/learn')).toBe('ja');
  });

  it('knows the pages that run a session', () => {
    expect(isToolPath('/')).toBe(true);
    expect(isToolPath('/de')).toBe(true);
    expect(isToolPath('/kiosk')).toBe(true);
    expect(isToolPath('/fr/kiosk')).toBe(true);
    expect(isToolPath('/guides')).toBe(false);
    expect(isToolPath('/de/guides')).toBe(false);
  });

  it('keeps only the hostname of the page that linked here', () => {
    expect(referrerHost('https://www.producthunt.com/posts/awaketab?utm=1', 'awaketab.com')).toBe('producthunt.com');
    expect(referrerHost('https://news.ycombinator.com/item?id=1', 'awaketab.com')).toBe('news.ycombinator.com');
    expect(referrerHost('https://awaketab.com/guides', 'www.awaketab.com')).toBe('');
    expect(referrerHost('', 'awaketab.com')).toBe('');
    expect(referrerHost('not a url', 'awaketab.com')).toBe('');
    expect(hostName('Example.COM')).toBe('example.com');
    expect(hostName('example.com/path')).toBe('');
    expect(hostName(42)).toBe('');
  });

  it('takes the ref label from ?ref= first, then ?utm_source=', () => {
    expect(refFromSearch('?ref=producthunt')).toBe('producthunt');
    expect(refFromSearch('?utm_source=newsletter_42&utm_medium=email')).toBe('newsletter_42');
    expect(refFromSearch('?ref=ProductHunt&utm_source=other')).toBe('producthunt');
    expect(refFromSearch('?utm_source=chatgpt.com')).toBe('chatgpt-com');
    expect(refFromSearch('?preset=p45')).toBe('');
    expect(refValue('a b')).toBe('');
    expect(refValue('x'.repeat(33))).toBe('');
    expect(refValue(null)).toBe('');
  });

  it("sorts the window width into the tool's layout tiers", () => {
    expect(viewportClass(390)).toBe('phone');
    expect(viewportClass(700)).toBe('tabletP');
    expect(viewportClass(1100)).toBe('tabletL');
    expect(viewportClass(1300)).toBe('desktop');
  });
});

describe('what an error report carries', () => {
  it('keeps short ids and drops everything else', () => {
    expect(token('hidden_document')).toBe('hidden_document');
    expect(token('Ring')).toBe('');
    expect(token('a'.repeat(33))).toBe('');
    expect(token(undefined)).toBe('');
  });

  it('names the error class, or Error when there is none', () => {
    expect(errorName(new TypeError('x'))).toBe('TypeError');
    expect(errorName('a string')).toBe('Error');
    expect(errorName(null)).toBe('Error');
  });

  it('cuts the message to 120 characters and removes link queries, addresses and long numbers', () => {
    expect(tidyMessage('  Failed   to fetch\n')).toBe('Failed to fetch');
    expect(tidyMessage('Load failed: https://awaketab.com/a.js?v=1#x now')).toBe(
      'Load failed: https://awaketab.com/a.js now',
    );
    expect(tidyMessage('write to someone@example.com')).toBe('write to [removed]');
    expect(tidyMessage('call +1 (415) 555-0100 today')).toBe('call [removed] today');
    expect(tidyMessage('y'.repeat(300))).toHaveLength(120);
    expect(tidyMessage(undefined)).toBe('');
  });
});
