import { allChangelogs, allComparisons, allDevices, allDocs, allGuides, allUseCases } from 'content-collections';
import type { TSceneKey } from '@/components/scene/scene-data';
import slugsJson from '@/i18n/slugs.json';
import { PRO_ENABLED } from '@/lib/features';
import { LOCALE_META, LOCALES, TRANSLATED_SLUG_LOCALES, type TLocale } from '@/i18n/locales';
import { SITE, type TContentKind } from '@/lib/routes';

// Every article collection goes through one transform, so one entry type covers them all.
export type TArticle = (typeof allUseCases)[number];
export type TChangelogEntry = (typeof allChangelogs)[number];

type TSlugMap = Record<string, Record<string, Partial<Record<TLocale, string>>>>;
const SLUGS = slugsJson as TSlugMap;

const BY_KIND: Record<TContentKind, readonly TArticle[]> = {
  for: allUseCases,
  on: allDevices,
  vs: allComparisons,
  guides: allGuides,
  learn: allDocs,
};

export const articles = (kind: TContentKind): readonly TArticle[] => BY_KIND[kind];

function publicSlug(kind: TContentKind, enSlug: string, locale: TLocale): string {
  if (!TRANSLATED_SLUG_LOCALES.includes(locale)) return enSlug;
  return SLUGS[kind]?.[enSlug]?.[locale] ?? enSlug;
}

export function articlePath(kind: TContentKind, enSlug: string, locale: TLocale): string {
  const slug = publicSlug(kind, enSlug, locale);
  return locale === 'en' ? `/${kind}/${slug}` : `/${locale}/${kind}/${slug}`;
}

export function findArticle(kind: TContentKind, locale: TLocale, slug: string): TArticle | undefined {
  return BY_KIND[kind].find((a) => a.locale === locale && publicSlug(kind, a.enSlug, locale) === slug);
}

export function articleIn(kind: TContentKind, enSlug: string, locale: TLocale): TArticle | undefined {
  return BY_KIND[kind].find((a) => a.locale === locale && a.enSlug === enSlug);
}

// Drafts (`noindex: true`) and unreviewed translations stay out of search, the sitemap and hreflang (docs/06 §20).
export const isIndexable = (a: Pick<TArticle, 'locale' | 'reviewed' | 'noindex'>): boolean =>
  !a.noindex && (a.locale === 'en' || a.reviewed);

export interface IAlternate {
  locale: TLocale;
  hreflang: string;
  href: string;
}

// The same reciprocal alternates the sitemap lists, so the two can never disagree.
export function alternatesFor(kind: TContentKind, enSlug: string, locale: TLocale): IAlternate[] {
  const versions = BY_KIND[kind].filter((a) => a.enSlug === enSlug && isIndexable(a));
  if (!versions.some((a) => a.locale === locale)) return [];
  return versions
    .slice()
    .sort((a, b) => LOCALES.indexOf(a.locale) - LOCALES.indexOf(b.locale))
    .map((a) => ({
      locale: a.locale,
      hreflang: LOCALE_META[a.locale].hreflang,
      href: `${SITE}${articlePath(kind, enSlug, a.locale)}`,
    }));
}

export function translationsOf(kind: TContentKind, enSlug: string): Partial<Record<TLocale, string>> {
  const links: Partial<Record<TLocale, string>> = {};
  for (const a of BY_KIND[kind]) if (a.enSlug === enSlug) links[a.locale] = articlePath(kind, enSlug, a.locale);
  return links;
}

export function staticArticleParams(kind: TContentKind): Array<{ locale: TLocale; slug: string }> {
  return BY_KIND[kind].map((a) => ({ locale: a.locale, slug: publicSlug(kind, a.enSlug, a.locale) }));
}

export function changelog(): TChangelogEntry[] {
  return [...allChangelogs].sort((a, b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id));
}

export interface IHubItem {
  slug: string;
  line?: string;
  meta?: readonly [string, string];
}

interface IHubGroup {
  id: string;
  title: string;
  line: string;
  items: readonly IHubItem[];
}

export interface IHub {
  crumb: string;
  lead: string;
  note?: string;
  groups: readonly IHubGroup[];
}

const HONEST =
  'Support claims come from browser documentation and automated tests. Real-device results appear in the matrix once recorded.';

export const HUBS: Record<TContentKind, IHub> = {
  for: {
    crumb: 'Use cases',
    lead: 'Start with the task you need to finish. Each guide pairs a suitable timer preset with the limits that matter in that situation.',
    groups: [
      {
        id: 'g-home',
        title: 'Kitchen, home and practice',
        line: 'Hands busy, screen propped a step away.',
        items: [
          {
            slug: 'cooking',
            line: 'Keep the tab on screen beside the recipe. Switching apps on a phone releases the lock until you return.',
          },
          {
            slug: 'reading',
            line: 'Articles in the browser stay awake in this tab. For a reading app, put it side by side with AwakeTab.',
          },
          {
            slug: 'sheet-music',
            line: 'Side by side with the score app. Low Power Mode still forces a 30-second Auto-Lock.',
          },
          { slug: 'workouts', line: 'Lock the orientation and plug in. Sweaty taps can stop the session.' },
        ],
      },
      {
        id: 'g-work',
        title: 'Work and study',
        line: 'Managed laptops, calls, slides and exams, each with its own rules.',
        items: [
          {
            slug: 'work-laptop',
            line: 'Holds only the display timeout while visible. Not closing the lid, smart cards or your Teams status.',
          },
          {
            slug: 'video-calls',
            line: 'Helps when the player pauses. It will not keep Teams, Slack or Zoom presence green.',
          },
          {
            slug: 'presentations',
            line: 'Full-screen slides hide the tab. Use the floating window in desktop Chrome, Edge or Firefox 151+, or mind the OS display timeout.',
          },
          {
            slug: 'teleprompter',
            line: 'Not a scrolling prompter. Keep your script visible beside it, side by side or with the floating window.',
          },
          {
            slug: 'classroom',
            line: 'Keeps the display on while this tab is visible. A school policy that locks the screen still applies; ask IT about the timeout.',
          },
        ],
      },
      {
        id: 'g-idle',
        title: 'Screens nobody touches',
        line: 'Dashboards, kiosks and long jobs left running.',
        items: [
          {
            slug: 'dashboards',
            line: 'Keep AwakeTab visible on the same display: side by side, a second window or its own monitor.',
          },
          { slug: 'kiosk', line: 'Not a locked-down kiosk shell. Pair it with your OS kiosk mode.' },
          {
            slug: 'downloads',
            line: 'Keeps the display on while this tab is visible. Closing the lid still puts the laptop to sleep.',
          },
          {
            slug: 'ai-agents',
            line: "Keeps the screen on. It cannot stop a site's own inactivity timeout or the throttling of a hidden tab.",
          },
        ],
      },
      {
        id: 'g-night',
        title: 'At night',
        line: 'A calm clock on a dark screen, beside the bed or the couch.',
        items: [{ slug: 'night-clock', line: 'Plug in. Pixel shift lowers burn-in risk; it does not remove it.' }],
      },
    ],
  },
  on: {
    crumb: 'Devices',
    lead: 'Pick your phone, tablet, computer or browser. Each page gives the version that works, the steps, and the limits your system still sets.',
    note: HONEST,
    groups: [
      {
        id: 'g-phones',
        title: 'Phones',
        line: 'The tab has to stay in front: switching apps hands the screen back to the phone.',
        items: [
          {
            slug: 'iphone-safari',
            line: 'Safari 16.4 and later hold the screen after one tap while the tab stays in front. Low Power Mode forces a 30-second Auto-Lock.',
            meta: ['Safari 16.4+', 'iOS'],
          },
          {
            slug: 'ios-home-screen',
            line: 'A web app added to the Home Screen runs apart from Safari. It can hold the screen from iOS 18.4; on older versions, stay in Safari.',
            meta: ['iOS 18.4+', 'Home Screen app'],
          },
          {
            slug: 'android-chrome',
            line: 'Chrome 84 and later hold the screen from a visible tab. Leaving Chrome releases it, and some phones close apps they think are unused.',
            meta: ['Chrome 84+', 'Android'],
          },
        ],
      },
      {
        id: 'g-tablets',
        title: 'Tablets',
        line: 'Big screens that share space with a score, a PDF or slides.',
        items: [
          {
            slug: 'ipad',
            line: 'Put AwakeTab in a window beside your score, PDF or slides. A tab in the background releases the lock, and Low Power Mode forces a 30-second Auto-Lock.',
            meta: ['Safari 16.4+', 'iPadOS'],
          },
        ],
      },
      {
        id: 'g-computers',
        title: 'Computers',
        line: 'The display timeout is covered. Closing the lid is not: that always sleeps.',
        items: [
          {
            slug: 'windows-11',
            line: 'Chrome and Edge 84 and later hold the display from a visible tab. The same steps work on Windows 10.',
            meta: ['Chrome, Edge 84+', 'Windows'],
          },
          {
            slug: 'macos',
            line: 'In Chrome or Edge, a visible tab keeps the display on, and the Mac does not idle-sleep while it does. Safari 16.4 and Firefox 126 hold the display too.',
            meta: ['Safari, Chrome, Firefox', 'macOS'],
          },
          {
            slug: 'chromebook',
            line: 'ChromeOS follows Chrome 84 and later. A school or work policy can still force sleep, and closing the lid sleeps.',
            meta: ['Chrome 84+', 'ChromeOS'],
          },
          {
            slug: 'linux',
            line: "Firefox 126 and Chrome 84 and later ask the desktop to stay awake. Whether it holds depends on your desktop's idle settings.",
            meta: ['Firefox 126+, Chrome 84+', 'Linux'],
          },
        ],
      },
      {
        id: 'g-browsers',
        title: 'Browsers',
        line: 'The same rule everywhere: the page must be visible.',
        items: [
          {
            slug: 'edge',
            line: 'Edge 84 and later match Chrome. Sleeping tabs apply to tabs in the background, not the one you are looking at.',
            meta: ['Edge 84+', 'Windows, macOS'],
          },
          {
            slug: 'firefox',
            line: 'Firefox 126 and later hold the screen natively, and refuse at 5 % battery or less while not charging. Older versions offer the video fallback after a tap.',
            meta: ['Firefox 126+', 'Desktop, Android'],
          },
          {
            slug: 'samsung-internet',
            line: "Samsung Internet 14 and later use Chromium's wake lock. Adaptive battery and sleeping apps can still close the tab once it is in the background.",
            meta: ['Samsung Internet 14+', 'Android'],
          },
        ],
      },
    ],
  },
  vs: {
    crumb: 'Compare',
    lead: 'AwakeTab is instant and needs no installation, but it is not always the right tool. A native utility beats it when the screen must stay on with the browser out of sight. Some tools keep the whole computer awake, some fake input, and some are tabs like this one; each comparison uses dated facts and says plainly when the other tool is the better pick.',
    groups: [
      {
        id: 'g-tabs',
        title: 'Other tabs and libraries',
        line: 'The same approach as AwakeTab: the screen stays on while a page is visible.',
        items: [
          {
            slug: 'nosleep-page',
            line: 'Both keep a screen on from a visible tab. AwakeTab adds a status that only says awake when it is, an end time and session restore.',
            meta: ['Browser tab', 'Any browser'],
          },
          {
            slug: 'nosleep-js',
            line: 'Both try the Screen Wake Lock API first and a video second. NoSleep.js reports one yes or no; @awaketab/wake reports seven states and why.',
            meta: ['JavaScript library', 'For developers'],
          },
        ],
      },
      {
        id: 'g-mac',
        title: 'Mac apps and commands',
        line: 'Native tools can hold the whole Mac awake, with no window open.',
        items: [
          {
            slug: 'amphetamine',
            line: 'A native Mac app with triggers and closed-lid options. No web page can match that; pick it when the Mac must stay awake on its own.',
            meta: ['Mac app', 'macOS'],
          },
          {
            slug: 'caffeine',
            line: 'A menu bar app that holds the Mac awake with a power assertion, no window needed. AwakeTab holds the display only while its tab is visible.',
            meta: ['Mac app', 'macOS'],
          },
          {
            slug: 'caffeinate-command',
            line: 'caffeinate -di in Terminal keeps the system and the display awake. Use it for scripts and builds; use a tab when you want to see the state.',
            meta: ['Terminal command', 'macOS'],
          },
        ],
      },
      {
        id: 'g-windows',
        title: 'Windows tools',
        line: "Microsoft's own free utility.",
        items: [
          {
            slug: 'powertoys-awake',
            line: 'PowerToys Awake can keep Windows running with the display off. AwakeTab does the opposite: it keeps the display on from a visible tab.',
            meta: ['Windows utility', 'Windows 10 and 11'],
          },
        ],
      },
      {
        id: 'g-input',
        title: 'Tools that fake input',
        line: 'They move the pointer so chat apps show you as active.',
        items: [
          {
            slug: 'mouse-jigglers',
            line: 'Jigglers fake pointer motion so your status stays green. AwakeTab never fakes input; it only keeps the display on.',
            meta: ['USB or software', 'Any system'],
          },
        ],
      },
    ],
  },
  guides: {
    crumb: 'Guides',
    lead: 'Sometimes the real answer is a system setting, not a tab. These step-by-step fixes, grouped by system, show where the timeout lives, what to do when an option is greyed out, and when AwakeTab is the faster answer.',
    groups: [
      {
        id: 'g-phones',
        title: 'iPhone and Android',
        line: 'Timeouts the phone sets, not the page.',
        items: [
          {
            slug: 'iphone-auto-lock-never-greyed-out',
            line: 'Low Power Mode sets Auto-Lock to 30 seconds and greys out the rest. Turn it off in Settings, Battery; if it stays locked, a work or school profile sets it.',
            meta: ['iPhone', 'Settings fix'],
          },
          {
            slug: 'android-screen-timeout-one-app',
            line: 'Stock Android has one screen timeout for everything. AwakeTab covers its own Chrome tab only; other apps keep the system timeout.',
            meta: ['Android', 'Settings fix'],
          },
        ],
      },
      {
        id: 'g-windows',
        title: 'Windows',
        line: 'Power settings, the lock screen and work policies.',
        items: [
          {
            slug: 'windows-11-screen-turns-off-after-1-minute',
            line: "Usually the lock screen's own 60-second timeout, a 1-minute power setting, or a work policy. How to check each, with exact steps.",
            meta: ['Windows 11', 'Settings fix'],
          },
          {
            slug: 'lock-screen-vs-sleep',
            line: 'Display sleep and sign-in after idle are separate settings. AwakeTab holds off display sleep; a work lock screen can still appear. Covers Modern Standby too.',
            meta: ['Windows', 'Explainer'],
          },
        ],
      },
      {
        id: 'g-mac',
        title: 'Mac',
        line: 'What the lid and the power settings decide.',
        items: [
          {
            slug: 'mac-prevent-sleep-lid-closed',
            line: 'A closed lid sleeps the Mac and no web page can stop it. Clamshell mode with power and an external display, pmset or Amphetamine can.',
            meta: ['macOS', 'OS limit'],
          },
        ],
      },
      {
        id: 'g-any',
        title: 'Any computer',
        line: 'Browser settings and second screens.',
        items: [
          {
            slug: 'chrome-energy-saver',
            line: 'Energy Saver slows tabs in the background. A visible AwakeTab tab still holds the screen.',
            meta: ['Chrome', 'Explainer'],
          },
          {
            slug: 'second-monitor-turns-off',
            line: "If only the second screen goes dark, check the cable, DisplayPort MST and the monitor's own auto-off. A wake lock cannot fix a lost signal.",
            meta: ['Any system', 'Hardware check'],
          },
        ],
      },
    ],
  },
  learn: {
    crumb: 'Learn',
    lead: 'How AwakeTab keeps a screen awake, where a web page stops, and what each browser supports.',
    note: HONEST,
    groups: [
      {
        id: 'start',
        title: 'Start here',
        line: 'What AwakeTab does, where a browser stops, and the questions people ask most.',
        items: [{ slug: 'how-awaketab-works' }, { slug: 'honest-limits' }, { slug: 'faq' }],
      },
      {
        id: 'reference',
        title: 'Reference',
        line: 'Which browsers hold the screen, and the API underneath.',
        items: [{ slug: 'browser-support-matrix' }, { slug: 'screen-wake-lock-api-guide' }],
      },
      {
        id: 'behaviour',
        title: 'Behaviour',
        line: 'What a battery saver or a chat app does to a screen kept awake.',
        items: [{ slug: 'low-power-mode-and-wake-locks' }, { slug: 'does-a-wake-lock-keep-teams-green' }],
      },
      {
        id: 'trust',
        title: 'Trust',
        line: HONEST,
        items: [{ slug: 'how-we-tested' }],
      },
    ],
  },
};

export type { TSceneKey };

const USE_CASE_SCENE: Record<string, TSceneKey> = {
  cooking: 'cooking',
  presentations: 'presenting',
  teleprompter: 'presenting',
  classroom: 'presenting',
  'sheet-music': 'presenting',
  'video-calls': 'presenting',
  dashboards: 'dashboard',
  kiosk: 'success',
  downloads: 'history',
  'ai-agents': 'nightdesk',
  'night-clock': 'nightdesk',
  reading: 'nightdesk',
  'work-laptop': 'nightdesk',
  workouts: 'firstaction',
};

export const useCaseScene = (slug: string): TSceneKey => USE_CASE_SCENE[slug] ?? 'hero';

interface IHelpTopic {
  title: string;
  line: string;
  href: string;
  words: string;
  scene?: TSceneKey;
  link?: string;
}

const ALL_HELP_TOPICS: readonly IHelpTopic[] = [
  {
    title: 'My screen still goes dark',
    line: 'The three causes, and one fix for each.',
    href: '/learn/honest-limits',
    words: 'sleep sleeps dim dims off black battery saver hidden tab blocked fix',
    scene: 'error',
    link: 'Fix it',
  },
  {
    title: 'Keep an iPhone or iPad awake',
    line: 'What Safari supports and Low Power Mode.',
    href: '/on/iphone-safari',
    words: 'ios ipados safari ipad iphone apple low power mode auto-lock',
    scene: 'offline',
    link: 'Read the guide',
  },
  {
    title: 'Present without dimming',
    line: 'A checklist for talks and screen shares.',
    href: '/for/presentations',
    words: 'slides presenting presentation talk screen share meeting projector',
    scene: 'presenting',
    link: 'Read the guide',
  },
  {
    title: 'Pro, billing and refunds',
    line: 'Plans, cancelling, receipts.',
    href: '/pro',
    words: 'pro price pay payment cancel refund receipt licence license subscription billing',
    scene: 'success',
    link: 'Billing help',
  },
  {
    title: 'Privacy and your data',
    line: 'What stays on your device — almost everything.',
    href: '/privacy',
    words: 'privacy data analytics telemetry cookies delete export gdpr',
    scene: 'conflict',
    link: 'Read the policy',
  },
  {
    title: 'What changed recently',
    line: 'New faces, fixes and improvements.',
    href: '/changelog',
    words: 'changelog release new version update faces fixes',
    scene: 'history',
    link: 'See the changelog',
  },
  {
    title: 'Battery saver blocks the wake lock',
    line: 'Low Power Mode, Energy Saver and battery saver can still dim the screen.',
    href: '/learn/low-power-mode-and-wake-locks',
    words: 'battery saver low power mode energy saver dark dim blocked android',
  },
  {
    title: 'The extension shows a red badge',
    line: 'What the badge colours mean and how to clear a blocked state.',
    href: '/extension',
    words: 'extension chrome edge badge red blocked toolbar pinned',
  },
];

const ALL_HELP_CHIPS: ReadonlyArray<readonly [string, string]> = [
  ['Screen still sleeps', '/learn/honest-limits'],
  ['Battery saver', '/learn/low-power-mode-and-wake-locks'],
  ['iPhone and iPad', '/on/iphone-safari'],
  ['Extension', '/extension'],
  ['Billing', '/pro'],
];

// Billing help exists only while Pro is on.
export const HELP_TOPICS = ALL_HELP_TOPICS.filter((x) => PRO_ENABLED || x.href !== '/pro');
export const HELP_CHIPS = ALL_HELP_CHIPS.filter(([, href]) => PRO_ENABLED || href !== '/pro');
