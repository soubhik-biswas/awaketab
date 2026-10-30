import { alpha } from '../geometry';
import { card, type IDrawProps, L, lmin, MONO, nightAccent, nightClass } from '../kit';
import type { TFaceState } from '../model';

const SCREEN = '#0A0D0B';
const BAR = '#121714';
const BAR_LINE = '#1D2420';
const INK = '#C8D3CB';
const DIM = '#7D8A82';
const LIGHTS = ['#FF5F57', '#FEBC2E', '#28C840'] as const;
const MSG: Readonly<Record<TFaceState, string>> = {
  idle: '· ready — press Keep awake',
  starting: '… requesting screen wake lock',
  running: '✓ screen wake lock acquired',
  fallback: '✓ awake via video fallback',
  paused: '⏸ tab hidden — lock released',
  blocked: '✗ NotAllowedError: battery saver',
  unsupported: '✗ wake lock unavailable',
  up: '✓ released — the screen can sleep',
};
// Error lines take the dark theme's danger red, a hidden tab its amber.
const MSG_INK: Readonly<Partial<Record<TFaceState, string>>> = {
  blocked: '#FF6B81',
  unsupported: '#FF6B81',
  paused: '#FFC53D',
};

// A shell that reports the wake lock honestly, with a blinking cursor.
export default function Terminal({ m }: IDrawProps) {
  const acc = nightAccent(m);
  const filled = Math.round(m.ringFrac * 18);
  const bar = `[${'█'.repeat(filled)}${'░'.repeat(18 - filled)}] ${Math.round(m.frac * 100)}%`;
  const prompt = <span style={{ color: acc }}>❯</span>;
  return (
    <div
      className={nightClass(m)}
      style={card(m, { borderRadius: 22, background: SCREEN, fontFamily: MONO, color: INK })}
    >
      <div
        style={{
          height: 34,
          display: 'flex',
          alignItems: 'center',
          gap: 7,
          padding: '0 14px',
          background: BAR,
          borderBottom: `1px solid ${BAR_LINE}`,
        }}
      >
        {LIGHTS.map((c) => (
          <span key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />
        ))}
        <span className={L} style={{ flex: 1, textAlign: 'center', fontSize: lmin(12), color: DIM }}>
          awaketab — zsh
        </span>
      </div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          padding: '14px 18px',
          fontSize: lmin(13),
          lineHeight: 1.35,
        }}
      >
        <span className={L}>
          {prompt} awake --for {Math.round(m.total / 60)}m
        </span>
        <span className={L} style={{ color: MSG_INK[m.st] ?? DIM }}>
          {MSG[m.st]}
        </span>
        <span
          style={{
            fontSize: 50,
            fontWeight: 500,
            letterSpacing: '-0.02em',
            lineHeight: 1.05,
            color: acc,
            textShadow: `0 0 18px ${alpha(acc, 0x40)}`,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {m.digits}
        </span>
        <span className={L} style={{ whiteSpace: 'pre', color: acc }}>
          {bar}
        </span>
        <span className={L}>ends {m.endShort}</span>
        <span className={L}>
          {prompt}{' '}
          <span
            className="afx-blink"
            style={{ display: 'inline-block', width: 9, height: 16, background: INK, verticalAlign: -3 }}
          />
        </span>
      </div>
    </div>
  );
}
