import { column, digitSize, type IDrawProps, L, lmin, MONO } from '../kit';

const WB = 56;
const HEIGHTS = Array.from(
  { length: WB },
  (_, i) => 12 + Math.round(22 * (0.5 + 0.5 * Math.sin(i * 1.7) * Math.cos(i * 0.6))),
);

// A ring of audio bars that dances while awake; lit bars are time left.
export default function Waveform({ m }: IDrawProps) {
  const lit = Math.round(m.ringFrac * WB);
  const hc = m.heat(m.frac);
  return (
    <>
      {HEIGHTS.map((hh, i) => {
        const on = i < lit;
        return (
          <span
            key={i}
            style={{
              position: 'absolute',
              left: 178,
              top: 15,
              width: 4,
              height: 140,
              transformOrigin: '50% 100%',
              transform: `rotate(${((i * 360) / WB).toFixed(2)}deg)`,
            }}
          >
            <span
              className={on ? 'afx-bar' : undefined}
              data-delay={on ? (-(i % 9) * 0.14).toFixed(2) : undefined}
              style={{
                position: 'absolute',
                left: 0,
                top: 34 - hh,
                width: 4,
                height: hh,
                borderRadius: 2,
                transformOrigin: '50% 100%',
                background: on ? hc : m.t.track,
                opacity: on ? 1 : 0.8,
              }}
            />
          </span>
        );
      })}
      <div style={column(4)}>
        <span
          className={L}
          style={{
            fontFamily: MONO,
            fontSize: lmin(12),
            letterSpacing: '.2em',
            textTransform: 'uppercase',
            color: m.t.ink2,
          }}
        >
          {m.topWord}
        </span>
        <span
          style={{
            fontSize: digitSize(m, 'sm'),
            fontWeight: 300,
            letterSpacing: '-0.04em',
            lineHeight: 1,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {m.digits}
        </span>
        <span className={L} style={{ fontSize: lmin(13), color: m.t.ink2 }}>
          {m.endLine}
        </span>
      </div>
    </>
  );
}
