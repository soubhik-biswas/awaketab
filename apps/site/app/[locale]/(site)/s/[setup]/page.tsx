import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { SiteFace } from '@/components/site/site-face';
import { Block, Callout, DataTable, no, tx } from '@/components/site/blocks';
import { EndsAt } from '@/components/site/ends-at';
import { HeroButtons, PageHero } from '@/components/site/page-hero';
import { SystemPage } from '@/components/site/system-page';
import { ROUTES, toolHref } from '@/lib/routes';
import { englishOnly, pageMetadata } from '@/lib/seo';
import { parseSetup, setupToolHref } from '@/lib/share-setup';

type TParams = Promise<{ locale: string; setup: string }>;

export async function generateMetadata({ params }: { params: TParams }): Promise<Metadata> {
  const { setup } = await params;
  const t = await getTranslations({ locale: 'en', namespace: 'site' });
  const ok = parseSetup(decodeURIComponent(setup)) !== null;
  return pageMetadata({
    title: ok ? t('share.title') : t('sys.removed.title'),
    description: t('share.description'),
    path: `/s/${setup}`,
    noindex: true,
    og: { kicker: t('share.eyebrow'), title: t('share.h1'), scene: 'dashboard', tone: 'light' },
  });
}

// A shared setup: the face waits, ready, and Start opens the timer with it. An unreadable or turned-off code shows
// the "setup removed" page.
export default async function Page({ params }: { params: TParams }) {
  await englishOnly(params);
  const { setup: code } = await params;
  const t = await getTranslations({ locale: 'en', namespace: 'site' });
  const tf = await getTranslations({ locale: 'en', namespace: 'face' });
  const tt = await getTranslations({ locale: 'en', namespace: 'tool' });
  const setup = parseSetup(decodeURIComponent(code));
  if (!setup) {
    return (
      <SystemPage
        eyebrow={t('sys.removed.eyebrow')}
        h1={t('sys.removed.h1')}
        lead={t('sys.removed.lead')}
        scene="removed"
        primary={{ href: toolHref(), label: t('sys.removed.start') }}
        secondary={{ href: ROUTES.home, label: t('sys.home') }}
      />
    );
  }
  const { minutes, chime } = setup;
  const faceName = tf(`name.${setup.face}`);
  const hours = minutes / 60;
  const length =
    minutes === 0
      ? t('share.noEnd')
      : minutes < 60
        ? t('share.minutes', { n: minutes })
        : hours === 1
          ? t('share.hour', { n: 1 })
          : t('share.hours', { n: hours });
  const start =
    minutes === 0
      ? t('share.startOpen')
      : minutes < 60
        ? t('share.startMin', { n: minutes })
        : hours === 1
          ? t('share.startHour')
          : t('share.startHours', { n: hours });
  const lengthValue = minutes === 0 ? t('share.noEnd') : tt(`preset.p${String(minutes)}.sr`);
  const template =
    minutes === 0
      ? t('share.leadOpen', { face: faceName })
      : t(chime ? 'share.leadChime' : 'share.leadQuiet', { length, face: faceName, time: '{time}' });
  const [before = '', after = ''] = template.split('{time}');
  const total = minutes * 60;
  return (
    <>
      <PageHero
        eyebrow={t('share.eyebrow')}
        h1={t('share.h1')}
        lead={
          <>
            {before}
            {minutes > 0 && (
              <EndsAt minutes={minutes} locale="en" tomorrow={tt('when.tomorrow', { time: '{time}' })} fallback="…" />
            )}
            {after}
          </>
        }
        actions={
          <HeroButtons
            primary={{ href: setupToolHref(setup, true), label: start }}
            secondary={{ href: setupToolHref(setup, false), label: t('share.change') }}
          />
        }
        face={<SiteFace face={setup.face} size={380} phoneSize={300} total={total || 3600} indef={minutes === 0} />}
      />
      <Block id="s-contains" h={t('share.contains')} sub={t('share.containsSub')}>
        <DataTable
          label={t('share.contains')}
          cols={[t('share.col.setting'), t('share.col.value')]}
          template="1fr 1.4fr"
          rows={[
            [tx(t('share.row.length'), true), tx(lengthValue)],
            [tx(t('share.row.face'), true), tx(faceName)],
            [tx(t('share.row.chime'), true), tx(chime ? t('share.chimeOn') : t('share.chimeOff'))],
            [tx(t('share.row.private'), true), no(t('share.never'))],
          ]}
        />
      </Block>
      <Block label={t('share.install')}>
        <Callout tone="lamp" title={t('share.install')}>
          {t('share.installBody')}
        </Callout>
      </Block>
    </>
  );
}
