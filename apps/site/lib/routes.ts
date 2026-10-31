import { localePath, type TLocale } from '@/i18n/locales';

export const SITE = 'https://awaketab.com';

// Where "Open the timer" goes: the home page is the tool. The anchor marks a page's own tool card.
export const TOOL_ANCHOR = 'tool';
export const toolHref = (locale: TLocale = 'en'): string => localePath(locale, '/');

// Feedback is the only support channel (no email anywhere): these open the tool with a panel already showing.
export type TToolPanel = 'feedback' | 'settings' | 'faces' | 'vibes';
export const panelHref = (panel: TToolPanel, locale: TLocale = 'en'): string => `${toolHref(locale)}?open=${panel}`;

export type TContentKind = 'for' | 'on' | 'vs' | 'guides' | 'learn';
export const CONTENT_KINDS: readonly TContentKind[] = ['for', 'on', 'vs', 'guides', 'learn'];

export const PRESET_ROUTES = ['15m', '30m', '45m', '1h', '2h', '4h', '8h'] as const;
export type TPresetRoute = (typeof PRESET_ROUTES)[number];

// A content page's start button opens the tool on the home page with the documented query params (docs/00 §7).
export function startHref(preset: string, mode: string, locale: TLocale = 'en'): string {
  const q = new URLSearchParams({ preset, autostart: '1' });
  if (mode !== 'standard') q.set('mode', mode);
  return `${toolHref(locale)}?${q.toString()}`;
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
  rss: '/rss.xml',
} as const;

export const SOURCE_URL = 'https://github.com/soubhik-biswas/awaketab';
