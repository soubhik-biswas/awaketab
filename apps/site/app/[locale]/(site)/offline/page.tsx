import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { SystemPage, systemMetadata } from '@/components/site/system-page';
import { localePath } from '@/i18n/locales';
import { PRO_ENABLED } from '@/lib/features';
import { toolHref } from '@/lib/routes';
import { localeParam } from '@/lib/seo';

// Sync only exists with Pro, so the free build's copy leaves it out.
const FREE = PRO_ENABLED ? '' : 'Free';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const locale = await localeParam(params);
  const t = await getTranslations({ locale, namespace: 'site.sys' });
  return systemMetadata(t('offline.h1'), t(`offline.description${FREE}`), localePath(locale, '/offline'), locale);
}

// The service worker shows this page, in the visitor's language, for an uncached address while offline; "Try again"
// reloads it.
export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const locale = await localeParam(params);
  const t = await getTranslations({ locale, namespace: 'site.sys' });
  return (
    <SystemPage
      eyebrow={t('offline.eyebrow')}
      h1={t('offline.h1')}
      lead={t(`offline.lead${FREE}`)}
      scene="offline"
      primary={{ href: toolHref(locale), label: t('offline.timer') }}
      secondary={{ href: '', label: t('retry') }}
    />
  );
}
