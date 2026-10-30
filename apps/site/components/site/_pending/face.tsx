import { cn } from '@/lib/utils';

export type TFaceState = 'idle' | 'starting' | 'running' | 'fallback' | 'paused' | 'blocked' | 'unsupported' | 'up';

const clock = (sec: number): string => {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');
  return h > 0 ? `${String(h)}:${mm}:${ss}` : `${mm}:${ss}`;
};

// Stand-in for components/face: the Ring face drawn on the 360 artboard, until the face set lands.
export function Face({
  face,
  state = 'idle',
  remain = 0,
  total = 3600,
  size = 260,
  bare = false,
  className,
}: {
  face: string;
  state?: TFaceState;
  remain?: number;
  total?: number;
  size?: number;
  bare?: boolean;
  className?: string;
}) {
  const p = total > 0 ? Math.max(0, Math.min(1, remain / total)) : 0;
  const r = 150;
  const len = 2 * Math.PI * r;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 360 360"
      role="img"
      aria-label={`${clock(remain)} left`}
      data-face={face}
      data-state={state}
      className={cn('max-w-full', className)}
    >
      <circle cx="180" cy="180" r={r} fill="none" className="stroke-secondary" strokeWidth="18" />
      <circle
        cx="180"
        cy="180"
        r={r}
        fill="none"
        className="stroke-lamp"
        strokeWidth="18"
        strokeLinecap="round"
        strokeDasharray={`${String(len * p)} ${String(len)}`}
        transform="rotate(-90 180 180)"
      />
      <text
        x="180"
        y="196"
        textAnchor="middle"
        className="fill-foreground font-sans"
        fontSize="64"
        fontWeight="300"
        style={{ fontVariantNumeric: 'tabular-nums' }}
      >
        {clock(remain)}
      </text>
      {!bare && (
        <text x="180" y="236" textAnchor="middle" className="fill-muted-foreground font-mono" fontSize="16">
          READY
        </text>
      )}
    </svg>
  );
}
