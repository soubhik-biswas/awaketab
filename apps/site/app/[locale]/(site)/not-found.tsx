import type { Metadata } from 'next';
import { getLocale, getTranslations } from 'next-intl/server';
import { Block, Cards, type ICard } from '@/components/site/blocks';
import { SystemPage, systemMetadata } from '@/components/site/system-page';
import { localePath, type TLocale } from '@/i18n/locales';
import { articleIn, articlePath } from '@/lib/content';
import { ROUTES, toolHref, type TContentKind } from '@/lib/routes';
import { titleFor } from '@/lib/seo';

// The three guides every language has, so a lost visitor lands on a page they can read.
const POPULAR: ReadonlyArray<readonly [TContentKind, string]> = [
  ['for', 'cooking'],
  ['on', 'iphone-safari'],
  ['for', 'presentations'],
];

export async function generateMetadata(): Promise<Metadata> {
  const locale = (await getLocale()) as TLocale;
  const t = await getTranslations({ locale, namespace: 'site.sys.notfound' });
  return { ...systemMetadata(t('h1'), t('description'), '/404', locale), alternates: {} };
}

// The browser draws this page from the missing page's own data, which has no title, so the page carries its own.
export default async function NotFound() {
  const locale = (await getLocale()) as TLocale;
  const t = await getTranslations({ locale, namespace: 'site' });
  const guides: ICard[] = POPULAR.flatMap(([kind, slug]) => {
    const a = articleIn(kind, slug, locale) ?? articleIn(kind, slug, 'en');
    if (!a) return [];
    const foreign = a.locale !== locale;
    return [
      {
        href: articlePath(kind, slug, a.locale),
        title: a.h1,
        desc: a.description,
        link: t('article.read'),
        ...(foreign ? { lang: a.locale, titleLang: a.locale } : {}),
      },
    ];
  });
  const help: ICard = {
    href: ROUTES.help,
    title: t('foot.help'),
    desc: t('sys.notfound.help'),
    link: t('sys.help'),
    ...(locale === 'en' ? {} : { lang: 'en' }),
  };
  return (
    <>
      <title>{titleFor(t('sys.notfound.h1'))}</title>
      <SystemPage
        eyebrow={t('sys.notfound.eyebrow')}
        h1={t('sys.notfound.h1')}
        lead={t('sys.notfound.lead')}
        scene="notfound"
        primary={{ href: toolHref(locale), label: t('cta._') }}
        secondary={{ href: localePath(locale, '/'), label: t('sys.home') }}
      />
      <Block id="nf-guides" h={t('sys.notfound.guides')}>
        <Cards cols={2} items={[...guides, help]} />
      </Block>
    </>
  );
}
