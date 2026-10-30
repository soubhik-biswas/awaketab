import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import en from '@/messages/en.json';
import { SurfacesBoard } from './surfaces-board';

export const metadata: Metadata = {
  title: 'Mini clock, widgets and kiosk · dev',
  robots: { index: false, follow: false },
};

// A review page for development builds only, laid out like the mini clock, widgets and kiosk board; production 404s.
export default function DevSurfacesPage() {
  if (process.env.NODE_ENV === 'production') notFound();
  return (
    <NextIntlClientProvider locale="en" messages={{ surfaces: en.surfaces, embed: en.embed, tool: en.tool }}>
      <SurfacesBoard />
    </NextIntlClientProvider>
  );
}
