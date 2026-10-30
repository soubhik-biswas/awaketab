import '../face-art.css';
import { alpha, f1, P } from '../geometry';
import { big, column, EndLine, type IDrawProps, Kicker } from '../kit';

const D60 = 60;

// Sixty dots around the dial; each minute left keeps one lit, warming toward the end.
export default function Dots({ m }: IDrawProps) {
  const litN = m.st === 'idle' ? D60 : Math.round(m.frac * D60);
  return (
    <>
      {Array.from({ length: D60 }, (_, i) => {
        const [x, y] = P(128, i * 6);
        const on = i < litN;
        const bigDot = i % 5 === 0;
        const sz = bigDot ? 9 : 6;
        const c = m.heat((i + 1) / D60);
        return (
          <span
            key={i}
            className={m.live && i === litN - 1 ? 'afx-breath' : undefined}
            style={{
              position: 'absolute',
              left: `${f1(x - sz / 2)}px`,
              top: `${f1(y - sz / 2)}px`,
              width: sz,
              height: sz,
              borderRadius: '50%',
              background: on ? c : m.t.track,
              boxShadow: on && bigDot ? `0 0 8px ${alpha(c, 0x66)}` : undefined,
            }}
          />
        );
      })}
      <div style={column(6)}>
        <Kicker m={m} />
        <span style={big(m.long ? 52 : 72)}>{m.digits}</span>
        <EndLine m={m} px={15} />
      </div>
    </>
  );
}
