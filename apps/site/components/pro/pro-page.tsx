import { getTranslations } from 'next-intl/server';
import { Block, DataTable, Faq, Note, no, tx, yes, type TCell } from '@/components/site/blocks';
import { PageHero } from '@/components/site/page-hero';
import * as s from '@/components/site/styles';
import { localePath, type TLocale } from '@/i18n/locales';
import { launchOn, PLAN_PRICES, usd } from '@/lib/pro/plans';
import { toolHref } from '@/lib/routes';
import { cn } from '@/lib/utils';
import { PlanCards } from './plan-cards';

// The /pro page body: the content board's Pro hero, plans and billing questions, plus the comparison, refund
// note and business licences the Pro brief keeps.
export async function ProPage({ locale = 'en' }: { locale?: TLocale }) {
  const t = await getTranslations({ locale, namespace: 'proflow.page' });
  const c = (key: string) => t(`cmp.${key}`);
  const both = (key: string): readonly TCell[] => [tx(c(key), true), yes(c('yes')), yes(c('yes'))];
  const proOnly = (key: string): readonly TCell[] => [tx(c(key), true), no(c('no')), yes(c('yes'))];
  const split = (key: string): readonly TCell[] => [
    tx(c(`${key}._`), true),
    tx(c(`${key}.free`)),
    yes(c(`${key}.pro`)),
  ];
  const rows: ReadonlyArray<readonly TCell[]> = [
    both('awake'),
    both('lengths'),
    both('faces'),
    both('presets'),
    split('devices'),
    split('history'),
    split('sound'),
    proOnly('studio'),
    split('notes'),
    split('ext'),
    split('ads'),
  ];
  return (
    <>
      <PageHero eyebrow={t('eyebrow')} h1={t('h1')} lead={t('lead')} scene="success" />
      <Block label={t('plans.label')}>
        <PlanCards
          timerHref={toolHref(locale)}
          checkoutHref={localePath(locale, '/pro/checkout')}
          launch={launchOn()}
        />
      </Block>
      <Block id="compare" h={t('cmp.h2')}>
        <DataTable
          label={t('cmp.h2')}
          cols={[t('cmp.col.feature'), t('cmp.col.free'), t('cmp.col.pro')]}
          rows={rows}
          template="1.6fr 1fr 1fr"
        />
      </Block>
      <Block id="billing" h={t('faq.h2')}>
        <Faq
          items={[
            { q: t('faq.q1'), a: t('faq.a1') },
            { q: t('faq.q2'), a: t('faq.a2') },
            { q: t('faq.q3'), a: t('faq.a3') },
          ]}
        />
        <Note>{t('refund')}</Note>
      </Block>
      <Block id="business" h={t('biz.h2')}>
        <div className={s.grid[2]}>
          {(
            [
              ['embed', { price: usd(PLAN_PRICES.biz_embed_site_yearly) }],
              ['kiosk', { one: usd(PLAN_PRICES.biz_kiosk_site), five: usd(PLAN_PRICES.biz_kiosk_5) }],
            ] as const
          ).map(([key, vars]) => (
            <div key={key} className="flex flex-col gap-[14px] rounded-[24px] border border-border bg-card p-[26px]">
              <strong className={s.h3}>{t(`biz.${key}.name`)}</strong>
              <span className={cn('text-[22px] font-extrabold tracking-[-0.03em]')}>{t(`biz.${key}.price`, vars)}</span>
              <span className={s.body}>{t(`biz.${key}.text`)}</span>
            </div>
          ))}
        </div>
      </Block>
    </>
  );
}
