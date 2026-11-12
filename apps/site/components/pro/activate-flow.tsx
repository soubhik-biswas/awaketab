'use client';

import { Copy } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { StatusAlert } from '@/components/product/status-alert';
import { Button } from '@/components/ui/button';
import { deviceLabel } from '@/lib/pro/device';
import {
  activateLicense,
  deviceId,
  keyTail,
  lookupCheckoutKey,
  normaliseLicenseKey,
  type TActivateResult,
} from '@/lib/pro/license';
import { cn } from '@/lib/utils';
import { FlowHeader, H1, LEAD, LINK, Outcome, PRIMARY, Processing, Rise } from './flow';

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

const CHECKOUT_RETRY_MS: readonly number[] = [3000, 6000, 12000];

async function whileSyncing<T extends { ok: boolean; error?: string }>(attempt: () => Promise<T>): Promise<T> {
  let result = await attempt();
  for (const ms of CHECKOUT_RETRY_MS) {
    if (result.ok || result.error !== 'polar_unavailable') break;
    await new Promise((resolve) => setTimeout(resolve, ms));
    result = await attempt();
  }
  return result;
}

// /pro/activate: where the payment provider returns, and where a licence key from the receipt turns Pro on by hand.
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
    if (result.ok) setState('checkout-success');
    else if (result.error === 'polar_unavailable') setState('help');
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
  const input =
    'h-[52px] w-full rounded-[12px] border-2 border-input bg-card px-3.5 font-mono text-[15px] text-foreground outline-none focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-ring aria-invalid:border-destructive';

  return (
    <div ref={root} className="relative flex flex-col">
      {step !== undefined ? <FlowHeader step={step} backHref={timerHref} /> : null}

      {state === 'processing' ? <Processing title={t('done.processing.h1')} lead={t('done.processing.lead')} /> : null}

      {state === 'checkout-success' ? (
        <Outcome
          scene="success"
          title={t('done.success.h1')}
          lead={t('done.success.lead')}
          primary={{ label: t('done.success.open'), href: timerHref }}
          secondary={{ label: t('done.success.add'), href: manageHref }}
        />
      ) : null}

      {state === 'failed' ? (
        <Outcome
          scene="error"
          tone="alert"
          title={t('done.failed.h1')}
          lead={t('done.failed.lead')}
          primary={{ label: t('done.failed.again'), href: `${checkoutHref}#pay` }}
          secondary={{ label: t('done.failed.plans'), href: `${checkoutHref}#plans` }}
        />
      ) : null}

      {state === 'help' ? (
        <Outcome
          scene="error"
          tone="alert"
          title={t('done.syncing.h1')}
          lead={t('done.syncing.lead')}
          primary={{
            label: t('done.syncing.retry'),
            onClick: () => (checkoutId.current ? void fromCheckout(checkoutId.current) : setState('idle')),
          }}
          secondary={{ label: t('done.syncing.key'), onClick: () => setState('idle') }}
        />
      ) : null}

      {state === 'cancelled' ? (
        <Outcome
          scene="noitems"
          title={t('done.cancelled.h1')}
          lead={t('done.cancelled.lead')}
          primary={{ label: t('done.cancelled.open'), href: timerHref }}
          secondary={{ label: t('done.cancelled.plans'), href: plansHref }}
        />
      ) : null}

      {state === 'success' ? (
        <Outcome
          scene="success"
          title={ta('ok.title')}
          lead={ta('ok.key', { tail: keyTail(shown) })}
          primary={{ label: ta('ok.open'), href: timerHref }}
          secondary={{ label: ta('manage'), href: manageHref }}
        />
      ) : null}

      {state === 'ext-key' ? (
        <Rise>
          <h1 className={H1} tabIndex={-1}>
            {ta('ext.title')}
          </h1>
          <p className={LEAD}>{ta('ext._')}</p>
          <div className="flex w-full gap-2">
            <input readOnly value={shown} aria-label={ta('ext.title')} className={cn(input, 'flex-1')} />
            <Button type="button" variant="outline" className="h-[52px] gap-2 rounded-[12px] px-4" onClick={copy}>
              <Copy className="size-[18px]" strokeWidth={2} aria-hidden="true" />
              <span aria-live="polite">{copied ? ta('copied') : ta('copy')}</span>
            </Button>
          </div>
          <p className="m-0 text-[13px] text-muted-foreground-strong">{ta('ext.note')}</p>
          <button type="button" className={LINK} onClick={() => setState('idle')}>
            {ta('reset')}
          </button>
        </Rise>
      ) : null}

      {state === 'idle' || state === 'checking' || state === 'error' ? (
        <Rise>
          <h1 className={H1} tabIndex={-1}>
            {ext ? ta('ext.title') : ta('h1')}
          </h1>
          <p className={LEAD}>{ext ? ta('ext.lead') : ta('lead')}</p>
          <form
            className="flex w-full flex-col gap-[14px] text-left"
            onSubmit={(e) => void submit(e)}
            noValidate
            aria-busy={state === 'checking'}
          >
            <label htmlFor={inputId} className="flex w-full flex-col gap-1.5">
              <span className="text-[14px] font-semibold">{ta('label')}</span>
              <input
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
                className={input}
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
            <Button type="submit" loading={state === 'checking'} className={cn(PRIMARY, 'min-[700px]:w-full')}>
              {state === 'checking' ? ta('checking._') : ext ? ta('ext.submit') : ta('submit')}
            </Button>
          </form>
          <a className={LINK} href={plansHref}>
            {ta('plans')}
          </a>
        </Rise>
      ) : null}
    </div>
  );
}
