'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import { Scene } from '@/components/scene/scene';
import { Block, Callout } from '@/components/site/blocks';
import { PageHero } from '@/components/site/page-hero';
import * as s from '@/components/site/styles';
import { fetchAuthStatus, signOutEverywhere } from '@/lib/auth/client';
import type { IAuthStatus } from '@/lib/auth/shared';
import { forgetAccount } from '@/lib/pro/account';
import { pendingMethod, syncAccount } from '@/lib/pro/session';
import { toolHref } from '@/lib/routes';
import { cn } from '@/lib/utils';
import { SignInButtons, type TSignInNote } from './sign-in-buttons';

// Until the server answers, every way in is offered; a missing one then says so when pressed.
const UNKNOWN: IAuthStatus = { ready: true, google: true, github: true, passkey: true };

export const FORM_CARD =
  'flex w-full max-w-[562px] flex-col gap-[14px] rounded-[24px] border border-border bg-card p-5 min-[700px]:max-w-[578px] min-[700px]:p-7';
const LINK_BTN =
  'min-h-11 border-0 bg-transparent px-1 text-[15px] font-bold text-lamp underline underline-offset-[3px] outline-none focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-ring';

// /signin: the content board's sign-in page. Default, cancelled and done are the drawn states; the note under the
// buttons also says when a provider is not set up yet or the network is down.
export function SignIn() {
  const t = useTranslations('account.signin');
  const [status, setStatus] = useState<IAuthStatus>(UNKNOWN);
  const [signed, setSigned] = useState(false);
  const [note, setNote] = useState<TSignInNote | null>(null);
  const [ready, setReady] = useState(false);
  const doneRef = useRef<HTMLElement>(null);

  const check = (focus: boolean) =>
    void syncAccount().then((result) => {
      setSigned(result.state === 'signed-in' || (result.state === 'offline' && result.account !== null));
      setReady(true);
      if (focus && result.state === 'signed-in') requestAnimationFrame(() => doneRef.current?.focus());
    });

  useEffect(() => {
    void fetchAuthStatus().then((next) => {
      if (next) setStatus(next);
    });
    const query = new URLSearchParams(window.location.search);
    // Google and GitHub come back with ?error= when the person stops at their screen.
    if (query.has('error')) {
      pendingMethod();
      setNote('cancelled');
      history.replaceState(null, '', window.location.pathname);
    }
    check(false);
  }, []);

  const signOut = async () => {
    await signOutEverywhere();
    forgetAccount();
    setSigned(false);
  };

  return (
    <>
      <PageHero eyebrow={t('eyebrow')} h1={t('h1')} lead={t('lead')} />
      <Block label={t('label')}>
        <div className={FORM_CARD} aria-busy={!ready || undefined}>
          {signed ? (
            <div role="status" aria-live="polite" className="flex flex-col items-center gap-3 text-center">
              <Scene scene="success" width={240} decorative />
              <strong ref={doneRef} tabIndex={-1} className={cn(s.h3, 'text-center outline-none')}>
                {t('done.h')}
              </strong>
              <span className={cn(s.body, 'text-center')}>{t('done.text')}</span>
              <span className="flex flex-wrap justify-center gap-x-4">
                <a className={cn(LINK_BTN, 'inline-flex items-center')} href={toolHref()}>
                  {t('done.back')}
                </a>
                <button type="button" className={LINK_BTN} onClick={() => void signOut()}>
                  {t('done.out')}
                </button>
              </span>
            </div>
          ) : (
            <>
              <SignInButtons
                key={note ?? 'none'}
                status={status}
                callbackURL="/signin"
                initialNote={note}
                onSigned={() => check(true)}
              />
              <span className={cn(s.body, 'text-[14px] min-[700px]:text-[14px]')}>{t('note.privacy')}</span>
            </>
          )}
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
