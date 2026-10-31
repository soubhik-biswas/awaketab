import { STORAGE_KEYS, type ISettings } from '@awaketab/core';
import { LOCALE_META } from '../../site/i18n/locales';
import type { IExtApi } from './api';
import { createTranslator, resolveLocale, type TCatalog, type TLocale, type TTranslate } from './i18n';
import type { IExtState, TExtRequest } from './messages';
import { readSettings } from './settings';

const CATALOGS: Record<TLocale, () => Promise<{ default: TCatalog }>> = {
  en: () => import('virtual:at-catalog/en'),
  es: () => import('virtual:at-catalog/es'),
  'pt-br': () => import('virtual:at-catalog/pt-br'),
  de: () => import('virtual:at-catalog/de'),
  fr: () => import('virtual:at-catalog/fr'),
  ja: () => import('virtual:at-catalog/ja'),
  zh: () => import('virtual:at-catalog/zh'),
  hi: () => import('virtual:at-catalog/hi'),
};

export type TPageTheme = 'light' | 'dark' | 'oled';

export interface IPageContext {
  api: IExtApi;
  settings: ISettings;
  locale: TLocale;
  t: TTranslate;
}

const LIGHT = '(prefers-color-scheme: light)';

export function resolveTheme(setting: ISettings['theme']): TPageTheme {
  if (setting === 'light' || setting === 'dark' || setting === 'oled') return setting;
  return typeof matchMedia === 'function' && matchMedia(LIGHT).matches ? 'light' : 'dark';
}

// The page follows the stored theme; Auto follows the system setting live.
export function watchTheme(setting: ISettings['theme'], onTheme: (theme: TPageTheme) => void): () => void {
  const apply = () => {
    const theme = resolveTheme(setting);
    document.documentElement.dataset.theme = theme;
    onTheme(theme);
  };
  apply();
  if (setting !== 'auto' || typeof matchMedia !== 'function') return () => undefined;
  const mq = matchMedia(LIGHT);
  mq.addEventListener('change', apply);
  return () => {
    mq.removeEventListener('change', apply);
  };
}

export async function loadPage(api: IExtApi): Promise<IPageContext> {
  const stored = await api.storage.local.get(STORAGE_KEYS.settings);
  const settings = readSettings(stored[STORAGE_KEYS.settings]);
  const locale = resolveLocale(settings.locale, api.i18n?.getUILanguage() ?? navigator.language);
  const [catalog, english] = await Promise.all([
    CATALOGS[locale]().then((m) => m.default),
    locale === 'en' ? Promise.resolve(null) : CATALOGS.en().then((m) => m.default),
  ]);
  document.documentElement.lang = LOCALE_META[locale].htmlLang;
  return { api, settings, locale, t: createTranslator(catalog, english ?? {}) };
}

export async function send(api: IExtApi, request: TExtRequest): Promise<IExtState | null> {
  try {
    return (await api.runtime.sendMessage(request)) as IExtState | null;
  } catch {
    return null;
  }
}
