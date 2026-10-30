'use client';

import { Check } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import * as s from '@/components/site/styles';
import { Button } from '@/components/ui/button';
import { launchDay, launchOn, PLAN_PRICES, usd } from '@/lib/pro/plans';
import { cn } from '@/lib/utils';

// The launch price ends on a fixed day; a page built before it corrects itself in the browser.
export function useLaunch(initial: boolean): boolean {
  const [on, setOn] = useState(initial);
  useEffect(() => {
    setOn(launchOn());
  }, []);
  return on;
}

function Feature({ children }: { children: string }) {
  return (
    <li className="flex items-start gap-2.5 text-[15px] leading-[1.45]">
      <Check className="mt-0.5 size-[18px] flex-none text-lamp" strokeWidth={2.25} aria-hidden="true" />
      {children}
    </li>
  );
}

const CARD = 'flex flex-col gap-[14px] rounded-[24px] bg-card p-[26px]';
const BADGE = 'rounded-full bg-primary-soft px-2.5 py-[3px] text-[13px] font-bold text-primary';
const PRICE = 'font-display text-[34px] font-extrabold tracking-[-0.03em] [font-stretch:112%] min-[700px]:text-[44px]';
const CTA = 'h-13 rounded-[12px] px-[18px] text-[15px]';

// The two plan cards of the content page's Pro board, with the real prices.
export function PlanCards({ timerHref, checkoutHref, launch }: { timerHref: string; checkoutHref: string; launch: boolean }) {
  const t = useTranslations('proflow.page');
  const on = useLaunch(launch);
  const once = usd(on ? PLAN_PRICES.pro_lifetime_launch : PLAN_PRICES.pro_lifetime);
  const free = ['f1', 'f2', 'f3', 'f4', 'f5'] as const;
  const pro = ['f1', 'f2', 'f3', 'f4', 'f5', 'f6'] as const;
  return (
    <div className={s.grid[2]}>
      <div className={cn(CARD, 'border border-border')}>
        <span className="flex items-center justify-between">
          <strong className={s.h3}>{t('free.name')}</strong>
        </span>
        <span className={PRICE}>{t('free.price')}</span>
        <span className={s.body}>{t('free.d')}</span>
        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          {free.map((k) => (
            <Feature key={k}>{t(`free.${k}`)}</Feature>
          ))}
        </ul>
        <Button asChild variant="outline" size="lg" className={CTA}>
          <a href={timerHref}>{t('free.btn')}</a>
        </Button>
      </div>
      <div className={cn(CARD, 'border-2 border-primary shadow-[0_20px_50px_var(--site-pro-glow)]')}>
        <span className="flex items-center justify-between">
          <strong className={s.h3}>{t('pro.name')}</strong>
          <span className={BADGE}>{t('pro.badge')}</span>
        </span>
        <span className={PRICE}>{t('pro.price', { yearly: usd(PLAN_PRICES.pro_yearly) })}</span>
        <span className={s.body}>
          {on
            ? t('pro.d.launch', { once, date: launchDay(), after: usd(PLAN_PRICES.pro_lifetime) })
            : t('pro.d._', { once })}
        </span>
        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          {pro.map((k) => (
            <Feature key={k}>{t(`pro.${k}`)}</Feature>
          ))}
        </ul>
        <Button asChild size="lg" className={CTA}>
          <a href={checkoutHref}>{t('pro.btn')}</a>
        </Button>
      </div>
    </div>
  );
}
