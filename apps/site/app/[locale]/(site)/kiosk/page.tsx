import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { KioskPage } from '@/components/kiosk/kiosk-page';
import { JsonLd } from '@/components/site/json-ld';
import { ROUTES, SITE } from '@/lib/routes';
import { articleSchema, englishOnly, pageMetadata } from '@/lib/seo';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations({ locale: 'en', namespace: 'page.kiosk' });
  return pageMetadata({
    title: t('title'),
    description: t('description'),
    path: ROUTES.kiosk,
    og: { kicker: 'Kiosk and signage', title: t('h1'), scene: 'dashboard', tone: 'dark' },
  });
}

// The kiosk landing page inside the site's header and footer; its owner draws the body.
export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  await englishOnly(params);
  const t = await getTranslations({ locale: 'en', namespace: 'page.kiosk' });
  const canonical = `${SITE}${ROUTES.kiosk}`;
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
      <KioskPage />
    </>
  );
}
