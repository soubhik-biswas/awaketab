'use client';

import * as React from 'react';
import { cn } from 'cn';
import { Check, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';

export interface ITypedConfirmProps extends Omit<React.ComponentProps<'div'>, 'title'> {
  word?: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  confirmLabel?: React.ReactNode;
  cancelLabel?: React.ReactNode;
  onConfirm: () => void;
  onCancel?: () => void;
  size?: 'compact' | 'panel';
}

function matchedLetters(text: string, word: string): number {
  let matched = 0;
  for (let i = 0; i < Math.min(text.length, word.length); i++) {
    if (text[i] !== word[i]) break;
    matched++;
  }
  return matched;
}

export function TypedConfirm({
  word = 'CLEAR',
  title = 'Clear all history?',
  description = 'Deletes every saved session on this device. Presets stay. This can’t be undone.',
  confirmLabel = 'Clear history',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  size = 'panel',
  className,
  ...props
}: ITypedConfirmProps) {
  const [text, setText] = React.useState('');
  const id = React.useId();
  const ok = text === word;
  const matched = matchedLetters(text, word);
  const compact = size === 'compact';
  return (
    <div
      role="alertdialog"
      aria-labelledby={`${id}-t`}
      aria-describedby={`${id}-d`}
      data-slot="typed-confirm"
      className={cn('flex flex-col', compact ? 'gap-2.5' : 'gap-3', className)}
      {...props}
    >
      <strong
        id={`${id}-t`}
        className={cn(
          'font-sans text-foreground',
          compact
            ? 'text-[17px] font-bold'
            : 'font-display text-[20px] font-extrabold tracking-[-0.02em] [font-stretch:112%]',
        )}
      >
        {title}
      </strong>
      <span
        id={`${id}-d`}
        className={cn('leading-[1.5] text-muted-foreground-strong', compact ? 'text-[13px]' : 'text-[14px]')}
      >
        {description}
      </span>
      <label className="flex flex-col gap-1.5">
        <span className="text-[13px] font-semibold text-foreground">Type {word} to confirm</span>
        <span className="relative flex items-center">
          <input
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder={word}
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            aria-describedby={`${id}-h`}
            className={cn(
              'w-full rounded-sm border-2 bg-field px-3 font-mono font-bold tracking-[.08em] text-foreground transition-colors duration-fast ease-glide outline-none placeholder:font-normal placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-ring',
              compact ? 'h-11 text-[15px]' : 'h-12 text-[16px]',
              ok ? 'border-lamp pr-10' : 'border-input',
            )}
          />
          {ok ? (
            <Check
              className="pointer-events-none absolute right-3 size-[18px] text-lamp"
              strokeWidth={2.25}
              aria-hidden="true"
            />
          ) : null}
        </span>
      </label>
      <span
        id={`${id}-h`}
        aria-live="polite"
        className={cn('text-[12px] font-semibold', ok ? 'text-lamp' : 'text-muted-foreground-strong')}
      >
        {ok ? 'Matches — the button is now enabled.' : `Type ${word} exactly (${matched} of ${word.length} letters).`}
      </span>
      <div className="flex flex-wrap justify-end gap-2">
        {onCancel ? (
          <Button variant="outline" className={compact ? undefined : 'text-[15px]'} onClick={onCancel}>
            {cancelLabel}
          </Button>
        ) : null}
        <Button
          variant="destructive"
          className={compact ? undefined : 'text-[15px]'}
          aria-disabled={!ok}
          onClick={() => {
            if (ok) onConfirm();
          }}
        >
          <Trash2 aria-hidden="true" />
          {confirmLabel}
        </Button>
      </div>
    </div>
  );
}
