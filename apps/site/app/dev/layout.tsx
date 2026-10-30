import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import type { ReactNode } from 'react';
import { ThemeProvider } from '@/components/theme/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import '../globals.css';

const geist = Geist({ subsets: ['latin'], variable: '--font-geist', weight: ['300', '400', '500', '600', '700', '800'] });
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono', weight: ['400', '500', '700'] });

export const metadata: Metadata = { title: 'AwakeTab · dev', robots: { index: false, follow: false } };

// The dev galleries sit outside the locale routes, so they keep their own minimal root layout.
export default function DevLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${geist.variable} ${geistMono.variable}`}>
      <body>
        <ThemeProvider>
          <TooltipProvider>
            {children}
            <Toaster />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
