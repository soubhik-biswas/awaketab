// @vitest-environment node
import { describe, expect, it } from 'vitest';

import {
  INDEXNOW_ENDPOINT,
  INDEXNOW_KEY,
  isSitemapIndex,
  MAX_URLS,
  payloads,
  readSitemap,
  selectUrls,
  sitemapLocs,
  submit,
  type IIndexNowPayload,
  type TFetch,
} from './indexnow.mjs';

const SITE = 'https://awaketab.com';
const XML = '<?xml version="1.0" encoding="UTF-8"?>\n';
const NS = 'xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"';

function urlset(urls: readonly string[]): string {
  const entries = urls.map((u) => `<url><loc>${u}</loc><xhtml:link rel="alternate" hreflang="en" href="${u}"/></url>`);
  return `${XML}<urlset ${NS}>${entries.join('')}</urlset>`;
}

function sitemapindex(urls: readonly string[]): string {
  const entries = urls.map((u) => `<sitemap><loc>${u}</loc></sitemap>`);
  return `${XML}<sitemapindex ${NS}>${entries.join('')}</sitemapindex>`;
}

interface IFakeSite {
  fetchFn: TFetch;
  requested: string[];
  posts: IIndexNowPayload[];
}

function fakeSite(pages: Record<string, string>, postStatus = 200): IFakeSite {
  const requested: string[] = [];
  const posts: IIndexNowPayload[] = [];
  const fetchFn: TFetch = (url, init) => {
    requested.push(url);
    if (url === INDEXNOW_ENDPOINT && init?.method === 'POST') {
      posts.push(JSON.parse(typeof init.body === 'string' ? init.body : '') as IIndexNowPayload);
      return Promise.resolve(new Response(null, { status: postStatus }));
    }
    const body = pages[url];
    return Promise.resolve(body === undefined ? new Response('', { status: 404 }) : new Response(body));
  };
  return { fetchFn, requested, posts };
}

describe('sitemap parsing', () => {
  it('reads every <loc>, decoding entities and CDATA', () => {
    const xml = `<urlset>
      <url><loc> https://awaketab.com/ </loc></url>
      <url><loc>https://awaketab.com/for/cooking?a=1&amp;b=2</loc></url>
      <url><loc><![CDATA[https://awaketab.com/es/]]></loc></url>
    </urlset>`;
    expect(sitemapLocs(xml)).toEqual([
      'https://awaketab.com/',
      'https://awaketab.com/for/cooking?a=1&b=2',
      'https://awaketab.com/es/',
    ]);
  });

  it('tells a sitemap index from a URL set', () => {
    expect(isSitemapIndex(sitemapindex([`${SITE}/a.xml`]))).toBe(true);
    expect(isSitemapIndex(urlset([`${SITE}/`]))).toBe(false);
  });

  it('follows sitemap index files on the site only, once each', async () => {
    const site = fakeSite({
      [`${SITE}/sitemap.xml`]: sitemapindex([
        `${SITE}/sitemap-pages.xml`,
        `${SITE}/sitemap-nested.xml`,
        'https://evil.example/sitemap.xml',
      ]),
      [`${SITE}/sitemap-pages.xml`]: urlset([`${SITE}/`, `${SITE}/30m`]),
      [`${SITE}/sitemap-nested.xml`]: sitemapindex([`${SITE}/sitemap-guides.xml`, `${SITE}/sitemap-pages.xml`]),
      [`${SITE}/sitemap-guides.xml`]: urlset([`${SITE}/guides/lock-screen-vs-sleep`]),
    });
    const urls = await readSitemap(site.fetchFn);
    expect(urls).toEqual([`${SITE}/`, `${SITE}/30m`, `${SITE}/guides/lock-screen-vs-sleep`]);
    expect(site.requested).not.toContain('https://evil.example/sitemap.xml');
    expect(site.requested.filter((u) => u === `${SITE}/sitemap-pages.xml`)).toHaveLength(1);
  });

  it('fails when a sitemap does not load', async () => {
    const site = fakeSite({ [`${SITE}/sitemap.xml`]: sitemapindex([`${SITE}/missing.xml`]) });
    await expect(readSitemap(site.fetchFn)).rejects.toThrow('missing.xml answered HTTP 404');
  });
});

describe('URL filtering', () => {
  it('keeps only https URLs on awaketab.com, without duplicates', () => {
    expect(
      selectUrls([
        `${SITE}/30m`,
        `${SITE}/`,
        `${SITE}/30m`,
        'http://awaketab.com/about',
        'https://www.awaketab.com/about',
        'https://play.awaketab.com/about',
        'https://awaketab.com.evil.example/about',
        `${SITE}/help#billing`,
        'not a url',
      ]),
    ).toEqual([`${SITE}/`, `${SITE}/30m`]);
  });
});

describe('batching', () => {
  it('splits the list into batches of 10,000 with the key location', () => {
    const urls = Array.from({ length: MAX_URLS * 2 + 5 }, (_, i) => `${SITE}/p/${String(i)}`);
    const batches = payloads(urls);
    expect(batches.map((b) => b.urlList.length)).toEqual([MAX_URLS, MAX_URLS, 5]);
    expect(batches.flatMap((b) => b.urlList)).toEqual(urls);
    expect(batches[0]).toMatchObject({
      host: 'awaketab.com',
      key: INDEXNOW_KEY,
      keyLocation: `${SITE}/${INDEXNOW_KEY}.txt`,
    });
  });

  it('uses a 32-character hex key', () => {
    expect(INDEXNOW_KEY).toMatch(/^[0-9a-f]{32}$/u);
  });
});

describe('submit', () => {
  const pages = (key = INDEXNOW_KEY): Record<string, string> => ({
    [`${SITE}/sitemap.xml`]: urlset([`${SITE}/`, `${SITE}/30m`, 'https://play.awaketab.com/']),
    [`${SITE}/${INDEXNOW_KEY}.txt`]: key,
  });

  it('posts the filtered URLs once the key file is live', async () => {
    const site = fakeSite(pages());
    await expect(submit({ fetchFn: site.fetchFn })).resolves.toEqual({ found: 2, sent: 2 });
    expect(site.posts).toEqual([
      {
        host: 'awaketab.com',
        key: INDEXNOW_KEY,
        keyLocation: `${SITE}/${INDEXNOW_KEY}.txt`,
        urlList: [`${SITE}/`, `${SITE}/30m`],
      },
    ]);
  });

  it('treats 202 as success', async () => {
    const site = fakeSite(pages(), 202);
    await expect(submit({ fetchFn: site.fetchFn })).resolves.toEqual({ found: 2, sent: 2 });
  });

  it('fails on any other answer from IndexNow', async () => {
    const site = fakeSite(pages(), 403);
    await expect(submit({ fetchFn: site.fetchFn })).rejects.toThrow('answered HTTP 403');
  });

  it('refuses to post when the key file does not serve the key', async () => {
    const site = fakeSite(pages('something-else'));
    await expect(submit({ fetchFn: site.fetchFn })).rejects.toThrow('does not serve the key');
    expect(site.posts).toEqual([]);
  });

  it('posts nothing on a dry run', async () => {
    const site = fakeSite(pages());
    const lines: string[] = [];
    const result = await submit({ fetchFn: site.fetchFn, dryRun: true, log: (l) => lines.push(l) });
    expect(result).toEqual({ found: 2, sent: 0 });
    expect(site.posts).toEqual([]);
    expect(lines).toEqual([`indexnow: dry run, would POST 2 URLs to ${INDEXNOW_ENDPOINT}`]);
  });
});
