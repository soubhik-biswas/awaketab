import type { Metadata, Viewport } from 'next';
import { notFound } from 'next/navigation';
import { hasLocale } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { LOCALE_META, type TLocale } from '@/i18n/locales';
import { routing } from '@/i18n/routing';
import type { IAlternate, TSceneKey } from '@/lib/content';
import { SITE } from '@/lib/routes';

export type TSchemaNode = Record<string, unknown>;

// Every page reads its locale the same way and turns on static rendering for it.
export async function localeParam(params: Promise<{ locale: string }>): Promise<TLocale> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  return locale;
}

// Pages that exist in English only: the locale prefixes 404, so no language serves an untranslated copy.
export async function englishOnly(params: Promise<{ locale: string }>): Promise<'en'> {
  const locale = await localeParam(params);
  if (locale !== 'en') notFound();
  return locale;
}

// The share images of the marketing board: five fixed files in public/og, and three templates the /og route draws
// per page from its H1 (use case on porcelain, guide on graphite, shared link with its clock).
type TOgImage = 'og-01' | 'og-02' | 'og-03' | 'og-04' | 'og-08';
type TOgTemplate = 'use' | 'guide' | 'shared';

export interface IOgCard {
  image?: TOgImage;
  template?: TOgTemplate;
  alt?: string;
  kicker?: string;
  title?: string;
  sub?: string;
  scene?: TSceneKey;
  face?: string;
  minutes?: number;
  // Older callers name a tone: light draws the use-case template, dark the guide template.
  tone?: 'light' | 'dark';
}

const OG_SIZE = { width: 1200, height: 630 } as const;

// Open Graph wants language_TERRITORY; Spanish is the neutral Latin American edition (docs/07 §1).
const OG_LOCALE: Record<TLocale, string> = {
  en: 'en_US',
  es: 'es_LA',
  'pt-br': 'pt_BR',
  de: 'de_DE',
  fr: 'fr_FR',
  ja: 'ja_JP',
  zh: 'zh_CN',
  hi: 'hi_IN',
};

// The head icons and both theme colours from the marketing board, shared by every locale layout.
export const SITE_ICONS: NonNullable<Metadata['icons']> = {
  icon: [
    { url: '/favicon.ico', sizes: 'any' },
    { url: '/favicon.svg', type: 'image/svg+xml' },
    { url: '/icons/favicon-16.png', sizes: '16x16', type: 'image/png' },
    { url: '/icons/favicon-32.png', sizes: '32x32', type: 'image/png' },
    { url: '/icons/favicon-48.png', sizes: '48x48', type: 'image/png' },
  ],
  apple: [{ url: '/icons/apple-touch-icon-180.png', sizes: '180x180' }],
};

export const SITE_VIEWPORT: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#05060A' },
    { media: '(prefers-color-scheme: light)', color: '#F4F4F9' },
  ],
};

export function ogImageUrl(card: IOgCard, locale: TLocale = 'en'): string {
  if (card.image || !card.title) return `/og/${card.image ?? 'og-01'}.png`;
  const template = card.template ?? (card.tone === 'light' ? 'use' : 'guide');
  const q = new URLSearchParams({ v: template, h: card.title });
  if (card.kicker) q.set('k', card.kicker);
  if (card.sub) q.set('d', card.sub);
  if (card.scene) q.set('s', card.scene);
  if (card.face) q.set('f', card.face);
  if (card.minutes !== undefined) q.set('n', String(card.minutes));
  if (locale !== 'en') q.set('l', locale);
  return `/og?${q.toString()}`;
}

const SUFFIX = ' · AwakeTab';
const BRAND = /awaketab/iu;
const WRITTEN_SUFFIX = / [—·] AwakeTab$/u;

const fits = (text: string): boolean => text.length + SUFFIX.length < 60;

// A title that already names AwakeTab stands alone (docs/06 §4); every other one takes the suffix.
const withBrand = (text: string): string | null => {
  if (BRAND.test(text)) return text.length < 60 ? text : null;
  return fits(text) ? text + SUFFIX : null;
};

// The longest run of whole words that still fits, so a title never stops in the middle of a phrase.
function wholeWords(text: string): string {
  const words = text.split(/\s+/u);
  let out = '';
  for (const word of words) {
    const next = out ? `${out} ${word}` : word;
    if (!fits(next)) break;
    out = next;
  }
  return (out || text.slice(0, 48)).replace(/[\s,;:–—-]+$/u, '');
}

// "{H1} · AwakeTab" under 60 characters (brief §9h). A long H1 gives way to the page's hand-written title, then to
// its clause before a colon or question mark, then to its short crumb.
export function titleFor(h1: string, short?: string, written?: string): string {
  const clean = h1.trim().replace(/[.!]$/u, '');
  const stem = written?.trim().replace(WRITTEN_SUFFIX, '');
  const clause = clean.split(/[:?]\s/u)[0]?.trim() ?? clean;
  const candidates = [clean, stem, clause.split(/\s+/u).length > 2 ? clause : undefined, short];
  for (const candidate of candidates) {
    const title = candidate ? withBrand(candidate) : null;
    if (title) return title;
  }
  return wholeWords(clean) + SUFFIX;
}

export interface IPageMeta {
  title: string;
  description: string;
  path: string;
  locale?: TLocale;
  noindex?: boolean;
  article?: boolean;
  alternates?: readonly IAlternate[];
  og: IOgCard;
  ogAlt?: string;
}

export function pageMetadata(meta: IPageMeta): Metadata {
  const noindex = meta.noindex || process.env.NEXT_PUBLIC_DEPLOY_ENV === 'play';
  const locale = meta.locale ?? 'en';
  const canonical = `${SITE}${meta.path === '/' ? '/' : meta.path}`;
  const alternates =
    meta.alternates && meta.alternates.length > 0
      ? meta.alternates
      : [{ locale, hreflang: LOCALE_META[locale].hreflang, href: canonical }];
  const english = alternates.find((a) => a.locale === 'en');
  const image = {
    url: ogImageUrl(meta.og, locale),
    ...OG_SIZE,
    alt: meta.og.alt ?? meta.ogAlt ?? meta.og.title ?? meta.title,
  };
  return {
    title: { absolute: meta.title },
    description: meta.description,
    robots: noindex
      ? { index: false, follow: true }
      : meta.article
        ? { 'max-image-preview': 'large' }
        : { index: true, follow: true },
    alternates: {
      canonical,
      ...(noindex
        ? {}
        : {
            languages: {
              ...Object.fromEntries(alternates.map((a) => [a.hreflang, a.href])),
              'x-default': english?.href ?? canonical,
            },
          }),
    },
    openGraph: {
      type: meta.article ? 'article' : 'website',
      siteName: 'AwakeTab',
      locale: OG_LOCALE[locale],
      ...(noindex
        ? {}
        : {
            alternateLocale: alternates.filter((a) => a.locale !== locale).map((a) => OG_LOCALE[a.locale]),
          }),
      title: meta.title,
      description: meta.description,
      url: canonical,
      images: [image],
    },
    twitter: { card: 'summary_large_image', title: meta.title, description: meta.description, images: [image] },
  };
}

export interface IRatingsSummary {
  count: number;
  average: number;
}

export function homeSchema(locale: TLocale, ratings: IRatingsSummary): TSchemaNode {
  const application: TSchemaNode = {
    '@type': 'WebApplication',
    '@id': `${SITE}/#app`,
    name: 'AwakeTab',
    url: `${SITE}/`,
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: 'Any',
    browserRequirements: 'Requires a browser with Screen Wake Lock API support or the video fallback',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    inLanguage: LOCALE_META[locale].hreflang,
  };
  if (ratings.count >= 25) {
    application.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: ratings.average,
      ratingCount: ratings.count,
      bestRating: 5,
      worstRating: 1,
    };
  }
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${SITE}/#org`,
        name: 'AwakeTab',
        url: `${SITE}/`,
        logo: { '@type': 'ImageObject', url: `${SITE}/icons/icon-512.png`, width: 512, height: 512 },
        founder: { '@id': `${SITE}/about#person` },
        sameAs: ['https://github.com/soubhik-biswas/awaketab'],
      },
      {
        '@type': 'WebSite',
        '@id': `${SITE}/#website`,
        name: 'AwakeTab',
        alternateName: ['Awake Tab', 'awaketab.com'],
        url: `${SITE}/`,
        publisher: { '@id': `${SITE}/#org` },
        inLanguage: LOCALE_META[locale].hreflang,
      },
      application,
    ],
  };
}

export interface IArticleSchemaInput {
  canonical: string;
  title: string;
  description: string;
  locale: TLocale;
  published: string;
  updated?: string;
  image?: string;
  faq?: Array<{ q: string; a: string }>;
  breadcrumbs: Array<{ name: string; url: string }>;
}

// Search engines reject a date without a time zone, so a plain day becomes midnight UTC.
export function schemaDate(value: string | Date): string {
  if (value instanceof Date) return value.toISOString();
  if (/^\d{4}-\d{2}-\d{2}$/u.test(value)) return `${value}T00:00:00+00:00`;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toISOString();
}

// Answers are written with inline Markdown; structured data wants the words alone.
const plainText = (value: string): string =>
  value
    .replace(/\[([^\]]+)\]\([^)]+\)/gu, '$1')
    .replace(/[*_`]/gu, '')
    .replace(/\s+/gu, ' ')
    .trim();

const faqPage = (items: Array<{ q: string; a: string }>): TSchemaNode => ({
  '@type': 'FAQPage',
  mainEntity: items.map((item) => ({
    '@type': 'Question',
    name: plainText(item.q),
    acceptedAnswer: { '@type': 'Answer', text: plainText(item.a) },
  })),
});

const breadcrumbList = (items: Array<{ name: string; url: string }>): TSchemaNode => ({
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: item.url,
  })),
});

export function articleSchema(input: IArticleSchemaInput): TSchemaNode {
  const article: TSchemaNode = {
    '@type': 'Article',
    headline: input.title,
    description: input.description,
    url: input.canonical,
    datePublished: schemaDate(input.published),
    dateModified: schemaDate(input.updated ?? input.published),
    inLanguage: LOCALE_META[input.locale].hreflang,
    // Google does not resolve an @id on another page, so the article names its author and publisher inline.
    author: { '@type': 'Person', '@id': `${SITE}/about#person`, name: 'Soubhik Biswas', url: `${SITE}/about` },
    publisher: { '@type': 'Organization', '@id': `${SITE}/#org`, name: 'AwakeTab', url: `${SITE}/` },
  };
  article.image = input.image ?? `${SITE}/og/og-01.png`;
  const graph = [article, breadcrumbList(input.breadcrumbs)];
  if (input.faq && input.faq.length > 0) graph.push(faqPage(input.faq));
  return { '@context': 'https://schema.org', '@graph': graph };
}

function itemListSchema(name: string, items: Array<{ name: string; url: string }>): TSchemaNode {
  return {
    '@type': 'ItemList',
    name,
    numberOfItems: items.length,
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      url: item.url,
    })),
  };
}

export function withItemList(
  schema: TSchemaNode,
  name: string,
  items: Array<{ name: string; url: string }>,
): TSchemaNode {
  return { ...schema, '@graph': [...(schema['@graph'] as TSchemaNode[]), itemListSchema(name, items)] };
}

export function personSchema(): TSchemaNode {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Person',
        '@id': `${SITE}/about#person`,
        name: 'Soubhik Biswas',
        url: `${SITE}/about`,
        worksFor: { '@id': `${SITE}/#org` },
      },
    ],
  };
}

export interface ISoftwareSchemaInput {
  canonical: string;
  name: string;
  description: string;
  operatingSystem: string;
  breadcrumbs: Array<{ name: string; url: string }>;
}

export function softwareSchema(input: ISoftwareSchemaInput): TSchemaNode {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'SoftwareApplication',
        name: input.name,
        description: input.description,
        url: input.canonical,
        applicationCategory: 'UtilitiesApplication',
        operatingSystem: input.operatingSystem,
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        publisher: { '@id': `${SITE}/#org` },
      },
      breadcrumbList(input.breadcrumbs),
    ],
  };
}
