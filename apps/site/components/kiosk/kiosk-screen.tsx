'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { Face } from '@/components/face';
import { SurfacePill, useSurfaceLine } from '@/components/pip/mini-clock';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { driftAt, HOLD_MS, KIOSK_STAGE, RELOCK_MS, type IKioskConfig } from '@/lib/surfaces/kiosk';
import { holdTween, usePop } from '@/lib/surfaces/motion';
import type { ISurfaceView } from '@/lib/surfaces/session';

const RING = 2 * Math.PI * 15;

// The 1440 × 810 wall-mode artboard, scaled to whatever box holds it (the page's preview or the TV itself).
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
      className="absolute bottom-[22px] left-10 inline-flex h-11 cursor-pointer touch-none items-center gap-3 rounded-full px-1 font-mono text-[14px] text-muted-foreground select-none focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-ring"
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
        <circle cx="18" cy="18" r="15" fill="none" strokeWidth="4" className="stroke-white/15" />
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
    <div ref={pop} className="absolute inset-0 flex items-center justify-center bg-black/60">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="kiosk-unlocked"
        className="flex w-[520px] flex-col gap-4 rounded-[28px] border border-white/10 bg-[rgba(16,18,26,.86)] p-7 shadow-[0_30px_80px_rgba(0,0,0,.6),inset_0_1px_0_rgba(255,255,255,.06)] backdrop-blur-[20px]"
      >
        <strong id="kiosk-unlocked" className="font-display text-[30px] font-bold tracking-[-0.02em]">
          {t('unlocked')}
        </strong>
        <span className="text-[16px] leading-[1.5] text-muted-foreground-strong">{t('unlockedBody')}</span>
        <span className="flex gap-2.5">
          <Button
            ref={first}
            type="button"
            className="h-12 rounded-full border-0 px-5 text-[15px] font-bold"
            onClick={onBack}
          >
            {t('back')}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-12 rounded-[12px] px-5 text-[15px] font-semibold"
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
  dim?: number;
  onLeave: () => void;
  fill?: boolean;
  className?: string;
}

// Wall mode: the face full screen on OLED black, a small status pill, a few pixels of drift every three minutes and
// 40 % after 10 PM. Running, it sits behind a three-second hold, and locks again after 30 seconds without a touch.
export function KioskScreen({
  config,
  view,
  shift,
  asleep,
  dim = 1,
  onLeave,
  fill = false,
  className,
}: IKioskScreenProps) {
  const t = useTranslations('surfaces');
  const line = useSurfaceLine();
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

  const pill = asleep ?? `${t(`status.${view.label}`)} · ${line(view)}`;
  const screen = (
    <FitStage className="size-full">
      <div
        className="absolute inset-0 transition-opacity duration-1000 ease-out motion-reduce:transition-none"
        style={{ opacity: dim }}
      >
        {view.awake ? (
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_50%,rgba(61,245,142,.08),transparent_70%)]"
          />
        ) : null}
        <div className="absolute inset-0" style={{ transform: `translate(${dx}px, ${dy}px)` }}>
          {config.logo ? (
            <img
              src={config.logo}
              alt=""
              referrerPolicy="no-referrer"
              decoding="async"
              className="absolute top-8 left-10 max-h-16 max-w-[260px] object-contain"
            />
          ) : null}
          <div className="absolute inset-x-0 flex justify-center" style={{ top: KIOSK_STAGE.faceTop }}>
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
              motion="auto"
            />
          </div>
          <div className="absolute right-10 bottom-[26px]">
            <SurfacePill view={view} text={pill} />
          </div>
          {fill && locked ? <HoldToExit onDone={() => setLocked(false)} /> : null}
        </div>
      </div>
      {fill && !locked ? (
        <UnlockPanel
          onBack={() => setLocked(true)}
          onLeave={() => {
            setLocked(true);
            onLeave();
          }}
        />
      ) : null}
    </FitStage>
  );

  return fill ? (
    <div
      ref={root}
      role="region"
      aria-label={t('kiosk.region')}
      data-locked={locked}
      className={cn(config.screen, 'size-full bg-background text-foreground', className)}
    >
      {screen}
    </div>
  ) : (
    <div className={cn('flex w-full max-w-[1440px] flex-col items-center', className)}>
      <div
        ref={root}
        role="region"
        aria-label={t('kiosk.region')}
        className={cn(
          config.screen,
          'box-border aspect-[16/9] w-full overflow-hidden rounded-[22px] border-[14px] border-[#15171E] bg-background text-foreground shadow-[0_40px_100px_rgba(0,0,0,.7)]',
        )}
      >
        {screen}
      </div>
      <div
        aria-hidden="true"
        className="h-[60px] w-[220px] max-w-[15%] bg-[linear-gradient(180deg,#15171E,#0B0C10)] [clip-path:polygon(20%_0,80%_0,100%_100%,0_100%)]"
      />
    </div>
  );
}
