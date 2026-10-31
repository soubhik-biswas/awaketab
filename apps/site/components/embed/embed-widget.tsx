'use client';

import type { CSSProperties, ReactNode } from 'react';
import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { TLockState } from '@awaketab/wake';
import { Mark, type TMarkLamp } from '@/components/brand/mark';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { TEmbedMode, TEmbedSize } from '@/lib/embed/protocol';
import { COOK_MAX_TIMERS, COOK_QUICK_MIN, type ICookTimer } from '@/lib/embed/timers';

const EMBED_FIX_URL = 'https://awaketab.com/embed#allow';

// The Glance status pill's colour per lock state; at rest it is hollow and quiet.
const PILL_TONE: Record<TLockState, string> = {
  idle: 'text-muted-foreground-strong',
  requesting: 'text-info',
  held: 'text-lamp',
  lost: 'text-warning',
  denied: 'text-destructive',
  unsupported: 'text-muted-foreground-strong',
  fallback: 'text-lamp',
};
const SOLID: ReadonlySet<TLockState> = new Set<TLockState>(['requesting', 'held', 'lost', 'denied', 'fallback']);
const VIOLET =
  'border-0 bg-[linear-gradient(180deg,#7A4DFF,#6633F5_45%,#5124E0)] text-white shadow-[0_12px_30px_var(--primary-glow)] dark:bg-[linear-gradient(180deg,#B39BFF,#9F7BFF_45%,#7C5CFF)] dark:text-[#0B0718]';
const FOCUS = 'focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-ring';

const BEAD: Record<TLockState, TMarkLamp> = {
  idle: 'off',
  requesting: 'info',
  held: 'awake',
  lost: 'paused',
  denied: 'blocked',
  unsupported: 'info',
  fallback: 'awake',
};

export type TEmbedAction = 'start' | 'stop' | 'retry';
export type TEmbedNotice = { tone: 'bad' | 'lamp'; text: string; fix: boolean } | null;

export interface IEmbedWidgetProps {
  mode: TEmbedMode;
  size: TEmbedSize;
  theme: 'light' | 'dark' | 'oled';
  lock: TLockState;
  action: TEmbedAction;
  digits: string;
  muted: boolean;
  digitsLabel: string;
  hint: string;
  foot: string;
  note: string | null;
  notice: TEmbedNotice;
  paused: boolean;
  accent?: { bg: string; fg: string } | null;
  timers?: ReactNode;
  long?: boolean;
  onAction: () => void;
  onDigits: () => void;
  className?: string;
}

// The website widget: status pill, big digits and Start/Stop; full size adds the mark and title, a meta line and,
// in cook mode, the kitchen timers. A notice band along the bottom carries the fix when the lock cannot be had.
export function EmbedWidget(p: IEmbedWidgetProps) {
  const t = useTranslations('embed');
  const ts = useTranslations('surfaces.embed');
  const tp = useTranslations('tool.pill');
  const full = p.size === 'full';
  const live = p.lock === 'held' || p.lock === 'requesting' || p.lock === 'fallback';
  const pillLabel = p.lock === 'idle' ? tp('idle._') : tp(p.lock);
  const accent: CSSProperties | undefined =
    p.accent && p.action === 'start'
      ? { background: p.accent.bg, borderColor: p.accent.bg, color: p.accent.fg }
      : undefined;
  const label = p.action === 'stop' ? ts('stop') : p.action === 'retry' ? ts('retry') : t('start');
  const solid = SOLID.has(p.lock);
  const pill = (
    <span
      role="status"
      aria-live="polite"
      data-slot="status-pill"
      className={cn(
        'inline-flex h-[30px] max-w-full items-center gap-2 rounded-full border bg-glass pr-3 pl-2.5 text-[13px] font-semibold whitespace-nowrap',
        PILL_TONE[p.lock],
        solid ? 'border-[color-mix(in_srgb,currentColor_33%,transparent)]' : 'border-border',
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'box-border size-2 flex-none rounded-full',
          solid ? 'bg-current' : 'border-2 border-current',
          p.lock === 'held' && 'motion-safe:animate-pulse',
        )}
      />
      <span className="truncate">{pillLabel}</span>
    </span>
  );
  const button = (
    <Button
      type="button"
      variant={p.action === 'start' ? 'default' : 'secondary'}
      onClick={p.onAction}
      style={accent}
      className={cn(
        'shrink-0 gap-2 rounded-full font-bold',
        p.action === 'start' ? VIOLET : 'border border-border-hi bg-glass text-foreground hover:bg-surface-3',
        full ? 'h-[52px] w-[112px] text-[16px] @min-[600px]:w-[128px]' : 'h-11 w-24 text-[15px]',
        full && p.mode === 'cook' && 'h-14',
      )}
    >
      {label}
    </Button>
  );
  const digits =
    p.mode === 'minimal' ? (
      <span className="text-[14px] text-muted-foreground-strong">{p.note}</span>
    ) : (
      <button
        type="button"
        onClick={p.onDigits}
        aria-label={p.digitsLabel}
        aria-pressed={p.mode === 'cook' && live ? p.paused : undefined}
        className={cn(
          'cursor-pointer self-start rounded-[12px] text-left font-light tracking-[-0.04em] tabular-nums',
          FOCUS,
          full ? 'text-[28px] @min-[360px]:text-[48px] @min-[600px]:text-[64px]' : 'text-[28px]',
          p.muted ? 'text-muted-foreground-strong' : 'text-foreground',
        )}
      >
        {p.digits}
      </button>
    );

  return (
    <div
      data-slot="embed-widget"
      data-lock={p.lock}
      data-size={p.size}
      className={cn(
        p.theme,
        '@container relative flex w-full flex-col overflow-hidden border border-border bg-card text-foreground shadow-panel',
        full ? 'min-h-[240px] rounded-[28px]' : 'min-h-[104px] rounded-[18px]',
        p.className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute inset-0',
          live
            ? 'bg-[radial-gradient(circle_at_0%_0%,color-mix(in_srgb,var(--lamp)_14%,transparent),transparent_60%)]'
            : 'bg-[radial-gradient(circle_at_0%_0%,color-mix(in_srgb,var(--muted-foreground)_6%,transparent),transparent_60%)]',
        )}
      />
      {full ? (
        <div className="relative flex flex-1 flex-col gap-4 px-6 py-4 @max-[599px]:px-4 @min-[600px]:flex-row">
          <div className="flex min-w-0 flex-1 flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <span aria-hidden="true" className="inline-flex">
                <Mark size={24} lampState={BEAD[p.lock]} tone="auto" glow={false} />
              </span>
              <strong className="font-display text-[17px] font-bold tracking-[-0.02em]">{t('frame.title')}</strong>
              <span className="ml-auto">{pill}</span>
            </div>
            <div className="flex items-end justify-between gap-4">
              <div className="flex min-w-0 flex-col gap-1">
                {digits}
                <span className="min-h-[18px] text-[13px] text-muted-foreground-strong">{p.hint}</span>
              </div>
              {button}
            </div>
            <span className="mt-auto text-[13px] text-muted-foreground">{p.foot}</span>
          </div>
          {p.timers}
        </div>
      ) : (
        <div
          className={cn(
            'relative grid flex-1 items-center gap-x-3 gap-y-1 p-4',
            p.long ? 'grid-cols-[1fr_auto] grid-rows-[auto_auto]' : 'grid-cols-[1fr_auto]',
          )}
        >
          <div className={cn('flex min-w-0 flex-col gap-1', p.long && 'col-span-2')}>{pill}</div>
          <div className="flex min-w-0 flex-col">{digits}</div>
          <div className={cn('row-start-1 self-end', p.long ? 'col-start-2 row-start-2' : 'col-start-2 row-span-2')}>
            {button}
          </div>
          <span className="sr-only">{p.hint}</span>
        </div>
      )}
      {p.notice ? (
        <div
          role="note"
          className={cn(
            'relative flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2.5 text-[13px]',
            p.notice.tone === 'bad'
              ? 'bg-[color-mix(in_srgb,var(--destructive)_8%,transparent)]'
              : 'bg-[color-mix(in_srgb,var(--lamp)_8%,transparent)]',
          )}
        >
          <span className="min-w-0 flex-1">{p.notice.text}</span>
          {p.notice.fix ? (
            <a
              href={EMBED_FIX_URL}
              target="_blank"
              rel="noopener"
              aria-label={ts('fixLabel')}
              className="inline-flex min-h-11 items-center font-semibold text-foreground underline underline-offset-3"
            >
              {t('advice.fix')}
            </a>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export interface IKitchenTimersProps {
  timers: ICookTimer[];
  now: number;
  format: (ms: number) => string;
  onAdd: (minutes: number) => void;
  onRemove: (id: string) => void;
}

// Up to three kitchen timers beside the main control (under it in a narrow frame); a finished one flashes.
export function KitchenTimers({ timers, now, format, onAdd, onRemove }: IKitchenTimersProps) {
  const t = useTranslations('embed.timers');
  const ts = useTranslations('surfaces.embed.timers');
  return (
    <section
      aria-label={t('title')}
      className="flex flex-col gap-2 border-border @max-[599px]:border-t @max-[599px]:pt-3 @min-[600px]:w-[264px] @min-[600px]:border-l @min-[600px]:pl-4"
    >
      <strong className="text-[13px] font-semibold text-muted-foreground-strong">{t('title')}</strong>
      {timers.length === 0 ? <span className="text-[13px] text-muted-foreground-strong">{t('empty')}</span> : null}
      <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
        {timers.map((x) => {
          const done = x.doneAt !== null;
          const flashing = done && now - (x.doneAt ?? 0) < 3000;
          return (
            <li
              key={x.id}
              className={cn(
                'flex h-[46px] items-center gap-2 rounded-[12px] border border-border bg-glass px-3',
                done && 'border-lamp bg-accent',
                flashing && 'motion-safe:animate-pulse',
              )}
            >
              <span className="min-w-0 flex-1 truncate text-[14px] font-semibold">{x.name}</span>
              <span className="text-[14px] tabular-nums text-muted-foreground-strong">
                {done ? ts('finished') : format(x.endsAt - now)}
              </span>
              <button
                type="button"
                onClick={() => onRemove(x.id)}
                aria-label={ts('remove', { name: x.name })}
                className={cn(
                  'inline-flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-[12px] text-muted-foreground-strong hover:bg-secondary',
                  FOCUS,
                )}
              >
                <X className="size-4" strokeWidth={2} aria-hidden="true" />
              </button>
            </li>
          );
        })}
      </ul>
      {timers.length < COOK_MAX_TIMERS ? (
        <div className="flex flex-wrap gap-1.5">
          {COOK_QUICK_MIN.map((min) => (
            <button
              key={min}
              type="button"
              onClick={() => onAdd(min)}
              aria-label={t('addLabel', { minutes: min })}
              className={cn(
                'inline-flex h-11 min-w-11 cursor-pointer items-center justify-center rounded-[12px] border-[1.5px] border-dashed border-border-hi px-3 text-[13px] font-semibold text-muted-foreground-strong hover:text-foreground',
                FOCUS,
              )}
            >
              {ts('quick', { minutes: min })}
            </button>
          ))}
        </div>
      ) : null}
    </section>
  );
}
