import { isLocale, type TLocale } from '../../site/i18n/locales';
import { clockText } from '../../site/lib/clock-format';

export type TCatalog = Record<string, string>;
export type TVars = Record<string, string | number>;
export type TTranslate = (key: string, vars?: TVars) => string;

export { type TLocale };

const PLURAL = /\{(\w+), plural, one \{([^}]*)\} other \{([^}]*)\}\}/gu;
const TOKEN = /\{(\w+)\}/gu;

export function format(raw: string, vars?: TVars): string {
  if (!vars) return raw;
  const withPlural = raw.replace(PLURAL, (_m, name: string, one: string, other: string) => {
    const n = Number(vars[name] ?? 0);
    return (n === 1 ? one : other).replaceAll('#', String(n));
  });
  return withPlural.replace(TOKEN, (_m, name: string) => String(vars[name] ?? ''));
}

export function createTranslator(catalog: TCatalog, fallback: TCatalog = {}): TTranslate {
  return (key, vars) => format(catalog[key] ?? fallback[key] ?? key, vars);
}

function matchLocale(tags: readonly string[]): TLocale | null {
  for (const tag of tags) {
    const lower = tag.toLowerCase();
    if (lower.startsWith('pt')) return 'pt-br';
    if (lower.startsWith('zh')) return 'zh';
    const base = lower.split('-')[0] ?? '';
    if (isLocale(base)) return base;
  }
  return null;
}

// German, Spanish, French and Portuguese write the clock on a 24-hour dial, as the website's tool does.
const DIAL_24: readonly TLocale[] = ['de', 'es', 'fr', 'pt-br'];

export function dialOf(locale: TLocale, clock24h: boolean | null): 12 | 24 {
  return clock24h === true || DIAL_24.includes(locale) ? 24 : 12;
}

// The clock as each language writes it: 11:42 AM · 11:42 · 午前11:42 · 上午11:42 · सुबह 11:42.
export function clockTime(at: number, locale: TLocale, clock24h: boolean | null = null): string {
  const d = new Date(at);
  return clockText(d.getHours(), d.getMinutes(), locale, dialOf(locale, clock24h));
}

export function resolveLocale(setting: string | null | undefined, uiLanguage: string | undefined): TLocale {
  if (setting && isLocale(setting)) return setting;
  return (uiLanguage ? matchLocale([uiLanguage]) : null) ?? 'en';
}
