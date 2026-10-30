import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Block, DataTable, Prose, Steps, tx, yes } from '@/components/site/blocks';
import { JsonLd } from '@/components/site/json-ld';
import { PageHero } from '@/components/site/page-hero';
import { CONTACT_EMAIL, CONTACT_MAILTO, ROUTES } from '@/lib/routes';
import { englishOnly, pageMetadata, personSchema } from '@/lib/seo';

const COFFEE = 'https://buymeacoffee.com/awaketab';
const LOCK_STATES = ['idle', 'requesting', 'held', 'lost', 'denied', 'unsupported', 'fallback'] as const;
const JOURNEYS = [
  'Acquisition',
  'Denial',
  'Release on hidden tabs',
  'Reacquisition',
  'Fallback behaviour',
  'Multi-tab warnings',
];
const CREDITS = [
  ['Tone.js', 'https://tonejs.github.io/', 'Focus sounds and end sounds, made live in your browser', 'MIT'],
  ['howler.js', 'https://howlerjs.com/', 'Plays recorded tracks in the lo-fi library', 'MIT'],
  ['Embla Carousel', 'https://www.embla-carousel.com/', 'Swiping between clock faces', 'MIT'],
  ['Tiptap and ProseMirror', 'https://tiptap.dev/', 'The notepad editor', 'MIT'],
  ['idb-keyval', 'https://github.com/jakearchibald/idb-keyval', 'Keeps notes in this browser', 'Apache 2.0'],
  ['annyang', 'https://github.com/TalAter/annyang', 'Voice commands while you dictate a note', 'MIT'],
  ['vanilla-colorful', 'https://github.com/web-padawan/vanilla-colorful', 'The custom lamp colour picker', 'MIT'],
  ['Hero Patterns', 'https://heropatterns.com/', 'The Dots, Grid and Waves backgrounds, by Steve Schoger', 'CC BY 4.0'],
  ['IBM Plex Serif', 'https://github.com/IBM/plex', 'The Analog luxe and Words faces, by IBM', 'SIL OFL 1.1'],
  ['DotGothic16', 'https://github.com/fontworks-fonts/DotGothic16', 'The LED face, by Fontworks', 'SIL OFL 1.1'],
  ['Geist and Geist Mono', 'https://vercel.com/font', 'The interface type, by Vercel', 'SIL OFL 1.1'],
  [
    'Space Grotesk',
    'https://github.com/floriankarsten/space-grotesk',
    'The numerals of the Bold face, by Florian Karsten',
    'SIL OFL 1.1',
  ],
  ['Lucide', 'https://lucide.dev/', 'The interface icons, by the Lucide contributors', 'ISC'],
  [
    'SVG Logos',
    'https://svglogos.dev/',
    'The browser and platform logos, by Gil Barbara; logos are trademarks of their owners',
    'CC0 1.0',
  ],
] as const;
const PRINCIPLES = [
  [
    'A tab is not a system setting',
    'A normal browser tab cannot guarantee operation while hidden, prevent system sleep after a laptop lid closes, or override battery-saving policy.',
  ],
  [
    'No fake input',
    'AwakeTab does not simulate mouse movement or keystrokes and does not claim to keep chat presence indicators available.',
  ],
  ['Nothing else on the awake screen', 'The awake screen carries no advertising or third-party scripts.'],
  [
    'Open to inspection',
    'The core wake-lock package is developed as open-source software so its state transitions can be inspected independently.',
  ],
] as const;

const link = 'text-link underline underline-offset-2';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations({ locale: 'en', namespace: 'page.about' });
  return pageMetadata({
    title: t('title'),
    description: t('description'),
    path: ROUTES.about,
    og: { kicker: 'About', title: 'A small tool with one job.', scene: 'nightdesk', tone: 'dark' },
  });
}

// The about board's three sections, then how AwakeTab is checked, what it will not claim, credits and contact.
export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  await englishOnly(params);
  const tt = await getTranslations({ locale: 'en', namespace: 'tool' });
  const pill = (id: (typeof LOCK_STATES)[number]) => (id === 'idle' ? tt('pill.idle._') : tt(`pill.${id}`));
  return (
    <>
      <JsonLd schema={personSchema()} />
      <PageHero
        crumbs={[{ label: 'Company' }, { label: 'About' }]}
        eyebrow="About"
        h1="A small tool with one job."
        lead="AwakeTab keeps a screen on while you need it and lets it sleep when you don’t. We would rather do that one thing honestly than do many things loudly."
        scene="nightdesk"
      />
      <Block id="ab-why" label="About AwakeTab">
        <Prose
          level={2}
          items={[
            {
              h: 'Why it exists',
              p: 'Screens go dark at the worst moments — mid-recipe, mid-slide, mid-download. Browsers can now ask to keep the display on, but nothing made that simple, visible and honest. AwakeTab requests a browser wake lock, shows the result honestly, and makes the common timer and until-time workflows fast without requiring an account.',
            },
            {
              h: 'How we make money',
              list: [
                'Pro, for people who sync devices or want the extras. Keeping awake stays free.',
                'One clearly labelled ad slot on content pages — never on the timer, never animated.',
                'No selling of data. There is very little data to sell, and we keep it that way.',
              ],
            },
            {
              h: 'Who we are',
              p: (
                <>
                  AwakeTab is an independent project built and maintained by Soubhik Biswas. Say hello at{' '}
                  <a href={CONTACT_MAILTO} className={link}>
                    {CONTACT_EMAIL}
                  </a>
                  ; messages go to Soubhik directly. If AwakeTab is useful, you can{' '}
                  <a href={COFFEE} rel="noopener" target="_blank" className={link}>
                    buy Soubhik a coffee
                  </a>{' '}
                  — no widget, account or extra script, just a link.
                </>
              ),
            },
          ]}
        />
      </Block>
      <Block
        id="ab-test"
        h="How AwakeTab is checked"
        sub="Real-device results are pending until the manual run is recorded."
      >
        <Prose
          items={[
            {
              p: (
                <>
                  The lock layer is tested as a seven-state transition machine. Browser journeys inject a controllable
                  Wake Lock implementation and verify acquisition, denial, release on hidden tabs, reacquisition,
                  fallback behaviour and multi-tab warnings. Device claims are kept in the support matrix and are
                  refreshed separately from application code.{' '}
                  <a href="/learn/how-we-tested" className={link}>
                    How AwakeTab is checked
                  </a>
                </>
              ),
            },
          ]}
        />
        <DataTable
          label="The seven lock states"
          cols={['Lock state', 'What the pill says']}
          template="1fr 1.6fr"
          rows={LOCK_STATES.map((id) => [tx(id, true), tx(pill(id))])}
        />
        <DataTable
          label="What the browser journeys verify"
          cols={['Journey', 'Checked']}
          template="1.6fr 1fr"
          rows={JOURNEYS.map((label) => [tx(label, true), yes('Yes')])}
        />
      </Block>
      <Block id="ab-claims" h="What AwakeTab will not claim">
        <Steps items={PRINCIPLES.map(([title, body]) => ({ title, body }))} />
      </Block>
      <Block
        id="credits"
        h="Credits"
        sub="AwakeTab stands on open-source work. Each of these loads only with the feature that uses it."
      >
        <DataTable
          label="Credits"
          cols={['Project', 'Used for', 'Licence']}
          template="1fr 2fr 0.8fr"
          rows={CREDITS.map(([name, href, use, licence]) => [
            tx(
              <a href={href} rel="noopener" target="_blank" className={link}>
                {name}
              </a>,
              true,
            ),
            tx(use),
            tx(licence),
          ])}
        />
      </Block>
      <Block id="contact" h="Contact">
        <Prose
          items={[
            {
              p: (
                <>
                  Email{' '}
                  <a href={CONTACT_MAILTO} className={link}>
                    {CONTACT_EMAIL}
                  </a>{' '}
                  for support, refunds, bug reports, device results that differ from the support matrix, or a request to
                  delete your licence data. Messages go to Soubhik directly.
                </>
              ),
            },
          ]}
        />
      </Block>
    </>
  );
}
