import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { localeParam } from '@/lib/seo';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const locale = await localeParam(params);
  const t = await getTranslations({ locale, namespace: 'page.pip' });
  return { title: { absolute: t('title') }, robots: { index: false, follow: false } };
}

// The popup fallback for Document Picture-in-Picture, in the opener's language; the mini clock fills it.
export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const locale = await localeParam(params);
  const t = await getTranslations({ locale, namespace: 'page.pip' });
  return (
    <div data-pip-shell="" className="grid min-h-dvh place-items-center p-4">
      <h1 className="sr-only">{t('title')}</h1>
    </div>
  );
}
