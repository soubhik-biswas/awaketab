'use client';

import * as React from 'react';
import { cn } from 'cn';
import { AlarmClock, CircleAlert, CircleCheck, History, X, type LucideIcon } from 'lucide-react';
import { toast } from 'sonner';

type TToastTone = 'success' | 'warning' | 'error' | 'ended' | 'info';

export interface IProductToastOptions {
  id?: string | number;
  tone: TToastTone;
  title: React.ReactNode;
  description?: React.ReactNode;
  icon?: LucideIcon;
  actionLabel?: React.ReactNode;
  onAction?: () => void;
  duration?: number;
  dismissLabel?: string;
  // Off when the page announces the same moment itself, so a screen reader hears it once.
  live?: boolean;
}

const TONE: Record<TToastTone, { icon: LucideIcon; color: string }> = {
  success: { icon: CircleCheck, color: 'text-lamp' },
  warning: { icon: AlarmClock, color: 'text-warning' },
  error: { icon: CircleAlert, color: 'text-destructive' },
  ended: { icon: History, color: 'text-ended' },
  info: { icon: CircleCheck, color: 'text-info' },
};

export const TOAST_DURATION = 6000;

interface IProductToastProps extends Omit<IProductToastOptions, 'id'> {
  toastId: string | number;
}

// Sonner's own timer does not pause on keyboard focus, so each toast keeps its own pausable timer.
function useDismissTimer(toastId: string | number, duration: number) {
  const remaining = React.useRef(duration);
  const started = React.useRef(0);
  const timer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const paused = React.useRef(0);

  const stop = React.useCallback(() => {
    if (timer.current === undefined) return;
    clearTimeout(timer.current);
    timer.current = undefined;
    remaining.current -= Date.now() - started.current;
  }, []);

  const start = React.useCallback(() => {
    if (!Number.isFinite(duration) || timer.current !== undefined || paused.current > 0) return;
    started.current = Date.now();
    timer.current = setTimeout(() => toast.dismiss(toastId), Math.max(0, remaining.current));
  }, [duration, toastId]);

  React.useEffect(() => {
    start();
    const onVisibility = () => (document.hidden ? stop() : start());
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      stop();
    };
  }, [start, stop]);

  const hold = React.useCallback(() => {
    paused.current += 1;
    stop();
  }, [stop]);
  const release = React.useCallback(() => {
    paused.current = Math.max(0, paused.current - 1);
    start();
  }, [start]);
  return { hold, release };
}

export function ProductToast({
  toastId,
  tone,
  title,
  description,
  icon,
  actionLabel,
  onAction,
  duration = TOAST_DURATION,
  dismissLabel = 'Dismiss',
  live = true,
}: IProductToastProps) {
  const look = TONE[tone];
  const Icon = icon ?? look.icon;
  const { hold, release } = useDismissTimer(toastId, duration);
  return (
    <div
      role={live ? 'status' : undefined}
      aria-live={live ? 'polite' : 'off'}
      data-slot="product-toast"
      data-tone={tone}
      onPointerEnter={hold}
      onPointerLeave={release}
      onFocus={hold}
      onBlur={release}
      className="flex w-(--width) max-w-full items-center gap-2.5 rounded-[16px] border bg-pop py-2.5 pr-2 pl-3.5 font-sans text-foreground shadow-e2 max-[600px]:w-full"
    >
      <Icon className={cn('size-5 shrink-0', look.color)} strokeWidth={1.75} aria-hidden="true" />
      <span className="flex min-w-0 flex-1 flex-col gap-px">
        <strong className="text-[14px] font-bold">{title}</strong>
        {description ? (
          <span className="text-[12px] leading-[1.45] text-muted-foreground-strong">{description}</span>
        ) : null}
      </span>
      {actionLabel && onAction ? (
        <button
          type="button"
          onClick={() => {
            onAction();
            toast.dismiss(toastId);
          }}
          className="inline-flex h-11 shrink-0 cursor-pointer items-center border-0 bg-transparent px-2 text-[15px] font-semibold text-lamp underline underline-offset-3 outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          {actionLabel}
        </button>
      ) : null}
      <button
        type="button"
        onClick={() => toast.dismiss(toastId)}
        aria-label={dismissLabel}
        className="inline-flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-sm border-0 bg-transparent text-muted-foreground-strong transition-colors duration-glide outline-none hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <X className="size-4" aria-hidden="true" />
      </button>
    </div>
  );
}

export function showToast({ id, duration, ...options }: IProductToastOptions): string | number {
  const life = duration ?? (options.tone === 'error' ? Infinity : TOAST_DURATION);
  return toast.custom((toastId) => <ProductToast toastId={toastId} duration={life} {...options} />, {
    id,
    duration: Infinity,
    unstyled: true,
  });
}

export function showExtendedToast({ until, minutes, onUndo }: { until: string; minutes: number; onUndo: () => void }) {
  return showToast({
    id: 'extended',
    tone: 'success',
    title: `Awake until ${until}`,
    description: `Extended by ${minutes} minutes.`,
    actionLabel: 'Undo',
    onAction: onUndo,
  });
}

export function showLowTimeToast({ endsAt, onExtend }: { endsAt: string; onExtend: () => void }) {
  return showToast({
    id: 'low-time',
    tone: 'warning',
    title: '5 minutes left',
    description: `Ends at ${endsAt}.`,
    actionLabel: '+15 min',
    onAction: onExtend,
  });
}

export function showSyncFailedToast({ onRetry, description }: { onRetry: () => void; description?: string }) {
  return showToast({
    id: 'sync-failed',
    tone: 'error',
    title: 'Couldn’t sync',
    description: description ?? 'You are offline. Changes stay on this device.',
    actionLabel: 'Retry',
    onAction: onRetry,
  });
}

export function showEndedToast({ endedAt, onStartAgain }: { endedAt: string; onStartAgain: () => void }) {
  return showToast({
    id: 'ended',
    tone: 'ended',
    title: 'Time’s up',
    description: `Ended at ${endedAt}. The screen can sleep again.`,
    actionLabel: 'Start again',
    onAction: onStartAgain,
    duration: Infinity,
  });
}
