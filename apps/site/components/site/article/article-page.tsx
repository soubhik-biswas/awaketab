import { BadgeCheck, CalendarCheck, Clock, Languages } from 'lucide-react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { LOCALE_META, localePath, type TLocale } from '@/i18n/locales';
import {
  alternatesFor,
  articleIn,
  articlePath,
  findArticle,
  HUBS,
  isIndexable,
  translationsOf,
  useCaseScene,
  type TArticle,
  type TSceneKey,
} from '@/lib/content';
import { fullDate } from '@/lib/dates';
import { inline } from '@/lib/markdown';
import { SITE, startHref, type TContentKind } from '@/lib/routes';
import { articleSchema, ogImageUrl, pageMetadata, titleFor, type IOgCard } from '@/lib/seo';
import { AdSlot } from '../ad-slot';
import { EndsAt } from '../ends-at';
import { Block, Callout, Cards, Faq, Note, type ICard } from '../blocks';
import { JsonLd } from '../json-ld';
import { LocaleLinks } from '../locale-links';
import { HeroButtons, PageHero, type ICrumb } from '../page-hero';
import { ToolSlot } from '../tool-slot';
import { ArticleBody } from './parts';

const PRESET_MINUTES: Record<string, number | null> = {
  p15: 15,
  p30: 30,
  p45: 45,
  p60: 60,
  p120: 120,
  p240: 240,
  custom: 480,
  pinf: null,
  until: null,
};

// docs/06 §10: the down-link names the duration it starts ("Start a 30-minute session"); English only.
const PRESET_WORDS: Partial<Record<string, string>> = {
  p15: '15-minute',
  p30: '30-minute',
  p45: '45-minute',
  p60: '1-hour',
  p120: '2-hour',
  p240: '4-hour',
};

// Use cases share on the porcelain use-case card; guides, devices, comparisons and docs on the graphite guide card.
const OG_TEMPLATE: Record<TContentKind, 'use' | 'guide'> = {
  for: 'use',
  on: 'guide',
  vs: 'guide',
  guides: 'guide',
  learn: 'guide',
};

// Every family draws a scene on its share card, as the marketing board's templates do.
const OG_SCENE: Record<TContentKind, TSceneKey> = {
  for: 'hero',
  on: 'firstaction',
  vs: 'conflict',
  guides: 'maintenance',
  learn: 'history',
};

const heroScene = (kind: TContentKind, enSlug: string): TSceneKey | undefined =>
  kind === 'for' ? useCaseScene(enSlug) : kind === 'on' ? 'firstaction' : kind === 'guides' ? 'maintenance' : undefined;

async function eyebrowFor(a: TArticle, locale: TLocale): Promise<string> {
  const tc = await getTranslations({ locale, namespace: 'content' });
  if (locale !== 'en' || (a.kind === 'for' && !a.crumb)) return tc(`family.${a.kind}`);
  const ts = await getTranslations({ locale, namespace: 'site' });
  return ts(`article.eyebrow.${a.kind}`, { crumb: a.crumb ?? a.h1, n: a.minutes || 1 });
}

async function articleOg(a: TArticle): Promise<IOgCard> {
  return {
    template: OG_TEMPLATE[a.kind],
    kicker: await eyebrowFor(a, a.locale),
    title: a.ogTitle ?? a.h1,
    scene: heroScene(a.kind, a.enSlug) ?? OG_SCENE[a.kind],
    alt: a.h1,
  };
}

function resolve(kind: TContentKind, locale: string, slug: string): TArticle {
  const a = findArticle(kind, locale as TLocale, decodeURIComponent(slug));
  if (!a) notFound();
  return a;
}

export async function articleMetadata(kind: TContentKind, locale: string, slug: string): Promise<Metadata> {
  const a = resolve(kind, locale, slug);
  const og = await articleOg(a);
  const indexable = isIndexable(a);
  return pageMetadata({
    title: titleFor(a.h1, a.crumb, a.title),
    description: a.description,
    path: articlePath(kind, a.enSlug, a.locale),
    locale: a.locale,
    noindex: !indexable,
    article: true,
    alternates: indexable ? alternatesFor(kind, a.enSlug, a.locale) : [],
    og,
    ogAlt: a.h1,
  });
}

interface IRelated {
  href: string;
  label: string;
  desc?: string;
  lang?: string;
}

async function relatedLinks(a: TArticle): Promise<IRelated[]> {
  const tp = await getTranslations({ locale: 'en', namespace: 'page' });
  const sitePage = (key: 'embed' | 'extension' | 'kiosk' | 'library' | 'pro' | 'about') => ({
    label: tp(`${key}.h1`),
    desc: tp(`${key}.description`),
  });
  const SITE_PAGES: Record<string, { label: string; desc: string }> = {
    '/embed': sitePage('embed'),
    '/extension': sitePage('extension'),
    '/kiosk': sitePage('kiosk'),
    '/library': sitePage('library'),
    '/pro': sitePage('pro'),
    '/about': sitePage('about'),
  };
  return a.related.map((href) => {
    const [, kind = '', enSlug = ''] = href.split('/');
    const known = (['for', 'on', 'vs', 'guides', 'learn'] as const).find((k) => k === kind);
    const source = known ? articleIn(known, enSlug, 'en') : undefined;
    const page = SITE_PAGES[href];
    const fallback = page?.label ?? href.replace(/^\//u, '').replaceAll('/', ' · ').replaceAll('-', ' ');
    const desc = source?.description ?? page?.desc;
    const withDesc = desc ? { desc } : {};
    if (a.locale === 'en') return { href, label: source?.h1 ?? fallback, ...withDesc };
    const same = known ? articleIn(known, enSlug, a.locale) : undefined;
    if (same && known) return { href: articlePath(known, enSlug, a.locale), label: same.h1, desc: same.description };
    return { href, label: `${source?.h1 ?? fallback} (${LOCALE_META.en.label})`, lang: 'en', ...withDesc };
  });
}

// One template for every article family: hero, the tool where the board puts it, the body, the honest limit,
// questions and related pages (docs/06 §24, content-page board).
export async function ArticlePage({
  kind,
  locale: rawLocale,
  slug,
}: {
  kind: TContentKind;
  locale: string;
  slug: string;
}) {
  const a = resolve(kind, rawLocale, slug);
  const locale = a.locale;
  const english = locale === 'en';
  const t = await getTranslations({ locale, namespace: 'content' });
  const ts = await getTranslations({ locale, namespace: 'site' });
  const tp = await getTranslations({ locale, namespace: 'tool' });
  const path = articlePath(kind, a.enSlug, locale);
  const canonical = `${SITE}${path}`;
  const hub = HUBS[kind];
  const homeHref = localePath(locale, '/');
  const crumbLabel = a.crumb ?? a.h1;
  const crumbs: ICrumb[] = english
    ? [{ href: `/${kind}`, label: hub.crumb }, { label: crumbLabel }]
    : [{ href: homeHref, label: 'AwakeTab' }, { label: crumbLabel }];
  const breadcrumbs = english
    ? [
        { name: 'AwakeTab', url: SITE },
        { name: hub.crumb, url: `${SITE}/${kind}` },
        { name: crumbLabel, url: canonical },
      ]
    : [
        { name: 'AwakeTab', url: `${SITE}${homeHref}` },
        { name: crumbLabel, url: canonical },
      ];
  const minutes = PRESET_MINUTES[a.preset] ?? null;
  const href = startHref(a.preset, a.mode, locale);
  const words = english ? PRESET_WORDS[a.preset] : undefined;
  const startLabel = words ? `Start a ${words} session` : t('start');
  const scene = heroScene(kind, a.enSlug);
  const translations = translationsOf(kind, a.enSlug);
  const related = await relatedLinks(a);
  const relatedCards: ICard[] = related.map((r) => ({
    href: r.href,
    title: r.label,
    ...(r.desc ? { desc: r.desc } : {}),
    link: ts('article.read'),
    ...(r.lang ? { lang: r.lang, titleLang: r.lang } : {}),
  }));
  const toolCopy = kind === 'guides' ? 'skip' : 'try';
  const toolFirst = kind === 'for';
  const verified = a.lastVerified ? fullDate(a.lastVerified, locale) : null;
  const updated = verified ? null : fullDate(a.updated ?? a.published, locale);
  const stale = a.lastVerified !== undefined && Date.now() - Date.parse(a.lastVerified) > 180 * 86_400_000;
  const heroAction =
    kind === 'on'
      ? { href: homeHref, label: ts('article.open') }
      : kind === 'guides'
        ? { href, label: startLabel }
        : undefined;
  const ends = minutes ? ts('tool.ends', { time: '{time}' }) : ts('tool.noEnd');
  const tool = (
    <Block id="s-tool" label={t(`${toolCopy}.title`)}>
      <ToolSlot
        preset={a.preset}
        mode={a.mode}
        face={a.mode === 'cook' ? 'bold' : 'ring'}
        minutes={minutes}
        eyebrow={ts('tool.eyebrow')}
        title={t(`${toolCopy}.title`)}
        desc={
          <>
            <span dangerouslySetInnerHTML={{ __html: inline(a.toolNote ?? t(`${toolCopy}.body`)) }} />{' '}
            {minutes ? (
              <EndsLine
                template={ends}
                minutes={minutes}
                locale={locale}
                tomorrow={tp('when.tomorrow', { time: '{time}' })}
              />
            ) : (
              ends
            )}
          </>
        }
        href={href}
        label={startLabel}
      />
    </Block>
  );
  const ad = <AdSlot label={t('ad')} note={ts('tool.adNote')} />;
  return (
    <>
      <LocaleLinks links={translations} />
      <JsonLd
        schema={articleSchema({
          canonical,
          title: a.h1,
          description: a.description,
          locale,
          published: a.published,
          image: `${SITE}${ogImageUrl(await articleOg(a), locale)}`,
          ...(a.updated ? { updated: a.updated } : {}),
          ...(a.faq.length > 0 ? { faq: a.faq } : {}),
          breadcrumbs,
        })}
      />
      <PageHero
        crumbs={crumbs}
        crumbLabel={t('breadcrumb')}
        eyebrow={await eyebrowFor(a, locale)}
        h1={a.h1}
        {...(a.lead ? { lead: <span dangerouslySetInnerHTML={{ __html: inline(a.lead) }} /> } : {})}
        {...(scene ? { scene } : {})}
        meta={
          <>
            {verified && (
              <span className="inline-flex items-center gap-1.5">
                <BadgeCheck className="size-4" aria-hidden="true" />
                {t('verified', { date: verified })}
              </span>
            )}
            {updated && (
              <span className="inline-flex items-center gap-1.5">
                <CalendarCheck className="size-4" aria-hidden="true" />
                {t('updated', { date: updated })}
              </span>
            )}
            {a.minutes > 0 && (
              <span className="inline-flex items-center gap-1.5">
                <Clock className="size-4" aria-hidden="true" />
                {t('readTime', { n: a.minutes })}
              </span>
            )}
            <span>{t('byline', { name: 'Soubhik Biswas' })}</span>
            {stale && <span className="text-warning">{t('stale')}</span>}
            {!english && !a.reviewed && (
              <span role="note" className="inline-flex basis-full items-start gap-1.5" data-translation-pending="">
                <Languages className="mt-0.5 size-4 flex-none" aria-hidden="true" />
                <span>
                  {t('translation.pending')}{' '}
                  {translations.en && (
                    <a href={translations.en} hrefLang="en" className="text-link underline underline-offset-2">
                      {t('translation.original')}
                    </a>
                  )}
                </span>
              </span>
            )}
          </>
        }
        actions={heroAction ? <HeroButtons primary={heroAction} /> : undefined}
      />
      {toolFirst && tool}
      {toolFirst && ad}
      <ArticleBody a={a} t={t} tp={tp} />
      <Block id="s-limit" label={t('limit')}>
        <Callout tone="info" title={t('limit')} as="aside">
          {a.honestLimit}
        </Callout>
      </Block>
      {!toolFirst && tool}
      {!toolFirst && ad}
      <Block id="faq" h={t('faq')}>
        <Faq items={a.faq.map((f) => ({ q: f.q, a: <span dangerouslySetInnerHTML={{ __html: inline(f.a) }} /> }))} />
      </Block>
      {relatedCards.length > 0 && (
        <Block id="s-related" h={kind === 'for' ? t('related.for') : t('related._')}>
          <Cards items={relatedCards} cols={2} />
        </Block>
      )}
      <Block label={t('author.about')}>
        <Note>
          <strong className="text-foreground">Soubhik Biswas</strong> · {t('author.role')}{' '}
          {verified ? `${t('verified', { date: verified })}. ` : null}
          <a href="/about" className="text-link underline underline-offset-2">
            {t('author.about')}
          </a>
        </Note>
      </Block>
    </>
  );
}

function EndsLine({
  template,
  minutes,
  locale,
  tomorrow,
}: {
  template: string;
  minutes: number;
  locale: TLocale;
  tomorrow: string;
}) {
  const [before = '', after = ''] = template.split('{time}');
  return (
    <span>
      {before}
      <EndsAt minutes={minutes} locale={LOCALE_META[locale].htmlLang} tomorrow={tomorrow} fallback="…" />
      {after}
    </span>
  );
}
