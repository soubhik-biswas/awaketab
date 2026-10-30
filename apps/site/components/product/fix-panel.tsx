import * as React from 'react';
import Link from 'next/link';
import { cn } from 'cn';
import { BatteryWarning, ExternalLink, Play, RefreshCw } from 'lucide-react';

import { Button } from '@/components/ui/button';

export interface IFixPanelProps extends Omit<React.ComponentProps<'section'>, 'title'> {
  layout?: 'card' | 'stack';
  eyebrow?: React.ReactNode;
  title?: React.ReactNode;
  body?: React.ReactNode;
  steps?: React.ReactNode[];
  onUseFallback: () => void;
  onCheckAgain: () => void;
  guideHref: string;
  fallbackLabel?: string;
  guideLabel?: string;
  checkLabel?: string;
}

const COPY = {
  card: {
    body: 'Battery saver is on, and this browser ignores wake requests while it is. Pick one fix — AwakeTab rechecks as soon as you come back.',
    steps: [
      'Plug in, or turn battery saver off for this browser.',
      'Or switch to the video fallback below — it keeps most screens on.',
      'Still dimming? The desktop app can block system sleep.',
    ],
  },
  stack: {
    body: 'Battery saver is on, and this browser ignores wake requests while it is.',
    steps: [
      'Plug in, or turn battery saver off for this browser.',
      'Or use the video fallback — it keeps most screens on.',
      'Still dimming? The desktop app can block system sleep.',
    ],
  },
};

export function FixPanel({
  layout = 'card',
  eyebrow,
  title = 'Your screen may still sleep',
  body,
  steps,
  onUseFallback,
  onCheckAgain,
  guideHref,
  fallbackLabel = 'Use video fallback',
  guideLabel = 'Open the battery guide',
  checkLabel = 'Check again',
  className,
  ...props
}: IFixPanelProps) {
  const card = layout === 'card';
  const copy = COPY[layout];
  const list = steps ?? copy.steps;
  const titleId = React.useId();
  const external = /^https?:/u.test(guideHref);
  return (
    <section
      data-slot="fix-panel"
      aria-labelledby={titleId}
      className={cn(
        'flex flex-col',
        card ? 'gap-3.5 rounded-lg border border-destructive bg-card p-5' : 'gap-4',
        className,
      )}
      {...props}
    >
      <div className="flex items-start gap-3">
        <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-md bg-destructive-soft text-destructive">
          <BatteryWarning className="size-[22px]" strokeWidth={1.75} aria-hidden="true" />
        </span>
        <span className="flex flex-col gap-1">
          {eyebrow ? (
            <span className="font-mono text-[12px] font-medium text-muted-foreground-strong">{eyebrow}</span>
          ) : null}
          <strong
            id={titleId}
            className={cn(
              'font-sans text-foreground',
              card ? 'text-[22px] leading-[1.2] font-bold' : 'text-[20px] font-extrabold tracking-[-0.02em]',
            )}
          >
            {title}
          </strong>
          <span className="text-[14px] leading-[1.5] text-muted-foreground-strong">{body ?? copy.body}</span>
        </span>
      </div>
      <ol className={cn('m-0 flex list-none flex-col p-0', card ? 'gap-2' : 'gap-4')}>
        {list.map((step, index) => (
          <li
            key={index}
            className={cn('flex gap-2.5 text-[14px] text-foreground', card ? 'items-center' : 'items-start leading-[1.5]')}
          >
            <span
              aria-hidden="true"
              className="inline-flex size-[26px] shrink-0 items-center justify-center rounded-full border bg-secondary font-mono text-[12px] font-bold"
            >
              {index + 1}
            </span>
            <span>{step}</span>
          </li>
        ))}
      </ol>
      <div className={cn('flex', card ? 'flex-wrap gap-2' : 'flex-col gap-4')}>
        <Button
          onClick={onUseFallback}
          className={cn(card ? 'px-3.5' : 'h-13 w-full gap-2 rounded-md text-[15px]')}
        >
          <Play className={card ? undefined : 'size-[18px]'} aria-hidden="true" />
          {fallbackLabel}
        </Button>
        <Button variant="outline" asChild className={cn(card ? 'px-3.5' : 'w-full gap-2 text-[15px]')}>
          <Link href={guideHref} {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}>
            {guideLabel}
            <ExternalLink aria-hidden="true" />
          </Link>
        </Button>
        <Button variant="ghost" onClick={onCheckAgain} className={cn(card ? 'px-3.5' : 'w-full gap-2 text-[15px]')}>
          <RefreshCw aria-hidden="true" />
          {checkLabel}
        </Button>
      </div>
    </section>
  );
}
