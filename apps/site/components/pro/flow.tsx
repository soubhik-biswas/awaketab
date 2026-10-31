'use client';

import { ArrowRight, Check, LoaderCircle, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { ComponentProps, ReactNode } from 'react';
import { Scene } from '@/components/scene/scene';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export const RISE = 'animate-[at-rise_520ms_cubic-bezier(0.16,1,0.3,1)_both]';
export const H1 = 'm-0 text-[34px] leading-[1.05] font-extrabold tracking-[-0.035em] min-[700px]:text-[44px]';
export const LEAD = 'm-0 text-[17px] leading-[1.55] text-muted-foreground-strong';
export const PRIMARY =
  'h-13 rounded-md px-[22px] text-[16px] font-bold shadow-[0_12px_30px_var(--site-act-glow)] [&_svg:not([class*=size-])]:size-[18px]';
const PRIMARY_FLAT = 'h-13 rounded-md px-[22px] text-[16px] font-bold';
const OUTLINE = 'h-13 rounded-md px-[22px] text-[16px] font-bold';
export const LINK =
  'min-h-11 border-0 bg-transparent px-1 text-[15px] font-semibold text-lamp underline underline-offset-[3px] outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring';

const STEPS = ['s1', 's2', 's3', 's4'] as const;

// The Pro flow's bar from the purchase board: Pro badge, the four steps, and the way back to the timer. Inside the
// site's header it sits flush under it in place of the board's own logo row.
export function FlowHeader({ step, backHref }: { step: number; backHref: string }) {
  const t = useTranslations('proflow');
  return (
    <div className="relative -mt-7 flex h-[72px] items-center gap-4 border-b border-border px-4 min-[700px]:-mt-[72px] min-[700px]:px-10">
      <span className="rounded-full bg-primary-soft px-2.5 py-[3px] text-[13px] font-bold text-primary">
        {t('flow.pro')}
      </span>
      <span className="flex-1" />
      <ol className="m-0 flex list-none gap-1.5 p-0" aria-label={t('flow.label')}>
        {STEPS.map((key, i) => {
          const done = i < step;
          const cur = i === step;
          return (
            <li
              key={key}
              aria-current={cur ? 'step' : undefined}
              className={cn(
                'inline-flex h-9 items-center gap-2 rounded-full border py-0 pr-3 pl-1.5 text-[14px]',
                cur
                  ? 'border-border bg-card font-bold text-foreground'
                  : 'border-transparent font-medium text-muted-foreground-strong',
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  'inline-flex size-6 items-center justify-center rounded-full text-[12px] font-bold',
                  done
                    ? 'bg-lamp text-lamp-foreground'
                    : cur
                      ? 'bg-foreground text-background'
                      : 'bg-surface-3 text-muted-foreground-strong',
                )}
              >
                {done ? <Check className="size-3" strokeWidth={3.5} /> : i + 1}
              </span>
              <span className={cn(!cur && 'sr-only min-[900px]:not-sr-only')}>{t(`steps.${key}`)}</span>
              {done ? <span className="sr-only">{t('flow.done')}</span> : null}
            </li>
          );
        })}
      </ol>
      <span className="flex-1" />
      <Button asChild variant="ghost" className="h-11 gap-2 rounded-[12px] px-3.5 text-[15px] font-semibold">
        <a href={backHref}>
          <X className="size-[18px]" strokeWidth={2} aria-hidden="true" />
          <span className="sr-only min-[700px]:not-sr-only">{t('flow.back')}</span>
        </a>
      </Button>
    </div>
  );
}

// The board's centred column: 520 px wide, 70 px from the bar, 18 px between items.
export function FlowColumn({ className, children, ...props }: ComponentProps<'section'>) {
  return (
    <section
      className={cn(
        'relative mx-auto flex w-full max-w-[560px] flex-col items-center gap-[18px] px-5 pt-10 text-center min-[700px]:pt-[70px]',
        className,
      )}
      {...props}
    >
      {children}
    </section>
  );
}

export function Actions({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap justify-center gap-2.5">{children}</div>;
}

export function Processing({ title, lead }: { title: string; lead: string }) {
  return (
    <FlowColumn role="status" aria-live="polite">
      <LoaderCircle className="size-14 animate-spinner text-lamp" strokeWidth={2} aria-hidden="true" />
      <h1 className={H1} tabIndex={-1}>
        {title}
      </h1>
      <p className={LEAD}>{lead}</p>
    </FlowColumn>
  );
}

export function Success({
  title,
  lead,
  open,
  openHref,
  add,
  addHref,
}: {
  title: string;
  lead: ReactNode;
  open: string;
  openHref: string;
  add: string;
  addHref: string;
}) {
  return (
    <FlowColumn className={RISE} role="status">
      <Scene scene="success" width={300} decorative />
      <h1 className={H1} tabIndex={-1}>
        {title}
      </h1>
      <p className={LEAD}>{lead}</p>
      <Actions>
        <Button asChild size="lg" className={PRIMARY_FLAT}>
          <a href={openHref}>{open}</a>
        </Button>
        <Button asChild variant="outline" size="lg" className={OUTLINE}>
          <a href={addHref}>{add}</a>
        </Button>
      </Actions>
    </FlowColumn>
  );
}

export function Declined({
  title,
  lead,
  again,
  onAgain,
  againHref,
  plans,
  plansHref,
  onPlans,
}: {
  title: string;
  lead: string;
  again: string;
  onAgain?: () => void;
  againHref?: string;
  plans: string;
  plansHref?: string;
  onPlans?: () => void;
}) {
  return (
    <FlowColumn className={RISE} role="alert">
      <Scene scene="error" width={260} decorative />
      <h1 className={H1} tabIndex={-1}>
        {title}
      </h1>
      <p className={LEAD}>{lead}</p>
      <Actions>
        {againHref ? (
          <Button asChild size="lg" className={PRIMARY}>
            <a href={againHref}>{again}</a>
          </Button>
        ) : (
          <Button type="button" size="lg" className={PRIMARY} onClick={onAgain}>
            {again}
          </Button>
        )}
        {plansHref ? (
          <Button asChild variant="outline" size="lg" className={OUTLINE}>
            <a href={plansHref}>{plans}</a>
          </Button>
        ) : (
          <Button type="button" variant="outline" size="lg" className={OUTLINE} onClick={onPlans}>
            {plans}
          </Button>
        )}
      </Actions>
    </FlowColumn>
  );
}

export function ContinueIcon() {
  return <ArrowRight className="size-[18px]" strokeWidth={2} aria-hidden="true" />;
}
