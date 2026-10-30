import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono, Noto_Sans_Devanagari, Noto_Sans_JP, Noto_Sans_SC } from 'next/font/google';
import { notFound } from 'next/navigation';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import type { ReactNode } from 'react';
import { ThemeProvider } from '@/components/theme/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { LocaleLinksProvider } from '@/components/site/locale-links';
import { LOCALE_META, type TLocale } from '@/i18n/locales';
import { routing } from '@/i18n/routing';
import { SITE } from '@/lib/routes';
import '../globals.css';
import '@/components/site/site.css';

const geist = Geist({ subsets: ['latin'], variable: '--font-geist', weight: ['300', '400', '500', '600', '700', '800'] });
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono', weight: ['400', '500', '700'] });
const notoJp = Noto_Sans_JP({ variable: '--font-noto-jp', weight: ['400', '700'], preload: false });
const notoSc = Noto_Sans_SC({ variable: '--font-noto-sc', weight: ['400', '700'], preload: false });
const notoDeva = Noto_Sans_Devanagari({ variable: '--font-noto-deva', weight: ['400', '700'], preload: false });

const SCRIPT_FONT: Partial<Record<TLocale, string>> = {
  ja: notoJp.variable,
  zh: notoSc.variable,
  hi: notoDeva.variable,
};

// The client gets only what client components read; the tool adds its own namespaces here.
const CLIENT_NAMESPACES = ['site', 'content', 'account', 'tool'] as const;

// A returning visitor who already answered the analytics question never sees the box, not even for a frame.
const CONSENT_BOOT = `try{var o=JSON.parse(localStorage.getItem('at.v1.onboarding')||'null'),s=JSON.parse(localStorage.getItem('at.v1.settings')||'null');if((o&&Array.isArray(o.dismissedTips)&&o.dismissedTips.indexOf('analytics')>=0)||(s&&s.telemetry===false))document.documentElement.dataset.consent=''}catch(e){}`;

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  applicationName: 'AwakeTab',
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F6F4EF' },
    { media: '(prefers-color-scheme: dark)', color: '#070B16' },
  ],
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const messages = await getMessages();
  const client = Object.fromEntries(CLIENT_NAMESPACES.map((ns) => [ns, messages[ns]]));
  const fonts = [geist.variable, geistMono.variable, SCRIPT_FONT[locale]].filter(Boolean).join(' ');
  return (
    <html lang={LOCALE_META[locale].htmlLang} dir="ltr" suppressHydrationWarning className={fonts}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: CONSENT_BOOT }} />
      </head>
      <body>
        <NextIntlClientProvider locale={locale} messages={client}>
          <ThemeProvider>
            <TooltipProvider>
              <LocaleLinksProvider>{children}</LocaleLinksProvider>
              <Toaster />
            </TooltipProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
