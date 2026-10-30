import * as React from 'react';
import { cn } from 'cn';
import { Ban, BellRing, Clock, LoaderCircle, Pause, Play, Power, ZapOff, type LucideIcon } from 'lucide-react';

export type TStatusState =
  'idle' | 'starting' | 'awake' | 'running' | 'needsyou' | 'fallback' | 'paused' | 'blocked' | 'ended' | 'unsupported';

export interface IStatusPillProps extends Omit<React.ComponentProps<'span'>, 'children'> {
  state: TStatusState;
  time?: string;
  reason?: string;
  label?: string;
  live?: boolean;
  icon?: LucideIcon;
}

type TPillLook = { tone: string; icon?: LucideIcon; spin?: boolean; dot?: boolean };

const LOOK: Record<Exclude<TStatusState, 'running'>, TPillLook> = {
  idle: { tone: 'border-input bg-transparent text-muted-foreground-strong', icon: Power },
  starting: { tone: 'border-info bg-info-soft text-info', spin: true },
  awake: { tone: 'border-lamp bg-accent text-lamp', dot: true },
  needsyou: { tone: 'border-info bg-info-soft text-info', icon: BellRing },
  fallback: { tone: 'border-dashed border-lamp bg-transparent text-lamp', icon: Play },
  paused: { tone: 'border-warning bg-warning-soft text-warning', icon: Pause },
  blocked: { tone: 'border-destructive bg-destructive-soft text-destructive', icon: Ban },
  ended: { tone: 'border-ended bg-ended-soft text-ended', icon: Clock },
  unsupported: { tone: 'border-border bg-secondary text-muted-foreground-strong', icon: ZapOff },
};

function statusPillLabel(state: TStatusState, time?: string, reason?: string): string {
  switch (state) {
    case 'idle':
      return 'Not keeping awake';
    case 'starting':
      return 'Starting…';
    case 'awake':
    case 'running':
      return time ? `Awake · until ${time}` : 'Awake · no end';
    case 'needsyou':
      return 'Needs you · tap to resume';
    case 'fallback':
      return 'Awake · video fallback';
    case 'paused':
      return `Paused · ${reason ?? 'tab hidden'}`;
    case 'blocked':
      return `Blocked · ${reason ?? 'battery saver'}`;
    case 'ended':
      return time ? `Ended at ${time}` : 'Ended';
    case 'unsupported':
      return 'Not supported here';
  }
}

export function StatusPill({ state, time, reason, label, live = false, icon, className, ...props }: IStatusPillProps) {
  const key = state === 'running' ? 'awake' : state;
  const look = LOOK[key];
  const Icon = icon ?? look.icon;
  return (
    <span
      data-slot="status-pill"
      data-state={key}
      role={live ? 'status' : undefined}
      aria-live={live ? 'polite' : undefined}
      className={cn(
        'inline-flex h-9 max-w-full shrink-0 items-center gap-2 overflow-hidden rounded-full border pr-3.5 pl-3 text-[14px] font-semibold whitespace-nowrap transition-colors duration-base ease-base',
        look.tone,
        className,
      )}
      {...props}
    >
      {look.spin ? (
        <LoaderCircle className="size-4 shrink-0 animate-spinner" strokeWidth={2.25} aria-hidden="true" />
      ) : null}
      {look.dot ? (
        <span
          aria-hidden="true"
          className="size-2.5 shrink-0 animate-breath rounded-full bg-current shadow-[0_0_0_3px_var(--halo)]"
        />
      ) : null}
      {Icon ? <Icon className="size-4 shrink-0" strokeWidth={2.25} aria-hidden="true" /> : null}
      <span className="truncate">{label ?? statusPillLabel(state, time, reason)}</span>
    </span>
  );
}
