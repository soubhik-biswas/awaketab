'use client';

import { cn } from '@/lib/utils';
import { useGlance, type IGlance } from './context';

const PULSE = new Set(['running', 'starting', 'fallback']);

const SHORT: Record<IGlance['reason'], string> = {
  battery: 'reason.battery',
  unknown: 'reason.unknown',
  insecure: 'reason.insecure',
  policy: 'reason.policy',
};

// Words, dot shape and colour together: solid while something is happening, hollow at rest, pulsing while awake.
function pillText(g: IGlance): string {
  const { t, st, indef } = g;
  const time = g.time(g.endsAt);
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
      return t('pill.paused', { dur: g.dur(g.remain) });
    case 'needsyou':
      return t('pill.needsyou');
    case 'blocked':
      return t('pill.blocked', { reason: t(SHORT[g.reason]) });
    case 'unsupported':
      return t('pill.unsupported');
    case 'ended':
      return t('pill.ended', { time: g.time(g.snap.endedAt ?? g.now) });
  }
}

export function StatusPill({ className }: { className?: string }) {
  const g = useGlance();
  return (
    <span
      role="status"
      aria-live="polite"
      className={cn(
        'tg-glass tg-pill inline-flex h-[38px] items-center gap-2.5 rounded-full pr-4 pl-[13px] text-[14px] font-semibold tracking-[-0.005em] whitespace-nowrap',
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn('tg-dot size-[9px] flex-none rounded-full', PULSE.has(g.st) && 'tg-pulse')}
      />
      {pillText(g)}
    </span>
  );
}
