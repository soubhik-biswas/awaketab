import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { SystemPage, systemMetadata } from '@/components/site/system-page';
import { toolHref } from '@/lib/routes';
import { englishOnly } from '@/lib/seo';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations({ locale: 'en', namespace: 'site.sys' });
  return systemMetadata(t('offline.h1'), t('offline.description'), '/offline');
}

// The service worker shows this page for an uncached address while offline; "Try again" reloads it.
export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  await englishOnly(params);
  const t = await getTranslations({ locale: 'en', namespace: 'site.sys' });
  return (
    <SystemPage
      eyebrow={t('offline.eyebrow')}
      h1={t('offline.h1')}
      lead={t('offline.lead')}
      scene="offline"
      primary={{ href: toolHref(), label: t('offline.timer') }}
      secondary={{ href: '', label: t('retry') }}
    />
  );
}
