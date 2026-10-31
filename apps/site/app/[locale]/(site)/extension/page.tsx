import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Block, Callout, DataTable, Faq, Prose, Steps, tx } from '@/components/site/blocks';
import { JsonLd } from '@/components/site/json-ld';
import { HeroButtons, PageHero } from '@/components/site/page-hero';
import { ROUTES, SITE, toolHref } from '@/lib/routes';
import { englishOnly, pageMetadata, softwareSchema, titleFor } from '@/lib/seo';

// Until the stores approve the listing the links are store searches, and the note under the buttons says so.
const STORE = {
  chrome: 'https://chromewebstore.google.com/search/AwakeTab',
  edge: 'https://microsoftedge.microsoft.com/addons/search/AwakeTab',
} as const;
const LISTED = false as boolean;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations({ locale: 'en', namespace: 'page.extension' });
  return pageMetadata({
    title: titleFor(t('h1')),
    description: t('description'),
    path: ROUTES.extension,
    og: {
      template: 'guide',
      kicker: 'Chrome & Edge',
      title: 'Stays awake when the tab isn’t in front.',
      sub: 'Time left on your toolbar',
      scene: 'welcome',
    },
  });
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  await englishOnly(params);
  const t = await getTranslations({ locale: 'en', namespace: 'page.extension' });
  const canonical = `${SITE}${ROUTES.extension}`;
  const note = `${t('cta.note', { browsers: 'Chrome and Edge', version: '116' })}${LISTED ? '' : ` ${t('cta.pending')}`}`;
  return (
    <>
      <JsonLd
        schema={softwareSchema({
          canonical,
          name: t('h1'),
          description: t('description'),
          operatingSystem: 'Windows, macOS, Linux, ChromeOS',
          breadcrumbs: [
            { name: 'AwakeTab', url: SITE },
            { name: t('h1'), url: canonical },
          ],
        })}
      />
      <PageHero
        crumbs={[{ label: 'Product' }, { label: t('h1') }]}
        eyebrow="Chrome & Edge"
        h1={t('h1')}
        lead={t('lead')}
        scene="welcome"
        meta={<span>{note}</span>}
        actions={
          <HeroButtons
            primary={{ href: STORE.chrome, label: LISTED ? t('cta.chrome') : t('cta.chromeSearch') }}
            secondary={{ href: STORE.edge, label: LISTED ? t('cta.edge') : t('cta.edgeSearch') }}
          />
        }
      />
      <Block id="ext-steps" h={t('steps.title')}>
        <Steps
          items={[
            { title: t('steps.install.title'), body: t('steps.install.body') },
            { title: t('steps.pin.title'), body: t('steps.pin.body') },
            { title: t('steps.press.title'), body: t('steps.press.body') },
          ]}
        />
      </Block>
      <Block id="ext-features" h={t('features.title')}>
        <Prose
          items={[{ list: [t('features.levels'), t('features.timers'), t('features.badge'), t('features.pro')] }]}
        />
        <Callout tone="warning" title="What it can’t do">
          {t('limits.running')} {t('limits.lid')} {t('limits.presence')}
        </Callout>
      </Block>
      <Block id="ext-permissions" h={t('permissions.title')} sub={t('permissions.lead')}>
        <DataTable
          label={t('permissions.title')}
          cols={['Permission', 'Why']}
          template="0.8fr 2fr"
          rows={(['power', 'storage', 'alarms', 'notifications', 'sites'] as const).map((key) => {
            const [name = '', why = ''] = t(`permissions.${key}`).split(' — ');
            return [tx(name, true), tx(why)];
          })}
        />
        <Callout tone="lamp" title="Private by default">
          {t('privacy')}{' '}
          <a href={`${ROUTES.privacy}#extension`} className="font-semibold text-link underline underline-offset-2">
            Privacy policy
          </a>
        </Callout>
      </Block>
      <Block id="ext-ff" label={t('firefox.title')}>
        <Callout tone="info" title={t('firefox.title')}>
          {t('firefox.body')}{' '}
          <a href="/on/firefox" className="font-semibold text-link underline underline-offset-2">
            {t('firefox.link')}
          </a>
        </Callout>
      </Block>
      <Block id="ext-faq" h={t('faq.title')}>
        <Faq items={[1, 2, 3, 4, 5].map((n) => ({ q: t(`faq.q${String(n)}`), a: t(`faq.a${String(n)}`) }))} />
      </Block>
      <Block label={t('web')}>
        <Callout tone="lamp" title={t('band.title')}>
          {t('web')}{' '}
          <a href={toolHref()} className="font-semibold text-link underline underline-offset-2">
            Open the timer
          </a>
        </Callout>
      </Block>
    </>
  );
}
