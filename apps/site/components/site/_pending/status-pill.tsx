import { CircleAlert, CirclePause, Circle, CircleDot, CircleOff, Loader, Video } from 'lucide-react';
import { cn } from '@/lib/utils';

export type TPillState = 'idle' | 'starting' | 'awake' | 'paused' | 'blocked' | 'unsupported' | 'fallback';

const LOOK: Record<TPillState, { icon: typeof Circle; tone: string }> = {
  idle: { icon: Circle, tone: 'text-muted-foreground-strong border-border' },
  starting: { icon: Loader, tone: 'text-info border-info/40' },
  awake: { icon: CircleDot, tone: 'text-lamp border-lamp/40 bg-accent' },
  paused: { icon: CirclePause, tone: 'text-warning border-warning/40 bg-warning-soft' },
  blocked: { icon: CircleAlert, tone: 'text-destructive border-destructive/40 bg-destructive-soft' },
  unsupported: { icon: CircleOff, tone: 'text-muted-foreground-strong border-border' },
  fallback: { icon: Video, tone: 'text-lamp border-dashed border-lamp/60' },
};

// Stand-in for components/product StatusPill: icon, words and a solid or hollow dot, never colour alone.
export function StatusPill({ state, label, className }: { state: TPillState; label: string; className?: string }) {
  const { icon: Icon, tone } = LOOK[state];
  const solid = state === 'awake' || state === 'fallback' || state === 'starting';
  return (
    <span
      className={cn(
        'inline-flex h-8 items-center gap-2 rounded-full border px-3 text-sm font-semibold whitespace-nowrap',
        tone,
        className,
      )}
    >
      <span className={cn('size-2 rounded-full border-2 border-current', solid && 'bg-current')} aria-hidden="true" />
      <Icon className="size-4" aria-hidden="true" />
      {label}
    </span>
  );
}
