import { BLACK, SNOW } from '../art';
import { alpha, arc, ticks } from '../geometry';
import { D, DialLabel, hand, type IDrawProps, L, mono, MONO, Svg } from '../kit';

// The bezel stays dark in every theme, like the real object.
const BEZEL = {
  light: 'linear-gradient(180deg, #1C1F29, #121A2E)',
  dark: 'linear-gradient(180deg, #1A2238, #0A0B10)',
  oled: '#0B0F1A',
};
const BEZEL_INK = SNOW;
const BEZEL_MASK = 'radial-gradient(circle, transparent 0 117px, #000 118px)';
const BEZEL_TICKS = ticks(140, 144, 60, (i) => i % 5 !== 0 && i !== 0);
const DIAL = ticks(96, 110, 12);
const MINOR = ticks(110, 114, 60, (i) => i % 5 !== 0);
const NUMS = [10, 20, 30, 40, 50];

// A dive-watch bezel: the arc is the minutes left, the hands keep real time.
export default function Dive({ m }: IDrawProps) {
  const { t, accent } = m;
  const mins = Math.min(60, (m.st === 'idle' ? m.total : m.r) / 60);
  return (
    <>
      <div
        style={{
          position: 'absolute',
          left: 34,
          top: 9,
          width: 292,
          height: 292,
          borderRadius: '50%',
          background: BEZEL[m.theme],
          WebkitMaskImage: BEZEL_MASK,
          maskImage: BEZEL_MASK,
        }}
      />
      <Svg>
        <path d={arc(129, 0, mins * 6)} fill="none" strokeWidth="22" opacity=".9" style={{ stroke: accent }} />
        <path d={BEZEL_TICKS} strokeWidth="2" strokeLinecap="round" opacity=".7" style={{ stroke: BEZEL_INK }} />
        <path d="M180 14 L172 28 H188 Z" style={{ fill: BEZEL_INK }} />
        <path d={DIAL} strokeWidth="6" strokeLinecap="round" style={{ stroke: t.ink }} />
        <path
          className={D}
          d={MINOR}
          strokeWidth="1.2"
          strokeLinecap="round"
          opacity=".55"
          style={{ stroke: t.ink2 }}
        />
      </Svg>
      {NUMS.map((n) => (
        <DialLabel
          key={n}
          m={m}
          text={String(n)}
          rr={131}
          deg={n * 6}
          fs={13}
          color={BEZEL_INK}
          extra={{ fontFamily: MONO, fontWeight: 500 }}
        />
      ))}
      <div className="afx-h" style={hand(70, 14, 8, m.hourDeg, m.hourDeg0, t.ink, { borderRadius: 4 })} />
      <div className="afx-m" style={hand(110, 16, 6, m.minDeg, m.minDeg0, t.ink, { borderRadius: 3 })} />
      <div className="afx-s" style={hand(124, 30, 2, m.secDeg, m.secDeg0, accent)}>
        <span
          style={{
            position: 'absolute',
            left: -5,
            top: 22,
            width: 12,
            height: 12,
            borderRadius: '50%',
            border: `2.5px solid ${accent}`,
            background: t.panel,
          }}
        />
      </div>
      <div
        style={{
          position: 'absolute',
          left: 173,
          top: 148,
          width: 14,
          height: 14,
          borderRadius: '50%',
          background: t.ink,
          border: `3px solid ${accent}`,
        }}
      />
      <span
        className={L}
        style={{
          position: 'absolute',
          left: 120,
          width: 120,
          top: 206,
          height: 30,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 10,
          background: t.panel,
          boxShadow: `0 0 0 1px ${alpha(accent, 0x40)}, 0 6px 16px ${BLACK(0.35)}`,
          ...mono(13, '.06em', accent),
          fontVariantNumeric: 'tabular-nums',
          zIndex: 3,
        }}
      >
        {`${m.digits} LEFT`}
      </span>
    </>
  );
}
