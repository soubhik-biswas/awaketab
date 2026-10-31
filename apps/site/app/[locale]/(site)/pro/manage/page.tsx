import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { ManageDevices } from '@/components/pro/manage-devices';
import { englishOnly, pageMetadata } from '@/lib/seo';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations({ locale: 'en', namespace: 'proflow.manage' });
  return pageMetadata({
    title: t('title'),
    description: t('description'),
    path: '/pro/manage',
    noindex: true,
    og: { kicker: 'AwakeTab Pro', title: t('h1'), tone: 'dark' },
  });
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  await englishOnly(params);
  return <ManageDevices activateHref="/pro/activate" plansHref="/pro" />;
}
