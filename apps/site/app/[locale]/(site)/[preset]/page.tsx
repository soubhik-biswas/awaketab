import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Block, Callout, Cards, Prose } from '@/components/site/blocks';
import { Chips } from '@/components/site/chips';
import { JsonLd } from '@/components/site/json-ld';
import { PageHero } from '@/components/site/page-hero';
import { ToolSlot } from '@/components/site/tool-slot';
import { PRESET_ROUTES, SITE, startHref, type TPresetRoute } from '@/lib/routes';
import { articleSchema, englishOnly, pageMetadata, titleFor } from '@/lib/seo';

const ROUTES: Record<
  TPresetRoute,
  { key: string; cta: string; words: string; job: string; preset: string; minutes: number; short: string }
> = {
  '15m': {
    key: 'p15._',
    cta: '15 min',
    words: '15 minutes',
    job: '15-minute',
    preset: 'p15',
    minutes: 15,
    short: '15 min',
  },
  '30m': {
    key: 'p30._',
    cta: '30 min',
    words: '30 minutes',
    job: '30-minute',
    preset: 'p30',
    minutes: 30,
    short: '30 min',
  },
  '45m': {
    key: 'p45._',
    cta: '45 min',
    words: '45 minutes',
    job: '45-minute',
    preset: 'p45',
    minutes: 45,
    short: '45 min',
  },
  '1h': { key: 'p60._', cta: '1 hour', words: '1 hour', job: 'one-hour', preset: 'p60', minutes: 60, short: '1 h' },
  '2h': {
    key: 'p120._',
    cta: '2 hours',
    words: '2 hours',
    job: 'two-hour',
    preset: 'p120',
    minutes: 120,
    short: '2 h',
  },
  '4h': {
    key: 'p240._',
    cta: '4 hours',
    words: '4 hours',
    job: 'four-hour',
    preset: 'p240',
    minutes: 240,
    short: '4 h',
  },
  '8h': {
    key: 'eightHour',
    cta: '8 hours',
    words: '8 hours',
    job: 'eight-hour',
    preset: 'custom',
    minutes: 480,
    short: '8 h',
  },
};
const GUIDES = [
  ['Keep the screen on during a video call', '/for/video-calls'],
  ['Keep the screen on while downloading', '/for/downloads'],
  ['Keep a work laptop display on', '/for/work-laptop'],
  ['Keep the screen on while you present', '/for/presentations'],
] as const;

type TParams = Promise<{ locale: string; preset: string }>;

export const dynamicParams = false;

export function generateStaticParams() {
  return PRESET_ROUTES.map((preset) => ({ locale: 'en', preset }));
}

const route = (slug: string) => ROUTES[slug as TPresetRoute];

export async function generateMetadata({ params }: { params: TParams }): Promise<Metadata> {
  const { preset } = await params;
  const r = route(preset);
  const t = await getTranslations({ locale: 'en', namespace: 'page.preset' });
  const tt = await getTranslations({ locale: 'en', namespace: 'tool.preset' });
  const label = tt(r.key);
  return pageMetadata({
    title: titleFor(`Keep your screen awake for ${r.words}`),
    description: t('description', { label }),
    path: `/${preset}`,
    og: { image: 'og-01', alt: 'AwakeTab clock showing 38:12 left' },
  });
}

// A preset page: the tool set to this length, what happens at the end, the honest limit and the other lengths.
export default async function Page({ params }: { params: TParams }) {
  await englishOnly(params);
  const { preset: slug } = await params;
  const r = route(slug);
  const t = await getTranslations({ locale: 'en', namespace: 'page.preset' });
  const tt = await getTranslations({ locale: 'en', namespace: 'tool' });
  const ts = await getTranslations({ locale: 'en', namespace: 'site' });
  const label = tt(`preset.${r.key}`);
  const h1 = `Keep your screen awake for ${r.words}`;
  const canonical = `${SITE}/${slug}`;
  return (
    <>
      <JsonLd
        schema={articleSchema({
          canonical,
          title: h1,
          description: t('description', { label }),
          locale: 'en',
          published: '2026-09-09',
          breadcrumbs: [
            { name: 'AwakeTab', url: SITE },
            { name: label, url: canonical },
          ],
        })}
      />
      <PageHero
        eyebrow={`Keep awake · ${r.cta}`}
        h1={h1}
        lead={`This page keeps the screen on for ${r.words} from the moment you start, as long as this tab stays visible. The tool shows the time it will stop, so you know when the screen may dim again.`}
      />
      <Block id="s-tool" label={h1}>
        <ToolSlot
          preset={r.preset}
          minutes={r.minutes}
          eyebrow={ts('tool.eyebrow')}
          title={`A ${r.job} session`}
          desc={`Trust the pill, not the button. It starts with “${tt('glance.tab.awake')}” and names the end time only after the browser confirms the wake lock, and it turns to “${tt('glance.pill.needsyou')}” the moment you switch away.`}
          href={
            r.preset === 'custom'
              ? `${startHref(r.preset, 'standard')}&minutes=${String(r.minutes)}`
              : startHref(r.preset, 'standard')
          }
          label={`Keep awake · ${r.cta}`}
        />
      </Block>
      <Block id="about" h="About this page">
        <Prose
          items={[
            {
              p: `When ${r.words === '1 hour' ? 'the hour is' : `the ${r.words} are`} up, the pill reads “${tt('glance.tab.up')}”, a soft chime plays and your usual screen timeout takes over. To carry on, tap +15 min, +30 min or +1 hour, or ${tt('glance.dock.again')}. To change the length before you start, pick another length in the tool or one of the pages below.`,
            },
          ]}
        />
        <Callout tone="info" title="Honest limit">
          Keep this tab visible and the device open. A hidden tab, a closed laptop lid or a work sign-in policy can
          still let the display sleep or lock. AwakeTab never simulates input, so it will not keep Teams or Slack
          showing you as active.
        </Callout>
      </Block>
      <Block id="lengths" h="Other lengths">
        <Chips
          label="Other lengths"
          items={PRESET_ROUTES.map((s) => ({
            href: `/${s}`,
            label: ROUTES[s].short,
            current: s === slug,
            aria: `Keep awake for ${ROUTES[s].short}`,
          }))}
        />
      </Block>
      <Block id="guides" h={`Guides for a ${r.job} job`}>
        <Cards cols={2} items={GUIDES.map(([title, href]) => ({ href, title, link: ts('article.read') }))} />
      </Block>
    </>
  );
}
