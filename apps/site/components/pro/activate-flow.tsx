'use client';

import { Copy } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { StatusAlert } from '@/components/product/status-alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { deviceLabel } from '@/lib/pro/device';
import { clearFlow, readFlow } from '@/lib/pro/flow';
import {
  activateLicense,
  deviceId,
  keyTail,
  lookupCheckoutKey,
  normaliseLicenseKey,
  type TActivateResult,
} from '@/lib/pro/license';
import { cn } from '@/lib/utils';
import { Actions, Declined, FlowColumn, FlowHeader, H1, LEAD, LINK, PRIMARY, Processing, RISE, Success } from './flow';

type TState =
  | 'idle'
  | 'checking'
  | 'error'
  | 'success'
  | 'ext-key'
  | 'processing'
  | 'checkout-success'
  | 'failed'
  | 'help'
  | 'cancelled';

const ERR_CODE: Record<string, string> = {
  invalid_key: 'invalid_key',
  bad_request: 'invalid_key',
  activation_limit: 'activation_limit',
  revoked: 'revoked',
  refunded: 'revoked',
  polar_unavailable: 'polar_unavailable',
  offline: 'offline',
  rate_limited: 'offline',
  bad_token: 'bad_token',
};

export const CHECKOUT_RETRY_MS: readonly number[] = [3000, 6000, 12000];

async function whileSyncing<T extends { ok: boolean; error?: string }>(attempt: () => Promise<T>): Promise<T> {
  let result = await attempt();
  for (const ms of CHECKOUT_RETRY_MS) {
    if (result.ok || result.error !== 'polar_unavailable') break;
    await new Promise((resolve) => setTimeout(resolve, ms));
    result = await attempt();
  }
  return result;
}

// /pro/activate: where Polar returns after paying (processing, Pro is on, declined, still syncing, closed), and
// where a key from Polar's email turns Pro on by hand. `?ext=1` only shows the key for AwakeTab for Chrome.
export function ActivateFlow({
  timerHref,
  manageHref,
  checkoutHref,
  plansHref,
}: {
  timerHref: string;
  manageHref: string;
  checkoutHref: string;
  plansHref: string;
}) {
  const t = useTranslations('proflow');
  const ta = useTranslations('proflow.activate');
  const [state, setState] = useState<TState>('idle');
  const [error, setError] = useState('invalid_key');
  const [key, setKey] = useState('');
  const [shown, setShown] = useState('');
  const [email, setEmail] = useState('');
  const [ext, setExt] = useState(false);
  const [copied, setCopied] = useState(false);
  const checkoutId = useRef<string | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const inputId = useId();
  const errorId = useId();

  const focusHeading = () => requestAnimationFrame(() => root.current?.querySelector<HTMLElement>('h1, h2')?.focus());

  const fromCheckout = useCallback(async (id: string) => {
    setState('processing');
    const result: TActivateResult = await whileSyncing(() =>
      activateLicense({ checkoutId: id, deviceId: deviceId(), deviceLabel: deviceLabel() || 'This browser' }),
    );
    if (result.ok) {
      setEmail(readFlow().email ?? '');
      clearFlow();
      setState('checkout-success');
    } else if (result.error === 'polar_unavailable') setState('help');
    else if (result.error === 'invalid_key') setState('failed');
    else {
      setError(ERR_CODE[result.error] ?? 'invalid_key');
      setState('error');
    }
    focusHeading();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('checkout_id');
    const direct = params.get('checkout');
    const isExt = params.get('ext') === '1';
    setExt(isExt);
    checkoutId.current = id;
    if (!isExt && (direct === 'cancelled' || direct === 'failed' || direct === 'help')) setState(direct);
    else if (isExt && id) {
      setState('checking');
      void whileSyncing(() => lookupCheckoutKey(id)).then((result) => {
        if (result.ok) {
          setShown(result.key);
          setState('ext-key');
        } else {
          setError(ERR_CODE[result.error] ?? 'invalid_key');
          setState('error');
        }
      });
    } else if (id) void fromCheckout(id);
  }, [fromCheckout]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (state === 'checking') return;
    const typed = normaliseLicenseKey(key);
    if (ext) {
      if (typed) {
        setShown(typed);
        setState('ext-key');
        focusHeading();
      } else {
        setError('invalid_key');
        setState('error');
      }
      return;
    }
    setState('checking');
    const result = await activateLicense({
      key: typed ?? key.trim().toUpperCase(),
      deviceId: deviceId(),
      deviceLabel: deviceLabel() || 'This browser',
    });
    if (result.ok) {
      setShown(typed ?? key);
      setState('success');
      focusHeading();
    } else {
      setError(ERR_CODE[result.error] ?? 'invalid_key');
      setState('error');
    }
  };

  const copy = () => {
    void navigator.clipboard.writeText(shown).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      },
      () => undefined,
    );
  };

  const step = { processing: 2, failed: 2, help: 2, cancelled: 2, 'checkout-success': 3 }[state as string];

  return (
    <div ref={root} className="relative flex flex-col">
      {step !== undefined ? <FlowHeader step={step} backHref={timerHref} /> : null}

      {state === 'processing' ? (
        <Processing title={t('done.processing.h1')} lead={t('done.processing.lead')} />
      ) : null}

      {state === 'checkout-success' ? (
        <Success
          title={t('done.success.h1')}
          lead={
            email ? (
              <>
                {t('done.success.lead')} {t('done.success.to')} <strong className="text-foreground">{email}</strong>
                {t('done.success.next')}
              </>
            ) : (
              t('done.success.generic')
            )
          }
          open={t('done.success.open')}
          openHref={timerHref}
          add={t('done.success.add')}
          addHref={manageHref}
        />
      ) : null}

      {state === 'failed' ? (
        <Declined
          title={t('done.failed.h1')}
          lead={t('done.failed.lead')}
          again={t('done.failed.again')}
          againHref={`${checkoutHref}#pay`}
          plans={t('done.failed.plans')}
          plansHref={`${checkoutHref}#plans`}
        />
      ) : null}

      {state === 'help' || state === 'cancelled' ? (
        <FlowColumn className={RISE} role={state === 'help' ? 'alert' : 'status'}>
          <h1 className={cn(H1, 'outline-none')} tabIndex={-1}>
            {t(state === 'help' ? 'done.syncing.h1' : 'done.cancelled.h1')}
          </h1>
          <p className={LEAD}>{t(state === 'help' ? 'done.syncing.lead' : 'done.cancelled.lead')}</p>
          <Actions>
            {state === 'help' ? (
              <Button
                type="button"
                size="lg"
                className={PRIMARY}
                onClick={() => (checkoutId.current ? void fromCheckout(checkoutId.current) : setState('idle'))}
              >
                {t('done.syncing.retry')}
              </Button>
            ) : (
              <Button asChild size="lg" className={PRIMARY}>
                <a href={timerHref}>{t('done.cancelled.open')}</a>
              </Button>
            )}
            {state === 'help' ? (
              <Button type="button" variant="outline" size="lg" className="h-13 rounded-md px-[22px] text-[16px] font-bold" onClick={() => setState('idle')}>
                {t('done.syncing.key')}
              </Button>
            ) : (
              <Button asChild variant="outline" size="lg" className="h-13 rounded-md px-[22px] text-[16px] font-bold">
                <a href={plansHref}>{t('done.cancelled.plans')}</a>
              </Button>
            )}
          </Actions>
        </FlowColumn>
      ) : null}

      {state === 'success' ? (
        <Success
          title={ta('ok.title')}
          lead={ta('ok.key', { tail: keyTail(shown) })}
          open={ta('ok.open')}
          openHref={timerHref}
          add={ta('manage')}
          addHref={manageHref}
        />
      ) : null}

      {state === 'ext-key' ? (
        <FlowColumn className={RISE}>
          <h1 className={cn(H1, 'outline-none')} tabIndex={-1}>
            {ta('ext.title')}
          </h1>
          <p className={LEAD}>{ta('ext._')}</p>
          <div className="flex w-full gap-2">
            <Input
              readOnly
              value={shown}
              aria-label={ta('ext.title')}
              className="h-13 flex-1 rounded-[12px] px-3.5 font-mono text-[15px]"
            />
            <Button type="button" variant="outline" size="lg" className="h-13 rounded-md px-4" onClick={copy}>
              <Copy strokeWidth={2} aria-hidden="true" />
              <span aria-live="polite">{copied ? ta('copied') : ta('copy')}</span>
            </Button>
          </div>
          <p className="m-0 text-[13px] text-muted-foreground-strong">{ta('ext.note')}</p>
          <button type="button" className={LINK} onClick={() => setState('idle')}>
            {ta('reset')}
          </button>
        </FlowColumn>
      ) : null}

      {state === 'idle' || state === 'checking' || state === 'error' ? (
        <FlowColumn className={RISE}>
          <h1 className={cn(H1, 'outline-none')} tabIndex={-1}>
            {ext ? ta('ext.title') : ta('h1')}
          </h1>
          <p className={LEAD}>{ext ? ta('ext.lead') : ta('lead')}</p>
          <form className="flex w-full flex-col gap-[18px]" onSubmit={(e) => void submit(e)} noValidate aria-busy={state === 'checking'}>
            <label htmlFor={inputId} className="flex w-full flex-col gap-1.5 text-left">
              <span className="text-[14px] font-semibold">{ta('label')}</span>
              <Input
                id={inputId}
                name="key"
                autoComplete="off"
                spellCheck={false}
                placeholder={ta('placeholder')}
                value={key}
                readOnly={state === 'checking'}
                aria-invalid={state === 'error' || undefined}
                aria-describedby={state === 'error' ? errorId : undefined}
                onChange={(event) => {
                  setKey(event.target.value);
                  if (state === 'error') setState('idle');
                }}
                className="h-13 rounded-[12px] border-2 px-3.5 font-mono text-[15px] aria-invalid:px-3.5"
              />
              <span className="text-[13px] font-semibold text-muted-foreground-strong">
                {ext ? ta('hint.ext') : ta('hint._')}
              </span>
            </label>
            {state === 'error' ? (
              <StatusAlert
                id={errorId}
                role="alert"
                variant={error === 'polar_unavailable' || error === 'offline' ? 'paused' : 'refused'}
                title={ta(`err.${error}`)}
                className="w-full text-left"
              >
                {ta(`errText.${error}`)}
                {error === 'activation_limit' ? (
                  <>
                    {' '}
                    <a className="text-link underline underline-offset-[3px]" href={manageHref}>
                      {ta('manage')}
                    </a>
                  </>
                ) : null}
              </StatusAlert>
            ) : null}
            <Button type="submit" size="lg" loading={state === 'checking'} className={cn('w-full', PRIMARY)}>
              {state === 'checking' ? ta('checking._') : ext ? ta('ext.submit') : ta('submit')}
            </Button>
          </form>
          <a className={cn(LINK, 'inline-flex items-center')} href={plansHref}>
            {ta('plans')}
          </a>
        </FlowColumn>
      ) : null}
    </div>
  );
}
