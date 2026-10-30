import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Block, Releases, type IRelease } from '@/components/site/blocks';
import { JsonLd } from '@/components/site/json-ld';
import { PageHero } from '@/components/site/page-hero';
import { changelog } from '@/lib/content';
import { fullDate } from '@/lib/dates';
import { ROUTES, SITE } from '@/lib/routes';
import { articleSchema, englishOnly, pageMetadata } from '@/lib/seo';

const TAG = { new: 'New', fixed: 'Fixed', changed: 'Changed' } as const;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations({ locale: 'en', namespace: 'page.changelog' });
  const ts = await getTranslations({ locale: 'en', namespace: 'site.changelog' });
  return pageMetadata({
    title: t('title'),
    description: t('description'),
    path: ROUTES.changelog,
    og: { kicker: ts('eyebrow'), title: ts('h1'), sub: ts('lead'), scene: 'history', tone: 'dark' },
  });
}

// Every release fragment from the repository's changelog folder, newest first.
export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  await englishOnly(params);
  const t = await getTranslations({ locale: 'en', namespace: 'page.changelog' });
  const ts = await getTranslations({ locale: 'en', namespace: 'site.changelog' });
  const entries = changelog();
  const items: IRelease[] = entries.map((e) => ({
    id: e.id,
    tag: TAG[e.type],
    tone: e.type,
    meta: [e.release ? `v${e.release}` : null, fullDate(e.date)].filter(Boolean).join(' · '),
    title: e.title,
    items: e.items,
  }));
  const canonical = `${SITE}${ROUTES.changelog}`;
  return (
    <>
      <JsonLd
        schema={articleSchema({
          canonical,
          title: t('h1'),
          description: t('description'),
          locale: 'en',
          published: '2026-09-09',
          ...(entries[0] ? { updated: entries[0].date } : {}),
          breadcrumbs: [
            { name: 'AwakeTab', url: SITE },
            { name: t('h1'), url: canonical },
          ],
        })}
      />
      <PageHero
        crumbs={[{ label: ts('crumb') }, { label: t('h1') }]}
        eyebrow={ts('eyebrow')}
        h1={ts('h1')}
        lead={ts('lead')}
      />
      <Block label={ts('h1')}>
        <Releases items={items} />
      </Block>
    </>
  );
}
