import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { LegalPage, legalLink } from '@/components/site/legal-page';
import { panelHref, ROUTES } from '@/lib/routes';
import { englishOnly, pageMetadata, titleFor } from '@/lib/seo';

// Section ids are link targets (/privacy#extension from /extension, #ads, #server-data, #delete) and stay stable;
// every docs/08 §7 row, retention period and the deletion route are listed.
const KEYS = [
  [
    'at.v1.settings',
    'Theme, accent, default duration, sound, notifications, end behaviour, battery, ambient, language, telemetry and keyboard preferences.',
  ],
  ['at.v1.session', 'The current or last session so a reload can offer to resume it.'],
  ['at.v1.stats', 'Local-date minute totals, session count and streak data retained for up to 365 days.'],
  ['at.v1.license', 'An offline-verifiable Pro token, plan, features, validation time and random device identifier.'],
  ['at.v1.meta', 'Install date, completed-session count, rating-prompt choice and last seen version.'],
  ['at.v1.onboarding', 'Dismissed tips, including language suggestions.'],
  [
    'at.v1.notes',
    'Your notes (IndexedDB, not localStorage): text, titles, pins and edit times, plus whether you read the voice typing notice. Never uploaded.',
  ],
] as const;
const EVENTS = [
  'page_view',
  'session_start',
  'session_end',
  'lock_state',
  'lock_denied',
  'fallback_used',
  'resume_shown',
  'resume_accepted',
  'pwa_install',
  'pip_open',
  'share_click',
  'pro_view',
  'pro_checkout_click',
  'pro_activated',
  'rating_prompt',
  'extension_click',
  'ad_slot_loaded',
  'sponsor_view',
  'sponsor_click',
  'session_extend',
  'affiliate_click',
  'rating_submitted',
];

const Code = ({ children }: { children: string }) => <code>{children}</code>;
// There is no contact address: every privacy question goes through feedback inside the tool.
const feedback = (
  <a href={panelHref('feedback')} className={legalLink}>
    Settings → Send feedback
  </a>
);

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations({ locale: 'en', namespace: 'page.privacy' });
  return pageMetadata({
    title: titleFor('Privacy policy'),
    description: t('description'),
    path: ROUTES.privacy,
    og: { image: 'og-02', alt: 'AwakeTab: keep this screen awake' },
  });
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  await englishOnly(params);
  const t = await getTranslations({ locale: 'en', namespace: 'page.privacy' });
  return (
    <LegalPage
      crumb={t('h1')}
      h1="Privacy policy"
      lead="The short version: AwakeTab works without an account, keeps your settings on your device, and does not sell or share personal data. It sets no cookies."
      description={t('description')}
      path={ROUTES.privacy}
      updated="2026-09-28"
      effective="2026-09-09"
      other={['Terms', ROUTES.terms]}
      sections={[
        {
          id: 'browser',
          title: 'Data stored in your browser',
          summary:
            'your settings, sessions, stats and notes live in this browser, under seven keys. You can clear them from Settings or your browser.',
          body: (
            <>
              <dl className="m-0 flex flex-col gap-3">
                {KEYS.map(([key, text]) => (
                  <div key={key} className="flex flex-col gap-1">
                    <dt>
                      <Code>{key}</Code>
                    </dt>
                    <dd className="m-0 text-muted-foreground-strong">{text}</dd>
                  </div>
                ))}
              </dl>
              <p className="m-0">
                This data stays in browser storage unless a feature explicitly contacts the first-party API. You can
                clear it from Settings or your browser. <Code>{"BroadcastChannel('awaketab')"}</Code> coordinates open
                tabs without sending that state to a server.
              </p>
              <p className="m-0">
                Voice typing in the notepad uses your browser&apos;s own speech recognition. In Chrome and Edge the
                browser sends your voice to its speech service (Google or Microsoft) to be transcribed, and Safari uses
                Apple&apos;s, under that company&apos;s terms. AwakeTab receives neither the audio nor the text; only
                the words you keep are saved, in <Code>at.v1.notes</Code> on this device. The microphone is used only
                while the mic button shows it is listening.
              </p>
            </>
          ),
        },
        {
          id: 'telemetry',
          title: 'First-party telemetry',
          summary:
            'telemetry is on by default and anonymous: AwakeTab sends events to its own server, with no user id, no fingerprint and no persistent identifier. Site pages ask once whether you allow it; Decline, or one switch in Settings, turns it off everywhere.',
          body: (
            <>
              <p className="m-0">
                While telemetry is on, AwakeTab may send:{' '}
                {EVENTS.map((name, i) => (
                  <span key={name}>
                    <Code>{name}</Code>
                    {i < EVENTS.length - 1 ? ', ' : ' '}
                  </span>
                ))}
                and sampled <Code>client_error</Code> events.
              </p>
              <p className="m-0">
                Common fields are timestamp, path without query parameters, locale, coarse browser/OS and viewport
                classes, application version and a random per-tab session id held only in memory. AwakeTab does not
                collect a user id, exact user agent, fingerprint, full referrer or persistent analytics identifier.
              </p>
            </>
          ),
        },
        {
          id: 'extension',
          title: 'AwakeTab for Chrome (browser extension)',
          summary:
            'the extension keeps the same records on your computer, asks for power, storage and alarms (anything else is optional), and sends no usage data unless you turn it on.',
          body: (
            <>
              <p className="m-0">
                The extension keeps the same records as the site, in <Code>chrome.storage.local</Code> on your computer:{' '}
                <Code>at.v1.settings</Code>, <Code>at.v1.session</Code>, <Code>at.v1.stats</Code>,{' '}
                <Code>at.v1.license</Code> (only after you activate Pro), <Code>at.v1.ext</Code> (Screen or System
                level, schedules and auto-start sites) and <Code>at.v1.device</Code> (a random device id created once
                per browser profile, used only to count Pro activations).
              </p>
              <p className="m-0">
                If Chrome sync is on, your settings, schedules and auto-start sites are also copied through{' '}
                <Code>chrome.storage.sync</Code> to your other Chrome profiles. The licence token and the device id
                never sync.
              </p>
              <p className="m-0">
                The extension asks for <Code>power</Code>, <Code>storage</Code> and <Code>alarms</Code>. Notifications
                and access to a website are optional and requested only when you turn on end-of-timer notifications or
                add an auto-start site; the site permission covers that one site, and the extension never reads page
                content. Which sites you add is never sent anywhere.
              </p>
              <p className="m-0">
                Anonymous usage statistics are off by default in the extension. If you turn them on in its settings, it
                sends at most <Code>session_start</Code>, <Code>session_end</Code>, <Code>pro_activated</Code> and{' '}
                <Code>client_error</Code> events to <Code>awaketab.com/api/e</Code> with <Code>source: ext</Code> and
                the common fields above, never a URL, tab title or site name. Activating Pro sends the licence key, the
                random device id and the label “AwakeTab for Chrome · your operating system” to{' '}
                <Code>/api/license/activate</Code>. The extension shows no ads, loads no remote code and never simulates
                keyboard or mouse input.
              </p>
            </>
          ),
        },
        {
          id: 'server-data',
          title: 'Data kept on our servers',
          summary:
            'three kinds of records, each with an end date: usage events for 90 days, ratings for up to 2 years, and a licence record until the licence expires plus one year.',
          body: (
            <>
              <p className="m-0">
                AwakeTab runs on Cloudflare. It keeps three kinds of records there, and nothing else:
              </p>
              <dl className="m-0 flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <dt id="retention-events" className="font-bold">
                    Anonymous usage events
                  </dt>
                  <dd className="m-0 text-muted-foreground-strong">
                    The telemetry events above, and content-security-policy reports your browser may send to{' '}
                    <Code>/api/csp</Code> (only the page path is kept). They are stored in Cloudflare Workers Analytics
                    Engine and <strong>deleted automatically after 90 days</strong>. They carry no IP address and no
                    identifier beyond the per-tab random session id, so they cannot be traced back to you. Turn
                    telemetry off in Settings to stop sending them.
                  </dd>
                </div>
                <div className="flex flex-col gap-1">
                  <dt id="retention-ratings" className="font-bold">
                    Ratings
                  </dt>
                  <dd className="m-0 text-muted-foreground-strong">
                    If you rate AwakeTab, we store the stars, any text you choose to write (up to 280 characters), the
                    page language, the app version and the time, for up to 2 years. No name, email, IP address or device
                    id is attached. Only the aggregate (average and count) is published.
                  </dd>
                </div>
                <div className="flex flex-col gap-1">
                  <dt id="retention-licence" className="font-bold">
                    Licence record
                  </dt>
                  <dd className="m-0 text-muted-foreground-strong">
                    If you buy Pro or a Business licence, we keep a record to fulfil the purchase, handle refunds and
                    stop abuse: the plan and its status, your licence key (encrypted), the Polar order and customer ids,
                    and for each activated device a hash of its random device id, its label and when it was last seen.
                    It is kept until the licence expires plus one year, then deleted. Your name, email and payment
                    details stay with Polar, the merchant of record, whose privacy terms apply.
                  </dd>
                </div>
              </dl>
              <p id="delete" className="m-0">
                <strong>Deleting your licence data.</strong> Open the timer and use Settings → Account, or send your
                licence key from {feedback} and ask us to delete your licence data. We delete the licence record and its
                device list within 7 days, and Pro shows as off in the app once it is gone. Deleting it ends Pro on
                every device, and it does not refund the purchase (a refund within 14 days does that, see the terms).
                Usage events and ratings carry no identity, so no one, including us, can pick out yours; they expire on
                the schedule above.
              </p>
            </>
          ),
        },
        {
          id: 'network',
          title: 'Network and payment data',
          summary:
            'your IP address is used briefly, as a salted hash, for rate limiting and is never stored as analytics. Polar handles payment.',
          body: (
            <p className="m-0">
              API rate limiting uses a salted hash of the source IP transiently; neither the IP nor its hash is stored
              as analytics. Pro purchases are processed by Polar, whose checkout privacy terms apply. Licence endpoints
              receive only the licence key or token, a random device id and a user-visible device label.
            </p>
          ),
        },
        {
          id: 'ads',
          title: 'Advertising (not yet active)',
          summary:
            'no page shows ads today. If article ads start, they will never appear on the awake screen, in Picture-in-Picture, in embeds or in the extension.',
          body: (
            <>
              <p className="m-0">
                <strong>No page shows ads today.</strong> This section describes what will apply once advertising starts
                on the articles; the effective date above will change when it does.
              </p>
              <p className="m-0">
                AwakeTab&apos;s tool pages load no third-party scripts and show no ads. Our articles (pages under /for,
                /on, /vs, /guides and /learn) will show advertisements from Google AdSense. Ad vendors may set cookies
                and process your IP address and browsing information to show and measure ads. If you are in the EEA, the
                UK or Switzerland we will ask for your consent first through a certified consent management platform,
                and you will be able to change your choice any time via “Manage consent” in the footer. AwakeTab Pro
                removes ads on all pages. We never show ads on the awake screen, in Picture-in-Picture, in embeds or in
                the browser extension.
              </p>
            </>
          ),
        },
        {
          id: 'contact',
          title: 'Contact',
          summary: 'one place for every question about this policy or your data: feedback inside the tool.',
          body: (
            <p className="m-0">
              Questions about this policy or your data: open the timer and use {feedback}. There is no email address;
              feedback is anonymous unless you add your licence key.
            </p>
          ),
        },
      ]}
    />
  );
}
