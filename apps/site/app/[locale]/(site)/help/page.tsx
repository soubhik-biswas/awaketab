import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Block, Callout, Cards } from '@/components/site/blocks';
import { HelpSearch } from '@/components/site/help-search';
import { JsonLd } from '@/components/site/json-ld';
import { PageHero } from '@/components/site/page-hero';
import { changelog, HELP_CHIPS, HELP_TOPICS } from '@/lib/content';
import { fullDate } from '@/lib/dates';
import { panelHref, ROUTES, SITE } from '@/lib/routes';
import { articleSchema, englishOnly, pageMetadata, titleFor } from '@/lib/seo';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations({ locale: 'en', namespace: 'site.help' });
  return pageMetadata({
    title: titleFor(t('h1')),
    description: t('description'),
    path: ROUTES.help,
    og: { template: 'guide', kicker: t('eyebrow'), title: t('h1'), sub: t('ogSub'), scene: 'maintenance' },
  });
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  await englishOnly(params);
  const t = await getTranslations({ locale: 'en', namespace: 'site.help' });
  const tc = await getTranslations({ locale: 'en', namespace: 'site.nav' });
  const updated = changelog()[0]?.date;
  const popular = HELP_TOPICS.filter((topic) => topic.scene);
  return (
    <>
      <JsonLd
        schema={articleSchema({
          canonical: `${SITE}${ROUTES.help}`,
          title: t('h1'),
          description: t('description'),
          locale: 'en',
          published: '2026-09-09',
          ...(updated ? { updated } : {}),
          breadcrumbs: [
            { name: 'AwakeTab', url: SITE },
            { name: t('eyebrow'), url: `${SITE}${ROUTES.help}` },
          ],
        })}
      />
      <PageHero
        crumbs={[{ href: ROUTES.help, label: tc('help') }, { label: t('allTopics') }]}
        eyebrow={t('eyebrow')}
        h1={t('h1')}
        lead={t('lead')}
        scene="maintenance"
      />
      <Block label={t('searchLabel')}>
        <HelpSearch
          topics={HELP_TOPICS.map(({ title, href, words }) => ({ title, href, words }))}
          chips={HELP_CHIPS}
          labels={{
            search: t('searchLabel'),
            placeholder: t('placeholder'),
            chips: t('chips'),
            idle: updated
              ? t('count', { n: HELP_TOPICS.length, date: fullDate(updated) })
              : t('countPlain', { n: HELP_TOPICS.length }),
            one: t('one', { q: '{q}' }),
            many: t('many', { n: '{n}', q: '{q}' }),
            none: t('none', { q: '{q}' }),
          }}
        />
      </Block>
      <Block id="help-popular" h={t('popular')}>
        <Cards
          cols={3}
          items={popular.map((topic) => ({
            href: topic.href,
            title: topic.title,
            desc: topic.line,
            link: topic.link ?? 'Read more',
            ...(topic.scene ? { scene: topic.scene } : {}),
          }))}
        />
      </Block>
      <Block label={t('stuck')}>
        <Callout tone="info" title={t('stuck')}>
          {t('stuckBefore')}{' '}
          <a href={panelHref('feedback')} className="font-semibold text-link underline underline-offset-2">
            {t('stuckLink')}
          </a>
          {t('stuckAfter')}
        </Callout>
      </Block>
    </>
  );
}
