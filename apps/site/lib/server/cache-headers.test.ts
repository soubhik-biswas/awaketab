// @vitest-environment node
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { getPathMatch } from 'next/dist/shared/lib/router/utils/path-match';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';
import { cacheHeaders } from './cache-headers';

const SITE_DIR = join(import.meta.dirname, '../..');

function revalidates(pathname: string): boolean {
  return cacheHeaders().some((rule) => getPathMatch(rule.source)(pathname) !== false);
}

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return /\.tsx?$/u.test(entry.name) && !/\.test\.tsx?$/u.test(entry.name) ? [path] : [];
  });
}

describe('document cache headers', () => {
  it('asks browsers and Cloudflare to check with the site before reusing a page', () => {
    for (const rule of cacheHeaders()) {
      expect(rule.headers).toEqual([{ key: 'cache-control', value: 'public, max-age=0, must-revalidate' }]);
    }
  });

  it('covers every page in every locale and the crawler files', () => {
    const paths = ['/', '/de', '/until/08-00', '/de/learn/faq', '/embed', '/embed/cook', '/pro', '/s/abc', '/nope'];
    const files = ['/robots.txt', '/sitemap.xml', '/rss.xml', '/manifest.webmanifest'];
    for (const pathname of [...paths, ...files]) expect([pathname, revalidates(pathname)]).toEqual([pathname, true]);
  });

  it('leaves routes that set their own policy, and hashed files, alone', () => {
    const own = ['/api/health', '/api/embed/config', '/api', '/og', '/embed.js', '/serwist/sw.js'];
    const assets = ['/_next/static/chunks/main.js', '/_next/image', '/favicon.ico', '/icons/icon-192.png'];
    for (const pathname of [...own, ...assets]) expect([pathname, revalidates(pathname)]).toEqual([pathname, false]);
  });

  it('may call every page public because no page is rendered from cookies or request headers', () => {
    const readers = ['app', 'components', 'i18n']
      .flatMap((dir) => sourceFiles(join(SITE_DIR, dir)))
      .filter((file) => !file.startsWith(join(SITE_DIR, 'app', 'api')))
      .filter((file) => /from 'next\/headers'/u.test(readFileSync(file, 'utf8')));
    expect(readers.map((file) => file.slice(SITE_DIR.length))).toEqual([]);
  });
});

describe('prerendered pages are served from the build', () => {
  it('uses the static-assets cache with cache interception', () => {
    const config = readFileSync(join(SITE_DIR, 'open-next.config.ts'), 'utf8');
    expect(config).toContain('overrides/incremental-cache/static-assets-incremental-cache');
    expect(config).toMatch(/incrementalCache: staticAssetsIncrementalCache/u);
    expect(config).toMatch(/enableCacheInterception: true/u);
  });

  it('binds the assets the cache reads, and marks hashed files immutable', () => {
    const wrangler = ts.parseConfigFileTextToJson(
      'wrangler.jsonc',
      readFileSync(join(SITE_DIR, 'wrangler.jsonc'), 'utf8'),
    ).config as { assets?: { directory?: string; binding?: string }; env: { preview: { assets?: unknown } } };
    expect(wrangler.assets).toEqual({ directory: '.open-next/assets', binding: 'ASSETS' });
    expect(wrangler.env.preview.assets).toBeUndefined();
    const headers = readFileSync(join(SITE_DIR, 'public/_headers'), 'utf8');
    expect(headers).toMatch(/^\/_next\/static\/\*\n {2}Cache-Control: public, max-age=31536000, immutable$/mu);
  });
});
