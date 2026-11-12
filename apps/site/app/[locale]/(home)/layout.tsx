import { getTranslations } from 'next-intl/server';
import type { ReactNode } from 'react';
import { SiteShell } from '@/components/site/site-shell';
import { Tool } from '@/components/tool';
import type { TLocale } from '@/i18n/locales';
import { TOOL_LANGS, type TToolLang } from '@/lib/tool/strings';
import { localeParam } from '@/lib/seo';

const toolLang = (locale: TLocale): TToolLang => TOOL_LANGS.find((l) => l === locale) ?? 'en';

// The home page is the tool: one screen-high frame first, then the story and the footer (home board). The small
// viewport height keeps the frame still while a phone's browser bars slide away on scroll.
export default async function HomeLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const locale = await localeParam(params);
  const t = await getTranslations({ locale, namespace: 'site.story' });
  return (
    <SiteShell
      locale={locale}
      top={
        <div className="relative h-svh overflow-hidden">
          <Tool lang={toolLang(locale)} className="h-full" />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-[18px] hidden justify-center font-mono text-[12px] tracking-[0.12em] text-muted-foreground-strong uppercase min-[700px]:flex"
          >
            {t('cue')}
          </span>
        </div>
      }
    >
      {children}
    </SiteShell>
  );
}
