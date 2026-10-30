import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { CheckoutFlow } from '@/components/pro/checkout-flow';
import { toolHref } from '@/lib/routes';
import { englishOnly, pageMetadata } from '@/lib/seo';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations({ locale: 'en', namespace: 'proflow.checkout' });
  return pageMetadata({
    title: t('title'),
    description: t('description'),
    path: '/pro/checkout',
    noindex: true,
    og: { kicker: t('kicker'), title: t('plans.h1'), scene: 'success', tone: 'dark' },
  });
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  await englishOnly(params);
  return <CheckoutFlow backHref={toolHref('en')} />;
}
