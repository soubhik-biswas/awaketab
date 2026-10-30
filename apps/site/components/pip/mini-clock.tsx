'use client';

import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Face, type TFaceTheme } from '@/components/face';
import { cn } from '@/lib/utils';
import { formatDurationWords } from '@/lib/format';
import { usePop } from '@/lib/surfaces/motion';
import { TONE_TEXT, type ISurfaceView } from '@/lib/surfaces/session';

export interface IMiniClockProps {
  view: ISurfaceView;
  theme: TFaceTheme;
  onExtend?: () => void;
  onClose?: () => void;
  windowed?: boolean;
  className?: string;
}

const BTN =
  'inline-flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-[12px] border border-border bg-secondary text-[14px] font-bold text-foreground transition-colors duration-glide ease-glide hover:bg-surface-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:text-muted-foreground';

export function useSurfaceLine() {
  const t = useTranslations('surfaces');
  return (v: ISurfaceView): string => {
    switch (v.label) {
      case 'awake':
      case 'fallback':
        return v.until ? t('line.until', { time: v.until }) : t('line.noEnd');
      case 'hidden':
        return t('line.hidden');
      case 'paused':
        return v.endsAt === null ? t('line.noEnd') : t('line.left', { time: formatDurationWords(v.remain) });
      case 'ended':
        return v.endedAt ? t('line.ended', { time: v.endedAt }) : t('line.idle');
      default:
        return t(`line.${v.label}`);
    }
  };
}

export function SurfaceStatus({ view, className }: { view: ISurfaceView; className?: string }) {
  const t = useTranslations('surfaces');
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-[13px] font-semibold', TONE_TEXT[view.tone], className)}>
      <span
        aria-hidden="true"
        className={cn('size-2 shrink-0 rounded-full', view.solid ? 'bg-current' : 'border-[1.5px] border-current')}
      />
      {t(`status.${view.label}`)}
    </span>
  );
}

// The floating mini clock: the Ring face beside the status, the end time, +15 and close.
export function MiniClock({ view, theme, onExtend, onClose, windowed = false, className }: IMiniClockProps) {
  const t = useTranslations('surfaces');
  const line = useSurfaceLine();
  const pop = usePop<HTMLDivElement>(windowed);
  return (
    <div
      ref={windowed ? undefined : pop}
      role="region"
      aria-label={t('pip.region')}
      data-slot="mini-clock"
      data-state={view.wake}
      className={cn(
        'box-border flex items-center gap-1 bg-background px-[14px] text-foreground',
        windowed
          ? 'h-dvh w-full'
          : 'h-[180px] w-[320px] rounded-[16px] shadow-[0_0_0_1px_var(--border),0_24px_60px_rgba(0,0,0,.6)]',
        className,
      )}
    >
      <Face
        face="ring"
        theme={theme}
        state={view.face}
        size={150}
        remain={view.remain}
        total={view.total || 3600}
        nowSec={view.nowSec}
        indef={view.indef}
        bare
      />
      <span className="flex min-w-0 flex-1 flex-col gap-2">
        <SurfaceStatus view={view} />
        <span className="text-[13px] text-muted-foreground-strong">{line(view)}</span>
        <span className="flex gap-1.5">
          {view.canExtend && onExtend ? (
            <button type="button" className={BTN} onClick={onExtend} aria-label={t('pip.addLabel')}>
              {t('pip.add')}
            </button>
          ) : null}
          {onClose ? (
            <button type="button" className={BTN} onClick={onClose} aria-label={t('pip.close')}>
              <X className="size-4" strokeWidth={2.25} aria-hidden="true" />
            </button>
          ) : null}
        </span>
      </span>
    </div>
  );
}
