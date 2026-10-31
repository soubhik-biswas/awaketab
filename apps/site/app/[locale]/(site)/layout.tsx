import type { ReactNode } from 'react';
import { SiteShell } from '@/components/site/site-shell';
import { localeParam } from '@/lib/seo';

export default async function SiteLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const locale = await localeParam(params);
  return <SiteShell locale={locale}>{children}</SiteShell>;
}
