import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { ActivateFlow } from '@/components/pro/activate-flow';
import { toolHref } from '@/lib/routes';
import { englishOnly, pageMetadata } from '@/lib/seo';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations({ locale: 'en', namespace: 'proflow.activate' });
  return pageMetadata({
    title: t('title'),
    description: t('description'),
    path: '/pro/activate',
    noindex: true,
    og: { kicker: 'AwakeTab Pro', title: t('h1'), scene: 'success', tone: 'dark' },
  });
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  await englishOnly(params);
  return (
    <ActivateFlow timerHref={toolHref('en')} manageHref="/pro/manage" checkoutHref="/pro/checkout" plansHref="/pro" />
  );
}
