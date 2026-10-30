export type TMarkTone = 'dark' | 'light' | 'brand' | 'mono-ink' | 'mono-white';
export type TMarkLamp = 'awake' | 'paused' | 'blocked' | 'ended' | 'info' | 'off';
export type TMarkLockup = 'mark' | 'horizontal' | 'stacked';

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

const INK: Record<TMarkTone, string> = {
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
  const ink = INK[tone];
  let lamp = (tone === 'dark' ? LAMPS_DARK : LAMPS_LIGHT)[lampState];
  if (tone === 'brand') lamp = '#0B0F1A';
  if (tone === 'mono-ink') lamp = '#0B1020';
  if (tone === 'mono-white') lamp = '#FFFFFF';
  const mono = tone === 'brand' || tone.startsWith('mono');
  const glow = glowProp && !mono && !small && lampState !== 'off';
  const hollow = lampState === 'off' || lampState === 'paused' || lampState === 'blocked';
  const arc = small ? 'M32 11 A21 21 0 1 1 11.12 29.8' : 'M32 11 A21 21 0 1 1 12.27 24.82';
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
    >
      <path d={arc} fill="none" stroke={ink} strokeWidth={small ? 10 : 9} strokeLinecap="round" />
      <circle cx={lx} cy={ly} r={11} fill={lamp} opacity={glow && !hollow ? 0.28 : 0} />
      <circle
        cx={lx}
        cy={ly}
        r={small ? 6.2 : 5.6}
        fill={hollow ? 'transparent' : lamp}
        stroke={lamp}
        strokeWidth={hollow ? 3 : 0}
      />
      <circle cx={lx - 1.65} cy={ly - 1.6} r={1.6} fill="#DDFFE9" opacity={glow && !hollow ? 0.9 : 0} />
    </svg>
  );
  if (!word) return <span className={className}>{svg}</span>;
  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        flexDirection: stacked ? 'column' : 'row',
        alignItems: 'center',
        gap: Math.round(size * (stacked ? 0.14 : 0.22)),
        color: ink,
      }}
      role="img"
      aria-label={label}
    >
      {svg}
      <span
        style={{
          fontSize: Math.round(size * (stacked ? 0.42 : 0.62)),
          fontWeight: 800,
          letterSpacing: '-0.035em',
          lineHeight: 1,
          whiteSpace: 'nowrap',
        }}
      >
        Awake<span style={{ fontWeight: 500 }}>Tab</span>
      </span>
    </span>
  );
}
