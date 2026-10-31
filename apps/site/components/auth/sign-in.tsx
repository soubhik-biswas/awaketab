'use client';

import { CircleAlert, LogOut, Mail } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { StatusAlert } from '@/components/product/status-alert';
import { Scene } from '@/components/scene/scene';
import { Block, Callout } from '@/components/site/blocks';
import { HeroButtons, PageHero } from '@/components/site/page-hero';
import * as s from '@/components/site/styles';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  authClient,
  fetchAuthStatus,
  OFFLINE_STATUS,
  requestSignin,
  signInWith,
  signOutEverywhere,
  verifySignin,
} from '@/lib/auth/client';
import { validEmail, type IAuthStatus, type TSocialProvider } from '@/lib/auth/shared';
import { forgetAccount, readAccount, writeAccount, type TSignInMethod } from '@/lib/pro/account';
import { ROUTES, toolHref } from '@/lib/routes';
import { cn } from '@/lib/utils';
import { GithubLogo, GoogleLogo } from './brand-logos';

type TState = 'form' | 'sent' | 'unavailable' | 'verifying' | 'signed' | 'expired';
type THelp = 'idle' | 'bad' | 'rate' | 'offline';

const PROVIDER_NAME: Record<TSocialProvider, string> = { google: 'Google', github: 'GitHub' };
const FORM_CARD =
  'flex max-w-[562px] flex-col gap-[14px] rounded-[24px] border border-border bg-card p-5 min-[700px]:max-w-[578px] min-[700px]:p-7';
const SUBMIT = 'h-13 w-full rounded-md text-[16px] font-bold [&_svg:not([class*=size-])]:size-[18px]';
const LINK_BTN =
  'min-h-11 border-0 bg-transparent px-1 text-[15px] font-bold text-lamp underline underline-offset-[3px] outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring';

// /signin: Google and GitHub above the content board's email form, with every state the form can be in — empty,
// error, sent, email not set up, link expired, verifying and signed in.
export function SignIn() {
  const t = useTranslations('account.signin');
  const [state, setState] = useState<TState>('form');
  const [status, setStatus] = useState<IAuthStatus>(OFFLINE_STATUS);
  const [email, setEmail] = useState('');
  const [tried, setTried] = useState(false);
  const [help, setHelp] = useState<THelp>('idle');
  const [busy, setBusy] = useState(false);
  const [social, setSocial] = useState<{ provider: TSocialProvider; kind: 'unset' | 'failed' | 'offline' } | null>(
    null,
  );
  const [account, setAccount] = useState<{ email: string; method: TSignInMethod } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const inputId = useId();
  const helpId = useId();
  const session = authClient.useSession();

  const focusTop = () => requestAnimationFrame(() => headingRef.current?.querySelector<HTMLElement>('h1')?.focus());

  useEffect(() => {
    void fetchAuthStatus().then(setStatus);
    const hash = new URLSearchParams(window.location.hash.slice(1));
    const token = hash.get('token');
    const query = new URLSearchParams(window.location.search);
    if (token) {
      // The token leaves the address bar at once so it is never bookmarked, shared or kept in history.
      history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
      setState('verifying');
      void verifySignin(token).then((result) => {
        if (result.ok) {
          const row = writeAccount(result.email, 'email');
          setAccount({ email: row.email, method: row.method });
          setState('signed');
          focusTop();
        } else if (result.offline) {
          setState('form');
          setHelp('offline');
        } else {
          setState('expired');
          focusTop();
        }
      });
      return;
    }
    if (query.get('link') === 'expired' || query.get('error') === 'INVALID_TOKEN') {
      setState('expired');
      return;
    }
    if (query.get('error') === 'social') setSocial({ provider: 'google', kind: 'failed' });
    const stored = readAccount();
    if (stored) {
      setAccount({ email: stored.email, method: stored.method });
      setState('signed');
    }
  }, []);

  // A Google or GitHub sign-in lands back here with a session; remember the address on this device.
  useEffect(() => {
    const user = session.data?.user;
    if (!user?.email || state === 'verifying') return;
    void authClient
      .listAccounts()
      .catch(() => null)
      .then((res) => {
        const providers = Array.isArray(res?.data) ? res.data.map((a) => a.providerId) : [];
        const method: TSignInMethod = providers.includes('google')
          ? 'google'
          : providers.includes('github')
            ? 'github'
            : 'email';
        const row = writeAccount(user.email, method, user.name || '');
        setAccount({ email: row.email, method: row.method });
        setState('signed');
      });
  }, [session.data?.user, state]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;
    const value = email.trim();
    setTried(true);
    if (!validEmail(value)) {
      setHelp('bad');
      inputRef.current?.focus();
      return;
    }
    setBusy(true);
    void requestSignin(value).then((result) => {
      setBusy(false);
      if (result === 'sent') {
        setState('sent');
        requestAnimationFrame(() => document.getElementById('signin-sent')?.focus());
      } else if (result === 'email_unavailable') setState('unavailable');
      else setHelp(result === 'bad_email' ? 'bad' : result === 'rate_limited' ? 'rate' : 'offline');
    });
  };

  const withProvider = (provider: TSocialProvider) => {
    if (!status[provider]) {
      setSocial({ provider, kind: 'unset' });
      return;
    }
    setSocial(null);
    void signInWith(provider).then((result) => {
      if (result !== 'redirecting') setSocial({ provider, kind: result === 'offline' ? 'offline' : 'failed' });
    });
  };

  const reset = () => {
    setEmail('');
    setTried(false);
    setHelp('idle');
    setState('form');
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const signOut = async () => {
    await signOutEverywhere();
    forgetAccount();
    setAccount(null);
    setState('form');
  };

  if (state === 'expired')
    return (
      <div ref={headingRef}>
        <PageHero
          eyebrow={t('expired.eyebrow')}
          h1={t('expired.h1')}
          lead={t('expired.lead', { minutes: status.minutes })}
          scene="expired"
          actions={
            <HeroButtons
              primary={{ href: ROUTES.signin, label: t('expired.again') }}
              secondary={{ href: ROUTES.home, label: t('expired.home') }}
            />
          }
        />
      </div>
    );

  if (state === 'signed' && account)
    return (
      <>
        <div ref={headingRef}>
          <PageHero eyebrow={t('signed.eyebrow')} h1={t('signed.h1')} lead={t('signed.lead')} />
        </div>
        <Block label={t('signed.label')}>
          <div className={FORM_CARD} role="status">
            <span className="flex flex-col gap-1">
              <span className="text-[15px] font-bold">{t('signed.label')}</span>
              <strong className="text-[17px] break-all">{account.email}</strong>
              <span className={cn(s.body, 'text-[14px]')}>{t(`signed.with.${account.method}`)}</span>
            </span>
            <Button asChild size="lg" className={SUBMIT}>
              <a href={toolHref()}>{t('signed.open')}</a>
            </Button>
            <Button asChild variant="outline" size="lg" className={SUBMIT}>
              <a href="/pro/manage">{t('signed.manage')}</a>
            </Button>
            <button
              type="button"
              className={cn(LINK_BTN, 'inline-flex items-center gap-2 self-center')}
              onClick={() => void signOut()}
            >
              <LogOut className="size-4" strokeWidth={2} aria-hidden="true" />
              {t('signed.out')}
            </button>
          </div>
        </Block>
      </>
    );

  const bad = help !== 'idle';
  const helpText =
    help === 'bad'
      ? t('error.email')
      : help === 'rate'
        ? t('error.rate')
        : help === 'offline'
          ? t('error.offline')
          : t('help');

  return (
    <>
      <div ref={headingRef}>
        <PageHero
          eyebrow={t('eyebrow')}
          h1={state === 'verifying' ? t('verifying.h1') : t('h1')}
          lead={state === 'verifying' ? t('verifying.text') : t('lead')}
        />
      </div>
      <Block label={t('label')}>
        <div className={FORM_CARD}>
          {state === 'verifying' ? (
            <div role="status" aria-live="polite" className={s.body}>
              {t('verifying.text')}
            </div>
          ) : null}

          {state === 'form' || state === 'unavailable' ? (
            <>
              <div role="group" aria-label={t('social.label')} className="flex flex-col gap-2.5">
                {(['google', 'github'] as const).map((provider) => (
                  <Button
                    key={provider}
                    type="button"
                    variant="outline"
                    size="lg"
                    className={cn(SUBMIT, 'gap-2.5 font-bold')}
                    aria-describedby={social?.provider === provider ? `${helpId}-social` : undefined}
                    onClick={() => withProvider(provider)}
                  >
                    {provider === 'google' ? <GoogleLogo className="size-5" /> : <GithubLogo className="size-5" />}
                    {t(`social.${provider}`)}
                  </Button>
                ))}
                {social ? (
                  <span
                    id={`${helpId}-social`}
                    role="status"
                    className="flex items-center gap-1.5 text-[14px] font-bold text-destructive"
                  >
                    <CircleAlert className="size-4 flex-none" strokeWidth={2.25} aria-hidden="true" />
                    {social.kind === 'offline'
                      ? t('social.offline')
                      : t(`social.${social.kind}`, { provider: PROVIDER_NAME[social.provider] })}
                  </span>
                ) : null}
              </div>
              <div className="flex items-center gap-3 text-[14px] text-muted-foreground-strong">
                <Separator className="flex-1" />
                <span>{t('social.or')}</span>
                <Separator className="flex-1" />
              </div>
              <form className="flex flex-col gap-[14px]" onSubmit={submit} noValidate>
                <label htmlFor={inputId} className="flex flex-col gap-2">
                  <span className="text-[15px] font-bold">{t('label')}</span>
                  <Input
                    ref={inputRef}
                    id={inputId}
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    aria-invalid={help === 'bad' || undefined}
                    aria-describedby={helpId}
                    onChange={(event) => {
                      setEmail(event.target.value);
                      if (state === 'unavailable') setState('form');
                      // An error clears as soon as the address becomes valid, and only returns on the next try.
                      if (tried && validEmail(event.target.value)) setHelp('idle');
                    }}
                    className="h-13 rounded-[12px] border-2 px-3.5 text-[17px] aria-invalid:px-3.5"
                  />
                </label>
                <span
                  id={helpId}
                  aria-live="polite"
                  className={cn(
                    'flex items-center gap-1.5 text-[14px]',
                    bad ? 'font-bold text-destructive' : 'text-muted-foreground-strong',
                  )}
                >
                  {bad ? <CircleAlert className="size-4 flex-none" strokeWidth={2.25} aria-hidden="true" /> : null}
                  {helpText}
                </span>
                {state === 'unavailable' ? (
                  <StatusAlert variant="info" title={status.ready ? t('unavailable.title') : t('notReady.title')}>
                    {status.ready ? t('unavailable.text') : t('notReady.text')}{' '}
                    <a className="text-link underline underline-offset-[3px]" href="/pro/activate">
                      {t('unavailable.link')}
                    </a>
                  </StatusAlert>
                ) : null}
                <Button type="submit" size="lg" loading={busy} className={SUBMIT}>
                  <Mail strokeWidth={2} aria-hidden="true" />
                  {busy ? t('sending') : t('submit')}
                </Button>
              </form>
              <span className={cn(s.body, 'text-[14px]')}>{t('note', { minutes: status.minutes })}</span>
            </>
          ) : null}

          {state === 'sent' ? (
            <div role="status" aria-live="polite" className="flex flex-col items-center gap-3 text-center">
              <Scene scene="success" width={240} decorative />
              <strong id="signin-sent" tabIndex={-1} className={cn(s.h3, 'text-center outline-none')}>
                {t('sent.h')}
              </strong>
              <span className={cn(s.body, 'text-center')}>
                {t('sent.before')} <strong className="text-foreground">{email.trim() || 'your address'}</strong>
                {t('sent.after')}
              </span>
              <button type="button" className={LINK_BTN} onClick={reset}>
                {t('sent.reset')}
              </button>
            </div>
          ) : null}
        </div>
      </Block>
      <Block label={t('callout.title')}>
        <Callout tone="info" title={t('callout.title')}>
          {t('callout.text')}
        </Callout>
      </Block>
    </>
  );
}
