import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { afterEach, describe, expect, it, vi } from 'vitest';
import robots from './robots';
import { pageMetadata } from '@/lib/seo';
import { securityHeaders } from '@/lib/server/security-headers';

afterEach(() => vi.unstubAllEnvs());

describe('deployment search visibility', () => {
  const meta = { title: 'AwakeTab', description: 'Keep this screen awake', path: '/', og: {} };

  // Value: protects=production remains crawlable; fails_when=preview crawler rules leak into production;
  // why_new=existing metadata tests do not inspect robots routes; seam=none; no_claim=live HTTP routing.
  it('keeps production pages indexable', () => {
    vi.stubEnv('NEXT_PUBLIC_DEPLOY_ENV', '');
    expect(pageMetadata(meta).robots).toEqual({ index: true, follow: true });
    expect(pageMetadata(meta).alternates).toEqual({
      canonical: 'https://awaketab.com/',
      languages: { en: 'https://awaketab.com/', 'x-default': 'https://awaketab.com/' },
    });
    expect(pageMetadata(meta).openGraph).toHaveProperty('alternateLocale', []);
    expect(robots().rules).toMatchObject({ userAgent: '*', allow: '/' });
    expect(robots().rules).not.toMatchObject({ disallow: '/' });
    expect(robots().sitemap).toBe('https://awaketab.com/sitemap.xml');
    const restrictedRoutes = new Set([
      '/embed/:path+',
      '/:locale(es|pt-br|de|fr|ja|zh|hi)/embed/:path+',
      '/api/:path*',
      '/auth/:path*',
    ]);
    const publicRobotHeaders = securityHeaders()
      .filter((rule) => !restrictedRoutes.has(rule.source))
      .flatMap((rule) => rule.headers)
      .filter(
        (header) =>
          header.key.toLowerCase() === 'x-robots-tag' && /(?:^|[\s,:])(?:noindex|none)(?:$|[\s,])/iu.test(header.value),
      );
    expect(publicRobotHeaders).toEqual([]);
  });

  // Value: protects=preview pages remain out of search and language alternates; fails_when=preview visibility guards are omitted;
  // why_new=existing page-head tests cover titles and share images only; seam=none; no_claim=build-variable injection or live HTTP headers.
  it('excludes play pages from search at the metadata, crawler and HTTP layers', () => {
    vi.stubEnv('NEXT_PUBLIC_DEPLOY_ENV', 'play');
    expect(pageMetadata(meta).robots).toEqual({ index: false, follow: true });
    const localizedArticle = pageMetadata({
      ...meta,
      article: true,
      locale: 'de',
      path: '/de/learn',
      alternates: [
        { locale: 'en', hreflang: 'en', href: 'https://awaketab.com/learn' },
        { locale: 'de', hreflang: 'de', href: 'https://awaketab.com/de/learn' },
      ],
    });
    expect(localizedArticle.robots).toEqual({ index: false, follow: true });
    expect(localizedArticle.alternates).toEqual({ canonical: 'https://awaketab.com/de/learn' });
    expect(localizedArticle.openGraph).not.toHaveProperty('alternateLocale');
    expect(robots()).toEqual({ rules: { userAgent: '*', disallow: '/' } });
    expect(securityHeaders()).toContainEqual({
      source: '/:path*',
      headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
    });
  });

  it('preserves private page restrictions in production', () => {
    vi.stubEnv('NEXT_PUBLIC_DEPLOY_ENV', '');
    expect(pageMetadata({ ...meta, noindex: true }).robots).toEqual({ index: false, follow: true });
  });
});

describe('deployment isolation', () => {
  // Value: protects=play cannot target production domains or data; fails_when=preview routes, bindings or commerce point at production;
  // why_new=existing suites do not read Wrangler environment configuration; seam=none; no_claim=remote resources, secrets or deployed bindings.
  it('keeps production and preview domains, state and payments separate', () => {
    const parsed = ts.parseConfigFileTextToJson(
      'wrangler.jsonc',
      readFileSync(`${import.meta.dirname}/../wrangler.jsonc`, 'utf8'),
    );
    expect(parsed.error).toBeUndefined();
    const production = parsed.config;
    const preview = production.env.preview;
    expect(production.name).toBe('awaketab-site');
    expect(production.routes).toEqual([
      { pattern: 'awaketab.com', custom_domain: true },
      { pattern: 'www.awaketab.com', custom_domain: true },
    ]);
    expect(preview.name).toBe('awaketab-site-preview');
    expect(preview.routes).toEqual([{ pattern: 'play.awaketab.com', custom_domain: true }]);
    expect(production.services).toContainEqual({ binding: 'WORKER_SELF_REFERENCE', service: production.name });
    expect(preview.services).toContainEqual({ binding: 'WORKER_SELF_REFERENCE', service: preview.name });
    expect(production.vars).toMatchObject({
      PUBLIC_SITE_URL: 'https://awaketab.com',
      PUBLIC_POLAR_SERVER: 'production',
    });
    expect(preview.vars).toMatchObject({
      PUBLIC_SITE_URL: 'https://play.awaketab.com',
      PUBLIC_POLAR_SERVER: 'sandbox',
    });
    expect(preview.d1_databases[0]).toMatchObject({ binding: 'AUTH_DB', migrations_dir: 'migrations' });
    expect(preview.d1_databases[0].database_id).toMatch(/^[\da-f-]{36}$/u);
    expect(preview.d1_databases[0].database_id).not.toBe(production.d1_databases[0].database_id);
    expect(preview.kv_namespaces[0].binding).toBe('LICENSES');
    expect(preview.kv_namespaces[0].id).toMatch(/^[\da-f]{32}$/u);
    expect(preview.kv_namespaces[0].id).not.toBe(production.kv_namespaces[0].id);
    expect(preview.analytics_engine_datasets[0].binding).toBe('EVENTS');
    expect(preview.analytics_engine_datasets[0].dataset).toBe('awaketab_events_preview');
    expect(preview.analytics_engine_datasets[0].dataset).not.toBe(production.analytics_engine_datasets[0].dataset);
  });
});
