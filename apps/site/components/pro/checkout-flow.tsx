'use client';

import { Check, Lock } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { SegmentedControl } from '@/components/product/segmented-control';
import { StatusAlert } from '@/components/product/status-alert';
import { Scene } from '@/components/scene/scene';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { requestSignin } from '@/lib/auth/client';
import { validEmail } from '@/lib/auth/shared';
import { readAccount } from '@/lib/pro/account';
import {
  CHECKOUT_STEPS,
  checkoutUrl,
  readFlow,
  STEP_INDEX,
  writeFlow,
  type IFlow,
  type TCheckoutStep,
} from '@/lib/pro/flow';
import { planPrice, renewalDate, usd, type TProPlan } from '@/lib/pro/plans';
import { cn } from '@/lib/utils';
import { ContinueIcon, FlowColumn, FlowHeader, H1, LEAD, LINK, PRIMARY, RISE } from './flow';

const CARD = 'flex flex-col gap-[14px] rounded-[24px] bg-card p-[26px] text-left';
const FEATURE = 'flex items-center gap-2.5 text-[15px]';

function Feature({ children }: { children: string }) {
  return (
    <li className={FEATURE}>
      <Check className="size-[18px] flex-none text-lamp" strokeWidth={2.25} aria-hidden="true" />
      {children}
    </li>
  );
}

// The purchase board's flow at /pro/checkout: plan → account → inbox → pay. Polar then returns to /pro/activate.
export function CheckoutFlow({ backHref }: { backHref: string }) {
  const tc = useTranslations('proflow.checkout');
  const [step, setStep] = useState<TCheckoutStep>('plans');
  const [flow, setFlow] = useState<IFlow>({ plan: 'pro_yearly', email: '' });
  const [hint, setHint] = useState<'idle' | 'bad' | 'offline'>('idle');
  const [busy, setBusy] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const [now, setNow] = useState<number | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const hintId = useId();
  const emailId = useId();

  const go = useCallback((next: TCheckoutStep, email: string, focus = true) => {
    // Paying needs an address; anything that skips ahead without one lands on the account step.
    const target = (next === 'check' || next === 'pay') && !validEmail(email) ? 'account' : next;
    setStep(target);
    if (window.location.hash.slice(1) !== target)
      history.replaceState(null, '', `${window.location.pathname}${window.location.search}#${target}`);
    if (focus) requestAnimationFrame(() => root.current?.querySelector<HTMLElement>('h1')?.focus());
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const saved = readFlow();
    const next: IFlow = {
      plan: params.get('plan') === 'lifetime' ? 'pro_lifetime' : (saved.plan ?? 'pro_yearly'),
      email: saved.email ?? readAccount()?.email ?? '',
      ...(saved.unsent ? { unsent: true } : {}),
    };
    setFlow(next);
    setNow(Date.now());
    setUnavailable(params.get('checkout') === 'unavailable');
    const start = window.location.hash.slice(1) as TCheckoutStep;
    go(CHECKOUT_STEPS.includes(start) ? start : 'plans', next.email, false);
  }, [go]);

  const update = (patch: Partial<IFlow>) => {
    setFlow((current) => {
      const next = { ...current, ...patch };
      writeFlow(next);
      return next;
    });
  };

  const valid = validEmail(flow.email);
  const price = usd(planPrice(flow.plan, now ?? undefined));

  const send = (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;
    if (!valid) {
      setHint('bad');
      return;
    }
    setBusy(true);
    void requestSignin(flow.email, '/pro/checkout#pay').then((result) => {
      setBusy(false);
      if (result === 'offline' || result === 'bad_email') {
        setHint(result === 'offline' ? 'offline' : 'bad');
        return;
      }
      const sent = result === 'sent' || result === 'rate_limited';
      update({ unsent: !sent });
      // No email provider yet: never claim a link was sent, go straight to payment instead.
      go(sent ? 'check' : 'pay', flow.email);
    });
  };

  const hintText =
    hint === 'offline'
      ? tc('account.offline')
      : valid
        ? tc('account.ok')
        : tc('account.idle');

  return (
    <div ref={root} className="relative flex flex-col">
      <FlowHeader step={STEP_INDEX[step]} backHref={backHref} />

      {step === 'plans' ? (
        <section
          className={cn(
            RISE,
            'relative flex flex-col items-center gap-[26px] px-5 pt-11 min-[700px]:px-12 xl:px-[120px]',
          )}
        >
          <span className="font-mono text-[14px] tracking-[0.12em] text-lamp">{tc('kicker')}</span>
          <h1
            tabIndex={-1}
            className="m-0 text-center text-[40px] leading-none font-extrabold tracking-[-0.04em] outline-none min-[700px]:text-[64px]"
          >
            {tc('plans.h1')}
          </h1>
          <p className="m-0 max-w-[680px] text-center text-[19px] leading-normal text-muted-foreground-strong">
            {tc('plans.lead')}
          </p>
          <SegmentedControl
            aria-label={tc('plans.period')}
            value={flow.plan}
            onValueChange={(value) => update({ plan: value === 'pro_lifetime' ? 'pro_lifetime' : 'pro_yearly' })}
            options={[
              { value: 'pro_yearly', label: tc('plans.yearly') },
              { value: 'pro_lifetime', label: tc('plans.lifetime') },
            ]}
            className="gap-1 rounded-[14px] p-1 [&>button]:flex-none [&>button]:rounded-[10px] [&>button]:px-5 [&>button]:text-[15px]"
          />
          <div className="grid w-full max-w-[980px] grid-cols-1 gap-5 min-[700px]:grid-cols-2">
            <div className={cn(CARD, 'border border-border')}>
              <strong className="text-[24px]">{tc('free.name')}</strong>
              <span className="text-[34px] font-extrabold">{tc('free.price')}</span>
              <ul className="m-0 flex list-none flex-col gap-[14px] p-0">
                {(['f1', 'f2', 'f3', 'f4'] as const).map((k) => (
                  <Feature key={k}>{tc(`free.${k}`)}</Feature>
                ))}
              </ul>
              <span className="mt-auto text-[14px] text-muted-foreground-strong">{tc('free.now')}</span>
            </div>
            <div className={cn(CARD, 'border-2 border-primary shadow-[0_24px_60px_var(--site-pro-glow)]')}>
              <span className="flex items-center justify-between">
                <strong className="text-[24px]">{tc('pro.name')}</strong>
                <span className="rounded-full bg-primary-soft px-2.5 py-[3px] text-[13px] font-bold text-primary">
                  {tc(flow.plan === 'pro_lifetime' ? 'pro.badge.lifetime' : 'pro.badge.yearly')}
                </span>
              </span>
              <span className="text-[34px] font-extrabold">
                {tc(flow.plan === 'pro_lifetime' ? 'price.lifetime' : 'price.yearly', { price })}
              </span>
              <ul className="m-0 flex list-none flex-col gap-[14px] p-0">
                {(['f1', 'f2', 'f3', 'f4', 'f5', 'f6'] as const).map((k) => (
                  <Feature key={k}>{tc(`pro.${k}`)}</Feature>
                ))}
              </ul>
              <Button type="button" size="lg" className={PRIMARY} onClick={() => go('account', flow.email)}>
                {tc('plans.continue')}
                <ContinueIcon />
              </Button>
            </div>
          </div>
        </section>
      ) : null}

      {step === 'account' ? (
        <FlowColumn className={RISE}>
          <h1 className={cn(H1, 'outline-none')} tabIndex={-1}>
            {tc('account.h1')}
          </h1>
          <p className={LEAD}>{tc('account.lead')}</p>
          <form className="flex w-full flex-col gap-[18px]" onSubmit={send} noValidate>
            <label htmlFor={emailId} className="flex w-full flex-col gap-1.5 text-left">
              <span className="text-[14px] font-semibold">{tc('account.label')}</span>
              <Input
                id={emailId}
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={flow.email}
                aria-describedby={hintId}
                aria-invalid={hint === 'bad' && !valid ? true : undefined}
                onChange={(event) => {
                  update({ email: event.target.value.trim() });
                  if (hint !== 'idle') setHint('idle');
                }}
                className={cn(
                  'h-13 rounded-[12px] border-2 px-3.5 text-[17px] aria-invalid:px-3.5',
                  valid ? 'border-lamp' : 'border-input',
                )}
              />
            </label>
            <span
              id={hintId}
              aria-live="polite"
              className={cn(
                'self-start text-[13px] font-semibold',
                hint === 'bad' || hint === 'offline' ? 'text-destructive' : valid ? 'text-lamp' : 'text-muted-foreground-strong',
              )}
            >
              {hintText}
            </span>
            <Button
              type="submit"
              size="lg"
              loading={busy}
              aria-disabled={!valid || undefined}
              className={cn('w-full', valid ? PRIMARY : 'h-13 rounded-md px-[22px] text-[16px] font-bold')}
            >
              {busy ? tc('account.sending') : tc('account.send')}
            </Button>
          </form>
          <button type="button" className={LINK} onClick={() => go('plans', flow.email)}>
            {tc('back.plans')}
          </button>
        </FlowColumn>
      ) : null}

      {step === 'check' ? (
        <FlowColumn className={RISE}>
          <Scene scene="firstaction" width={260} decorative />
          <h1 className={cn(H1, 'outline-none')} tabIndex={-1}>
            {tc('check.h1')}
          </h1>
          <p className={LEAD}>
            {tc('check.before')} <strong className="text-foreground">{flow.email}</strong>
            {tc('check.after', { minutes: 15 })}
          </p>
          <Button type="button" size="lg" className={PRIMARY} onClick={() => go('pay', flow.email)}>
            {tc('check.continue')}
          </Button>
          <button type="button" className={LINK} onClick={() => go('account', flow.email)}>
            {tc('check.other')}
          </button>
        </FlowColumn>
      ) : null}

      {step === 'pay' ? (
        <FlowColumn className={RISE}>
          <h1 className={cn(H1, 'outline-none')} tabIndex={-1}>
            {tc('pay.h1')}
          </h1>
          {unavailable ? (
            <StatusAlert variant="refused" title={tc('unavailable.title')} className="w-full text-left">
              {tc('unavailable.text')}
            </StatusAlert>
          ) : null}
          {flow.unsent ? (
            <StatusAlert variant="info" title={tc('pay.unsentTitle')} className="w-full text-left">
              {tc('pay.unsent')}
            </StatusAlert>
          ) : null}
          <dl className="m-0 flex w-full flex-col overflow-hidden rounded-[20px] border border-border bg-card">
            {[
              [tc('pay.plan._'), tc('pay.plan.v')],
              [
                tc('pay.billing._'),
                flow.plan === 'pro_lifetime'
                  ? tc('pay.billing.lifetime')
                  : tc('pay.billing.yearly', { date: now ? renewalDate(now) : '' }),
              ],
              [tc('pay.account'), flow.email],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 border-t border-secondary px-5 py-4 text-[15px]">
                <dt>{k}</dt>
                <dd className="m-0 text-right break-all text-muted-foreground-strong">{v}</dd>
              </div>
            ))}
            <div className="flex justify-between gap-4 border-t border-secondary bg-secondary px-5 py-4 text-[15px] font-bold">
              <dt>{tc('pay.total')}</dt>
              <dd className="m-0 text-[17px]">{price}</dd>
            </div>
          </dl>
          <Button
            type="button"
            size="lg"
            className={PRIMARY}
            onClick={() => window.location.assign(checkoutUrl(flow.plan, flow.email))}
          >
            <Lock strokeWidth={2} aria-hidden="true" />
            {tc('pay.btn')}
          </Button>
          <span className="text-center text-[13px] leading-normal text-muted-foreground-strong">
            {tc('pay.note._')} {tc('pay.note.cancel')}
          </span>
        </FlowColumn>
      ) : null}
    </div>
  );
}
