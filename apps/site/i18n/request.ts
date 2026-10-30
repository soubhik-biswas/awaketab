import { hasLocale } from 'next-intl';
import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';
import en from '../messages/en.json';

type TMessages = typeof en;
type TTree = { [key: string]: string | TTree };

const LOADERS: Record<string, () => Promise<{ default: TTree }>> = {
  es: () => import('../messages/es.json'),
  'pt-br': () => import('../messages/pt-br.json'),
  de: () => import('../messages/de.json'),
  fr: () => import('../messages/fr.json'),
  ja: () => import('../messages/ja.json'),
  zh: () => import('../messages/zh.json'),
  hi: () => import('../messages/hi.json'),
};

// Untranslated keys fall back to English, as the old catalog loader did.
function merge(base: TTree, over: TTree): TTree {
  const out: TTree = { ...base };
  for (const [key, value] of Object.entries(over)) {
    const prev = out[key];
    out[key] = typeof value === 'object' && typeof prev === 'object' ? merge(prev, value) : value;
  }
  return out;
}

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;
  const load = LOADERS[locale];
  const messages = load ? (merge(en, (await load()).default) as TMessages) : en;
  return { locale, messages };
});
