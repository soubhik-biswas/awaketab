'use client';

import { CircleAlert, Info, Mail } from 'lucide-react';
import { useId, useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Scene } from './_pending/scene';
import * as s from './styles';

export type TSigninState = 'empty' | 'error' | 'sent' | 'unavailable';

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/u;

export interface ISigninLabels {
  label: string;
  help: string;
  error: string;
  submit: string;
  note: string;
  sentTitle: string;
  sentBefore: string;
  sentAfter: string;
  reset: string;
  unavailableTitle: string;
  unavailableText: string;
}

// The sign-in card: empty, error and sent (content board). `providers` is the place for the Google and GitHub
// buttons above the email field; `send` is wired by the account flow, and without it the card says honestly that
// sign-in emails are not switched on yet.
export function SigninForm({
  labels,
  providers,
  initial = 'empty',
  enabled = false,
}: {
  labels: ISigninLabels;
  providers?: ReactNode;
  initial?: TSigninState;
  enabled?: boolean;
}) {
  const id = useId();
  const [email, setEmail] = useState(initial === 'error' ? 'sam@example' : initial === 'sent' ? 'sam@example.com' : '');
  const [state, setState] = useState<TSigninState>(initial);
  const invalid = state === 'error';
  const submit = () => {
    if (!EMAIL.test(email.trim())) {
      setState('error');
      return;
    }
    setState(enabled ? 'sent' : 'unavailable');
  };
  if (state === 'sent') {
    return (
      <div className="flex max-w-[520px] flex-col gap-[14px] rounded-[24px] border border-border bg-card p-5 min-[700px]:p-7">
        <div role="status" aria-live="polite" className="flex flex-col items-center gap-3 text-center">
          <Scene sceneKey="success" width={240} />
          <strong className={cn(s.h3, 'text-center')}>{labels.sentTitle}</strong>
          <span className={cn(s.body, 'text-center')}>
            {labels.sentBefore} <strong className="text-foreground">{email || 'your address'}</strong>
            {labels.sentAfter}
          </span>
          <Button
            variant={null}
            size={null}
            className={s.linkBtn}
            onClick={() => {
              setEmail('');
              setState('empty');
            }}
          >
            {labels.reset}
          </Button>
        </div>
      </div>
    );
  }
  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="flex max-w-[520px] flex-col gap-[14px] rounded-[24px] border border-border bg-card p-5 min-[700px]:p-7"
    >
      {providers}
      <label htmlFor={id} className="text-[15px] font-bold">
        {labels.label}
      </label>
      <Input
        id={id}
        type="email"
        autoComplete="email"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          if (state !== 'empty') setState('empty');
        }}
        aria-invalid={invalid}
        aria-describedby={`${id}-help`}
        className={cn(
          '-mt-1.5 h-[52px] rounded-[12px] border-2 bg-field px-[14px] text-[17px] text-foreground shadow-none md:text-[17px]',
          invalid ? 'border-destructive' : 'border-input',
        )}
      />
      <span
        id={`${id}-help`}
        className={cn(
          'flex items-center gap-1.5 text-[14px]',
          invalid ? 'font-bold text-destructive' : 'text-muted-foreground-strong',
        )}
      >
        {invalid && <CircleAlert className="size-4 flex-none" strokeWidth={2.25} aria-hidden="true" />}
        {invalid ? labels.error : labels.help}
      </span>
      <Button
        type="submit"
        variant={null}
        size={null}
        className={cn(s.btn, 'h-[52px] rounded-[14px] border-primary bg-primary text-[16px] font-bold text-primary-foreground hover:bg-primary/90')}
      >
        <Mail className="size-[18px]" aria-hidden="true" />
        {labels.submit}
      </Button>
      {state === 'unavailable' && (
        <div role="status" className="flex items-start gap-3 rounded-[14px] border border-info/20 bg-info-soft px-4 py-3">
          <Info className="mt-0.5 size-5 flex-none text-info" aria-hidden="true" />
          <span className="flex flex-col gap-1">
            <strong className="text-[15px] text-info">{labels.unavailableTitle}</strong>
            <span className="text-[14px] text-muted-foreground-strong">{labels.unavailableText}</span>
          </span>
        </div>
      )}
      <span className={cn(s.body, 'text-[14px] min-[700px]:text-[14px]')}>{labels.note}</span>
    </form>
  );
}
