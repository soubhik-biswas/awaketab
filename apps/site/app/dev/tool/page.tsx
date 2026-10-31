import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { Tool } from '@/components/tool/tool';
import en from '@/messages/en.json';
import { isToolLang, type TToolLang } from '@/lib/tool/strings';
import { QaTray } from './qa-tray';

export const metadata: Metadata = {
  title: 'The tool · dev',
  robots: { index: false, follow: false },
};

type TTree = { [key: string]: string | TTree };

const LOADERS: Record<Exclude<TToolLang, 'en'>, () => Promise<{ default: TTree }>> = {
  de: () => import('@/messages/de.json'),
  ja: () => import('@/messages/ja.json'),
  zh: () => import('@/messages/zh.json'),
  hi: () => import('@/messages/hi.json'),
  es: () => import('@/messages/es.json'),
  fr: () => import('@/messages/fr.json'),
  'pt-br': () => import('@/messages/pt-br.json'),
};

function merge(base: TTree, over: TTree): TTree {
  const out: TTree = { ...base };
  for (const [key, value] of Object.entries(over)) {
    const prev = out[key];
    out[key] = typeof value === 'object' && typeof prev === 'object' ? merge(prev, value) : value;
  }
  return out;
}

// Development builds only: the tool inside a device-sized frame, driven by the QA tray, in any of its five
// languages (untranslated strings fall back to English, as on the site). Production answers 404.
export default async function DevToolPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  if (process.env.NODE_ENV === 'production') notFound();
  const q = await searchParams;
  const lang: TToolLang = typeof q.lang === 'string' && isToolLang(q.lang) ? q.lang : 'en';
  if (q.frame !== '1') return <QaTray />;
  const base = en as unknown as TTree;
  const messages = lang === 'en' ? base : merge(base, (await LOADERS[lang]()).default);
  return (
    <NextIntlClientProvider locale={lang} messages={messages} timeZone="UTC">
      <Tool lang={lang} qa />
    </NextIntlClientProvider>
  );
}
