import * as React from 'react';
import { cn } from 'cn';

import { formatDuration, formatDurationWords } from '@/lib/format';

export interface ICountdownProps extends Omit<React.ComponentProps<'div'>, 'children'> {
  remain: number;
  total?: number;
  endsAt?: string;
  variant?: 'ring' | 'digits';
  size?: number;
  warnAt?: number;
  caption?: string;
  label?: string;
}

const RADIUS = 72;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function Countdown({
  remain,
  total = 0,
  endsAt,
  variant = 'ring',
  size = 170,
  warnAt = 300,
  caption,
  label,
  className,
  ...props
}: ICountdownProps) {
  const digits = formatDuration(remain);
  const sub = caption ?? (endsAt ? `left · ends ${endsAt}` : 'left');
  const aria = label ?? `${formatDurationWords(remain)} left${endsAt ? `, ends at ${endsAt}` : ''}`;
  const warn = remain > 0 && remain <= warnAt;

  if (variant === 'digits') {
    return (
      <div
        role="timer"
        aria-label={aria}
        data-slot="countdown"
        className={cn('flex flex-col items-center gap-2', className)}
        {...props}
      >
        <span
          aria-hidden="true"
          className="font-sans text-[96px] leading-none font-light tracking-[-0.03em] text-foreground tabular-nums"
        >
          {digits}
        </span>
        <span aria-hidden="true" className="text-[14px] text-muted-foreground-strong">
          {sub}
        </span>
      </div>
    );
  }

  const progress = total > 0 ? Math.min(1, Math.max(0, remain / total)) : 1;
  const angle = -Math.PI / 2 + 2 * Math.PI * progress;
  const knobX = 85 + RADIUS * Math.cos(angle);
  const knobY = 85 + RADIUS * Math.sin(angle);
  const tone = warn ? 'var(--warning)' : 'var(--lamp)';
  const scale = size / 170;

  return (
    <div
      role="timer"
      aria-label={aria}
      data-slot="countdown"
      data-warn={warn || undefined}
      className={cn('relative shrink-0', className)}
      style={{ width: size, height: size }}
      {...props}
    >
      <svg width={size} height={size} viewBox="0 0 170 170" aria-hidden="true">
        <circle cx={85} cy={85} r={RADIUS} fill="none" stroke="var(--surface-3)" strokeWidth={12} />
        <circle
          cx={85}
          cy={85}
          r={RADIUS}
          fill="none"
          stroke={tone}
          strokeWidth={12}
          strokeLinecap="round"
          strokeDasharray={`${progress * CIRCUMFERENCE} ${CIRCUMFERENCE}`}
          transform="rotate(-90 85 85)"
          className="transition-[stroke] duration-base ease-base"
        />
        <circle
          cx={knobX.toFixed(1)}
          cy={knobY.toFixed(1)}
          r={9}
          stroke={tone}
          strokeWidth={3}
          className="fill-card dark:fill-foreground"
        />
      </svg>
      <div
        aria-hidden="true"
        className="absolute inset-0 flex flex-col items-center justify-center gap-0.5"
        style={{ fontSize: 16 * scale }}
      >
        <span className="font-mono text-[2em] leading-none font-bold tracking-[-0.02em] text-foreground tabular-nums">
          {digits}
        </span>
        <span className="text-[max(12px,0.75em)] text-muted-foreground-strong">{sub}</span>
      </div>
    </div>
  );
}
