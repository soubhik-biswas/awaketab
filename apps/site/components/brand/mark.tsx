import { cn } from 'cn';

export type TMarkTone = 'auto' | 'dark' | 'light' | 'brand' | 'mono-ink' | 'mono-white';
export type TMarkLamp = 'awake' | 'paused' | 'blocked' | 'ended' | 'info' | 'off';
export type TMarkLockup = 'mark' | 'horizontal' | 'stacked';
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

const HIGHLIGHT = '#DDFFE9';
const INK: Record<Exclude<TMarkTone, 'auto'>, string> = {
  dark: '#EEF2FA',
  light: '#0B1020',
  brand: '#0B0F1A',
  'mono-ink': '#0B1020',
  'mono-white': '#FFFFFF',
};
const LAMPS_DARK: Record<TMarkLamp, string> = {
  awake: '#3BE47F',
  paused: '#FFC53D',
  blocked: '#FF6B81',
  ended: '#C1B1FE',
  info: '#7CBBFF',
  off: '#8E99AE',
};
const LAMPS_LIGHT: Record<TMarkLamp, string> = {
  awake: '#117A3B',
  paused: '#8A5A00',
  blocked: '#C21D3E',
  ended: '#6D4AD0',
  info: '#1C64B8',
  off: '#626777',
};
const LAMPS_AUTO: Record<TMarkLamp, string> = {
  awake: 'var(--lamp)',
  paused: 'var(--warning)',
  blocked: 'var(--destructive)',
  ended: 'var(--ended)',
  info: 'var(--info)',
  off: 'var(--muted-foreground)',
};

const ARC = 'M32 11 A21 21 0 1 1 12.27 24.82';
const ARC_SMALL = 'M32 11 A21 21 0 1 1 11.12 29.8';

// Port of prototype/Mark.dc.html: 64 grid, r 21, 70° gap (84° at the small optical cut), lamp at −125°.
export function Mark({
  size = 120,
  tone = 'dark',
  lampState = 'awake',
  glow: glowProp = true,
  lockup = 'mark',
  small: smallProp,
  className,
  label = 'AwakeTab',
}: IMarkProps) {
  const small = smallProp === true || size <= 20;
  const auto = tone === 'auto';
  const ink = auto ? 'var(--foreground)' : INK[tone];
  let lamp = auto ? LAMPS_AUTO[lampState] : (tone === 'dark' ? LAMPS_DARK : LAMPS_LIGHT)[lampState];
  if (tone === 'brand') lamp = '#0B0F1A';
  if (tone === 'mono-ink') lamp = '#0B1020';
  if (tone === 'mono-white') lamp = '#FFFFFF';
  const mono = tone === 'brand' || tone.startsWith('mono');
  const glow = glowProp && !mono && !small && lampState !== 'off';
  const hollow = lampState === 'off' || lampState === 'paused' || lampState === 'blocked';
  const lit = glow && !hollow;
  const lx = small ? 17.9 : 19.95;
  const ly = small ? 16.4 : 14.8;
  const word = lockup !== 'mark';
  const stacked = lockup === 'stacked';
  const svg = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      role={word ? undefined : 'img'}
      aria-label={word ? undefined : label}
      aria-hidden={word ? true : undefined}
      className="shrink-0"
    >
      <path d={small ? ARC_SMALL : ARC} fill="none" stroke={ink} strokeWidth={small ? 10 : 9} strokeLinecap="round" />
      <circle cx={lx} cy={ly} r={11} fill={lamp} opacity={lit ? 0.28 : 0} />
      <circle
        cx={lx}
        cy={ly}
        r={small ? 6.2 : 5.6}
        fill={hollow ? 'transparent' : lamp}
        stroke={lamp}
        strokeWidth={hollow ? 3 : 0}
      />
      <circle cx={lx - 1.65} cy={ly - 1.6} r={1.6} fill={HIGHLIGHT} opacity={lit ? 0.9 : 0} />
    </svg>
  );
  if (!word) return <span className={cn('inline-flex', className)}>{svg}</span>;
  return (
    <span
      className={cn('inline-flex items-center font-sans', stacked ? 'flex-col' : 'flex-row', className)}
      style={{ gap: Math.round(size * (stacked ? 0.14 : 0.22)), color: ink }}
      role="img"
      aria-label={label}
    >
      {svg}
      <span
        style={{ fontSize: Math.round(size * (stacked ? 0.42 : 0.62)) }}
        className="leading-none font-extrabold tracking-[-0.035em] whitespace-nowrap"
      >
        Awake<span className="font-medium">Tab</span>
      </span>
    </span>
  );
}

const APP_LAMP: Record<TAppMarkState, string> = {
  idle: 'var(--muted-foreground-strong)',
  starting: 'var(--info)',
  running: 'var(--lamp)',
  fallback: 'var(--lamp)',
  paused: 'var(--warning)',
  needsyou: 'var(--info)',
  blocked: 'var(--destructive)',
  unsupported: 'var(--muted-foreground-strong)',
  ended: 'var(--ended)',
};

// The tool header draws the small optical cut with a status lamp: hollow when nothing keeps the screen awake.
export function AppMark({ state = 'idle', size = 32, wordSize = 21, word = true, className, label }: IAppMarkProps) {
  const lamp = APP_LAMP[state];
  const hollow = state === 'idle' || state === 'paused' || state === 'blocked' || state === 'unsupported';
  const awake = state === 'running' || state === 'fallback';
  return (
    <span className={cn('inline-flex shrink-0 items-center gap-2.5', className)}>
      <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" className="shrink-0">
        <path d={ARC_SMALL} fill="none" stroke="var(--foreground)" strokeWidth={10} strokeLinecap="round" />
        <circle cx={17.9} cy={16.4} r={9} fill={lamp} opacity={awake ? 0.35 : 0} />
        <circle
          cx={17.9}
          cy={16.4}
          r={6.2}
          fill={hollow ? 'var(--background)' : lamp}
          stroke={lamp}
          strokeWidth={2.5}
        />
      </svg>
      {word ? (
        <span
          style={{ fontSize: wordSize }}
          className="font-sans font-extrabold tracking-[-0.03em] whitespace-nowrap text-foreground"
        >
          AwakeTab
        </span>
      ) : (
        <span className="sr-only">{label ?? 'AwakeTab'}</span>
      )}
    </span>
  );
}
