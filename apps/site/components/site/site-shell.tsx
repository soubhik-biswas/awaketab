import { getTranslations } from 'next-intl/server';
import type { ReactNode } from 'react';
import type { TLocale } from '@/i18n/locales';
import { STAGE_ID } from '@/lib/tool/ui';
import { Consent } from './consent';
import { SiteFooter } from './site-footer';
import { SiteHeader } from './site-header';

// Header, the analytics question inline under it, the page, then the footer (content-page board). The home page
// passes the tool as `top`, which takes the header's place: the tool first, then the question, the story and the footer.
export async function SiteShell({ locale, top, children }: { locale: TLocale; top?: ReactNode; children: ReactNode }) {
  const t = await getTranslations({ locale, namespace: 'site' });
  const tt = await getTranslations({ locale, namespace: 'tool' });
  // The tool's stage is the home page's main landmark, so the story below it is a plain region.
  const Body = top ? 'div' : 'main';
  return (
    <div className="relative overflow-x-clip bg-background text-foreground">
      <div className="site-glow" aria-hidden="true" />
      <a
        href={top ? `#${STAGE_ID}` : '#content'}
        className="sr-only z-50 inline-flex h-11 items-center rounded-[10px] border border-border bg-card px-4 text-[15px] font-semibold text-foreground no-underline shadow-e2 focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        {tt('skip')}
      </a>
      {top ?? <SiteHeader locale={locale} />}
      <Consent
        title={t('consent.title')}
        body={t('consent.body')}
        decline={t('consent.decline')}
        allow={t('consent.allow')}
      />
      <Body
        id="content"
        tabIndex={-1}
        className="relative flex flex-col gap-11 pt-7 pb-12 outline-none min-[700px]:gap-[72px] min-[700px]:pt-[72px] min-[700px]:pb-24"
      >
        {children}
      </Body>
      <SiteFooter locale={locale} />
    </div>
  );
}
