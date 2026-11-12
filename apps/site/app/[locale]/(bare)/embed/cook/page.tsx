import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { EmbedApp } from '@/components/embed/embed-app';
import { localeParam } from '@/lib/seo';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const locale = await localeParam(params);
  const t = await getTranslations({ locale, namespace: 'embed' });
  return { title: { absolute: `${t('frame.title')} · AwakeTab` }, robots: { index: false, follow: false } };
}

// The iframe app behind the website widget, in the language the loader asked for.
export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const locale = await localeParam(params);
  const t = await getTranslations({ locale, namespace: 'embed' });
  return (
    <>
      <h1 className="sr-only">{t('frame.title')}</h1>
      <EmbedApp />
    </>
  );
}
