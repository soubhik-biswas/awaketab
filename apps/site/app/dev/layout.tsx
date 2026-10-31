import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import type { ReactNode } from 'react';
import messages from '@/messages/en.json';
import { ThemeProvider } from '@/components/theme/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { FONT_VARIABLES } from '../fonts';
import '../globals.css';

export const metadata: Metadata = {
  title: 'AwakeTab · dev',
  robots: { index: false, follow: false },
  icons: { icon: [{ url: '/favicon.svg', type: 'image/svg+xml' }] },
};

// The dev galleries sit outside the locale routes, so they keep their own minimal root layout with the English copy.
export default function DevLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={FONT_VARIABLES}>
      <body>
        <NextIntlClientProvider locale="en" messages={messages} timeZone="UTC">
          <ThemeProvider>
            <TooltipProvider>
              {children}
              <Toaster />
            </TooltipProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
