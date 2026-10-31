'use client';

import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Face, type TFaceId, type TFaceTheme } from '@/components/face';
import { cn } from '@/lib/utils';
import { usePop } from '@/lib/surfaces/motion';
import { shortDuration, TONE_TEXT, type ISurfaceView } from '@/lib/surfaces/session';

export interface IMiniClockProps {
  view: ISurfaceView;
  theme: TFaceTheme;
  face?: TFaceId;
  onClose?: () => void;
  windowed?: boolean;
  className?: string;
}

// The extension board's glass for the mini clock and the widgets: graphite at 86 %, a 10 % hairline, a deep shadow.
export const SURFACE_GLASS =
  'border border-border bg-panel shadow-panel dark:border-white/10 dark:bg-[rgba(16,18,26,.86)] dark:shadow-[0_30px_80px_rgba(0,0,0,.6),inset_0_1px_0_rgba(255,255,255,.06)] [.oled_&]:bg-[rgba(6,7,12,.94)]';

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
        return v.endsAt === null ? t('line.noEnd') : t('line.left', { time: shortDuration(v.remain, t) });
      case 'ended':
        return v.endedAt ? t('line.ended', { time: v.endedAt }) : t('line.idle');
      default:
        return t(`line.${v.label}`);
    }
  };
}

// The board's status pill: words, a dot that is solid while something is happening and hollow at rest, and colour.
export function SurfacePill({ view, text, className }: { view: ISurfaceView; text: string; className?: string }) {
  const muted = view.tone === 'muted' || view.tone === 'ended';
  return (
    <span
      role="status"
      aria-live="polite"
      className={cn(
        'inline-flex h-[30px] max-w-full items-center gap-2 self-start rounded-full border bg-glass pr-3 pl-2.5 text-[13px] font-semibold whitespace-nowrap',
        TONE_TEXT[view.tone],
        muted ? 'border-border dark:border-white/10' : 'border-[color-mix(in_srgb,currentColor_33%,transparent)]',
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'box-border size-2 flex-none rounded-full',
          view.solid ? 'bg-current' : 'border-2 border-current',
          view.awake && view.solid && 'motion-safe:animate-pulse',
        )}
      />
      <span className="truncate">{text}</span>
    </span>
  );
}

// The floating mini clock: a status line over the face, on glass; it closes with the session.
export function MiniClock({ view, theme, face = 'ring', onClose, windowed = false, className }: IMiniClockProps) {
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
        'box-border flex flex-col overflow-hidden text-foreground',
        windowed ? 'h-dvh w-full bg-background' : cn('w-[236px] rounded-[18px]', SURFACE_GLASS),
        className,
      )}
    >
      <div className="flex items-center gap-2 px-2.5 py-2 font-mono text-[12px] text-muted-foreground-strong">
        <span
          aria-hidden="true"
          className={cn(
            'box-border size-[7px] flex-none rounded-full',
            TONE_TEXT[view.tone],
            view.solid ? 'bg-current' : 'border-[1.5px] border-current',
          )}
        />
        <span role="status" aria-live="polite" className="min-w-0 truncate">
          {t(`status.${view.label}`)} · {line(view)}
        </span>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            aria-label={t('pip.close')}
            className="relative -my-1 ml-auto inline-flex size-6 flex-none cursor-pointer items-center justify-center rounded-full text-muted-foreground-strong before:absolute before:-inset-2.5 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <X className="size-3.5" strokeWidth={2.25} aria-hidden="true" />
          </button>
        ) : null}
      </div>
      <div className={cn('flex justify-center pt-1 pb-2.5', windowed && 'flex-1 items-center')}>
        <Face
          face={face}
          theme={theme}
          state={view.face}
          size={170}
          remain={view.remain}
          total={view.total || 3600}
          nowSec={view.nowSec}
          indef={view.indef}
          bare
          motion="auto"
        />
      </div>
    </div>
  );
}
