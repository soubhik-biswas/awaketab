'use client';

import { CircleAlert, KeyRound, LoaderCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useId, useState } from 'react';
import { signInWith, signInWithPasskey, type TSignInResult } from '@/lib/auth/client';
import type { IAuthStatus, TSignInMethod } from '@/lib/auth/shared';
import { rememberMethod } from '@/lib/pro/session';
import { cn } from '@/lib/utils';
import { GithubLogo, GoogleLogo } from './brand-logos';

export type TSignInNote = 'cancelled' | 'unset' | 'offline' | 'unavailable';

const BTN =
  'inline-flex h-[52px] w-full items-center justify-center gap-2 rounded-full border px-[18px] text-[16px] whitespace-nowrap outline-none focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-ring disabled:cursor-wait';
const FIRST = 'border-foreground bg-foreground font-bold text-background';
const OTHER = 'border-input bg-card font-semibold text-foreground';

const NAME: Record<TSignInMethod, string> = { google: 'Google', github: 'GitHub', passkey: 'Passkey' };

// The three ways in, as the sign-in board draws them: Google first, then GitHub, then a passkey. No address is asked
// for. A provider without keys says so in the note instead of sending the person somewhere that fails.
export function SignInButtons({
  status,
  callbackURL,
  initialNote = null,
  onSigned,
}: {
  status: IAuthStatus;
  callbackURL: string;
  initialNote?: TSignInNote | null;
  onSigned: () => void;
}) {
  const t = useTranslations('account.signin');
  const [note, setNote] = useState<{ kind: TSignInNote; method: TSignInMethod | null } | null>(
    initialNote ? { kind: initialNote, method: null } : null,
  );
  const [busy, setBusy] = useState<TSignInMethod | null>(null);
  // After the browser had no passkey to offer, the same button makes a new one.
  const [createPasskey, setCreatePasskey] = useState(false);
  const noteId = useId();

  const settle = (method: TSignInMethod, result: TSignInResult) => {
    setBusy(null);
    if (result === 'signed') {
      setNote(null);
      onSigned();
    } else if (result !== 'redirecting') setNote({ kind: result, method });
  };

  const go = (method: TSignInMethod) => {
    if (busy) return;
    if (!status[method]) {
      setNote({ kind: 'unset', method });
      return;
    }
    setNote(null);
    setBusy(method);
    rememberMethod(method);
    if (method === 'passkey') {
      const creating = createPasskey;
      void signInWithPasskey(creating).then((result) => {
        setCreatePasskey(result === 'cancelled' && !creating);
        settle(method, result);
      });
      return;
    }
    void signInWith(method, callbackURL).then((result) => settle(method, result));
  };

  const noteText = !note
    ? ''
    : note.kind === 'unset'
      ? t('note.unset', { provider: NAME[note.method ?? 'google'] })
      : t(`note.${note.kind}`);

  const icon = (method: TSignInMethod) =>
    busy === method ? (
      <LoaderCircle className="size-[18px] animate-spin motion-reduce:animate-none" aria-hidden="true" />
    ) : method === 'google' ? (
      <GoogleLogo className="size-[18px]" />
    ) : method === 'github' ? (
      <GithubLogo className="size-[18px]" />
    ) : (
      <KeyRound className="size-[18px]" strokeWidth={2} aria-hidden="true" />
    );

  return (
    <>
      {note ? (
        <span
          id={noteId}
          role="alert"
          className="flex items-center gap-2 rounded-[14px] bg-destructive/6 px-[14px] py-3 text-[14px] font-bold text-destructive dark:bg-destructive/10"
        >
          <CircleAlert className="size-4 flex-none" strokeWidth={2.25} aria-hidden="true" />
          {noteText}
        </span>
      ) : null}
      {(['google', 'github', 'passkey'] as const).map((method, i) => (
        <button
          key={method}
          type="button"
          className={cn(BTN, i === 0 ? FIRST : OTHER)}
          aria-describedby={note ? noteId : undefined}
          aria-busy={busy === method || undefined}
          disabled={busy !== null && busy !== method}
          onClick={() => go(method)}
        >
          {icon(method)}
          {method === 'passkey' && createPasskey ? t('passkeyCreate') : t(method)}
        </button>
      ))}
    </>
  );
}
