'use client';

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import {
  ArrowUpLeft,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Music2,
  Pause,
  Play,
  Plus,
  RotateCcw,
  RotateCw,
  Square,
  Volume2,
  VolumeX,
  type LucideIcon,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Face, StateIcon, type TFaceId, type TFaceTheme } from '@/components/face';
import { cn } from '@/lib/utils';
import { clockUntil } from '@/lib/tool/clock';
import type { TToolLang } from '@/lib/tool/strings';
import type { TMiniSize } from '@/lib/surfaces/pip';
import { digits, type ISurfaceView } from '@/lib/surfaces/session';
import type { TScene } from '@/lib/tool/sound-scenes';
import { SCENE_ICON } from '@/components/tool/sound-icons';

export interface IMiniSound {
  on: boolean;
  name: string;
  scene: TScene | null;
  toggle: () => void;
  step: (dir: 1 | -1) => void;
}

// What the window that shows the view can do; a missing action hides its button.
export interface IMiniActions {
  pause?: () => void;
  resume?: () => void;
  extend?: () => void;
  stop?: () => void;
  start?: () => void;
  retry?: () => void;
  back?: () => void;
  sound?: IMiniSound | null;
}

interface IMiniViewProps {
  view: ISurfaceView;
  theme: TFaceTheme;
  face: TFaceId;
  lang: TToolLang;
  fmt: 12 | 24;
  now: number;
  size: TMiniSize;
  onSize?: (size: TMiniSize) => void;
  actions: IMiniActions;
  leaving?: boolean;
  className?: string;
}

type TLabel = ISurfaceView['label'];

// The tool's state colours come from --tg-state, which glance.css sets from data-state on a [data-slot="tool"] box.
const TONE_STATE: Record<TLabel, string> = {
  awake: 'running',
  fallback: 'fallback',
  starting: 'starting',
  paused: 'paused',
  hidden: 'paused',
  needsyou: 'needsyou',
  blocked: 'blocked',
  unsupported: 'unsupported',
  ended: 'ended',
  idle: 'idle',
};

const PULSE = new Set<TLabel>(['awake', 'fallback', 'starting']);
const EASE = 'cubic-bezier(.16,1,.3,1)';
export const MINI_CLOSE_MS = 220;
const STOP_ASK_MS = 6000;

interface IAct {
  key: string;
  label: string;
  icon: LucideIcon;
  run: () => void;
}

function calmWindow(el: HTMLElement): Window | null {
  const win = el.ownerDocument.defaultView;
  if (!win || typeof el.animate !== 'function') return null;
  return win.matchMedia('(prefers-reduced-motion: reduce)').matches ? null : win;
}

// Measured in the element's own window, which for the floating clock is not the tab's.
function useBox(el: HTMLElement | null): { w: number; h: number } {
  const [box, setBox] = useState({ w: 0, h: 0 });
  useLayoutEffect(() => {
    const win = el?.ownerDocument.defaultView;
    if (!el || !win) return;
    const read = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      setBox((b) => (b.w === w && b.h === h ? b : { w, h }));
    };
    read();
    const ro = new win.ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, [el]);
  return box;
}

// One line of text that shrinks to its box instead of being cut, and wraps only at the smallest size.
function Fit({
  base,
  min = 12,
  className,
  children,
}: {
  base: number;
  min?: number;
  className?: string;
  children: ReactNode;
}) {
  const [el, setEl] = useState<HTMLSpanElement | null>(null);
  useLayoutEffect(() => {
    if (!el) return;
    el.style.whiteSpace = 'nowrap';
    el.style.fontSize = `${String(base)}px`;
    const over = el.scrollWidth / Math.max(1, el.clientWidth);
    if (over <= 1.01) return;
    const next = Math.max(min, Math.floor(base / over));
    el.style.fontSize = `${String(next)}px`;
    if (el.scrollWidth > el.clientWidth + 1) el.style.whiteSpace = 'normal';
  });
  return (
    <span ref={setEl} className={cn('block min-w-0 overflow-hidden', className)}>
      {children}
    </span>
  );
}

// Content rises in softly when it appears or changes size, and fades before the window closes.
function Fade({ leaving, className, children }: { leaving: boolean; className?: string; children: ReactNode }) {
  const [el, setEl] = useState<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!el) return;
    const win = calmWindow(el);
    if (!win) return;
    const anim = leaving
      ? el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: MINI_CLOSE_MS, easing: EASE, fill: 'forwards' })
      : el.animate(
          [
            { opacity: 0, transform: 'translateY(4px)' },
            { opacity: 1, transform: 'none' },
          ],
          {
            duration: 420,
            easing: EASE,
          },
        );
    return () => anim.cancel();
  }, [el, leaving]);
  return (
    <div ref={setEl} className={className}>
      {children}
    </div>
  );
}

function Glyph({ view }: { view: ISurfaceView }) {
  return (
    <span
      aria-hidden="true"
      className={cn('tg-glyph flex size-4 flex-none rounded-full', PULSE.has(view.label) && 'tg-pulse')}
    >
      <StateIcon state={view.face} c="currentColor" />
    </span>
  );
}

function Btn({
  act,
  primary = false,
  pressed,
  className,
  children,
}: {
  act: IAct;
  primary?: boolean;
  pressed?: boolean;
  className?: string;
  children?: ReactNode;
}) {
  const Icon = act.icon;
  return (
    <button
      type="button"
      onClick={act.run}
      aria-label={act.label}
      aria-pressed={pressed}
      title={act.label}
      className={cn(
        'tg-btn inline-flex h-11 min-w-11 items-center justify-center gap-2 rounded-[14px] px-3 text-[15px] font-bold',
        primary
          ? 'border-0 bg-(--tg-violet) text-(--tg-on-violet) shadow-[0_8px_22px_color-mix(in_srgb,var(--tg-violet)_30%,transparent),inset_0_1px_0_rgba(255,255,255,.25)]'
          : 'flex-none border border-(--tg-border) bg-(--tg-s2) text-(--tg-text)',
        className,
      )}
    >
      <Icon
        className="size-[18px] flex-none"
        strokeWidth={2}
        fill={act.icon === Play || act.icon === Pause || act.icon === Square ? 'currentColor' : 'none'}
        aria-hidden="true"
      />
      {children}
    </button>
  );
}

const SOUND_KEY =
  'tg-btn inline-flex h-10 flex-none items-center justify-center rounded-[12px] border-0 bg-transparent text-(--tg-t2) hover:text-(--tg-text)';

// The focus sound has its own row: what plays, a play button that also starts it, and a step through the scenes.
function SoundCard({ sound }: { sound: IMiniSound }) {
  const t = useTranslations('surfaces');
  const Icon = sound.scene ? SCENE_ICON[sound.scene] : Music2;
  return (
    <div
      role="group"
      aria-label={t('pip.soundName')}
      className="flex items-center gap-0.5 rounded-[16px] border border-(--tg-border) bg-(--tg-s1) p-1"
    >
      <span
        aria-hidden="true"
        className={cn(
          'flex size-10 flex-none items-center justify-center rounded-[12px] transition-colors duration-500',
          sound.on
            ? 'bg-[color-mix(in_srgb,var(--tg-violet)_20%,transparent)] text-(--tg-violet)'
            : 'bg-(--tg-s2) text-(--tg-t2)',
        )}
      >
        <Icon className="size-[18px]" strokeWidth={2} />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1 px-2">
        <span className="flex items-center gap-1.5 text-[11px] leading-none font-semibold text-(--tg-t2)">
          {sound.on ? (
            <span aria-hidden="true" className="tg-eq flex h-2.5 items-end gap-[2px]">
              <span className="h-full w-[2px] rounded-full bg-(--tg-violet)" />
              <span className="h-full w-[2px] rounded-full bg-(--tg-violet)" />
              <span className="h-full w-[2px] rounded-full bg-(--tg-violet)" />
            </span>
          ) : null}
          {sound.on ? t('pip.soundOn') : t('pip.soundOff')}
        </span>
        <Fit base={14} min={12} className="leading-[1.2] font-bold">
          {sound.name}
        </Fit>
      </div>
      <button
        type="button"
        onClick={() => sound.step(-1)}
        aria-label={t('pip.soundPrev')}
        title={t('pip.soundPrev')}
        className={cn(SOUND_KEY, 'w-8')}
      >
        <ChevronLeft className="size-[18px]" strokeWidth={2} aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={sound.toggle}
        aria-label={sound.on ? t('pip.soundPause') : t('pip.soundPlay')}
        title={sound.on ? t('pip.soundPause') : t('pip.soundPlay')}
        className="tg-btn inline-flex size-10 flex-none items-center justify-center rounded-full border border-(--tg-border-hi) bg-(--tg-s2) text-(--tg-text)"
      >
        {sound.on ? (
          <Pause className="size-4" fill="currentColor" strokeWidth={0} aria-hidden="true" />
        ) : (
          <Play className="ml-0.5 size-4" fill="currentColor" strokeWidth={0} aria-hidden="true" />
        )}
      </button>
      <button
        type="button"
        onClick={() => sound.step(1)}
        aria-label={t('pip.soundNext')}
        title={t('pip.soundNext')}
        className={cn(SOUND_KEY, 'w-8')}
      >
        <ChevronRight className="size-[18px]" strokeWidth={2} aria-hidden="true" />
      </button>
    </div>
  );
}

// The mini clock's content, for the floating window, the popup and the dev preview. Compact is a slim pill (state,
// time left, end time); expanded adds the face and the controls. Either reflows to the window it is given.
export function MiniView({
  view,
  theme,
  face,
  lang,
  fmt,
  now,
  size,
  onSize,
  actions: a,
  leaving = false,
  className,
}: IMiniViewProps) {
  const t = useTranslations('surfaces');
  const tw = useTranslations('tool.when');
  const [root, setRoot] = useState<HTMLDivElement | null>(null);
  const [slot, setSlot] = useState<HTMLDivElement | null>(null);
  const { w, h } = useBox(root);
  const box = useBox(slot);
  const [asking, setAsking] = useState(false);
  const keep = useRef<HTMLButtonElement>(null);

  const label = view.label;
  const roomy = w >= 220 && h >= 176;
  const layout: TMiniSize = w === 0 ? size : size === 'expanded' && roomy ? 'expanded' : 'compact';

  const word = t(`status.${label}`);
  const until =
    view.endsAt === null ? null : clockUntil(view.endsAt, now, lang, fmt, (time) => tw('tomorrow', { time }));
  const line = (() => {
    switch (label) {
      case 'awake':
      case 'fallback':
        return until ? t('line.until', { time: until }) : t('line.noEnd');
      case 'paused':
      case 'hidden':
        return t('pip.paused');
      case 'needsyou':
        return a.retry ? t('pip.needs') : t('line.needsyou');
      case 'ended':
        return view.endedAt ? t('line.ended', { time: view.endedAt }) : t('line.idle');
      default:
        return t(`line.${label}`);
    }
  })();
  const timed = view.endsAt !== null && (label === 'awake' || label === 'fallback' || label === 'paused');
  const big = timed ? digits(view.remain) : word;

  const back: IAct | null = a.back ? { key: 'back', label: t('pip.back'), icon: ArrowUpLeft, run: a.back } : null;
  const primary = ((): IAct | null => {
    switch (label) {
      case 'awake':
      case 'fallback':
      case 'starting':
        return a.pause ? { key: 'pause', label: t('pip.pause'), icon: Pause, run: a.pause } : null;
      case 'paused':
      case 'hidden':
        return a.resume ? { key: 'resume', label: t('pip.resume'), icon: Play, run: a.resume } : null;
      case 'needsyou':
        return a.retry ? { key: 'retry', label: t('pip.retry'), icon: RotateCw, run: a.retry } : back;
      case 'blocked':
      case 'unsupported':
        return back;
      case 'ended':
        return a.start ? { key: 'again', label: t('pip.again'), icon: RotateCcw, run: a.start } : back;
      case 'idle':
        return a.start ? { key: 'start', label: t('widgets.start'), icon: Play, run: a.start } : back;
    }
  })();
  const stopping = view.live && label !== 'ended';
  const extend: IAct | null =
    a.extend && view.canExtend && stopping
      ? { key: 'extend', label: t('widgets.extendLabel'), icon: Plus, run: a.extend }
      : null;
  const stop: IAct | null =
    a.stop && stopping ? { key: 'stop', label: t('widgets.stop'), icon: Square, run: () => setAsking(true) } : null;
  const sound = a.sound && stopping ? a.sound : null;
  // With room, the sound gets its own row; a short window keeps it as one button beside the controls.
  const card = sound !== null && h >= 300;
  const soundAct: IAct | null =
    sound && !card
      ? {
          key: 'sound',
          label: sound.name ? t('pip.soundLabel', { name: sound.name }) : t('pip.soundName'),
          icon: sound.on ? Volume2 : VolumeX,
          run: sound.toggle,
        }
      : null;
  const sizeAct: IAct | null = onSize
    ? layout === 'compact'
      ? { key: 'bigger', label: t('pip.bigger'), icon: Maximize2, run: () => onSize('expanded') }
      : { key: 'smaller', label: t('pip.smaller'), icon: Minimize2, run: () => onSize('compact') }
    : null;

  // A stop asks once, inline; it puts itself away if left alone.
  const ask = asking && stop !== null;
  useEffect(() => {
    if (!ask) return;
    keep.current?.focus();
    const id = setTimeout(() => setAsking(false), STOP_ASK_MS);
    return () => clearTimeout(id);
  }, [ask]);

  const bigBase = Math.round(Math.min(52, Math.max(18, Math.min(h * 0.36, w * 0.12))));
  const bigClass = timed
    ? 'font-mono font-semibold tabular-nums tracking-[-0.03em]'
    : 'font-display font-bold tracking-[-0.02em]';
  const fix = PULSE.has(label) ? null : primary;
  const innerW = Math.max(0, w - 24);
  const others = [extend, stop, soundAct].filter(Boolean).length;
  const showPrimaryLabel = innerW - others * 50 >= 104;
  const faceSize = Math.floor(Math.min(box.w, box.h));
  const soundWide = w >= 400;

  return (
    <div
      ref={setRoot}
      data-slot="tool"
      data-state={TONE_STATE[label]}
      role="region"
      aria-label={t('pip.region')}
      onKeyDown={(e) => {
        if (e.key === 'Escape' && ask) {
          e.stopPropagation();
          setAsking(false);
        }
      }}
      className={cn('relative box-border h-full w-full overflow-hidden font-sans text-(--tg-text)', className)}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_100%_at_50%_0%,color-mix(in_srgb,var(--tg-state)_12%,transparent),transparent_70%)]"
      />
      <span className="sr-only" role="status" aria-live="polite">
        {word}
      </span>
      {layout === 'compact' ? (
        <Fade key="compact" leaving={leaving} className="relative flex h-full items-center gap-3 px-3">
          <Glyph view={view} />
          <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
            <Fit base={bigBase} min={14} className={cn('leading-[1.05]', bigClass)}>
              {big}
            </Fit>
            {h >= 56 ? (
              <span className="text-[12px] leading-[1.25] font-medium text-(--tg-t2)">
                {timed ? `${word} · ${line}` : line}
              </span>
            ) : null}
          </div>
          {fix ? <Btn act={fix} primary className="flex-none px-0" /> : null}
          {sizeAct ? <Btn act={sizeAct} /> : null}
        </Fade>
      ) : (
        <Fade key="expanded" leaving={leaving} className="relative flex h-full flex-col gap-2 p-3">
          <div className="flex items-start gap-1.5">
            <div className="flex min-h-11 min-w-0 flex-1 items-center">
              <span className="tg-glass tg-pill inline-flex min-h-[38px] max-w-full items-center gap-2 rounded-[19px] py-1.5 pr-3.5 pl-3 text-[13px] leading-[1.25] font-semibold">
                <Glyph view={view} />
                <span className="min-w-0">{`${word} · ${line}`}</span>
              </span>
            </div>
            {back && primary?.key !== 'back' ? <Btn act={back} /> : null}
            {sizeAct ? <Btn act={sizeAct} /> : null}
          </div>
          <div ref={setSlot} className="relative flex min-h-0 flex-1 items-center justify-center">
            {faceSize >= 72 ? (
              <Face
                face={face}
                theme={theme}
                state={view.face}
                needs={view.needs}
                size={faceSize}
                remain={view.remain}
                total={view.total || 3600}
                nowSec={view.nowSec}
                indef={view.indef}
                fmt={fmt}
                bare
                motion="auto"
              />
            ) : box.h >= 28 ? (
              <Fit base={Math.min(44, Math.max(18, box.h * 0.7))} min={14} className={cn('text-center', bigClass)}>
                {big}
              </Fit>
            ) : null}
          </div>
          {ask ? (
            <div role="group" aria-label={t('pip.stopAsk')} className="flex flex-col gap-1.5">
              {h >= 240 ? (
                <span className="text-center text-[13px] leading-[1.3] font-semibold text-(--tg-text)">
                  {t('pip.stopAsk')}
                </span>
              ) : null}
              <div className="flex gap-1.5">
                <button
                  ref={keep}
                  type="button"
                  onClick={() => setAsking(false)}
                  className="tg-btn inline-flex h-11 min-w-0 flex-1 items-center justify-center rounded-[14px] border border-(--tg-border-hi) bg-(--tg-s2) px-3 text-[14px] font-bold text-(--tg-text)"
                >
                  <Fit base={14} min={12} className="text-center">
                    {t('pip.stopNo')}
                  </Fit>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAsking(false);
                    a.stop?.();
                  }}
                  className="tg-btn inline-flex h-11 min-w-0 flex-1 items-center justify-center gap-2 rounded-[14px] border-0 bg-(--tg-red) px-3 text-[14px] font-bold text-(--tg-on-red)"
                >
                  <Square className="size-4 flex-none" fill="currentColor" strokeWidth={0} aria-hidden="true" />
                  <Fit base={14} min={12}>
                    {t('pip.stopYes')}
                  </Fit>
                </button>
              </div>
            </div>
          ) : (
            <div
              role="group"
              aria-label={t('pip.controls')}
              className="flex flex-wrap items-center justify-center gap-1.5"
            >
              {primary ? (
                <Btn act={primary} primary className="flex-1">
                  {showPrimaryLabel ? (
                    <Fit base={15} min={12}>
                      {primary.label}
                    </Fit>
                  ) : null}
                </Btn>
              ) : null}
              {extend ? <Btn act={extend} /> : null}
              {stop ? <Btn act={stop} /> : null}
              {soundAct && sound ? (
                <Btn act={soundAct} pressed={sound.on} className={sound.on ? 'text-(--tg-volt)' : 'text-(--tg-t2)'}>
                  {soundWide ? (
                    <Fit base={13} min={12} className="max-w-[160px] font-semibold text-(--tg-text)">
                      {sound.name || t('pip.soundName')}
                    </Fit>
                  ) : null}
                </Btn>
              ) : null}
            </div>
          )}
          {card ? <SoundCard sound={sound} /> : null}
        </Fade>
      )}
    </div>
  );
}
