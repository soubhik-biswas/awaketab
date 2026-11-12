import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { LegalPage, legalLink, type ILegalSection } from '@/components/site/legal-page';
import { PRO_ENABLED } from '@/lib/features';
import { panelHref, ROUTES } from '@/lib/routes';
import { englishOnly, pageMetadata, titleFor } from '@/lib/seo';

// Section ids are link targets (/privacy#extension from /extension, #ads, #server-data) and stay stable. Every key the
// site writes (lib/tool, lib/embed) and every record the API keeps (app/api) is listed here; add a row when one is added.
const KEYS: ReadonlyArray<readonly [string, string]> = [
  [
    'at.v1.settings',
    'Theme, clock face, living background and its motion, length, 12-hour clock, seconds, chime, dim at night, language and your answer to “Count this visit?”.',
  ],
  ['at.v1.session', 'The current or last session, so a reload can pick it up where it was.'],
  ['at.v1.stats', 'Minutes awake per day, session count and streak for “This week” in Recents, for up to 365 days.'],
  ['at.v1.presets', 'Presets you saved: name, length, face and chime.'],
  ['at.v1.history', 'Finished sessions: label, face, start and end time, length and how each one ended.'],
  [
    'at.v1.journey',
    'The date of your first visit, how many sessions you have run and when the first one finished. It decides when the one-time “How did it go?” card shows.',
  ],
  ['at.v1.studio', 'The accent colour and glow you chose in Face studio.'],
  ['at.v1.onboarding', 'Tips you have dismissed, including the analytics question and language suggestions.'],
  [
    'at.v1.embed.settings',
    'Timers you set in the Cook Mode website widget, kept by the widget on the site that embeds it.',
  ],
];
const PRO_KEYS: ReadonlyArray<readonly [string, string]> = [
  ['at.v1.license', 'An offline-verifiable Pro token, plan, features, validation time and random device identifier.'],
  ['at.v1.account', 'How you signed in (Google, GitHub or a passkey) and a display name. Never an address.'],
];

// What lib/telemetry sends once a visitor has pressed Allow; keep the two lists in step.
const EVENTS = [
  'page_view',
  'session_start',
  'session_end',
  'session_extend',
  'lock_denied',
  'fallback_used',
  'resume_shown',
  'resume_accepted',
  'pwa_install',
  'pip_open',
  'client_error',
] as const;

const Code = ({ children }: { children: string }) => <code>{children}</code>;
// There is no contact address: every privacy question goes through feedback inside the tool.
const feedback = (
  <a href={panelHref('feedback')} className={legalLink}>
    Settings → Send feedback
  </a>
);

// Sign-in and sync only exist with Pro, so the free build's summary leaves them out.
const FREE = PRO_ENABLED ? '' : 'Free';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations({ locale: 'en', namespace: 'page.privacy' });
  return pageMetadata({
    title: titleFor('Privacy policy'),
    description: t(`description${FREE}`),
    path: ROUTES.privacy,
    og: { image: 'og-02', alt: 'AwakeTab: keep this screen awake' },
  });
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  await englishOnly(params);
  const t = await getTranslations({ locale: 'en', namespace: 'page.privacy' });
  const keys = PRO_ENABLED ? [...KEYS, ...PRO_KEYS] : KEYS;
  const sections: ILegalSection[] = [
    {
      id: 'browser',
      title: 'Data stored in your browser',
      summary:
        'your settings, sessions, presets and history live in this browser, under the keys below. Nothing here is uploaded, and you can clear it from Settings or your browser.',
      body: (
        <>
          <dl className="m-0 flex flex-col gap-3">
            {keys.map(([key, text]) => (
              <div key={key} className="flex flex-col gap-1">
                <dt>
                  <Code>{key}</Code>
                </dt>
                <dd className="m-0 text-muted-foreground-strong">{text}</dd>
              </div>
            ))}
          </dl>
          <p className="m-0">
            This data stays in this browser. Settings → Clear history removes the history; clearing the site&apos;s data
            in your browser removes everything. <Code>{"BroadcastChannel('awaketab')"}</Code> lets open AwakeTab tabs
            and the mini clock stay in step without sending that state to a server. A shared link carries only a length,
            a face, a background and a chime choice, never a name, history or device.
          </p>
        </>
      ),
    },
    {
      id: 'telemetry',
      title: 'Anonymous counting, only if you allow it',
      summary:
        'nothing is counted until you press Allow on “Count this visit?”. After that, AwakeTab counts page views and sessions with no cookies, no user id and no fingerprint.',
      body: (
        <>
          <p className="m-0">
            Site pages ask once, “Count this visit?”. Until you press Allow, nothing is sent, and nothing is ever sent
            while your browser signals Global Privacy Control or Do Not Track. Your answer is saved on this device only,
            in <Code>at.v1.settings</Code> and <Code>at.v1.onboarding</Code>. To take an Allow back, clear this
            site&apos;s data in your browser; you will be asked again.
          </p>
          <p className="m-0">
            After Allow, AwakeTab sends these events to its own server:{' '}
            {EVENTS.map((name, i) => (
              <span key={name}>
                <Code>{name}</Code>
                {i < EVENTS.length - 1 ? ', ' : '.'}
              </span>
            ))}
          </p>
          <p className="m-0">
            Each one carries the time, the page path without its query, the page language, whether the installed app or
            the website is in use, a coarse window-size class, the app version, and a random id that lives in memory for
            one page load and is gone on reload. A page view also carries the host name of the site that linked to you,
            never the full address. A session start carries its length, the clock face and the background; a session end
            carries how long the screen was kept awake and how it ended; an error carries its name and a short message
            with addresses and numbers removed.
          </p>
          <p className="m-0">
            The server adds a two-letter country code, a device class (phone, tablet or desktop), the browser family and
            a visitor key for the day: a short hash of the date, a secret, your IP address and your browser&apos;s user
            agent. It counts unique visitors for one day and changes the next, so it cannot follow you from day to day.
            The IP address and the full user agent are used to compute it and are never stored. The website widget on
            other sites and the browser extension send no events.
          </p>
        </>
      ),
    },
    {
      id: 'feedback',
      title: 'Feedback you send',
      summary:
        'feedback is the only thing AwakeTab collects from you, and only when you press Send: your rating, the topics you ticked, your note, and your browser family and device size.',
      body: (
        <>
          <p className="m-0">
            When you send feedback from Settings → Send feedback or the “How did it go?” card, AwakeTab receives your
            rating (Loved it, It worked or Something broke), the topics you ticked, the note you wrote (up to 1,000
            characters), your browser&apos;s family name (for example “Firefox”, never the full user agent), your device
            size (phone, tablet or desktop), how many sessions this browser has run, and the app version.
          </p>
          <p className="m-0">
            It is anonymous. No name, account, cookie, IP address or device identifier is stored with it, and anything
            in your note that looks like an email address or a phone number is replaced with “[removed]” before it is
            saved. Feedback is kept for up to 2 years, then deleted automatically.
          </p>
        </>
      ),
    },
    {
      id: 'extension',
      title: 'AwakeTab for Chrome (browser extension)',
      summary:
        'the extension keeps its records on your computer, sends no usage statistics, and asks for site access only for sites you add yourself.',
      body: (
        <>
          <p className="m-0">
            The extension stores, in <Code>chrome.storage.local</Code> on your computer: your settings (theme, face,
            last length and chime), the current session, minute totals, the date it was installed, the switches for the
            badge, auto-wake and release when hidden, the sites you chose for auto-wake, and a random device identifier
            that is used only when a licence is checked.
          </p>
          <p className="m-0">
            If Chrome sync is on, your settings and chosen sites are also copied through{' '}
            <Code>chrome.storage.sync</Code> to your own other Chrome profiles. AwakeTab never receives them.
          </p>
          <p className="m-0">
            It asks for <Code>power</Code> (keep the display awake), <Code>alarms</Code> (end on time and update the
            badge), <Code>storage</Code> (the records above), <Code>offscreen</Code> (play the optional chime) and{' '}
            <Code>activeTab</Code> (read the current site&apos;s address when you click “Add this site”). Access to a
            website is optional and requested one site at a time, only for sites you add to “Always keep these sites
            awake”, so the extension can tell when that site is open. It never reads page content, and which sites you
            add is never sent anywhere.
          </p>
          <p className="m-0">
            The extension has no telemetry and sends no usage statistics, URLs, tab titles or site names. It shows no
            ads, loads no remote code and never simulates keyboard or mouse input.
            {PRO_ENABLED
              ? ' If a Pro licence is stored on the device, the extension checks it against awaketab.com about once a day so a revoked one is dropped.'
              : ' This release has no sign-in and nothing to buy. Only if an earlier build stored a licence on the device is that licence checked against awaketab.com about once a day, so a revoked one is dropped.'}
          </p>
        </>
      ),
    },
    {
      id: 'server-data',
      title: 'Data kept on our servers',
      summary: PRO_ENABLED
        ? 'feedback for up to 2 years, anonymous counts and security reports for 90 days, rate-limit counters for a few minutes, and with Pro a licence record and a sign-in account. Nothing else.'
        : 'each record has an end date: feedback for up to 2 years, anonymous counts and security reports for 90 days, and rate-limit counters for a few minutes. Nothing else.',
      body: (
        <>
          <p className="m-0">AwakeTab runs on Cloudflare. It keeps these records there, and nothing else:</p>
          <dl className="m-0 flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <dt id="retention-feedback" className="font-bold">
                Feedback
              </dt>
              <dd className="m-0 text-muted-foreground-strong">
                What the section above lists, for up to 2 years. It carries no identity, so no one, including us, can
                pick out yours.
              </dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt id="retention-events" className="font-bold">
                Anonymous counts and security reports
              </dt>
              <dd className="m-0 text-muted-foreground-strong">
                The events above, for people who pressed Allow, and the reports a browser may send to{' '}
                <Code>/api/csp</Code> when it blocks something under the site&apos;s content security policy (only the
                page path is kept). They are stored in Cloudflare Workers Analytics Engine and{' '}
                <strong>deleted automatically after 90 days</strong>. They carry no IP address and nothing that
                identifies you beyond the one-day visitor key.
              </dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt id="retention-limits" className="font-bold">
                Rate-limit counters
              </dt>
              <dd className="m-0 text-muted-foreground-strong">
                To stop abuse, each API request adds one to a counter stored under a salted hash of the source IP
                address. A counter expires after 4 minutes. Neither the address nor its hash is kept for analytics.
              </dd>
            </div>
            {PRO_ENABLED && (
              <>
                <div className="flex flex-col gap-1">
                  <dt id="retention-licence" className="font-bold">
                    Licence record
                  </dt>
                  <dd className="m-0 text-muted-foreground-strong">
                    If you buy Pro, we keep a record to fulfil the purchase, handle refunds and stop abuse: the plan and
                    its status, your licence key (encrypted), the payment provider&apos;s order and customer ids, and
                    for each activated device a hash of its random device id, its label and when it was last seen. It is
                    kept until the licence expires plus one year, then deleted. Your name and payment details stay with
                    the payment provider, the merchant of record, whose privacy terms apply.
                  </dd>
                </div>
                <div className="flex flex-col gap-1">
                  <dt id="retention-account" className="font-bold">
                    Sign-in account
                  </dt>
                  <dd className="m-0 text-muted-foreground-strong">
                    If you sign in to sync Pro, we keep the sign-in id that Google, GitHub or your passkey gives us,
                    your sessions and the screens you sync, so sync can work. No password is stored.
                  </dd>
                </div>
              </>
            )}
          </dl>
          {PRO_ENABLED && (
            <p id="delete" className="m-0">
              <strong>Deleting your Pro data.</strong> Open the timer and use Settings → Account, or ask from {feedback}
              . We delete the licence record, its device list and your sign-in account within 7 days, and Pro shows as
              off in the app once it is gone. Deleting it ends Pro on every device, and it does not refund the purchase
              (a refund within 14 days does that, see the terms).
            </p>
          )}
        </>
      ),
    },
    {
      id: 'network',
      title: 'Network data',
      summary:
        'like every website, AwakeTab’s host sees your IP address while it answers a request. AwakeTab uses it only for the short-lived rate limit above.',
      body: (
        <>
          <p className="m-0">
            Loading a page, a font or an icon is an ordinary web request, handled by Cloudflare, which sees your IP
            address and browser details while it answers. AwakeTab does not log them. Fonts and scripts are served from
            awaketab.com itself; no third-party script runs on any page.
          </p>
          <p className="m-0">
            When another website embeds the Cook Mode widget, the widget asks <Code>/api/embed/config</Code> for that
            site&apos;s settings and sends the site&apos;s domain name to do so. The answer is cached for 5 minutes and
            the request is not stored.
          </p>
          {PRO_ENABLED && (
            <p className="m-0">
              Pro purchases are processed by the payment provider, whose checkout privacy terms apply. Licence endpoints
              receive only the licence key or token, a random device id and a user-visible device label.
            </p>
          )}
        </>
      ),
    },
    {
      id: 'ads',
      title: 'Advertising (not active)',
      summary:
        'no page shows ads today. If article ads ever start, they will never appear on the timer, in the mini clock, in embeds or in the extension.',
      body: (
        <>
          <p className="m-0">
            <strong>No page shows ads today</strong>, and no ad or tracking script is loaded anywhere on the site.
          </p>
          <p className="m-0">
            If advertising starts on the articles (pages under /for, /on, /vs, /guides and /learn), this page and its
            date will change first, and it will name the ad vendor, what that vendor collects and how to refuse it. We
            will never show ads on the timer, in the mini clock, in embeds or in the browser extension.
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
          Questions about this policy or your data: open the timer and use {feedback}. There is no email address.
          Feedback is anonymous and contact details in a note are removed, so we cannot write back to one person;
          answers that help everyone are added to the help centre and to this page.
        </p>
      ),
    },
  ];
  return (
    <LegalPage
      crumb={t('h1')}
      h1="Privacy policy"
      lead="The short version: AwakeTab works without an account, keeps your settings on your device, and does not sell or share personal data. It sets no cookies."
      description={t(`description${FREE}`)}
      path={ROUTES.privacy}
      updated="2026-11-13"
      effective="2026-11-13"
      other={['Terms', ROUTES.terms]}
      sections={sections}
    />
  );
}
