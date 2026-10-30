import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Block } from '@/components/site/blocks';
import { JsonLd } from '@/components/site/json-ld';
import { PageHero } from '@/components/site/page-hero';
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

// The landing page shell; the kiosk builder fills the slot below the hero.
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
      <PageHero eyebrow="Kiosk and signage" h1={t('h1')} lead={t('description')} scene="dashboard" />
      <Block id="kiosk-builder" label={t('h1')}>
        <div data-kiosk-slot="" className="min-h-[480px] rounded-[28px] border border-dashed border-input bg-secondary" />
      </Block>
    </>
  );
}
