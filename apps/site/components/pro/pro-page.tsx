import { getTranslations } from 'next-intl/server';
import { Block, Faq } from '@/components/site/blocks';
import { PageHero } from '@/components/site/page-hero';
import { localePath, type TLocale } from '@/i18n/locales';
import { toolHref } from '@/lib/routes';
import { PlanCards } from './plan-cards';

// The /pro page body, as the Pro board draws it: the hero, the Free and Pro cards, and the billing questions.
export async function ProPage({ locale = 'en' }: { locale?: TLocale }) {
  const t = await getTranslations({ locale, namespace: 'proflow.page' });
  return (
    <>
      <PageHero eyebrow={t('eyebrow')} h1={t('h1')} lead={t('lead')} scene="success" />
      <Block label={t('plans')}>
        <PlanCards locale={locale} timerHref={toolHref(locale)} checkoutHref={localePath(locale, '/pro/checkout')} />
      </Block>
      <Block id="billing" h={t('faq.h2')}>
        <Faq
          items={[
            { q: t('faq.q1'), a: t('faq.a1') },
            { q: t('faq.q2'), a: t('faq.a2') },
            { q: t('faq.q3'), a: t('faq.a3') },
          ]}
        />
      </Block>
    </>
  );
}
