import type { Metadata } from 'next';
import { getLocale, getTranslations } from 'next-intl/server';
import { SystemPage, systemMetadata } from '@/components/site/system-page';
import { localePath, type TLocale } from '@/i18n/locales';
import { toolHref } from '@/lib/routes';

export async function generateMetadata(): Promise<Metadata> {
  const locale = (await getLocale()) as TLocale;
  const t = await getTranslations({ locale, namespace: 'site.sys.notfound' });
  return { ...systemMetadata(t('h1'), t('description'), '/404'), alternates: {} };
}

export default async function NotFound() {
  const locale = (await getLocale()) as TLocale;
  const t = await getTranslations({ locale, namespace: 'site' });
  return (
    <SystemPage
      eyebrow={t('sys.notfound.eyebrow')}
      h1={t('sys.notfound.h1')}
      lead={t('sys.notfound.lead')}
      scene="notfound"
      primary={{ href: toolHref(locale), label: t('cta._') }}
      secondary={{ href: localePath(locale, '/'), label: t('sys.home') }}
    />
  );
}
