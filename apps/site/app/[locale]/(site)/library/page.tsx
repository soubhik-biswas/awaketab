import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import wakePkg from '../../../../../../packages/wake/package.json';
import { CodeBlock } from '@/components/site/article/code-block';
import { Block, DataTable, html, tx } from '@/components/site/blocks';
import { JsonLd } from '@/components/site/json-ld';
import { HeroButtons, PageHero } from '@/components/site/page-hero';
import { inline, tokenize } from '@/lib/markdown';
import { ROUTES, SITE } from '@/lib/routes';
import { articleSchema, englishOnly, pageMetadata } from '@/lib/seo';

const STATES = ['idle', 'requesting', 'held', 'lost', 'denied', 'unsupported', 'fallback'] as const;
const CODE = `import { createWakeLock } from '@awaketab/wake';

const lock = createWakeLock();
lock.on('change', ({ from, to, reason, advice }) => {
  pill.textContent = to;            // one of the seven states
  hint.textContent = advice ?? '';  // e.g. 'iframe_no_allow', 'hidden_document'
});
start.addEventListener('click', () => lock.request()); // a tap allows the fallback
stop.addEventListener('click', () => lock.release());`;
const CMP: ReadonlyArray<readonly [string, string, string]> = [
  ['Last release', 'Maintained; semver', '16 December 2020'],
  ['Native Wake Lock', 'Yes, first', 'Yes (when present)'],
  ['State reporting', 'Seven states + change events with reason and advice', '`isEnabled` boolean'],
  ['Denial diagnosis', '`classifyDenial()` advice codes', 'None'],
  ['Fallback', 'Inlined 1-frame video, gesture-aware, pauses when hidden', 'Looping video, always on'],
  ['Size (gzip)', '≤ 3.4 KB, fallback included', '≈ 3.2 KB'],
  ['TypeScript · SSR', 'Native · inert on the server', 'Community typings · no'],
  ['Adapters', 'React, Preact, Vue (< 400 B each)', 'No'],
];

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations({ locale: 'en', namespace: 'page.library' });
  return pageMetadata({
    title: t('title'),
    description: t('description'),
    path: ROUTES.library,
    og: { kicker: 'Open source', title: t('h1'), tone: 'light' },
  });
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  await englishOnly(params);
  const t = await getTranslations({ locale: 'en', namespace: 'page.library' });
  const tt = await getTranslations({ locale: 'en', namespace: 'tool' });
  const tc = await getTranslations({ locale: 'en', namespace: 'content' });
  const canonical = `${SITE}${ROUTES.library}`;
  const pill = (s: (typeof STATES)[number]) => (s === 'idle' ? tt('pill.idle._') : tt(`pill.${s}`));
  const lines = (code: string, lang: string) => code.split('\n').map((l) => tokenize(l, lang));
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
        crumbs={[{ label: 'Developers' }, { label: '@awaketab/wake' }]}
        eyebrow={`Open source · v${wakePkg.version}`}
        h1={t('h1')}
        lead={t('description')}
        actions={
          <HeroButtons
            primary={{ href: 'https://github.com/SoubhikBiswas-gitHub/awaketab', label: 'View on GitHub' }}
            secondary={{ href: '/learn/screen-wake-lock-api-guide', label: 'Read the API guide' }}
          />
        }
      />
      <Block id="lib-install" h="Install">
        <CodeBlock
          file="terminal"
          lines={lines('npm install @awaketab/wake', 'sh')}
          copy={tc('copy')}
          copied={tc('copied')}
          copyLabel={tc('copyFile', { file: 'terminal' })}
          scrollLabel={tc('codeScroll', { file: 'terminal' })}
        />
        <CodeBlock
          file="main.js"
          lines={lines(CODE, 'js')}
          copy={tc('copy')}
          copied={tc('copied')}
          copyLabel={tc('copyFile', { file: 'main.js' })}
          scrollLabel={tc('codeScroll', { file: 'main.js' })}
        />
      </Block>
      <Block id="lib-states" h="Seven honest states" sub="The same states and pill copy as the AwakeTab tool.">
        <DataTable
          label="Lock states"
          cols={['State', 'What the pill says']}
          template="1fr 1.6fr"
          rows={STATES.map((s) => [tx(s, true), tx(pill(s))])}
        />
      </Block>
      <Block id="lib-compare" h="@awaketab/wake vs NoSleep.js">
        <DataTable
          label="@awaketab/wake vs NoSleep.js"
          cols={['', '@awaketab/wake', 'NoSleep.js']}
          template="1fr 1.4fr 1.2fr"
          rows={CMP.map(([what, us, them]) => [tx(what, true), html(inline(us)), html(inline(them))])}
        />
      </Block>
    </>
  );
}
