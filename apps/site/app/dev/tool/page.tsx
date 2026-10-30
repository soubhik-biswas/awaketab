import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Tool } from '@/components/tool/tool';
import { isToolLang } from '@/lib/tool/strings';
import { QaTray } from './qa-tray';

export const metadata: Metadata = {
  title: 'The tool · dev',
  robots: { index: false, follow: false },
};

// Development builds only: the tool inside a device-sized frame, driven by the QA tray. Production answers 404.
export default async function DevToolPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  if (process.env.NODE_ENV === 'production') notFound();
  const q = await searchParams;
  const lang = typeof q.lang === 'string' && isToolLang(q.lang) ? q.lang : 'en';
  if (q.frame === '1') return <Tool lang={lang} qa welcome={q.welcome !== '0'} />;
  return <QaTray />;
}
