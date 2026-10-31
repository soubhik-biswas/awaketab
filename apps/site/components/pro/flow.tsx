'use client';

import { Check, LoaderCircle, Sparkle, X } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';
import { Scene } from '@/components/scene/scene';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export const H1 =
  'm-0 font-display text-[36px] leading-[.98] font-bold tracking-[-0.04em] text-balance outline-none min-[700px]:text-[52px]';
export const LEAD = 'm-0 text-[17px] leading-[1.55] text-pretty text-muted-foreground-strong min-[700px]:text-[18px]';
export const PRIMARY = 'h-[52px] w-full gap-2 rounded-full px-[22px] text-[16px] font-bold min-[700px]:w-auto';
const OUTLINE =
  'h-[52px] w-full gap-2 rounded-full border-input px-[22px] text-[16px] font-semibold min-[700px]:w-auto';
export const LINK =
  'inline-flex min-h-11 items-center border-0 bg-transparent px-1 text-[15px] font-bold text-lamp underline underline-offset-[3px] outline-none focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-ring';
export const PANEL =
  'flex w-full flex-col gap-3.5 rounded-[24px] border border-border bg-card p-5 text-left min-[700px]:p-7';

const STEPS = ['s1', 's2', 's3', 's4'] as const;
const EASE = [0.16, 1, 0.3, 1] as const;

// The Pro accent: one serif-italic word in the volt → mint → violet gradient, as on the Pro panels.
export function Accent({ children }: { children: ReactNode }) {
  return (
    <span className="inline-block bg-clip-text pr-[.06em] font-accent text-[1.08em] font-normal tracking-[-0.01em] whitespace-nowrap text-transparent italic [background-image:linear-gradient(100deg,var(--lamp),#0e8f6a_45%,var(--primary))] dark:[background-image:linear-gradient(100deg,var(--lamp),#7cf0c8_45%,var(--primary))]">
      {children}
    </span>
  );
}

export function Kicker({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 font-mono text-[12px] tracking-[.14em] text-primary uppercase">
      <Sparkle className="size-3.5" fill="currentColor" strokeWidth={0} aria-hidden="true" />
      {children}
    </span>
  );
}

// Each step arrives with the system's 420 ms rise; reduced motion shows it in place.
export function Rise({
  children,
  className,
  role,
}: {
  children: ReactNode;
  className?: string;
  role?: 'status' | 'alert';
}) {
  const still = useReducedMotion();
  return (
    <motion.section
      role={role}
      aria-live={role ? 'polite' : undefined}
      initial={still ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.42, ease: EASE }}
      className={cn(
        'relative mx-auto flex w-full max-w-[600px] flex-col items-center gap-[18px] px-5 pt-10 pb-16 text-center min-[700px]:pt-16',
        className,
      )}
    >
      {children}
    </motion.section>
  );
}

// The Pro flow's bar: the Pro badge, the four steps and the way back to the timer.
export function FlowHeader({ step, backHref }: { step: number; backHref: string }) {
  const t = useTranslations('proflow');
  return (
    <div className="flex min-h-[72px] items-center gap-3 border-b border-border px-4 min-[700px]:px-10">
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
                      : 'bg-secondary text-muted-foreground-strong',
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

function Actions({ children }: { children: ReactNode }) {
  return <div className="flex w-full flex-wrap justify-center gap-2.5">{children}</div>;
}

export function Processing({ title, lead }: { title: string; lead: string }) {
  return (
    <Rise role="status">
      <LoaderCircle
        className="size-14 animate-spin text-lamp motion-reduce:animate-none"
        strokeWidth={2}
        aria-hidden="true"
      />
      <h1 className={H1} tabIndex={-1}>
        {title}
      </h1>
      <p className={LEAD}>{lead}</p>
    </Rise>
  );
}

export interface IFlowAction {
  label: string;
  href?: string;
  onClick?: () => void;
}

function ActionButton({ action, primary }: { action: IFlowAction; primary: boolean }) {
  const cls = primary ? PRIMARY : OUTLINE;
  const variant = primary ? 'default' : 'outline';
  return action.href ? (
    <Button asChild variant={variant} className={cls}>
      <a href={action.href}>{action.label}</a>
    </Button>
  ) : (
    <Button type="button" variant={variant} className={cls} onClick={action.onClick}>
      {action.label}
    </Button>
  );
}

// A finished or failed step: its scene, a headline, one line and at most two ways on.
export function Outcome({
  scene,
  title,
  lead,
  primary,
  secondary,
  tone = 'status',
}: {
  scene: 'success' | 'error' | 'noitems' | 'expired';
  title: ReactNode;
  lead: ReactNode;
  primary: IFlowAction;
  secondary?: IFlowAction;
  tone?: 'status' | 'alert';
}) {
  return (
    <Rise role={tone}>
      <Scene scene={scene} width={260} decorative />
      <h1 className={H1} tabIndex={-1}>
        {title}
      </h1>
      <p className={LEAD}>{lead}</p>
      <Actions>
        <ActionButton action={primary} primary />
        {secondary ? <ActionButton action={secondary} primary={false} /> : null}
      </Actions>
    </Rise>
  );
}
