import { alpha, f1, P } from '../geometry';
import { big, column, digitSize, EndLine, type IDrawProps, Kicker, Svg } from '../kit';

const WB = 56;
// Each bar is centred on radius 123 and mirrors about it, like a recorded waveform, filling 106 to 140 at its tallest.
const MID_R = 123;
const ARM = 140;
const DOT = 4;
const INNER = 100;
const HEIGHTS = Array.from(
  { length: WB },
  (_, i) => 8 + Math.round(26 * Math.abs(Math.sin(i * 0.83) * Math.cos(i * 0.29 + 0.4))),
);

// A ring of audio bars that dances while awake; lit bars are time left and the spent ones fall silent to dots.
export default function Waveform({ m }: IDrawProps) {
  const { t, accent } = m;
  // A session without an end never runs down, so its whole ring stays lit.
  const lit = m.indef ? WB : Math.round(m.ringFrac * WB);
  const hc = m.heat(m.frac);
  const quiet = alpha(t.ink2, 0x4d);
  const [dx, dy] = P(INNER, 360 * m.ringFrac);
  return (
    <>
      <Svg>
        <circle cx="180" cy="155" r={INNER} fill="none" strokeWidth="1" style={{ stroke: t.line }} />
        {!m.indef && (
          <>
            <circle className="afx-pulse" cx={f1(dx)} cy={f1(dy)} r="9" opacity={m.haloOp} style={{ fill: accent }} />
            <circle
              cx={f1(dx)}
              cy={f1(dy)}
              r="4.5"
              strokeWidth="2.5"
              style={{ fill: m.hollow ? t.panel : accent, stroke: accent }}
            />
          </>
        )}
      </Svg>
      {HEIGHTS.map((hh, i) => {
        const on = i < lit;
        const len = on ? hh : DOT;
        return (
          <span
            key={i}
            style={{
              position: 'absolute',
              left: 178,
              top: 155 - ARM,
              width: 4,
              height: ARM,
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
                top: ARM - MID_R - len / 2,
                width: 4,
                height: len,
                borderRadius: 2,
                transformOrigin: '50% 50%',
                background: on ? hc : quiet,
              }}
            />
          </span>
        );
      })}
      <div style={column(6)}>
        <Kicker m={m} />
        <span style={big(digitSize(m, 'sm'), 300, '-0.045em')}>{m.digits}</span>
        <EndLine m={m} px={13} style={{ maxWidth: 176, textAlign: 'center', lineHeight: 1.15 }} />
      </div>
    </>
  );
}
