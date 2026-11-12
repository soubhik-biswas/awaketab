import { existsSync, readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { isLocale, LOCALES, type TLocale } from '@/i18n/locales';
import { findArticle } from '@/lib/content';
import { CONTENT_KINDS, MAKER_URL, panelHref, ROUTES, SOURCE_URL, toolHref, type TContentKind } from '@/lib/routes';
import { footGroups, supportLink, type IFootLink } from './links';
import { Maker, MAKER } from './maker';

type TTree = { [key: string]: string | TTree };

const SITE = `${import.meta.dirname}/../../..`;
const APP = `${SITE}/app`;

const foot = (locale: TLocale): TTree => {
  const all = JSON.parse(readFileSync(`${SITE}/messages/${locale}.json`, 'utf8')) as { site: { foot: TTree } };
  return all.site.foot;
};

const keys = (tree: TTree, prefix = ''): string[] =>
  Object.entries(tree).flatMap(([key, value]) =>
    typeof value === 'string' ? [`${prefix}${key}`] : keys(value, `${prefix}${key}.`),
  );

// A key's text, or nothing when the key is missing or holds a group.
function text(tree: TTree, path: string): string {
  const found = path
    .split('.')
    .reduce<string | TTree | undefined>((at, key) => (typeof at === 'object' ? at[key] : undefined), tree);
  return typeof found === 'string' ? found : '';
}

const isKind = (value: string): value is TContentKind => (CONTENT_KINDS as readonly string[]).includes(value);

// Says why a footer address leads nowhere, or nothing when a page answers it.
function broken(href: string): string | null {
  if (href.startsWith('https://'))
    return href.startsWith(SOURCE_URL) ? null : 'an outside address the site does not own';
  const [first = '', ...rest] = (href.split('?')[0] ?? '').split('/').filter(Boolean);
  const locale: TLocale = isLocale(first) ? first : 'en';
  const parts = isLocale(first) ? rest : [first, ...rest].filter(Boolean);
  if (parts.length === 0) return existsSync(`${APP}/[locale]/(home)/page.tsx`) ? null : 'no home page';
  const [kind = '', slug] = parts;
  if (parts.length === 2 && slug && isKind(kind)) return findArticle(kind, locale, slug) ? null : 'no such article';
  const file = `${APP}/[locale]/(site)/${parts.join('/')}/page.tsx`;
  if (!existsSync(file)) return 'no such page';
  return locale !== 'en' && readFileSync(file, 'utf8').includes('englishOnly(') ? 'an English-only page' : null;
}

const everyLink = (locale: TLocale): IFootLink[] => [
  ...footGroups(locale).flatMap((group) => group.links),
  supportLink(locale),
];

describe('the footer links', () => {
  it.each(LOCALES)('%s leads to pages that exist', (locale) => {
    const dead = everyLink(locale)
      .map((link) => [link.id, link.href, broken(link.href)] as const)
      .filter(([, , why]) => why !== null);
    expect(dead).toEqual([]);
    expect(broken(toolHref(locale))).toBeNull();
    expect(broken(panelHref('feedback', locale))).toBeNull();
  });

  it('serves the feed it points to', () => {
    expect(existsSync(`${APP}${ROUTES.rss}/route.ts`)).toBe(true);
  });

  it.each(LOCALES)('%s marks the links that leave its language', (locale) => {
    for (const link of everyLink(locale)) {
      const prefixed = locale !== 'en' && (link.href === `/${locale}` || link.href.startsWith(`/${locale}/`));
      if (locale === 'en' || link.external) continue;
      expect([link.id, link.english === true]).toEqual([link.id, !prefixed && !link.href.startsWith(`/${locale}?`)]);
    }
  });

  it('keeps the five groups and their order', () => {
    expect(footGroups('en').map((group) => [group.id, group.links.map((link) => link.id)])).toEqual([
      ['product', ['timer', 'faces', 'vibes', 'extension', 'embed', 'kiosk', 'library']],
      ['uses', ['cooking', 'presenting', 'dashboards', 'nightdesk', 'allUses']],
      ['devices', ['support', 'deviceGuides', 'compare']],
      ['learn', ['help', 'guides', 'how', 'faq', 'changelog']],
      ['company', ['about', 'github', 'roadmap', 'privacy', 'terms']],
    ]);
  });
});

describe('the footer words', () => {
  const english = keys(foot('en')).sort();

  it.each(LOCALES)('%s has every footer key and nothing else', (locale) => {
    const tree = foot(locale);
    expect(keys(tree).sort()).toEqual(english);
    for (const key of english) expect([key, text(tree, key).trim().length > 0]).toEqual([key, true]);
  });

  it.each(LOCALES)('%s names every group and link', (locale) => {
    const tree = foot(locale);
    for (const group of footGroups(locale)) {
      expect(text(tree, `groups.${group.id}`)).not.toBe('');
      for (const link of group.links) expect(text(tree, `links.${link.id}`)).not.toBe('');
    }
  });

  it.each(LOCALES)('%s keeps the heart, the name and the accent word in place', (locale) => {
    const tree = foot(locale);
    expect(text(tree, 'made')).toMatch(/<heart>[^<]+<\/heart>/u);
    expect(text(tree, 'made')).toContain('<name></name>');
    expect(text(tree, 'made')).not.toContain(MAKER);
    expect(text(tree, 'headline')).toMatch(/<accent>[^<]+<\/accent>/u);
    expect(text(tree, 'makerLink')).toContain('{name}');
    expect(text(tree, 'copyright')).toContain('{year}');
  });
});

describe('the maker name', () => {
  it('links to the profile when one is set', () => {
    const html = renderToStaticMarkup(
      <Maker url="https://example.com/in/someone/" label="Soubhik Biswas on LinkedIn" />,
    );
    expect(html).toBe(
      '<a class="site-foot-maker" href="https://example.com/in/someone/" rel="noopener me" target="_blank" aria-label="Soubhik Biswas on LinkedIn">Soubhik Biswas</a>',
    );
  });

  it('is plain bold text while no profile is set', () => {
    const html = renderToStaticMarkup(<Maker url="" label="Soubhik Biswas on LinkedIn" />);
    expect(html).toBe('<strong class="site-foot-maker">Soubhik Biswas</strong>');
  });

  it('points at the profile the site publishes', () => {
    expect(MAKER_URL).toBe('https://www.linkedin.com/in/biswas-soubhik/');
  });
});
