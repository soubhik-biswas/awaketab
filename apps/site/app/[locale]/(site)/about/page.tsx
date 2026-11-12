import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Block, DataTable, Prose, Steps, tx, yes } from '@/components/site/blocks';
import { JsonLd } from '@/components/site/json-ld';
import { PageHero } from '@/components/site/page-hero';
import { lockPillLabel, type TLock } from '@/components/site/pill-copy';
import { PRO_ENABLED } from '@/lib/features';
import { panelHref, ROUTES } from '@/lib/routes';
import { englishOnly, pageMetadata, personSchema, titleFor } from '@/lib/seo';

const COFFEE = 'https://buymeacoffee.com/awaketab';
const LOCK_STATES: readonly TLock[] = ['idle', 'requesting', 'held', 'lost', 'denied', 'unsupported', 'fallback'];
const JOURNEYS = [
  'Acquisition',
  'Denial',
  'Release on hidden tabs',
  'Reacquisition',
  'Fallback behaviour',
  'Multi-tab warnings',
];
const CREDITS = [
  ['Next.js and React', 'https://nextjs.org/', 'The website and the timer', 'MIT'],
  ['Radix UI and shadcn/ui', 'https://ui.shadcn.com/', 'Accessible panels, menus, switches and tooltips', 'MIT'],
  ['cmdk', 'https://cmdk.paco.me/', 'The command palette', 'MIT'],
  ['Vaul', 'https://vaul.emilkowal.ski/', 'Bottom sheets on phones and tablets', 'MIT'],
  ['Sonner', 'https://sonner.emilkowal.ski/', 'Toasts, such as the one after you add time', 'MIT'],
  ['GSAP', 'https://gsap.com/', 'The moving parts of the clock faces', 'GSAP standard licence'],
  ['Motion', 'https://motion.dev/', 'Interface transitions', 'MIT'],
  ['Magic UI', 'https://magicui.design/', 'The border beam, meteors and grid pattern', 'MIT'],
  ['Lucide', 'https://lucide.dev/', 'The interface icons, by the Lucide contributors', 'ISC'],
  ['next-intl', 'https://next-intl.dev/', 'The eight languages', 'MIT'],
  ['Serwist', 'https://github.com/serwist/serwist', 'The offline page and widgets', 'MIT'],
  [
    'Bricolage Grotesque',
    'https://github.com/ateliertriay/bricolage',
    'Headings and the wordmark, by Mathieu Triay',
    'SIL OFL 1.1',
  ],
  ['Inter', 'https://rsms.me/inter/', 'Interface text and the clock digits, by Rasmus Andersson', 'SIL OFL 1.1'],
  [
    'Instrument Serif',
    'https://github.com/Instrument/instrument-serif',
    'The accent word in headlines, by Instrument',
    'SIL OFL 1.1',
  ],
  ['Geist Mono', 'https://vercel.com/font', 'Labels and keyboard keys, by Vercel', 'SIL OFL 1.1'],
  [
    'Archivo',
    'https://github.com/Omnibus-Type/Archivo',
    'The Neon, Bauhaus, Poster and HUD faces, by Omnibus-Type',
    'SIL OFL 1.1',
  ],
  ['IBM Plex Serif', 'https://github.com/IBM/plex', 'The Luxe, Words and E-ink faces, by IBM', 'SIL OFL 1.1'],
  ['Noto Sans', 'https://fonts.google.com/noto', 'Japanese, Chinese and Hindi text, by Google', 'SIL OFL 1.1'],
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

// The keys the tool listens for (components/tool/keys.ts), in the order a session uses them.
const KEYS = [
  ['Space', 'Keep awake · pause · resume'],
  ['Enter', 'Start the session, before one is running'],
  ['← →', 'Pick a shorter or longer length, before one is running'],
  ['+', 'Add 5 minutes'],
  ['−', 'Take 5 minutes off'],
  ['F', 'Open Faces'],
  ['V', 'Open Vibes'],
  ['R', 'Open Recents'],
  [',', 'Open Settings'],
  ['⇧ F', 'Fullscreen'],
  ['?', 'Command palette, which lists every command'],
  ['⌘ K · Ctrl K', 'Command palette, from anywhere on the page'],
  ['Esc', 'Close a panel or the palette'],
] as const;

const link = 'text-link underline underline-offset-2';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations({ locale: 'en', namespace: 'page.about' });
  return pageMetadata({
    title: titleFor('A small tool with one job.'),
    description: t('description'),
    path: ROUTES.about,
    og: { image: 'og-02', alt: 'AwakeTab: keep this screen awake' },
  });
}

// The about board's three sections, then how AwakeTab is checked, what it will not claim, credits and contact.
export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  await englishOnly(params);
  const tt = await getTranslations({ locale: 'en', namespace: 'tool' });
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
              list: PRO_ENABLED
                ? [
                    'Pro, for people who sync devices. Keeping awake stays free.',
                    'One clearly labelled ad slot on content pages — never on the timer, never animated.',
                    'No selling of data. There is very little data to sell, and we keep it that way.',
                  ]
                : [
                    'Today, we don’t: every feature is free and there is nothing to buy.',
                    'No ads on the timer, ever. No page shows an ad today; if guides carry one later, it will be a single, clearly labelled slot that never animates.',
                    'No selling of data. There is very little data to sell, and we keep it that way.',
                  ],
            },
            {
              h: 'Who we are',
              p: (
                <>
                  AwakeTab is an independent project built and maintained by Soubhik Biswas. Say hello from{' '}
                  <a href={panelHref('feedback')} className={link}>
                    Settings → Send feedback
                  </a>{' '}
                  inside the tool; Soubhik reads every message. If AwakeTab is useful, you can{' '}
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
          rows={LOCK_STATES.map((id) => [tx(id, true), tx(lockPillLabel(tt, id))])}
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
        id="accessibility"
        h="Accessibility"
        sub="The target is WCAG 2.2 AA, in light, dark and OLED and in every supported language."
      >
        <Prose
          items={[
            {
              p: 'Everything works by keyboard, by touch and with a screen reader. Single-key shortcuts only fire while the timer has focus and no panel is open — never while you type in a field or the palette — and the palette shows each one next to its command.',
            },
          ]}
        />
        <DataTable
          label="Keyboard shortcuts"
          cols={['Key', 'Action']}
          template="0.7fr 2fr"
          rows={KEYS.map(([key, action]) => [tx(<kbd className="font-mono">{key}</kbd>, true), tx(action)])}
        />
        <Prose
          items={[
            {
              list: [
                'Status is always an icon and words, plus a solid or hollow dot — never colour alone.',
                'The countdown is never read out every second. The clock is a timer whose label changes once a minute; start, extend, five minutes left, a hidden tab and the end are announced politely, and only a refused wake lock interrupts.',
                'With reduced motion on, the faces stop sweeping, flipping and glowing and sheets fade instead of sliding; the digits still change once a second.',
                'Every control is at least 44 px with a focus ring you can always see, no text is smaller than 12 px, and pages reflow to one column at 200 % zoom.',
              ],
            },
            {
              p: (
                <>
                  Found something that gets in your way? Tell us from{' '}
                  <a href={panelHref('feedback')} className={link}>
                    Settings → Send feedback
                  </a>{' '}
                  and pick “Something broke”: your browser and device are attached, so add the page and any assistive
                  technology you use.
                </>
              ),
            },
          ]}
        />
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
                  There is no support email: feedback inside the tool is the one channel. Open the timer, then{' '}
                  <a href={panelHref('feedback')} className={link}>
                    Settings → Send feedback
                  </a>{' '}
                  for help, bug reports or device results that differ from the support matrix.
                  {PRO_ENABLED && ' Plans, receipts, refunds and deleting your Pro data live in Settings → Account.'}
                </>
              ),
            },
          ]}
        />
      </Block>
    </>
  );
}
