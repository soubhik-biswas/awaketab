import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { articleIn, articles, HUBS, useCaseScene, type IHubItem } from '@/lib/content';
import { SITE, type TContentKind } from '@/lib/routes';
import { articleSchema, pageMetadata, withItemList } from '@/lib/seo';
import { Block, Callout, Cards, type ICard } from './blocks';
import { JsonLd } from './json-ld';
import { PageHero } from './page-hero';

const PRESET_LABEL: Record<string, string> = {
  p15: '15 min',
  p30: '30 min',
  p45: '45 min',
  p60: '1 h',
  p120: '2 h',
  p240: '4 h',
  pinf: 'Until I stop',
  custom: 'Custom',
  until: 'Until a time',
};

export async function hubMetadata(kind: TContentKind): Promise<Metadata> {
  const tp = await getTranslations({ locale: 'en', namespace: 'page' });
  const ts = await getTranslations({ locale: 'en', namespace: 'site' });
  return pageMetadata({
    title: tp(`hub.${kind}.title`),
    description: tp(`hub.${kind}.description`),
    path: `/${kind}`,
    og: { kicker: ts(`hub.${kind}.eyebrow`), title: tp(`hub.${kind}.h1`), tone: kind === 'for' ? 'light' : 'dark', ...(kind === 'for' ? { scene: 'cooking' as const } : {}) },
  });
}

// Every hub in the use-case index board's layout: hero, then each group as a card grid. English only.
export async function HubPage({ kind }: { kind: TContentKind }) {
  const tp = await getTranslations({ locale: 'en', namespace: 'page' });
  const ts = await getTranslations({ locale: 'en', namespace: 'site' });
  const hub = HUBS[kind];
  const canonical = `${SITE}/${kind}`;
  const listed = new Set(hub.groups.flatMap((g) => g.items.map((i) => i.slug)));
  const unlisted = articles(kind).filter((a) => a.locale === 'en' && !listed.has(a.enSlug));
  const toCard = (item: IHubItem): ICard | null => {
    const a = articleIn(kind, item.slug, 'en');
    if (!a) return null;
    return {
      href: `/${kind}/${item.slug}`,
      title: kind === 'for' ? a.h1 : (a.crumb ?? a.h1),
      desc: item.line ?? a.description,
      link: tp('hub.readGuide'),
      ...(kind === 'for' ? { scene: useCaseScene(item.slug), meta: [PRESET_LABEL[a.preset] ?? ''].filter(Boolean) } : {}),
      ...(item.meta ? { meta: item.meta } : {}),
    };
  };
  const groups = hub.groups
    .map((g, gi) => ({
      ...g,
      cards: [...g.items, ...(gi === hub.groups.length - 1 ? unlisted.map((a) => ({ slug: a.enSlug })) : [])]
        .map(toCard)
        .filter((c): c is ICard => c !== null),
    }))
    .filter((g) => g.cards.length > 0);
  const h1 = kind === 'for' ? ts('hub.for.h1') : tp(`hub.${kind}.h1`);
  const lead = kind === 'for' ? ts('hub.for.lead') : hub.lead;
  const all = groups.flatMap((g) => g.cards);
  const schema = withItemList(
    articleSchema({
      canonical,
      title: tp(`hub.${kind}.h1`),
      description: tp(`hub.${kind}.description`),
      locale: 'en',
      published: '2026-09-09',
      breadcrumbs: [
        { name: 'AwakeTab', url: SITE },
        { name: hub.crumb, url: canonical },
      ],
    }),
    tp(`hub.${kind}.h1`),
    all.map((c) => ({ name: c.title, url: `${SITE}${c.href}` })),
  );
  return (
    <>
      <JsonLd schema={schema} />
      <PageHero
        crumbs={[{ href: `/${kind}`, label: hub.crumb }, { label: ts('hub.all') }]}
        eyebrow={ts(`hub.${kind}.eyebrow`)}
        h1={h1}
        lead={lead}
      />
      {groups.map((g) => (
        <Block key={g.id} id={g.id} h={groups.length > 1 ? g.title : undefined} sub={groups.length > 1 ? g.line : undefined} label={g.title}>
          <Cards items={g.cards} cols={3} />
        </Block>
      ))}
      {hub.note && (
        <Block label={hub.note}>
          <Callout tone="info" title={ts('hub.honest')}>
            {hub.note}
          </Callout>
        </Block>
      )}
    </>
  );
}
