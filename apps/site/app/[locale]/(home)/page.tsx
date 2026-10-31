import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import ratings from '../../../../../data/ratings.json';
import { Note } from '@/components/site/blocks';
import { Bento } from '@/components/site/home/bento';
import { FacesMarquee } from '@/components/site/home/faces-marquee';
import { FinalCta } from '@/components/site/home/final-cta';
import { HowItWorks } from '@/components/site/home/how-it-works';
import { MadeFor } from '@/components/site/home/made-for';
import { Questions } from '@/components/site/home/questions';
import { Vibes } from '@/components/site/home/vibes';
import { JsonLd } from '@/components/site/json-ld';
import { pad } from '@/components/site/styles';
import { LOCALE_META, localePath, type TLocale } from '@/i18n/locales';
import { homeSchema, localeParam, pageMetadata } from '@/lib/seo';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const locale = await localeParam(params);
  const t = await getTranslations({ locale, namespace: 'page.home' });
  return pageMetadata({
    title: t('title'),
    description: t('description'),
    path: localePath(locale, '/'),
    locale,
    noindex: !LOCALE_META[locale].reviewed,
    og: { image: 'og-01', alt: t('ogAlt') },
  });
}

// The story below the tool, in the home board's order: faces, vibes, the bento, how it works, use cases,
// questions and the closing call.
export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const locale: TLocale = await localeParam(params);
  const tc = await getTranslations({ locale, namespace: 'content' });
  return (
    <>
      <JsonLd schema={homeSchema(locale, ratings)} />
      {locale !== 'en' && !LOCALE_META[locale].reviewed && (
        <div className={pad}>
          <Note>
            <span role="note" data-translation-pending="">
              {tc('translation.pending')}{' '}
              <a href="/" hrefLang="en" className="text-link underline underline-offset-2">
                {tc('translation.original')}
              </a>
            </span>
          </Note>
        </div>
      )}
      <FacesMarquee locale={locale} />
      <Vibes locale={locale} />
      <Bento locale={locale} />
      <HowItWorks locale={locale} />
      <MadeFor locale={locale} />
      <Questions locale={locale} />
      <FinalCta locale={locale} />
    </>
  );
}
