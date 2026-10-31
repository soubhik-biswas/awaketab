'use client';

import { Check, Lock } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { RadioGroup } from 'radix-ui';
import { useCallback, useEffect, useRef, useState } from 'react';
import { FORM_CARD } from '@/components/auth/sign-in';
import { SignInButtons } from '@/components/auth/sign-in-buttons';
import { Button } from '@/components/ui/button';
import { fetchAuthStatus } from '@/lib/auth/client';
import type { IAuthStatus } from '@/lib/auth/shared';
import { CHECKOUT_STEPS, checkoutUrl, STEP_INDEX, type TCheckoutStep } from '@/lib/pro/flow';
import { planOf, priceLabel, TRIAL_DAYS, yearlySaving, type TProPlan } from '@/lib/pro/plans';
import { syncAccount } from '@/lib/pro/session';
import { cn } from '@/lib/utils';
import { Accent, FlowHeader, H1, Kicker, LEAD, LINK, PANEL, PRIMARY, Rise } from './flow';

const UNKNOWN: IAuthStatus = { ready: true, google: true, github: true, passkey: true };
const FEATURES = ['f1', 'f2', 'f3', 'f4', 'f5'] as const;
const PLANS: readonly TProPlan[] = ['yearly', 'monthly'];

// /pro/checkout: plan → account → pay, then the payment provider returns to /pro/activate. The plan step is the Pro
// offer panel; the account step is the three sign-in buttons, skipped when already signed in or when sign-in is
// not set up on this site.
export function CheckoutFlow({ backHref }: { backHref: string }) {
  const t = useTranslations('proflow.checkout');
  const [step, setStep] = useState<TCheckoutStep>('plans');
  const [plan, setPlan] = useState<TProPlan>('yearly');
  const [status, setStatus] = useState<IAuthStatus>(UNKNOWN);
  const [signed, setSigned] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const known = useRef({ signed: false, ready: true });

  const go = useCallback((next: TCheckoutStep, focus = true) => {
    // Paying needs an account when sign-in exists; anything that skips ahead without one lands on the account step.
    const target = next === 'account' && (known.current.signed || !known.current.ready) ? 'pay' : next;
    const final = target === 'pay' && !known.current.signed && known.current.ready ? 'account' : target;
    setStep(final);
    if (window.location.hash.slice(1) !== final)
      history.replaceState(null, '', `${window.location.pathname}${window.location.search}#${final}`);
    if (focus) requestAnimationFrame(() => root.current?.querySelector<HTMLElement>('h1')?.focus());
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setPlan(planOf(params.get('plan')));
    setUnavailable(params.get('checkout') === 'unavailable');
    const start = window.location.hash.slice(1) as TCheckoutStep;
    void Promise.all([fetchAuthStatus(), syncAccount()]).then(([auth, account]) => {
      if (auth) setStatus(auth);
      known.current = {
        signed: account.state === 'signed-in' || (account.state === 'offline' && account.account !== null),
        ready: auth ? auth.ready : true,
      };
      setSigned(known.current.signed);
      go(CHECKOUT_STEPS.includes(start) ? start : 'plans', false);
    });
  }, [go]);

  const choose = (next: TProPlan) => {
    setPlan(next);
    const q = new URLSearchParams(window.location.search);
    q.set('plan', next);
    history.replaceState(null, '', `${window.location.pathname}?${q.toString()}${window.location.hash}`);
  };

  const onSigned = () => {
    known.current.signed = true;
    setSigned(true);
    go('pay');
  };

  return (
    <div ref={root} className="relative flex flex-col">
      <FlowHeader step={STEP_INDEX[step]} backHref={backHref} />

      {step === 'plans' ? (
        <Rise key="plans" className="items-stretch text-left">
          <div className="flex flex-col gap-2 rounded-[22px] border border-border bg-card p-[18px] [background-image:radial-gradient(120%_100%_at_0%_0%,color-mix(in_srgb,var(--primary)_8%,transparent),transparent_60%)] dark:[background-image:radial-gradient(120%_100%_at_0%_0%,color-mix(in_srgb,var(--primary)_20%,transparent),transparent_60%)]">
            <Kicker>{t('kicker')}</Kicker>
            <h1 className={H1} tabIndex={-1}>
              {t('h1a')} <Accent>{t('h1b')}</Accent>
            </h1>
            <p className="m-0 text-[15px] leading-[1.5] text-muted-foreground-strong">{t('lead')}</p>
          </div>
          <RadioGroup.Root
            value={plan}
            onValueChange={(v) => choose(planOf(v))}
            aria-label={t('plan')}
            className="grid grid-cols-2 gap-2.5"
          >
            {PLANS.map((p) => {
              const on = plan === p;
              return (
                <RadioGroup.Item
                  key={p}
                  value={p}
                  className={cn(
                    'flex flex-col gap-1.5 rounded-[18px] bg-card p-4 text-left text-foreground outline-none focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-ring',
                    on
                      ? 'border-2 border-primary shadow-[0_0_0_4px_color-mix(in_srgb,var(--primary)_10%,transparent)] dark:shadow-[0_0_0_4px_color-mix(in_srgb,var(--primary)_16%,transparent)]'
                      : 'border border-border',
                  )}
                >
                  <span className="flex items-center justify-between gap-2">
                    <strong className="text-[15px] font-semibold">{t(`${p}.name`)}</strong>
                    {p === 'yearly' ? (
                      <span className="flex-none rounded-full bg-lamp/10 px-2.5 py-1 font-mono text-[12px] font-bold text-[#0b5f2d] dark:bg-lamp/14 dark:text-lamp">
                        {t('save', { n: yearlySaving() })}
                      </span>
                    ) : null}
                  </span>
                  <span className="font-display text-[22px] font-bold tracking-[-0.02em]">
                    {t(`${p}.price`, { price: priceLabel(p) })}
                  </span>
                  <span className="text-[13px] leading-[1.45] text-muted-foreground-strong">{t(`${p}.d`)}</span>
                </RadioGroup.Item>
              );
            })}
          </RadioGroup.Root>
          <ul className="m-0 flex list-none flex-col overflow-hidden rounded-[18px] border border-border bg-card p-0">
            {FEATURES.map((k) => (
              <li key={k} className="flex min-h-[52px] items-center gap-3 px-4 py-2 [&+&]:border-t [&+&]:border-border">
                <span className="flex size-[26px] flex-none items-center justify-center rounded-full bg-primary/8 text-primary dark:bg-primary/14">
                  <Check className="size-4" strokeWidth={2.5} aria-hidden="true" />
                </span>
                <span className="text-[15px] font-semibold">{t(`features.${k}`)}</span>
              </li>
            ))}
          </ul>
          <span className="text-[13px] leading-[1.5] text-muted-foreground-strong">
            {t('note', { days: TRIAL_DAYS, price: priceLabel('yearly') })}
          </span>
          <Button type="button" className={cn(PRIMARY, 'min-[700px]:w-full')} onClick={() => go('account')}>
            {t('trial', { days: TRIAL_DAYS })}
          </Button>
          <span className="text-center text-[13px] text-muted-foreground-strong">{t('secure')}</span>
        </Rise>
      ) : null}

      {step === 'account' ? (
        <Rise key="account">
          <h1 className={H1} tabIndex={-1}>
            {t('account.h1')}
          </h1>
          <p className={LEAD}>{t('account.lead')}</p>
          <div className={cn(FORM_CARD, 'text-left')}>
            <SignInButtons status={status} callbackURL={`/pro/checkout?plan=${plan}#pay`} onSigned={onSigned} />
          </div>
          <button type="button" className={LINK} onClick={() => go('plans')}>
            {t('back')}
          </button>
        </Rise>
      ) : null}

      {step === 'pay' ? (
        <Rise key="pay">
          <h1 className={H1} tabIndex={-1}>
            {t('pay.h1')}
          </h1>
          {unavailable ? (
            <p
              role="alert"
              className="m-0 w-full rounded-[14px] bg-destructive/6 px-[14px] py-3 text-left text-[14px] font-bold text-destructive dark:bg-destructive/10"
            >
              {t('pay.unavailable')}
            </p>
          ) : null}
          <dl className={cn(PANEL, 'm-0 gap-0 p-0 min-[700px]:p-0')}>
            {[
              [t('pay.plan'), t(`${plan}.name`)],
              [t('pay.price'), t(`${plan}.price`, { price: priceLabel(plan) })],
              [t('pay.trial'), t('pay.trialV', { days: TRIAL_DAYS })],
              [t('pay.account'), signed ? t('pay.signed') : t('pay.none')],
            ].map(([k, v]) => (
              <div
                key={k}
                className="flex min-h-[52px] items-center justify-between gap-4 px-5 text-[15px] [&+&]:border-t [&+&]:border-border"
              >
                <dt className="font-semibold">{k}</dt>
                <dd className="m-0 text-right text-muted-foreground-strong">{v}</dd>
              </div>
            ))}
          </dl>
          <Button type="button" className={PRIMARY} onClick={() => window.location.assign(checkoutUrl(plan))}>
            <Lock className="size-[18px]" strokeWidth={2} aria-hidden="true" />
            {t('pay.btn')}
          </Button>
          <span className="text-[13px] leading-normal text-muted-foreground-strong">{t('secure')}</span>
          <button type="button" className={LINK} onClick={() => go('plans')}>
            {t('back')}
          </button>
        </Rise>
      ) : null}
    </div>
  );
}
