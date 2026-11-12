'use client';

import { memo } from 'react';
import { motion } from 'motion/react';
import { Maximize, Minimize, Pause, Play, RotateCcw, Square, TriangleAlert, type LucideIcon } from 'lucide-react';
import { Face } from '@/components/face';
import { cn } from '@/lib/utils';
import type { TWakeState } from '@/lib/wake';
import { useGlance, type IGlance } from './context';
import { EASE } from './kit';
import { warmPanels } from './panels/lazy';

interface IPrimary {
  label: string;
  icon: LucideIcon;
  filled: boolean;
  go: (g: IGlance) => void;
}

const PRIMARY: Record<TWakeState, IPrimary> = {
  running: { label: 'dock.pause', icon: Pause, filled: true, go: (g) => g.a.pause() },
  fallback: { label: 'dock.pause', icon: Pause, filled: true, go: (g) => g.a.pause() },
  starting: { label: 'dock.pause', icon: Pause, filled: true, go: () => undefined },
  paused: { label: 'dock.resume', icon: Play, filled: true, go: (g) => g.a.resume() },
  needsyou: { label: 'dock.resume', icon: Play, filled: true, go: (g) => g.a.resume() },
  ended: { label: 'dock.again', icon: RotateCcw, filled: false, go: (g) => g.a.start() },
  blocked: { label: 'dock.fix', icon: TriangleAlert, filled: false, go: (g) => g.a.open('help') },
  unsupported: { label: 'dock.video', icon: Play, filled: true, go: (g) => g.a.useFallback() },
  idle: { label: 'dock.again', icon: Play, filled: true, go: (g) => g.a.start() },
};

const KEY =
  'tg-btn inline-flex flex-none items-center justify-center border border-(--tg-border) bg-(--tg-s1) text-(--tg-text)';

// The dock keeps the same slots in every state: add time · primary · stop · face · fullscreen. Only Stop leaves,
// when the session has already ended, and Fullscreen where the browser has none. On phone it folds into two rows.
export const Dock = memo(function Dock() {
  const g = useGlance();
  const { t, phone, desk, st, hidden } = g;
  if (g.isSet || g.panel === 'faces') return null;
  const ended = st === 'ended';
  const chips: Array<[number, string, string]> = ended
    ? [
        [900, t('dock.add', { n: 15, unit: t('unit.min') }), t('dock.addAria', { dur: g.durLong(900) })],
        [1800, t('dock.add', { n: 30, unit: t('unit.min') }), t('dock.addAria', { dur: g.durLong(1800) })],
        [3600, t('dock.add', { n: 1, unit: t('unit.hour') }), t('dock.addAria', { dur: g.durLong(3600) })],
      ]
    : [
        [300, t('dock.add', { n: 5, unit: t('unit.min') }), t('dock.addAria', { dur: g.durLong(300) })],
        [900, t('dock.add', { n: 15, unit: t('unit.min') }), t('dock.addAria', { dur: g.durLong(900) })],
        [3600, t('dock.add', { n: 1, unit: t('unit.hour') }), t('dock.addAria', { dur: g.durLong(3600) })],
      ];
  const p = PRIMARY[st];
  const Icon = p.icon;
  const blocked = st === 'blocked';
  const key = phone ? 52 : 56;
  const name = g.faceName(g.face);
  return (
    <motion.div
      role="toolbar"
      aria-label={t('dock.label')}
      inert={hidden}
      data-rests=""
      initial={{ opacity: 0, y: 16, x: '-50%' }}
      animate={{ opacity: hidden ? 0 : 1, y: hidden ? 16 : 0, x: '-50%' }}
      transition={{ duration: 0.45, ease: EASE }}
      className={cn(
        'tg-hair absolute left-1/2 z-[5] flex p-2',
        phone
          ? 'w-[358px] max-w-[calc(100%-16px)] flex-col items-stretch gap-2 rounded-[28px]'
          : 'items-center gap-1.5 rounded-[26px]',
      )}
      style={{
        bottom: phone ? 16 : 28,
        boxShadow: 'var(--tg-shadow), inset 0 1px 0 var(--tg-inset-hi)',
      }}
    >
      <div
        role="group"
        aria-label={t('dock.addTime')}
        className="flex items-center gap-0.5 rounded-[18px] bg-(--tg-s1) p-1"
      >
        {chips.map(([sec, label, aria]) => (
          <button
            key={sec}
            type="button"
            onClick={() => g.a.extend(sec)}
            aria-label={aria}
            className={cn(
              'tg-btn rounded-[14px] border-0 bg-transparent text-[15px] font-semibold whitespace-nowrap text-(--tg-text)',
              phone ? 'h-11 flex-1 basis-0 px-2.5' : 'h-12 px-4',
            )}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => p.go(g)}
          className={cn(
            'tg-btn inline-flex items-center justify-center gap-2.5 rounded-[18px] border-0 px-6 text-[17px] font-bold whitespace-nowrap',
            phone ? 'flex-auto' : 'min-w-[168px]',
            blocked ? 'text-(--tg-on-red)' : 'text-(--tg-on-violet)',
          )}
          style={{
            height: key,
            background: blocked ? 'var(--tg-red)' : 'var(--tg-violet)',
            boxShadow: `0 10px 28px color-mix(in srgb, ${blocked ? 'var(--tg-red)' : 'var(--tg-violet)'} 33%, transparent), inset 0 1px 0 rgba(255,255,255,.3)`,
          }}
        >
          <Icon className="size-5" strokeWidth={2} fill={p.filled ? 'currentColor' : 'none'} aria-hidden="true" />
          <span>{t(p.label)}</span>
        </button>
        {!ended ? (
          <button
            type="button"
            onClick={() => g.a.stop()}
            aria-label={t('dock.stopAria')}
            className={cn(KEY, 'gap-2 rounded-[18px] text-[15px] font-semibold', desk ? 'px-[18px]' : 'px-0')}
            style={{ height: key, minWidth: key }}
          >
            <Square className="size-4" fill="currentColor" strokeWidth={0} aria-hidden="true" />
            {desk ? <span>{t('dock.stop')}</span> : null}
          </button>
        ) : null}
        {!phone ? <span aria-hidden="true" className="mx-1 h-8 w-px flex-none bg-(--tg-border)" /> : null}
        <button
          type="button"
          onClick={() => g.a.open('faces')}
          onPointerEnter={warmPanels}
          onFocus={warmPanels}
          aria-label={t('dock.faceAria', { face: name })}
          className={cn(KEY, 'justify-start gap-2.5 rounded-[18px] pl-1.5', desk ? 'pr-4' : 'pr-1.5')}
          style={{ height: key }}
        >
          <span className="flex h-[39px] w-11 flex-none items-center justify-center overflow-hidden rounded-[12px]">
            <Face
              face={g.face}
              theme={g.faceTheme}
              state="running"
              remain={2292}
              total={3600}
              nowSec={39828}
              size={44}
              bare
              motion="off"
            />
          </span>
          {desk ? (
            <span className="max-w-[130px] overflow-hidden text-[15px] font-bold text-ellipsis whitespace-nowrap">
              {name}
            </span>
          ) : null}
        </button>
        {g.canFullscreen ? (
          <button
            type="button"
            onClick={() => g.a.fullscreen()}
            aria-label={g.fullscreen ? t('dock.exitFull') : t('dock.full')}
            aria-keyshortcuts="Shift+F"
            className={cn(KEY, 'rounded-[18px]')}
            style={{ width: key, height: key }}
          >
            {g.fullscreen ? (
              <Minimize className="size-[18px]" strokeWidth={2} aria-hidden="true" />
            ) : (
              <Maximize className="size-[18px]" strokeWidth={2} aria-hidden="true" />
            )}
          </button>
        ) : null}
      </div>
    </motion.div>
  );
});
