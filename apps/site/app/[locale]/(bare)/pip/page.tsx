import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { PipPage } from '@/components/pip/pip-page';
import { localeParam } from '@/lib/seo';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const locale = await localeParam(params);
  const t = await getTranslations({ locale, namespace: 'page.pip' });
  return { title: { absolute: t('title') }, robots: { index: false, follow: false } };
}

// The popup fallback for Document Picture-in-Picture, in the opener's language, with no site chrome.
export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  await localeParam(params);
  return <PipPage />;
}
