import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { CheckoutFlow } from '@/components/pro/checkout-flow';
import { toolHref } from '@/lib/routes';
import { englishOnly, pageMetadata, titleFor } from '@/lib/seo';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations({ locale: 'en', namespace: 'proflow.checkout' });
  return pageMetadata({
    title: titleFor(t('plans.h1')),
    description: t('description'),
    path: '/pro/checkout',
    noindex: true,
    og: { image: 'og-04', alt: 'AwakeTab Pro: one setup, every screen' },
  });
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  await englishOnly(params);
  return <CheckoutFlow backHref={toolHref('en')} />;
}
