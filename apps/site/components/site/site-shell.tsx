import { getTranslations } from 'next-intl/server';
import type { ReactNode } from 'react';
import type { TLocale } from '@/i18n/locales';
import { Consent } from './consent';
import { SiteFooter } from './site-footer';
import { SiteHeader } from './site-header';

// Header, the analytics question inline under it, the page, then the footer (content-page board). The home page
// passes the tool as `top`, which takes the header's place: the tool first, then the question, the story and the footer.
export async function SiteShell({ locale, top, children }: { locale: TLocale; top?: ReactNode; children: ReactNode }) {
  const t = await getTranslations({ locale, namespace: 'site' });
  // The tool's stage is the home page's main landmark, so the story below it is a plain region.
  const Body = top ? 'div' : 'main';
  return (
    <div className="relative overflow-x-clip bg-background text-foreground">
      <div className="site-glow" aria-hidden="true" />
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
