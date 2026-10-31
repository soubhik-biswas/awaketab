'use client';

import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { Face, type TFaceId, type TFaceTheme } from '@/components/face';
import { SURFACE_GLASS, SurfacePill, useSurfaceLine } from '@/components/pip/mini-clock';
import { cn } from '@/lib/utils';
import { shortDuration, type ISurfaceView } from '@/lib/surfaces/session';

const TILE = cn('box-border h-[170px] rounded-[28px]', SURFACE_GLASS);

function useWidgetLines() {
  const t = useTranslations('surfaces');
  const line = useSurfaceLine();
  return {
    pill: (v: ISurfaceView) =>
      v.awake && !v.indef ? t('widgets.left', { dur: shortDuration(v.remain, t) }) : t(`status.${v.label}`),
    ends: (v: ISurfaceView) => (v.awake && v.until ? t('widgets.ends', { time: v.until }) : line(v)),
  };
}

function FaceSlot(p: { view: ISurfaceView; theme: TFaceTheme; face: TFaceId }) {
  return (
    <Face
      face={p.face}
      theme={p.theme}
      state={p.view.face}
      size={130}
      remain={p.view.remain}
      total={p.view.total || 3600}
      nowSec={p.view.nowSec}
      indef={p.view.indef}
      bare
      motion="auto"
    />
  );
}

// Large widget: the face beside the status pill, the preset name and when it ends; a tap adds 15 minutes.
export function WidgetLarge({
  view,
  theme,
  face = 'ring',
  label,
  onExtend,
  className,
}: {
  view: ISurfaceView;
  theme: TFaceTheme;
  face?: TFaceId;
  label?: string;
  onExtend?: () => void;
  className?: string;
}) {
  const t = useTranslations('surfaces.widgets');
  const lines = useWidgetLines();
  const body = (
    <>
      <span className="flex-none">
        <FaceSlot view={view} theme={theme} face={face} />
      </span>
      <span className="flex min-w-0 flex-col gap-1.5 text-left">
        <SurfacePill view={view} text={lines.pill(view)} />
        <strong className="truncate font-display text-[22px] font-bold tracking-[-0.02em]">{label || t('name')}</strong>
        <span className="text-[13px] text-muted-foreground-strong">{lines.ends(view)}</span>
      </span>
    </>
  );
  const look = cn(TILE, 'col-span-2 flex items-center gap-3.5 p-4 text-foreground', className);
  return view.canExtend && onExtend ? (
    <button
      type="button"
      data-slot="widget-large"
      onClick={onExtend}
      aria-label={t('extendLabel')}
      className={cn(
        look,
        'cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-ring',
      )}
    >
      {body}
    </button>
  ) : (
    <div data-slot="widget-large" className={look}>
      {body}
    </div>
  );
}

// Small widget: the face over one status word.
export function WidgetSmall({
  view,
  theme,
  face = 'halo',
  className,
}: {
  view: ISurfaceView;
  theme: TFaceTheme;
  face?: TFaceId;
  className?: string;
}) {
  const t = useTranslations('surfaces');
  return (
    <div data-slot="widget-small" className={cn(TILE, 'flex flex-col items-center justify-center gap-1', className)}>
      <FaceSlot view={view} theme={theme} face={face} />
      <span className="text-[12px] text-muted-foreground-strong">{t(`status.${view.label}`)}</span>
    </div>
  );
}

// Quick start: one violet button that keeps the screen awake for an hour.
export function WidgetQuickStart({ onStart, className }: { onStart?: () => void; className?: string }) {
  const t = useTranslations('surfaces.widgets');
  const disc = (
    <span
      aria-hidden="true"
      className="flex size-16 items-center justify-center rounded-full bg-[linear-gradient(180deg,#B39BFF,#7C5CFF)] shadow-[0_10px_26px_rgba(124,92,255,.5)]"
    >
      <svg width="26" height="26" viewBox="0 0 24 24" fill="#0B0718">
        <path d="M7 4.5v15a1 1 0 0 0 1.5.86l12.5-7.5a1 1 0 0 0 0-1.72L8.5 3.64A1 1 0 0 0 7 4.5Z" />
      </svg>
    </span>
  );
  const look = cn(TILE, 'flex flex-col items-center justify-center gap-2.5 text-foreground', className);
  const text = <span className="text-[13px] font-semibold">{t('quick')}</span>;
  return onStart ? (
    <button
      type="button"
      data-slot="widget-quick"
      onClick={onStart}
      aria-label={t('quickLabel')}
      className={cn(
        look,
        'cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-ring',
      )}
    >
      {disc}
      {text}
    </button>
  ) : (
    <div data-slot="widget-quick" className={look}>
      {disc}
      {text}
    </div>
  );
}

const APPS = [
  'linear-gradient(135deg,#FF8FB1,#FF6A3D)',
  'linear-gradient(135deg,#7CBBFF,#1C64B8)',
  'linear-gradient(135deg,#FFC53D,#E08A00)',
  'linear-gradient(135deg,#C1B1FE,#6633F5)',
];

// The phone home screen the widgets board draws them on: wallpaper, status bar, the widget grid and an app row.
export function WidgetScreen({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      data-slot="widget-screen"
      className={cn(
        'dark relative box-border h-[844px] w-full max-w-[390px] overflow-hidden rounded-[48px] border border-white/12 text-foreground',
        'bg-[radial-gradient(120%_80%_at_20%_10%,#1B3A2E,transparent_60%),radial-gradient(120%_80%_at_90%_90%,#2A1E5C,transparent_60%),#0A0C14]',
        className,
      )}
    >
      <div aria-hidden="true" className="flex justify-between px-[30px] py-4 text-[15px] font-semibold">
        <span>11:23</span>
        <span>●●● ▮</span>
      </div>
      <div className="grid grid-cols-2 gap-[22px] px-6 py-[18px]">{children}</div>
      <div aria-hidden="true" className="flex justify-between px-[30px]">
        {APPS.map((bg) => (
          <span key={bg} className="size-[58px] rounded-[16px]" style={{ background: bg }} />
        ))}
      </div>
    </div>
  );
}
