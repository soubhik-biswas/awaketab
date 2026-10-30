'use client';

import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import type { TPresetId } from '@awaketab/core';
import { Face, type TFaceTheme } from '@/components/face';
import { useSurfaceLine } from '@/components/pip/mini-clock';
import { cn } from '@/lib/utils';
import { digits, TONE_TEXT, type ISurfaceView } from '@/lib/surfaces/session';
import { WIDGET_PRESETS } from '@/lib/surfaces/widgets';

const TILE = 'rounded-[26px] bg-card/85 shadow-[0_0_0_1px_var(--border)]';

function useWidgetLines() {
  const t = useTranslations('surfaces.widgets');
  const line = useSurfaceLine();
  return {
    small: (v: ISurfaceView) => (v.awake ? (v.until ? t('small', { time: v.until }) : t('smallNoEnd')) : line(v)),
    wide: (v: ISurfaceView) => (v.awake ? (v.until ? t('awakeUntil', { time: v.until }) : t('awakeNoEnd')) : line(v)),
  };
}

// Small widget: the Ring face over the end time.
export function WidgetSmall({ view, theme, className }: { view: ISurfaceView; theme: TFaceTheme; className?: string }) {
  const lines = useWidgetLines();
  return (
    <div
      data-slot="widget-small"
      className={cn(TILE, 'flex flex-col items-center justify-center gap-1 backdrop-blur-[10px]', className)}
    >
      <Face
        face="ring"
        theme={theme}
        state={view.face}
        size={110}
        remain={view.remain}
        total={view.total || 3600}
        nowSec={view.nowSec}
        indef={view.indef}
        bare
      />
      <span className={cn('text-[12px] font-semibold', TONE_TEXT[view.tone])}>{lines.small(view)}</span>
    </div>
  );
}

// Presets widget: three starts, each a tap away.
export function WidgetPresets({ onPreset, className }: { onPreset?: (p: TPresetId) => void; className?: string }) {
  const t = useTranslations('surfaces.widgets');
  return (
    <div
      data-slot="widget-presets"
      role="group"
      aria-label={t('presetsLabel')}
      className={cn(TILE, 'flex flex-col justify-between p-4', className)}
    >
      <span className="text-[12px] text-muted-foreground-strong">{t('presets')}</span>
      {WIDGET_PRESETS.map((p) => {
        const body = (
          <>
            <span>{t(p.key)}</span>
            <span className="font-mono text-[12px] text-muted-foreground-strong">{t(p.len)}</span>
          </>
        );
        const row = 'flex items-center justify-between text-[14px] font-semibold';
        return onPreset ? (
          <button
            key={p.key}
            type="button"
            className={cn(
              row,
              'relative min-h-6 cursor-pointer rounded-xs text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
            )}
            onClick={() => onPreset(p.preset)}
          >
            {body}
          </button>
        ) : (
          <span key={p.key} className={row}>
            {body}
          </span>
        );
      })}
    </div>
  );
}

function WideAction({
  children,
  onClick,
  label,
  className,
}: {
  children: ReactNode;
  onClick?: (() => void) | undefined;
  label?: string;
  className: string;
}) {
  const look = cn('flex h-10 items-center rounded-[12px] px-4 text-[14px]', className);
  return onClick ? (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={cn(
        look,
        'cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
      )}
    >
      {children}
    </button>
  ) : (
    <span className={look}>{children}</span>
  );
}

// Wide widget: the session label, big digits, the end time, +15 min and Stop.
export function WidgetWide({
  view,
  label,
  onExtend,
  onStop,
  onStart,
  className,
}: {
  view: ISurfaceView;
  label?: string;
  onExtend?: () => void;
  onStop?: () => void;
  onStart?: () => void;
  className?: string;
}) {
  const t = useTranslations('surfaces.widgets');
  const lines = useWidgetLines();
  return (
    <div data-slot="widget-wide" className={cn(TILE, 'col-span-2 flex items-center gap-[14px] px-[18px]', className)}>
      <span className="flex flex-1 flex-col gap-1">
        <span className="text-[12px] text-muted-foreground-strong">{label || t('session')}</span>
        <span className="text-[40px] font-bold tracking-[-0.03em]">{view.indef ? '∞' : digits(view.remain)}</span>
        <span className={cn('text-[13px] font-semibold', TONE_TEXT[view.tone])}>{lines.wide(view)}</span>
      </span>
      <span className="flex flex-col gap-2">
        {view.live ? (
          <>
            {view.canExtend ? (
              <WideAction
                onClick={onExtend}
                label={t('extendLabel')}
                className="bg-primary font-bold text-primary-foreground"
              >
                {t('extend')}
              </WideAction>
            ) : null}
            <WideAction onClick={onStop} className="border border-input font-semibold text-foreground">
              {t('stop')}
            </WideAction>
          </>
        ) : (
          <WideAction onClick={onStart} className="bg-primary font-bold text-primary-foreground">
            {t('start')}
          </WideAction>
        )}
      </span>
    </div>
  );
}

// The home-screen frame the widgets board draws them on: a phone wallpaper with the two-column widget grid.
export function WidgetScreen({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      data-slot="widget-screen"
      className={cn(
        'dark relative grid h-[520px] w-full max-w-[420px] grid-cols-2 auto-rows-[158px] gap-[18px] overflow-hidden rounded-[44px] px-[22px] py-[34px] text-foreground shadow-[0_0_0_8px_var(--secondary)]',
        'bg-[radial-gradient(circle_at_20%_15%,var(--accent),transparent_50%),radial-gradient(circle_at_80%_85%,var(--primary-soft),transparent_50%),var(--background)]',
        className,
      )}
    >
      {children}
    </div>
  );
}
