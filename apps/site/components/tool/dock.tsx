'use client';

import { memo, useSyncExternalStore } from 'react';
import { motion } from 'motion/react';
import {
  Maximize,
  Minimize,
  Pause,
  PictureInPicture2,
  Play,
  RotateCcw,
  Square,
  TriangleAlert,
  type LucideIcon,
} from 'lucide-react';
import { Face } from '@/components/face';
import { PIP_EVENT } from '@/components/pip/pip-launcher';
import { pipSupport } from '@/lib/surfaces/pip';
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

const subscribeNever = () => () => undefined;
// Only a window that stays on top earns a dock button, and not on the phone layout, where the dock has no room; the
// popup other browsers get, and narrow windows, keep it in the command palette.
const onTopMini = () => pipSupport() === 'document';

// Desktop and tablet lift the dock clear of the home page's scroll cue; phone has no cue.
export const DOCK_BOTTOM = { phone: 16, wide: 40 } as const;
export const DOCK_H = { phone: 136, wide: 68 } as const;

const KEY =
  'tg-btn inline-flex flex-none items-center justify-center border border-(--tg-border) bg-(--tg-s1) text-(--tg-text)';

// The dock keeps the same slots in every state: add time · primary · stop · face · fullscreen. Only Stop leaves,
// when the session has already ended, and Fullscreen where the browser has none. On phone it folds into two rows.
export const Dock = memo(function Dock() {
  const g = useGlance();
  const { t, phone, desk, st, hidden } = g;
  const canMini = useSyncExternalStore(subscribeNever, onTopMini, () => false);
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
  const key = phone ? 52 : 48;
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
        'tg-hair absolute left-1/2 z-[5] flex',
        phone
          ? 'w-[358px] max-w-[calc(100%-16px)] flex-col items-stretch gap-2 rounded-[28px] p-2'
          : 'items-center gap-1.5 rounded-[22px] p-1.5',
      )}
      style={{
        bottom: phone ? DOCK_BOTTOM.phone : DOCK_BOTTOM.wide,
        boxShadow: 'var(--tg-shadow), inset 0 1px 0 var(--tg-inset-hi)',
      }}
    >
      <div
        role="group"
        aria-label={t('dock.addTime')}
        className={cn('flex items-center gap-0.5 bg-(--tg-s1) p-1', phone ? 'rounded-[18px]' : 'rounded-[16px]')}
      >
        {chips.map(([sec, label, aria]) => (
          <button
            key={sec}
            type="button"
            onClick={() => g.a.extend(sec)}
            aria-label={aria}
            className={cn(
              'tg-btn border-0 bg-transparent font-semibold whitespace-nowrap text-(--tg-text)',
              phone
                ? 'h-11 flex-1 basis-0 rounded-[14px] px-2.5 text-[15px]'
                : 'h-10 rounded-[12px] px-3.5 text-[14px]',
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
            'tg-btn inline-flex items-center justify-center border-0 font-bold whitespace-nowrap',
            phone
              ? 'flex-auto gap-2.5 rounded-[18px] px-6 text-[17px]'
              : 'min-w-[132px] gap-2 rounded-[16px] px-5 text-[15px]',
            blocked ? 'text-(--tg-on-red)' : 'text-(--tg-on-violet)',
          )}
          style={{
            height: key,
            background: blocked ? 'var(--tg-red)' : 'var(--tg-violet)',
            boxShadow: `0 10px 28px color-mix(in srgb, ${blocked ? 'var(--tg-red)' : 'var(--tg-violet)'} 33%, transparent), inset 0 1px 0 rgba(255,255,255,.3)`,
          }}
        >
          <Icon
            className={phone ? 'size-5' : 'size-[18px]'}
            strokeWidth={2}
            fill={p.filled ? 'currentColor' : 'none'}
            aria-hidden="true"
          />
          <span>{t(p.label)}</span>
        </button>
        {!ended ? (
          <button
            type="button"
            onClick={() => g.a.stop()}
            aria-label={t('dock.stopAria')}
            className={cn(
              KEY,
              'gap-2 font-semibold',
              phone ? 'rounded-[18px] text-[15px]' : 'rounded-[16px] text-[14px]',
              desk ? 'px-4' : 'px-0',
            )}
            style={{ height: key, minWidth: key }}
          >
            <Square className="size-3.5" fill="currentColor" strokeWidth={0} aria-hidden="true" />
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
          className={cn(
            KEY,
            'justify-start gap-2.5 pl-1.5',
            phone ? 'rounded-[18px]' : 'rounded-[16px]',
            desk ? 'pr-4' : 'pr-1.5',
          )}
          style={{ height: key }}
        >
          <span
            aria-hidden="true"
            className={cn(
              'flex flex-none items-center justify-center overflow-hidden',
              phone ? 'h-[39px] w-11 rounded-[12px]' : 'h-[34px] w-[38px] rounded-[10px]',
            )}
          >
            <Face
              face={g.face}
              theme={g.faceTheme}
              state="running"
              remain={2292}
              total={3600}
              nowSec={39828}
              size={phone ? 44 : 38}
              bare
              motion="off"
            />
          </span>
          {desk ? (
            <span className="max-w-[130px] overflow-hidden text-[14px] font-bold text-ellipsis whitespace-nowrap">
              {name}
            </span>
          ) : null}
        </button>
        {canMini && !phone ? (
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event(PIP_EVENT))}
            aria-label={t('pal.pip')}
            title={t('pal.pip')}
            className={cn(KEY, 'rounded-[16px]')}
            style={{ width: key, height: key }}
          >
            <PictureInPicture2 className="size-[17px]" strokeWidth={2} aria-hidden="true" />
          </button>
        ) : null}
        {g.canFullscreen ? (
          <button
            type="button"
            onClick={() => g.a.fullscreen()}
            aria-label={g.fullscreen ? t('dock.exitFull') : t('dock.full')}
            aria-keyshortcuts="Shift+F"
            className={cn(KEY, phone ? 'rounded-[18px]' : 'rounded-[16px]')}
            style={{ width: key, height: key }}
          >
            {g.fullscreen ? (
              <Minimize className="size-[17px]" strokeWidth={2} aria-hidden="true" />
            ) : (
              <Maximize className="size-[17px]" strokeWidth={2} aria-hidden="true" />
            )}
          </button>
        ) : null}
      </div>
    </motion.div>
  );
});
