import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import ratings from '../../../../../data/ratings.json';
import { Block, Callout, Cards, Cta, Faq, Note, Steps, type ICard } from '@/components/site/blocks';
import { FacesGallery } from '@/components/site/faces-gallery';
import { JsonLd } from '@/components/site/json-ld';
import { LOCALE_META, localePath, type TLocale } from '@/i18n/locales';
import { articleIn, articlePath, type TSceneKey } from '@/lib/content';
import { startHref } from '@/lib/routes';
import { homeSchema, localeParam, pageMetadata } from '@/lib/seo';

const USES: ReadonlyArray<readonly [slug: string, key: string, scene: TSceneKey]> = [
  ['cooking', 'cooking', 'cooking'],
  ['presentations', 'presenting', 'presenting'],
  ['dashboards', 'dashboards', 'dashboard'],
  ['reading', 'nightdesk', 'nightdesk'],
];

const FACES = ['aurora', 'liquid', 'eclipse', 'skeleton', 'neon', 'halo'] as const;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const locale = await localeParam(params);
  const tp = await getTranslations({ locale, namespace: 'page' });
  const ts = await getTranslations({ locale, namespace: 'site' });
  return pageMetadata({
    title: tp('home.title'),
    description: tp('home.description'),
    path: localePath(locale, '/'),
    locale,
    noindex: !LOCALE_META[locale].reviewed,
    og: {
      kicker: ts('home.og.kicker'),
      title: ts('home.og.title'),
      sub: ts('home.og.sub'),
      scene: 'hero',
      tone: 'dark',
    },
  });
}

// The story below the tool (home board): faces, use cases, how it works, the honest limit, questions, closing call.
export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const locale: TLocale = await localeParam(params);
  const english = locale === 'en';
  const t = await getTranslations({ locale, namespace: 'site' });
  const tc = await getTranslations({ locale, namespace: 'content' });
  const cards: ICard[] = USES.map(([slug, key, scene]) => {
    const translated = !english && articleIn('for', slug, locale) !== undefined;
    return {
      href: translated ? articlePath('for', slug, locale) : `/for/${slug}`,
      ...(english || translated ? {} : { lang: 'en' }),
      title: t(`home.uses.${key}._`),
      desc: t(`home.uses.${key}.body`),
      scene,
      link: t(`home.uses.${key}.link`),
    };
  });
  const faces = FACES.map((id) => ({
    id,
    name: t(`home.faces.items.${id}.name`),
    desc: t(`home.faces.items.${id}.body`),
  }));
  const steps = [1, 2, 3].map((n) => ({ title: t(`home.how.${String(n)}._`), body: t(`home.how.${String(n)}.body`) }));
  const faq = [1, 2, 3, 4].map((n) => ({ q: t(`home.faq.${String(n)}._`), a: t(`home.faq.${String(n)}.a`) }));
  return (
    <>
      <JsonLd schema={homeSchema(locale, ratings)} />
      {!english && !LOCALE_META[locale].reviewed && (
        <Block label={tc('translation.pending')}>
          <Note>
            <span role="note" data-translation-pending="">
              {tc('translation.pending')}{' '}
              <a href="/" hrefLang="en" className="text-link underline underline-offset-2">
                {tc('translation.original')}
              </a>
            </span>
          </Note>
        </Block>
      )}
      <Block id="home-faces" h={t('home.faces.title')} sub={t('home.faces.sub')}>
        <FacesGallery items={faces} />
      </Block>
      <Block id="home-uses" h={t('home.uses.title')}>
        <Cards items={cards} cols={4} />
      </Block>
      <Block id="home-how" h={t('home.how.title')}>
        <Steps items={steps} />
      </Block>
      <Block label={t('home.limits.title')}>
        <Callout tone="info" title={t('home.limits.title')}>
          {t('home.limits.body')}
        </Callout>
      </Block>
      <Block id="home-faq" h={tc('faq')}>
        <Faq items={faq} />
      </Block>
      <Block label={t('cta.label')}>
        <Cta
          title={t('cta.title')}
          desc={t('cta.desc')}
          href={startHref('p60', 'standard', locale)}
          label={t('home.cta')}
        />
      </Block>
    </>
  );
}
