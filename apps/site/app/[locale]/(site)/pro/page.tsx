import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { ProPage } from '@/components/pro/pro-page';
import { JsonLd } from '@/components/site/json-ld';
import { ROUTES, SITE } from '@/lib/routes';
import { articleSchema, englishOnly, pageMetadata, titleFor } from '@/lib/seo';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations({ locale: 'en', namespace: 'page.pro' });
  const ts = await getTranslations({ locale: 'en', namespace: 'site.pro' });
  return pageMetadata({
    title: titleFor(ts('h1')),
    description: t('description'),
    path: ROUTES.pro,
    og: { image: 'og-04', alt: ts('ogAlt') },
  });
}

// The Pro page: the Pro flow draws the hero, plans and billing questions.
export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  await englishOnly(params);
  const t = await getTranslations({ locale: 'en', namespace: 'page.pro' });
  const canonical = `${SITE}${ROUTES.pro}`;
  return (
    <>
      <JsonLd
        schema={articleSchema({
          canonical,
          title: t('h1'),
          description: t('description'),
          locale: 'en',
          published: '2026-09-09',
          breadcrumbs: [
            { name: 'AwakeTab', url: SITE },
            { name: t('h1'), url: canonical },
          ],
        })}
      />
      <ProPage />
    </>
  );
}
