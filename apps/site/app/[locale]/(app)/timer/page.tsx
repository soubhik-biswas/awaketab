import type { Metadata } from 'next';
import { Tool } from '@/components/tool';
import { localeParam, pageMetadata } from '@/lib/seo';
import { TIMER_PATH } from '@/lib/routes';

const TOOL_LANGS = ['en', 'de', 'ja', 'zh', 'hi'] as const;
type TToolLang = (typeof TOOL_LANGS)[number];

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata({
    title: 'Keep your screen awake · AwakeTab',
    description: 'Keep the screen awake for as long as you choose, see when it will sleep again, then let it sleep.',
    path: TIMER_PATH,
    og: { kicker: 'AWAKETAB', title: 'Keep your screen awake', scene: 'hero', tone: 'dark' },
  });
}

export default async function TimerPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = await localeParam(params);
  const lang: TToolLang = (TOOL_LANGS as readonly string[]).includes(locale) ? (locale as TToolLang) : 'en';
  return <Tool lang={lang} />;
}
