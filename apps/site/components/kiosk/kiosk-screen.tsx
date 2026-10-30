'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { Face } from '@/components/face';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { driftAt, HOLD_MS, KIOSK_STAGE, RELOCK_MS, type IKioskConfig } from '@/lib/surfaces/kiosk';
import { holdTween, usePop } from '@/lib/surfaces/motion';
import type { ISurfaceView } from '@/lib/surfaces/session';

const RING = 2 * Math.PI * 15;

// The 960 × 540 kiosk artboard, scaled to whatever box holds it (the board's frame, a phone column or a TV).
function FitStage({ children, className }: { children: ReactNode; className?: string }) {
  const box = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const el = box.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(([entry]) => {
      if (!entry) return;
      const { width, height } = entry.contentRect;
      setScale(Math.min(width / KIOSK_STAGE.width, height / KIOSK_STAGE.height) || 1);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <div ref={box} className={cn('relative overflow-hidden', className)}>
      <div
        className="absolute top-1/2 left-1/2"
        style={{
          width: KIOSK_STAGE.width,
          height: KIOSK_STAGE.height,
          transform: `translate(-50%, -50%) scale(${scale})`,
        }}
      >
        {children}
      </div>
    </div>
  );
}

function HoldToExit({ onDone }: { onDone: () => void }) {
  const t = useTranslations('surfaces.kiosk');
  const [p, setP] = useState(0);
  const cancel = useRef<(() => void) | null>(null);
  const start = useCallback(() => {
    if (cancel.current) return;
    cancel.current = holdTween(HOLD_MS, setP, () => {
      cancel.current = null;
      setP(0);
      onDone();
    });
  }, [onDone]);
  const stop = useCallback(() => {
    cancel.current?.();
    cancel.current = null;
  }, []);
  useEffect(() => stop, [stop]);
  return (
    <button
      type="button"
      aria-label={t('holdLabel')}
      className="absolute right-4 bottom-[14px] inline-flex h-11 cursor-pointer touch-none items-center gap-2 rounded-[12px] border border-border bg-background/70 px-3 text-[13px] text-muted-foreground-strong select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      onPointerDown={start}
      onPointerUp={stop}
      onPointerLeave={stop}
      onPointerCancel={stop}
      onContextMenu={(e) => e.preventDefault()}
      onKeyDown={(e) => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          if (!e.repeat) start();
        }
      }}
      onKeyUp={(e) => {
        if (e.key === ' ' || e.key === 'Enter') stop();
      }}
      onBlur={stop}
    >
      <svg width="22" height="22" viewBox="0 0 36 36" aria-hidden="true">
        <circle cx="18" cy="18" r="15" fill="none" strokeWidth="4" className="stroke-border" />
        <circle
          cx="18"
          cy="18"
          r="15"
          fill="none"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={`${(RING * p).toFixed(1)} ${RING.toFixed(1)}`}
          transform="rotate(-90 18 18)"
          className="stroke-info"
        />
      </svg>
      {p > 0 ? t('holding') : t('hold')}
    </button>
  );
}

function UnlockPanel({ onBack, onLeave }: { onBack: () => void; onLeave: () => void }) {
  const t = useTranslations('surfaces.kiosk');
  const pop = usePop<HTMLDivElement>();
  const first = useRef<HTMLButtonElement | null>(null);
  useEffect(() => first.current?.focus(), []);
  return (
    <div ref={pop} className="absolute inset-0 flex items-center justify-center bg-black/55">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="kiosk-unlocked"
        className="flex w-[420px] flex-col gap-3 rounded-[22px] bg-secondary p-[22px] shadow-e3"
      >
        <strong id="kiosk-unlocked" className="text-[24px] font-bold">
          {t('unlocked')}
        </strong>
        <span className="text-[14px] leading-[1.5] text-muted-foreground-strong">{t('unlockedBody')}</span>
        <span className="flex gap-2">
          <Button ref={first} type="button" className="h-11 rounded-[12px] border-0 px-4 text-[14px] font-bold" onClick={onBack}>
            {t('back')}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-11 self-start rounded-[12px] px-4 text-[14px] font-semibold"
            onClick={onLeave}
          >
            {t('leave')}
          </Button>
        </span>
      </div>
    </div>
  );
}

export interface IKioskScreenProps {
  config: IKioskConfig;
  view: ISurfaceView;
  shift: number;
  asleep?: string | null;
  onLeave: () => void;
  fill?: boolean;
  className?: string;
}

// The kiosk screen: a large face beside the sign, drifting for burn-in care, locked behind a three-second hold.
// Unlocked, it locks itself again after 30 seconds without a touch.
export function KioskScreen({ config, view, shift, asleep, onLeave, fill = false, className }: IKioskScreenProps) {
  const t = useTranslations('surfaces.kiosk');
  const [locked, setLocked] = useState(true);
  const root = useRef<HTMLDivElement | null>(null);
  const [dx, dy] = driftAt(shift);

  useEffect(() => {
    if (locked) return;
    let id = window.setTimeout(() => setLocked(true), RELOCK_MS);
    const touch = () => {
      window.clearTimeout(id);
      id = window.setTimeout(() => setLocked(true), RELOCK_MS);
    };
    const el = root.current;
    el?.addEventListener('pointerdown', touch);
    el?.addEventListener('keydown', touch);
    return () => {
      window.clearTimeout(id);
      el?.removeEventListener('pointerdown', touch);
      el?.removeEventListener('keydown', touch);
    };
  }, [locked]);

  return (
    <div
      ref={root}
      role="region"
      aria-label={t('region')}
      data-locked={locked}
      className={cn(
        config.screen,
        'bg-background text-foreground',
        fill
          ? 'size-full'
          : 'aspect-[16/9] w-full max-w-[960px] rounded-[18px] shadow-[0_0_0_10px_var(--secondary),0_30px_70px_rgba(0,0,0,.5)]',
        className,
      )}
    >
      <FitStage className={cn('size-full', !fill && 'rounded-[18px]')}>
        <div
          className="absolute flex items-center justify-center gap-[60px]"
          style={{ left: dx, top: dy, width: KIOSK_STAGE.width, height: KIOSK_STAGE.height }}
        >
          {config.logo ? (
            <img
              src={config.logo}
              alt=""
              referrerPolicy="no-referrer"
              decoding="async"
              className="absolute top-5 left-6 max-h-12 max-w-[200px] object-contain"
            />
          ) : null}
          <Face
            face={config.face}
            theme={config.screen}
            state={view.face}
            size={KIOSK_STAGE.face}
            remain={view.remain}
            total={view.total || 3600}
            nowSec={view.nowSec}
            indef={view.indef}
            bare
          />
          <span className="flex max-w-[300px] flex-col gap-[10px]">
            <span className="font-mono text-[14px] tracking-[.12em] text-muted-foreground-strong">{config.kicker}</span>
            <strong className="text-[40px] leading-[1.05] font-bold tracking-[-0.03em]">{config.msg}</strong>
            <span className="text-[18px] text-muted-foreground-strong" aria-live="polite">
              {asleep ?? config.line}
            </span>
          </span>
        </div>
        {locked ? (
          <HoldToExit onDone={() => setLocked(false)} />
        ) : (
          <UnlockPanel
            onBack={() => setLocked(true)}
            onLeave={() => {
              setLocked(true);
              onLeave();
            }}
          />
        )}
      </FitStage>
    </div>
  );
}
