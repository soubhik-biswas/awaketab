export const LOCALES = ['en', 'es', 'pt-br', 'de', 'fr', 'ja', 'zh', 'hi'] as const;

export type TLocale = (typeof LOCALES)[number];

export interface ILocaleMeta {
  htmlLang: string;
  hreflang: string;
  label: string;
  reviewed: boolean;
}

export const LOCALE_META: Record<TLocale, ILocaleMeta> = {
  en: { htmlLang: 'en', hreflang: 'en', label: 'English', reviewed: true },
  es: { htmlLang: 'es', hreflang: 'es', label: 'Español', reviewed: false },
  'pt-br': { htmlLang: 'pt-BR', hreflang: 'pt-BR', label: 'Português (Brasil)', reviewed: false },
  de: { htmlLang: 'de', hreflang: 'de', label: 'Deutsch', reviewed: false },
  fr: { htmlLang: 'fr', hreflang: 'fr', label: 'Français', reviewed: false },
  ja: { htmlLang: 'ja', hreflang: 'ja', label: '日本語', reviewed: false },
  zh: { htmlLang: 'zh-Hans', hreflang: 'zh-Hans', label: '简体中文', reviewed: false },
  hi: { htmlLang: 'hi', hreflang: 'hi', label: 'हिन्दी', reviewed: false },
};

// Translated slugs are for the Latin-script locales only; ja, zh and hi keep the English slug (docs/00 §7).
export const TRANSLATED_SLUG_LOCALES: readonly TLocale[] = ['es', 'pt-br', 'de', 'fr'];

export function isLocale(value: string): value is TLocale {
  return (LOCALES as readonly string[]).includes(value);
}

export function localePath(locale: TLocale, pathname = '/'): string {
  const clean = pathname === '/' ? '' : `/${pathname.replace(/^\/+|\/+$/gu, '')}`;
  if (locale === 'en') return clean || '/';
  return `/${locale}${clean}`;
}
