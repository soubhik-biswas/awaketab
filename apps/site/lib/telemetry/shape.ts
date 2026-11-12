import { isLocale } from '@/i18n/locales';

export type TViewport = 'phone' | 'tabletP' | 'tabletL' | 'desktop';

const HOST_RE = /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)*[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/u;
const TOKEN_RE = /^[a-z0-9_-]{1,32}$/u;
const NAME_RE = /^[A-Za-z0-9_]{1,40}$/u;

export const isHost = (value: string): boolean => HOST_RE.test(value);

// A short id such as a face, a background or a refusal reason; anything else is dropped, never trimmed to fit.
export function token(value: unknown): string {
  return typeof value === 'string' && TOKEN_RE.test(value) ? value : '';
}

// The ?ref= or ?utm_source= label. Dots become dashes so a source written as a domain is still counted.
export function refValue(value: unknown): string {
  return typeof value === 'string' ? token(value.toLowerCase().replace(/\./gu, '-')) : '';
}

export function refFromSearch(search: string): string {
  const query = new URLSearchParams(search);
  return refValue(query.get('ref')) || refValue(query.get('utm_source'));
}

export function hostName(value: unknown): string {
  if (typeof value !== 'string') return '';
  const host = value.toLowerCase().replace(/^www\./u, '');
  return isHost(host) ? host : '';
}

// The hostname of the page that linked here, never its path or query; empty for the site's own pages.
export function referrerHost(referrer: string, self: string): string {
  if (!referrer) return '';
  let host: string;
  try {
    host = new URL(referrer).hostname;
  } catch {
    return '';
  }
  const clean = hostName(host);
  return clean === hostName(self) ? '' : clean;
}

export function pagePath(pathname: string): string {
  const path = pathname.split(/[?#]/u)[0] ?? '';
  return (path.replace(/\/+$/u, '') || '/').slice(0, 200);
}

export function localeOf(path: string): string {
  const first = path.split('/')[1] ?? '';
  return isLocale(first) ? first : 'en';
}

// The pages that run a session: the home page and the kiosk, in every language.
export function isToolPath(path: string): boolean {
  const parts = path.split('/').filter(Boolean);
  const rest = parts[0] !== undefined && isLocale(parts[0]) ? parts.slice(1) : parts;
  return rest.length === 0 || (rest.length === 1 && rest[0] === 'kiosk');
}

// The tool's own layout tiers, so a count here means the layout the person saw.
export function viewportClass(width: number): TViewport {
  if (width >= 1300) return 'desktop';
  if (width >= 1100) return 'tabletL';
  if (width >= 700) return 'tabletP';
  return 'phone';
}

export function errorName(cause: unknown): string {
  const name = cause instanceof Error ? cause.name : '';
  return NAME_RE.test(name) ? name : 'Error';
}

// An error message cut to 120 characters, with link queries and anything shaped like an address or a number removed.
export function tidyMessage(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value
    .replace(/\s+/gu, ' ')
    .replace(/([a-z][a-z0-9+.-]*:\/\/[^\s?#"')]+)[?#][^\s"')]*/giu, '$1')
    .replace(/[^\s@]+@[^\s@]+\.[^\s@]+/gu, '[removed]')
    .replace(/\+?\d[\d\s().-]{7,}\d/gu, '[removed]')
    .trim()
    .slice(0, 120);
}
