import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { ManageDevices } from '@/components/pro/manage-devices';
import { englishOnly, pageMetadata, titleFor } from '@/lib/seo';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations({ locale: 'en', namespace: 'proflow.manage' });
  return pageMetadata({
    title: titleFor(t('h1')),
    description: t('description'),
    path: '/pro/manage',
    noindex: true,
    og: { image: 'og-04', alt: 'AwakeTab Pro: one setup, every screen' },
  });
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  await englishOnly(params);
  return <ManageDevices activateHref="/pro/activate" plansHref="/pro" />;
}
