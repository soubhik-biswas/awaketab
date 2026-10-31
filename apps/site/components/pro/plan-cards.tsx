import { Check } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import * as s from '@/components/site/styles';
import { Button } from '@/components/ui/button';
import type { TLocale } from '@/i18n/locales';
import { priceLabel } from '@/lib/pro/plans';
import { cn } from '@/lib/utils';

const CARD = 'flex flex-col gap-[14px] rounded-[24px] bg-card p-[26px] text-foreground';
const PRICE = `${s.display} text-[34px] font-bold tracking-[-0.03em] min-[700px]:text-[44px]`;
const CTA = 'mt-auto h-[52px] gap-2 rounded-[12px] px-[18px] text-[15px] font-semibold';
const FREE = ['f1', 'f2', 'f3', 'f4', 'f5'] as const;
const PRO = ['f1', 'f2', 'f3', 'f4', 'f5', 'f6'] as const;

function Features({ items }: { items: readonly string[] }) {
  return (
    <ul className="m-0 flex list-none flex-col gap-2 p-0">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2.5 text-[15px] leading-[1.45]">
          <Check className="mt-0.5 size-[18px] flex-none text-lamp" strokeWidth={2.25} aria-hidden="true" />
          {item}
        </li>
      ))}
    </ul>
  );
}

// The Pro board's two plan cards. Free is the whole product on one screen; Pro only adds sync and priority help.
export async function PlanCards({
  locale,
  timerHref,
  checkoutHref,
}: {
  locale: TLocale;
  timerHref: string;
  checkoutHref: string;
}) {
  const t = await getTranslations({ locale, namespace: 'proflow.page' });
  return (
    <div className={s.grid[2]}>
      <div className={cn(CARD, 'border border-border')}>
        <strong className={s.h3}>{t('free.name')}</strong>
        <span className={PRICE}>{t('free.price')}</span>
        <span className={s.body}>{t('free.d')}</span>
        <Features items={FREE.map((k) => t(`free.${k}`))} />
        <Button asChild variant="outline" className={cn(CTA, 'border-input bg-transparent')}>
          <a href={timerHref}>{t('free.btn')}</a>
        </Button>
      </div>
      <div
        className={cn(
          CARD,
          'border-2 border-primary shadow-[0_20px_50px_color-mix(in_srgb,var(--primary)_12%,transparent)] dark:shadow-[0_20px_50px_color-mix(in_srgb,var(--primary)_18%,transparent)]',
        )}
      >
        <span className="flex items-center justify-between gap-3">
          <strong className={s.h3}>{t('pro.name')}</strong>
          <span className="rounded-full bg-primary-soft px-2.5 py-[3px] text-[13px] font-bold text-primary">
            {t('pro.badge')}
          </span>
        </span>
        <span className={PRICE}>{t('pro.price', { price: priceLabel('yearly') })}</span>
        <span className={s.body}>{t('pro.d', { price: priceLabel('monthly') })}</span>
        <Features items={PRO.map((k) => t(`pro.${k}`))} />
        <Button asChild className={CTA}>
          <a href={checkoutHref}>{t('pro.btn')}</a>
        </Button>
      </div>
    </div>
  );
}
