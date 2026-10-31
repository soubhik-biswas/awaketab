import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { SystemPage, systemMetadata } from '@/components/site/system-page';
import { ROUTES, toolHref } from '@/lib/routes';
import { englishOnly } from '@/lib/seo';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations({ locale: 'en', namespace: 'site.sys.removed' });
  return systemMetadata(t('title'), t('lead'), ROUTES.removed, t('eyebrow'), t('h1'), 'removed');
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  await englishOnly(params);
  const t = await getTranslations({ locale: 'en', namespace: 'site.sys' });
  return (
    <SystemPage
      eyebrow={t('removed.eyebrow')}
      h1={t('removed.h1')}
      lead={t('removed.lead')}
      scene="removed"
      primary={{ href: toolHref(), label: t('removed.start') }}
      secondary={{ href: ROUTES.home, label: t('home') }}
    />
  );
}
