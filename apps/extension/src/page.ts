import { STORAGE_KEYS, type ISettings } from '@awaketab/core';
import { LOCALE_META } from '../../web/src/i18n/locales';
import { markSvg, type MarkState } from '../../web/src/lib/mark';
import type { IExtApi } from './api';
import { createTimeFormat, type TTimeFormat } from './format';
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

export interface IPageContext {
  api: IExtApi;
  settings: ISettings;
  locale: TLocale;
  lang: string;
  t: TTranslate;
  time: TTimeFormat;
}

export function applyTheme(settings: ISettings, root: HTMLElement = document.documentElement): void {
  if (settings.theme === 'auto') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', settings.theme);
}

export function translateTree(root: ParentNode, t: TTranslate): void {
  for (const el of root.querySelectorAll<HTMLElement>('[data-i18n]')) el.textContent = t(el.dataset.i18n ?? '');
  for (const el of root.querySelectorAll<HTMLElement>('[data-i18n-aria]'))
    el.setAttribute('aria-label', t(el.dataset.i18nAria ?? ''));
  for (const el of root.querySelectorAll<HTMLElement>('[data-i18n-title]')) el.title = t(el.dataset.i18nTitle ?? '');
}

async function translatorFor(locale: TLocale): Promise<TTranslate> {
  const [catalog, english] = await Promise.all([
    CATALOGS[locale]().then((m) => m.default),
    locale === 'en' ? Promise.resolve(null) : CATALOGS.en().then((m) => m.default),
  ]);
  return createTranslator(catalog, english ?? {});
}

export async function switchLocale(ctx: IPageContext, setting: string | null): Promise<void> {
  const locale = resolveLocale(setting, ctx.api.i18n?.getUILanguage() ?? navigator.language);
  ctx.locale = locale;
  ctx.lang = LOCALE_META[locale].htmlLang;
  ctx.t = await translatorFor(locale);
  ctx.time = createTimeFormat({ lang: ctx.lang, clock24h: ctx.settings.ambient.clock24h, t: ctx.t });
  document.documentElement.lang = ctx.lang;
}

export async function loadPage(api: IExtApi): Promise<IPageContext> {
  const stored = await api.storage.local.get(STORAGE_KEYS.settings);
  const settings = readSettings(stored[STORAGE_KEYS.settings]);
  const locale = resolveLocale(settings.locale, api.i18n?.getUILanguage() ?? navigator.language);
  const t = await translatorFor(locale);
  const lang = LOCALE_META[locale].htmlLang;
  document.documentElement.lang = lang;
  applyTheme(settings);
  return { api, settings, locale, lang, t, time: createTimeFormat({ lang, clock24h: settings.ambient.clock24h, t }) };
}

export async function send(api: IExtApi, request: TExtRequest): Promise<IExtState | null> {
  try {
    return (await api.runtime.sendMessage(request)) as IExtState | null;
  } catch {
    return null;
  }
}

export function q<T extends Element = HTMLElement>(root: ParentNode, selector: string, type?: new () => T): T {
  const el = root.querySelector(selector);
  const expected = type ?? (HTMLElement as unknown as new () => T);
  if (!(el instanceof expected)) throw new Error(`missing ${selector}`);
  return el;
}

export function show(el: Element, on: boolean): boolean {
  (el as HTMLElement).hidden = !on;
  return on;
}

// The brand mark (the shared web geometry) into every `[data-mark-slot]`: data-size, data-state, data-glow="0".
export function paintMark(slot: HTMLElement, state?: MarkState): void {
  const next = state ?? (slot.dataset.state as MarkState | undefined) ?? 'awake';
  if (slot.dataset.drawn === next) return;
  slot.dataset.drawn = next;
  slot.innerHTML = markSvg({ size: Number(slot.dataset.size ?? 26), state: next, glow: slot.dataset.glow !== '0' });
}

export function paintMarks(root: ParentNode): void {
  for (const slot of root.querySelectorAll<HTMLElement>('[data-mark-slot]')) paintMark(slot);
}
