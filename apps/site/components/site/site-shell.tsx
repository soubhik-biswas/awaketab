import { getTranslations } from 'next-intl/server';
import type { ReactNode } from 'react';
import type { TLocale } from '@/i18n/locales';
import { Consent } from './consent';
import { SiteFooter } from './site-footer';
import { SiteHeader } from './site-header';

// Header, the analytics question inline under it, the page, then the footer (content-page board).
export async function SiteShell({ locale, children }: { locale: TLocale; children: ReactNode }) {
  const t = await getTranslations({ locale, namespace: 'site' });
  return (
    <div className="relative overflow-x-clip bg-background text-foreground">
      <div className="site-glow" aria-hidden="true" />
      <SiteHeader locale={locale} />
      <Consent
        title={t('consent.title')}
        body={t('consent.body')}
        decline={t('consent.decline')}
        allow={t('consent.allow')}
      />
      <main
        id="content"
        tabIndex={-1}
        className="relative flex flex-col gap-11 pt-7 pb-12 outline-none min-[700px]:gap-[72px] min-[700px]:pt-[72px] min-[700px]:pb-24"
      >
        {children}
      </main>
      <SiteFooter locale={locale} />
    </div>
  );
}
