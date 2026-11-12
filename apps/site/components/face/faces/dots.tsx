import { alpha, f1, P } from '../geometry';
import { big, column, EndLine, type IDrawProps, Kicker } from '../kit';

const D60 = 60;

// Sixty dots around the dial; each minute left keeps one lit, in one heat colour.
export default function Dots({ m }: IDrawProps) {
  const litN = m.st === 'idle' ? D60 : Math.round(m.frac * D60);
  return (
    <>
      {Array.from({ length: D60 }, (_, i) => {
        const [x, y] = P(128, i * 6);
        const on = i < litN;
        const bigDot = i % 5 === 0;
        const sz = bigDot ? 9 : 6;
        const c = m.heat(m.frac);
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
              // Spent minutes stay visible as empty sockets on every plate.
              background: on ? c : m.t.line,
              boxShadow: on && bigDot ? `0 0 10px ${alpha(c, 0x88)}` : undefined,
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
