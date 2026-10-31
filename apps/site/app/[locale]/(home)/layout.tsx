import type { ReactNode } from 'react';
import { SiteShell } from '@/components/site/site-shell';
import { Tool } from '@/components/tool';
import type { TLocale } from '@/i18n/locales';
import { TOOL_LANGS, type TToolLang } from '@/lib/tool/strings';
import { localeParam } from '@/lib/seo';

// The tool has drawn strings in five languages; the others open the English tool above their own story.
const toolLang = (locale: TLocale): TToolLang => TOOL_LANGS.find((l) => l === locale) ?? 'en';

// The home page is the tool: one screen-high frame first, then the analytics question, the story and the footer.
// The small viewport height keeps the frame still while a phone's browser bars slide away on scroll.
export default async function HomeLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const locale = await localeParam(params);
  return (
    <SiteShell
      locale={locale}
      top={
        <div className="relative h-svh overflow-hidden border-b border-border">
          <Tool lang={toolLang(locale)} className="h-full" />
        </div>
      }
    >
      {children}
    </SiteShell>
  );
}
