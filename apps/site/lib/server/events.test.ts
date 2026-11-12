// @vitest-environment node
import { describe, expect, it } from 'vitest';
import {
  BLOB_COLUMNS,
  browserFamily,
  countryOf,
  deviceClass,
  mapEvent,
  requestFacts,
  visitorKey,
  type IAePoint,
  type IRequestFacts,
} from './events';

const NOW = Date.UTC(2026, 10, 13, 9, 30);
const FACTS: IRequestFacts = { country: 'IN', device: 'desktop', browser: 'Chrome', visitor: '0123456789abcdef' };

const UA = {
  chromeWin:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36',
  edgeWin:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0',
  safariMac:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Safari/605.1.15',
  safariPhone:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Mobile/15E148 Safari/604.1',
  chromePhoneIos:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/142.0.0.0 Mobile/15E148 Safari/604.1',
  safariTablet:
    'Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
  chromeAndroid:
    'Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36',
  chromeAndroidTablet:
    'Mozilla/5.0 (Linux; Android 15; Pixel Tablet) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36',
  samsung:
    'Mozilla/5.0 (Linux; Android 14; SM-S921B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/27.0 Chrome/125.0.0.0 Mobile Safari/537.36',
  firefoxLinux: 'Mozilla/5.0 (X11; Linux x86_64; rv:144.0) Gecko/20100101 Firefox/144.0',
  firefoxAndroidTablet: 'Mozilla/5.0 (Android 15; Tablet; rv:144.0) Gecko/144.0 Firefox/144.0',
  opera:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0',
  crawler: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
};

const col = (point: IAePoint | null, name: (typeof BLOB_COLUMNS)[number]): string | undefined =>
  point?.blobs[BLOB_COLUMNS.indexOf(name)];

const request = (headers: Record<string, string> = {}, cf?: { country?: unknown }): Request => {
  const req = new Request('https://awaketab.com/api/e', { method: 'POST', headers });
  return cf ? Object.assign(req, { cf }) : req;
};

describe('Analytics Engine layout', () => {
  it('keeps the first nine columns where they were and adds the new ones on the end', () => {
    expect(BLOB_COLUMNS).toEqual([
      'path',
      'locale',
      'ua',
      'source',
      'sid',
      'attr1',
      'attr2',
      'viewport',
      'ver',
      'country',
      'device',
      'browser',
      'referrer',
      'ref',
      'visitor',
      'face',
      'background',
    ]);
  });

  it('writes one blob per column, the event as the index and two doubles', () => {
    const point = mapEvent({ event: 'page_view', source: 'web', path: '/guides?x=1', ts: NOW + 40 }, NOW, FACTS);
    expect(point?.indexes).toEqual(['page_view']);
    expect(point?.blobs).toHaveLength(BLOB_COLUMNS.length);
    expect(col(point, 'path')).toBe('/guides');
    expect(point?.doubles).toEqual([0, 40]);
  });

  it('refuses an event name that is not on the list', () => {
    expect(mapEvent({ event: 'made_up', source: 'web' }, NOW, FACTS)).toBeNull();
    expect(mapEvent({ source: 'web' }, NOW, FACTS)).toBeNull();
  });
});

describe('page views', () => {
  const row = {
    event: 'page_view',
    source: 'web',
    path: '/',
    locale: 'en',
    sid: 'abc',
    viewport: 'desktop',
    ver: 'web',
    via: 'allow',
    referrer: 'www.ProductHunt.com',
    ref: 'producthunt',
  };

  it('stores the referrer host, the ref label, how the view came about and the request facts', () => {
    const point = mapEvent(row, NOW, FACTS);
    expect(col(point, 'referrer')).toBe('producthunt.com');
    expect(col(point, 'ref')).toBe('producthunt');
    expect(col(point, 'attr2')).toBe('allow');
    expect(col(point, 'country')).toBe('IN');
    expect(col(point, 'device')).toBe('desktop');
    expect(col(point, 'browser')).toBe('Chrome');
    expect(col(point, 'visitor')).toBe('0123456789abcdef');
    expect(col(point, 'viewport')).toBe('desktop');
  });

  it('drops a referrer that is more than a hostname and a ref with anything but letters, digits, dash, underscore', () => {
    const point = mapEvent({ ...row, referrer: 'https://news.example/item?id=1', ref: 'a b<script>', via: 'x' }, NOW);
    expect(col(point, 'referrer')).toBe('');
    expect(col(point, 'ref')).toBe('');
    expect(col(point, 'attr2')).toBe('');
    expect(col(mapEvent({ ...row, ref: 'x'.repeat(33) }, NOW), 'ref')).toBe('');
    expect(col(mapEvent({ ...row, ref: 'ChatGPT.com' }, NOW), 'ref')).toBe('chatgpt-com');
  });

  it('adds nothing about the request to events from the extension or the embed widget', () => {
    const point = mapEvent({ ...row, source: 'ext' }, NOW, FACTS);
    expect(col(point, 'country')).toBe('');
    expect(col(point, 'device')).toBe('');
    expect(col(point, 'browser')).toBe('');
    expect(col(point, 'visitor')).toBe('');
    expect(col(point, 'referrer')).toBe('');
    const embed = mapEvent({ event: 'page_view', source: 'embed', host: 'blog.example' }, NOW, FACTS);
    expect(col(embed, 'attr1')).toBe('blog.example');
    expect(col(embed, 'visitor')).toBe('');
  });
});

describe('tool events', () => {
  it('stores what a session started with', () => {
    const point = mapEvent(
      {
        event: 'session_start',
        source: 'web',
        planType: 'duration',
        presetId: 'p60',
        lengthMin: 60,
        face: 'ring',
        background: 'aurora',
      },
      NOW,
      FACTS,
    );
    expect(col(point, 'attr1')).toBe('duration');
    expect(col(point, 'attr2')).toBe('p60');
    expect(col(point, 'face')).toBe('ring');
    expect(col(point, 'background')).toBe('aurora');
    expect(point?.doubles[0]).toBe(60);
  });

  it('keeps a face or background only when it is a short id', () => {
    const point = mapEvent(
      { event: 'session_start', source: 'web', face: 'Ring Face!', background: 'x'.repeat(40) },
      NOW,
    );
    expect(col(point, 'face')).toBe('');
    expect(col(point, 'background')).toBe('');
    expect(col(mapEvent({ event: 'page_view', source: 'web', face: 'ring' }, NOW), 'face')).toBe('');
  });

  it('stores how a session ended and the minutes it kept', () => {
    const point = mapEvent({ event: 'session_end', source: 'web', reason: 'completed', durationMin: 45 }, NOW);
    expect(col(point, 'attr1')).toBe('completed');
    expect(point?.doubles[0]).toBe(45);
    expect(mapEvent({ event: 'session_extend', source: 'web', addedMin: 15 }, NOW)?.doubles[0]).toBe(15);
    expect(col(mapEvent({ event: 'lock_denied', source: 'web', reason: 'permissions_policy' }, NOW), 'attr1')).toBe(
      'permissions_policy',
    );
  });

  it('stores an error as a name and a short message with no address or link query in it', () => {
    const message = `Failed to load https://awaketab.com/_next/chunk.js?token=abc for someone@example.com ${'x'.repeat(200)}`;
    const point = mapEvent({ event: 'client_error', source: 'web', code: 'TypeError', message }, NOW);
    expect(col(point, 'attr1')).toBe('TypeError');
    const stored = col(point, 'attr2') ?? '';
    expect(stored.length).toBeLessThanOrEqual(120);
    expect(stored).toContain('https://awaketab.com/_next/chunk.js for [removed]');
    expect(stored).not.toContain('token=');
    expect(stored).not.toContain('@');
  });
});

describe('request facts', () => {
  it('sorts user agents into coarse device classes', () => {
    expect(deviceClass(UA.chromeWin)).toBe('desktop');
    expect(deviceClass(UA.safariMac)).toBe('desktop');
    expect(deviceClass(UA.firefoxLinux)).toBe('desktop');
    expect(deviceClass(UA.safariPhone)).toBe('phone');
    expect(deviceClass(UA.chromeAndroid)).toBe('phone');
    expect(deviceClass(UA.samsung)).toBe('phone');
    expect(deviceClass(UA.safariTablet)).toBe('tablet');
    expect(deviceClass(UA.chromeAndroidTablet)).toBe('tablet');
    expect(deviceClass(UA.firefoxAndroidTablet)).toBe('tablet');
    expect(deviceClass(UA.crawler)).toBe('bot');
    expect(deviceClass('')).toBe('other');
  });

  it('names the browser family only', () => {
    expect(browserFamily(UA.chromeWin)).toBe('Chrome');
    expect(browserFamily(UA.chromePhoneIos)).toBe('Chrome');
    expect(browserFamily(UA.edgeWin)).toBe('Edge');
    expect(browserFamily(UA.opera)).toBe('Opera');
    expect(browserFamily(UA.samsung)).toBe('Samsung Internet');
    expect(browserFamily(UA.firefoxLinux)).toBe('Firefox');
    expect(browserFamily(UA.safariMac)).toBe('Safari');
    expect(browserFamily(UA.safariPhone)).toBe('Safari');
    expect(browserFamily('')).toBe('Other');
  });

  it('reads a two-letter country from Cloudflare and nothing else', () => {
    expect(countryOf(request({}, { country: 'DE' }))).toBe('DE');
    expect(countryOf(request(), 'FR')).toBe('FR');
    expect(countryOf(request({ 'cf-ipcountry': 'JP' }))).toBe('JP');
    expect(countryOf(request({ 'cf-ipcountry': 'XX' }))).toBe('');
    expect(countryOf(request({ 'cf-ipcountry': 'T1' }))).toBe('');
    expect(countryOf(request({}, { country: 'Germany' }))).toBe('');
    expect(countryOf(request())).toBe('');
  });

  it('gives the same browser one key for a UTC day and a different one the next day', async () => {
    const key = await visitorKey('secret', NOW, '203.0.113.7', UA.chromeWin);
    expect(key).toMatch(/^[0-9a-f]{16}$/u);
    expect(await visitorKey('secret', NOW + 3_600_000, '203.0.113.7', UA.chromeWin)).toBe(key);
    expect(await visitorKey('secret', NOW + 86_400_000, '203.0.113.7', UA.chromeWin)).not.toBe(key);
    expect(await visitorKey('secret', NOW, '203.0.113.8', UA.chromeWin)).not.toBe(key);
    expect(await visitorKey('secret', NOW, '203.0.113.7', UA.safariMac)).not.toBe(key);
    expect(await visitorKey('other', NOW, '203.0.113.7', UA.chromeWin)).not.toBe(key);
  });

  it('writes no visitor key when the secret is missing', async () => {
    expect(await visitorKey(undefined, NOW, '203.0.113.7', UA.chromeWin)).toBe('');
    expect(await visitorKey('', NOW, '203.0.113.7', UA.chromeWin)).toBe('');
    const facts = await requestFacts(request({ 'user-agent': UA.chromeWin }), {}, '203.0.113.7', NOW);
    expect(facts).toEqual({ country: '', device: 'desktop', browser: 'Chrome', visitor: '' });
  });

  it('builds the facts from the request and never includes the address or the user agent', async () => {
    const req = request({ 'user-agent': UA.safariPhone, 'cf-ipcountry': 'US' });
    const facts = await requestFacts(req, { RATE_LIMIT_SALT: 'secret' }, '203.0.113.7', NOW);
    expect(facts.country).toBe('US');
    expect(facts.device).toBe('phone');
    expect(facts.browser).toBe('Safari');
    expect(facts.visitor).toBe(await visitorKey('secret', NOW, '203.0.113.7', UA.safariPhone));
    const stored = JSON.stringify(mapEvent({ event: 'page_view', source: 'web', path: '/' }, NOW, facts));
    expect(stored).not.toContain('203.0.113.7');
    expect(stored).not.toContain('iPhone OS');
  });
});
