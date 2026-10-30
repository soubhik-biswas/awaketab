import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Block } from '@/components/site/blocks';
import { JsonLd } from '@/components/site/json-ld';
import { PageHero } from '@/components/site/page-hero';
import { ROUTES, SITE } from '@/lib/routes';
import { articleSchema, englishOnly, pageMetadata } from '@/lib/seo';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations({ locale: 'en', namespace: 'page.embed' });
  return pageMetadata({
    title: t('title'),
    description: t('description'),
    path: ROUTES.embed,
    og: { kicker: 'Website widget', title: t('h1'), scene: 'cooking', tone: 'dark' },
  });
}

// The landing page shell; the embed builder fills the slot below the hero.
export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  await englishOnly(params);
  const t = await getTranslations({ locale: 'en', namespace: 'page.embed' });
  const canonical = `${SITE}${ROUTES.embed}`;
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
      <PageHero eyebrow="Website widget" h1={t('h1')} lead={t('description')} scene="cooking" />
      <Block id="embed-builder" label={t('h1')}>
        <div data-embed-slot="" className="min-h-[480px] rounded-[28px] border border-dashed border-input bg-secondary" />
      </Block>
    </>
  );
}
