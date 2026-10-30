import { localePath, type TLocale } from '@/i18n/locales';

export const SITE = 'https://awaketab.com';

export const CONTACT_EMAIL = 'support@awaketab.com';
export const CONTACT_MAILTO = `mailto:${CONTACT_EMAIL}`;

// Where "Open the timer" goes. The home page carries the tool under its hero until the tool owns the whole page.
export const TOOL_ANCHOR = 'tool';
export const toolHref = (locale: TLocale = 'en'): string => `${localePath(locale, '/')}#${TOOL_ANCHOR}`;

export type TContentKind = 'for' | 'on' | 'vs' | 'guides' | 'learn';
export const CONTENT_KINDS: readonly TContentKind[] = ['for', 'on', 'vs', 'guides', 'learn'];

export const PRESET_ROUTES = ['15m', '30m', '45m', '1h', '2h', '4h', '8h'] as const;
export type TPresetRoute = (typeof PRESET_ROUTES)[number];

export const PRESET_ROUTE: Record<string, string> = {
  p15: '/15m',
  p30: '/30m',
  p45: '/45m',
  p60: '/1h',
  p120: '/2h',
  p240: '/4h',
  pinf: '/',
  custom: '/8h',
  until: '/',
};

// The tool route a content page starts: its preset's page, plus `?mode=` when the page has its own mode. Locale
// pages start the session on their locale home with the documented query params (docs/00 §7).
export function startHref(preset: string, mode: string, locale: TLocale = 'en'): string {
  if (locale !== 'en') {
    const q = new URLSearchParams({ preset });
    if (mode !== 'standard') q.set('mode', mode);
    return `${localePath(locale, '/')}?${q.toString()}`;
  }
  const route = PRESET_ROUTE[preset] ?? '/';
  return mode === 'standard' ? route : `${route}?mode=${mode}`;
}

// The board's sample addresses, kept as permanent aliases of the pages that already own those slugs.
export const ALIASES: Record<string, string> = {
  '/learn/browser-support': '/learn/browser-support-matrix',
  '/on/iphone-and-ipad': '/on/iphone-safari',
  '/vs/mouse-jiggler': '/vs/mouse-jigglers',
  '/guides/presenting': '/for/presentations',
  '/legal/privacy': '/privacy',
  '/legal/terms': '/terms',
};

export const ROUTES = {
  home: '/',
  useCases: '/for',
  devices: '/on',
  compare: '/vs',
  guides: '/guides',
  learn: '/learn',
  support: '/learn/browser-support-matrix',
  presenting: '/for/presentations',
  help: '/help',
  pro: '/pro',
  about: '/about',
  changelog: '/changelog',
  privacy: '/privacy',
  terms: '/terms',
  signin: '/signin',
  status: '/status',
  offline: '/offline',
  expired: '/signin/expired',
  removed: '/s/removed',
  extension: '/extension',
  library: '/library',
  embed: '/embed',
  kiosk: '/kiosk',
} as const;
