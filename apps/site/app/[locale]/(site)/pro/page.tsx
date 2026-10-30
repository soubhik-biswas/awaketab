import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Block, Faq } from '@/components/site/blocks';
import { JsonLd } from '@/components/site/json-ld';
import { PageHero } from '@/components/site/page-hero';
import { ProPlans } from '@/components/site/pro-plans';
import { ROUTES, SITE } from '@/lib/routes';
import { articleSchema, englishOnly, pageMetadata } from '@/lib/seo';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations({ locale: 'en', namespace: 'page.pro' });
  return pageMetadata({
    title: t('title'),
    description: t('description'),
    path: ROUTES.pro,
    og: { kicker: 'AwakeTab Pro', title: 'Keeping awake is free. Pro is for comfort.', sub: 'Looks, history, notes.', scene: 'success', tone: 'dark' },
  });
}

// The Pro page shell from the content board: hero, the plans slot and the billing questions.
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
      <PageHero
        eyebrow="AwakeTab Pro"
        h1="Keeping awake stays free."
        lead="Pro is for people who run screens on more than one device or want the extras. Prices are placeholders until they are set."
        scene="success"
      />
      <Block id="plans" label="Plans">
        <ProPlans />
      </Block>
      <Block id="billing" h="Billing questions">
        <Faq
          items={[
            { q: 'Can I cancel?', a: 'Yes, any time in Settings → Pro. You keep Pro until the end of the period you paid for.' },
            { q: 'Who handles payment?', a: '[PAYMENT PROVIDER]. AwakeTab never sees your card details.' },
            {
              q: 'What happens to my data if I cancel?',
              a: 'Sessions stay on each device. Sync stops; nothing is deleted without asking.',
            },
          ]}
        />
      </Block>
    </>
  );
}
