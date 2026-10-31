import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { SystemPage, systemMetadata } from '@/components/site/system-page';
import { ROUTES } from '@/lib/routes';
import { englishOnly } from '@/lib/seo';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations({ locale: 'en', namespace: 'site.sys.expired' });
  return systemMetadata(t('h1'), t('description'), ROUTES.expired);
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  await englishOnly(params);
  const t = await getTranslations({ locale: 'en', namespace: 'site.sys' });
  return (
    <SystemPage
      eyebrow={t('expired.eyebrow')}
      h1={t('expired.h1')}
      lead={t('expired.lead')}
      scene="expired"
      primary={{ href: ROUTES.signin, label: t('expired.send') }}
      secondary={{ href: ROUTES.home, label: t('home') }}
    />
  );
}
