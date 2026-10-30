import type { Metadata } from 'next';
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

// Pages that exist in English only: the locale prefixes 404, as on the old site.
export async function englishOnly(params: Promise<{ locale: string }>): Promise<'en'> {
  const locale = await localeParam(params);
  if (locale !== 'en') notFound();
  return locale;
}

export interface IOgCard {
  kicker: string;
  title: string;
  sub?: string;
  scene?: TSceneKey;
  tone?: 'light' | 'dark';
}

// The social card in the style of the brand board: kicker, headline, line, scene, on paper or midnight.
export function ogImageUrl(card: IOgCard, locale: TLocale = 'en'): string {
  const q = new URLSearchParams({ k: card.kicker, t: card.title, m: card.tone ?? 'dark' });
  if (card.sub) q.set('d', card.sub);
  if (card.scene) q.set('s', card.scene);
  if (locale !== 'en') q.set('l', locale);
  return `/og?${q.toString()}`;
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
  const locale = meta.locale ?? 'en';
  const canonical = `${SITE}${meta.path === '/' ? '/' : meta.path}`;
  const alternates = meta.alternates && meta.alternates.length > 0 ? meta.alternates : [{ locale, hreflang: LOCALE_META[locale].hreflang, href: canonical }];
  const english = alternates.find((a) => a.locale === 'en');
  const image = ogImageUrl(meta.og, locale);
  return {
    title: { absolute: meta.title },
    description: meta.description,
    robots: meta.noindex ? { index: false, follow: true } : meta.article ? { 'max-image-preview': 'large' } : { index: true, follow: true },
    alternates: {
      canonical,
      ...(meta.noindex
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
      locale: LOCALE_META[locale].htmlLang.replace('-', '_'),
      ...(meta.noindex
        ? {}
        : {
            alternateLocale: alternates
              .filter((a) => a.locale !== locale)
              .map((a) => LOCALE_META[a.locale].htmlLang.replace('-', '_')),
          }),
      title: meta.title,
      description: meta.description,
      url: canonical,
      images: [{ url: image, width: 1200, height: 630, ...(meta.ogAlt ? { alt: meta.ogAlt } : {}) }],
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
        sameAs: ['https://github.com/SoubhikBiswas-gitHub/awaketab'],
      },
      {
        '@type': 'WebSite',
        '@id': `${SITE}/#website`,
        name: 'AwakeTab',
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
  breadcrumbs: Array<{ name: string; url: string }>;
}

const breadcrumbList = (items: Array<{ name: string; url: string }>): TSchemaNode => ({
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, index) => ({ '@type': 'ListItem', position: index + 1, name: item.name, item: item.url })),
});

export function articleSchema(input: IArticleSchemaInput): TSchemaNode {
  const article: TSchemaNode = {
    '@type': 'Article',
    headline: input.title,
    description: input.description,
    url: input.canonical,
    datePublished: input.published,
    dateModified: input.updated ?? input.published,
    inLanguage: LOCALE_META[input.locale].hreflang,
    // Google does not resolve an @id on another page, so the article names its author and publisher inline.
    author: { '@type': 'Person', '@id': `${SITE}/about#person`, name: 'Soubhik Biswas', url: `${SITE}/about` },
    publisher: { '@type': 'Organization', '@id': `${SITE}/#org`, name: 'AwakeTab', url: `${SITE}/` },
  };
  if (input.image) article.image = input.image;
  return { '@context': 'https://schema.org', '@graph': [article, breadcrumbList(input.breadcrumbs)] };
}

export function itemListSchema(name: string, items: Array<{ name: string; url: string }>): TSchemaNode {
  return {
    '@type': 'ItemList',
    name,
    numberOfItems: items.length,
    itemListElement: items.map((item, index) => ({ '@type': 'ListItem', position: index + 1, name: item.name, url: item.url })),
  };
}

export function withItemList(schema: TSchemaNode, name: string, items: Array<{ name: string; url: string }>): TSchemaNode {
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
