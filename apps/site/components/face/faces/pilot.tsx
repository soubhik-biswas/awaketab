import { SUB_DIAL } from '../art';
import { alpha, sectorPath, ticks } from '../geometry';
import { D, DialLabel, hand, type IDrawProps, L, lmin, MONO, Svg } from '../kit';
import { minutesSpan } from './analog-dial';

const MINOR = ticks(126, 132, 60, (i) => i % 5 !== 0);
const MAJOR = ticks(120, 132, 60, (i) => i % 5 === 0 && i !== 0);
const SWORD = { clipPath: 'polygon(50% 0, 100% 10%, 100% 100%, 0 100%, 0 10%)' };

// Aviator dial with a triangle at 12, sword hands and a minutes-left sector.
export default function Pilot({ m }: IDrawProps) {
  const { t, accent } = m;
  const spanN = minutesSpan(m);
  const sword = `linear-gradient(90deg, ${t.ink} 30%, ${accent} 30% 70%, ${t.ink} 70%)`;
  return (
    <>
      <Svg>
        <path className={D} d={MINOR} strokeWidth="1.4" opacity=".6" style={{ stroke: t.ink2 }} />
        <path d={MAJOR} strokeWidth="3" style={{ stroke: t.ink }} />
        <path d="M180 30 L170 48 H190 Z" style={{ fill: t.ink }} />
        <circle cx="166" cy="34" r="2.6" style={{ fill: accent }} />
        <circle cx="194" cy="34" r="2.6" style={{ fill: accent }} />
        <path d={sectorPath(96, 134, m.minDeg, m.minDeg + spanN)} style={{ fill: alpha(accent, 0x26) }} />
      </Svg>
      {Array.from({ length: 11 }, (_, k) => (
        <DialLabel
          key={k}
          m={m}
          text={String(k + 1)}
          rr={97}
          deg={(k + 1) * 30}
          fs={24}
          color={t.ink}
          extra={{ fontWeight: 600, letterSpacing: '-0.02em' }}
        />
      ))}
      <div
        className={L}
        style={{
          position: 'absolute',
          left: 146,
          top: 196,
          width: 68,
          height: 26,
          borderRadius: 6,
          background: SUB_DIAL[m.theme],
          border: `1px solid ${t.line}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: MONO,
          fontSize: lmin(13),
          color: accent,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {m.digits}
      </div>
      <div className="afx-h" style={hand(72, 10, 12, m.hourDeg, m.hourDeg0, sword, SWORD)} />
      <div className="afx-m" style={hand(112, 12, 10, m.minDeg, m.minDeg0, sword, SWORD)} />
      <div className="afx-s" style={hand(124, 30, 2, m.secDeg, m.secDeg0, accent)} />
      <div
        style={{
          position: 'absolute',
          left: 172,
          top: 147,
          width: 16,
          height: 16,
          borderRadius: '50%',
          background: t.ink,
          border: `3px solid ${accent}`,
        }}
      />
    </>
  );
}
