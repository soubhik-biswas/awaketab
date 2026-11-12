'use client';

import { StateIcon, type TFaceState } from '@/components/face';
import { cn } from '@/lib/utils';
import type { TWakeState } from '@/lib/wake';
import { useGlance, useTickValue, type IGlance, type ITick } from './context';

const PULSE = new Set(['running', 'starting', 'fallback']);

// How each session state is drawn, on the face and as the pill's glyph. A session that needs a tap borrows the
// paused drawing (amber, bars) but is never called paused.
export const FACE_STATE: Record<TWakeState, TFaceState> = {
  idle: 'idle',
  starting: 'starting',
  running: 'running',
  fallback: 'fallback',
  paused: 'paused',
  needsyou: 'paused',
  ended: 'up',
  blocked: 'blocked',
  unsupported: 'unsupported',
};

const SHORT: Record<IGlance['reason'], string> = {
  battery: 'reason.battery',
  unknown: 'reason.unknown',
  insecure: 'reason.insecure',
  policy: 'reason.policy',
};

// Words, glyph and colour together, so no state reads by colour alone. Paused is only the person's own Pause.
export function pillText(g: IGlance, tick: Pick<ITick, 'now' | 'remain' | 'endsAt'>): string {
  const { t, st, indef } = g;
  const time = g.until(tick.endsAt);
  switch (st) {
    case 'idle':
      return t('pill.idle');
    case 'starting':
      return t('pill.starting');
    case 'running':
      return indef ? t('pill.awakeOpen') : t('pill.awake', { time });
    case 'fallback':
      return indef ? t('pill.fallbackOpen') : t('pill.fallback', { time });
    case 'paused':
      return indef ? t('pill.pausedOpen') : t('pill.paused', { dur: g.dur(tick.remain) });
    case 'needsyou':
      return t('pill.needsyou');
    case 'blocked':
      return t('pill.blocked', { reason: t(SHORT[g.reason]) });
    case 'unsupported':
      return t('pill.unsupported');
    case 'ended':
      return t('pill.ended', { time: g.time(g.endedAt ?? tick.now) });
  }
}

export function StatusPill({ className }: { className?: string }) {
  const g = useGlance();
  const text = useTickValue((tick) => pillText(g, tick));
  return (
    // Words to read, not a control: the announcer in the tool speaks the changes, so the pill stays quiet.
    <span
      role="status"
      aria-live="off"
      className={cn(
        'tg-glass tg-pill inline-flex min-h-[38px] max-w-full items-center gap-2.5 rounded-full py-1 pr-4 pl-[13px] text-[14px] font-semibold tracking-[-0.005em]',
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn('tg-glyph flex size-4 flex-none rounded-full', PULSE.has(g.st) && 'tg-pulse')}
      >
        <StateIcon state={FACE_STATE[g.st]} c="currentColor" />
      </span>
      {text}
    </span>
  );
}
