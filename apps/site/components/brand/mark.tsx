import { cn } from 'cn';

type TMarkTone = 'auto' | 'dark' | 'light' | 'brand' | 'mono-ink' | 'mono-white';
export type TMarkLamp = 'awake' | 'paused' | 'blocked' | 'ended' | 'info' | 'off';
type TMarkLockup = 'mark' | 'horizontal' | 'stacked';
export type TAppMarkState =
  'idle' | 'starting' | 'running' | 'fallback' | 'paused' | 'needsyou' | 'blocked' | 'unsupported' | 'ended';

interface IMarkProps {
  size?: number;
  tone?: TMarkTone;
  lampState?: TMarkLamp;
  glow?: boolean;
  lockup?: TMarkLockup;
  small?: boolean;
  className?: string;
  label?: string;
}

interface IAppMarkProps {
  state?: TAppMarkState;
  size?: number;
  wordSize?: number;
  word?: boolean;
  className?: string;
  label?: string;
}

const INK: Record<Exclude<TMarkTone, 'auto'>, string> = {
  dark: '#F2F4FA',
  light: '#0B1020',
  brand: '#0B0718',
  'mono-ink': '#0B1020',
  'mono-white': '#FFFFFF',
};
const BEAD_DARK: Record<TMarkLamp, string> = {
  awake: '#3DF58E',
  paused: '#FFC53D',
  blocked: '#FF6B81',
  ended: '#99A1B5',
  info: '#7CBBFF',
  off: '#99A1B5',
};
const BEAD_LIGHT: Record<TMarkLamp, string> = {
  awake: '#117A3B',
  paused: '#8A5A00',
  blocked: '#C21D3E',
  ended: '#5C6275',
  info: '#1C64B8',
  off: '#5C6275',
};
const BEAD_AUTO: Record<TMarkLamp, string> = {
  awake: 'var(--lamp)',
  paused: 'var(--warning)',
  blocked: 'var(--destructive)',
  ended: 'var(--muted-foreground)',
  info: 'var(--info)',
  off: 'var(--muted-foreground)',
};

// The v3.1 mark on its 32 grid: a faint full track (time used), the bold 300° arc from 12 o'clock (time left) and
// the bead on the arc's end (now).
function MarkSvg({ size, ink, bead, label }: { size: number; ink: string; bead: string; label?: string | undefined }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className="shrink-0"
    >
      <circle cx={16} cy={16} r={11} fill="none" stroke={ink} strokeOpacity={0.22} strokeWidth={4} />
      <path d="M16 5 A11 11 0 1 1 6.47 10.5" fill="none" stroke={ink} strokeWidth={4} strokeLinecap="round" />
      <circle cx={6.47} cy={10.5} r={4.6} fill={bead} />
    </svg>
  );
}

export function Mark({
  size = 120,
  tone = 'dark',
  lampState = 'awake',
  lockup = 'mark',
  className,
  label = 'AwakeTab',
}: IMarkProps) {
  const auto = tone === 'auto';
  const ink = auto ? 'var(--foreground)' : INK[tone];
  let bead = auto ? BEAD_AUTO[lampState] : (tone === 'dark' ? BEAD_DARK : BEAD_LIGHT)[lampState];
  if (tone === 'brand' || tone.startsWith('mono')) bead = ink;
  const word = lockup !== 'mark';
  const stacked = lockup === 'stacked';
  if (!word)
    return (
      <span className={cn('inline-flex', className)}>
        <MarkSvg size={size} ink={ink} bead={bead} label={label} />
      </span>
    );
  return (
    <span
      className={cn('inline-flex items-center', stacked ? 'flex-col' : 'flex-row', className)}
      style={{ gap: Math.round(size * (stacked ? 0.14 : 0.33)), color: ink }}
      role="img"
      aria-label={label}
    >
      <MarkSvg size={size} ink={ink} bead={bead} />
      <span
        style={{ fontSize: Math.round(size * (stacked ? 0.42 : 0.73)) }}
        className="font-display leading-none font-bold tracking-[-0.03em] whitespace-nowrap"
      >
        Awake<span className="font-medium">Tab</span>
      </span>
    </span>
  );
}

// The tool's header lockup: the bead is always volt, as the boards draw it.
export function AppMark({ size = 30, wordSize = 22, word = true, className, label }: IAppMarkProps) {
  return (
    <span className={cn('inline-flex shrink-0 items-center gap-2.5', className)}>
      <MarkSvg size={size} ink="var(--foreground)" bead="var(--lamp)" />
      {word ? (
        <span
          style={{ fontSize: wordSize }}
          className="font-display font-bold tracking-[-0.03em] whitespace-nowrap text-foreground"
        >
          Awake<span className="font-medium">Tab</span>
        </span>
      ) : (
        <span className="sr-only">{label ?? 'AwakeTab'}</span>
      )}
    </span>
  );
}
