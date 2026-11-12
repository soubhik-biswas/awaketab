import { fxInk, fxInk2 } from '../art';
import { f1 } from '../geometry';
import { card, type IDrawProps, L, lmin, PLATE } from '../kit';

// A dawn sky with ink-green stars by day, a night sky with glowing stars at night.
const ART = {
  light: {
    sky: 'radial-gradient(70% 60% at 70% 30%, rgba(102,51,245,.10), transparent 60%), radial-gradient(60% 50% at 20% 70%, rgba(17,122,59,.08), transparent 60%), #F4F5FA',
    dim: '#C3C9D8',
  },
  night: {
    sky: 'radial-gradient(70% 60% at 70% 30%, rgba(159,123,255,.16), transparent 60%), radial-gradient(60% 50% at 20% 70%, rgba(61,245,142,.08), transparent 60%), #02030A',
    dim: '#3A425A',
  },
};
const CS = 30;
const POINTS = Array.from({ length: CS }, (_, i) => {
  const tt = i / (CS - 1);
  return [26 + 280 * tt + (((i * 37) % 17) - 8), 104 + 52 * Math.sin(tt * 6.2) + (((i * 53) % 29) - 14)] as const;
});

// Each minute left is a star; they join into a constellation.
export default function Constellation({ m }: IDrawProps) {
  const light = !m.night;
  const a = light ? ART.light : ART.night;
  const acc = m.accent;
  const lit = Math.round(m.ringFrac * CS);
  const path = POINTS.slice(0, lit)
    .map(([x, y], i) => `${i ? 'L' : 'M'}${f1(x)} ${f1(y)}`)
    .join(' ');
  return (
    <div className={PLATE} style={card(m, { background: a.sky })}>
      <svg
        style={{ position: 'absolute', left: 0, top: 0 }}
        width="332"
        height="282"
        viewBox="0 0 332 282"
        aria-hidden="true"
      >
        <path d={path} fill="none" strokeWidth="1.2" opacity=".5" style={{ stroke: acc }} />
      </svg>
      {POINTS.map(([x, y], i) => {
        const on = i < lit;
        const bright = i % 6 === 0;
        const sz = on ? (bright ? 6 : 4) : 2;
        return (
          <span
            key={i}
            className={on ? 'afx-twinkle' : undefined}
            data-delay={on ? ((i * 0.3) % 3).toFixed(1) : undefined}
            style={{
              position: 'absolute',
              left: `${f1(x - sz / 2)}px`,
              top: `${f1(y - sz / 2)}px`,
              width: sz,
              height: sz,
              borderRadius: '50%',
              background: on ? (light ? acc : '#FFFFFF') : a.dim,
              boxShadow: on ? `0 0 ${bright ? 12 : 6}px ${acc}` : undefined,
            }}
          />
        );
      })}
      <div
        style={{
          position: 'absolute',
          left: 0,
          width: 332,
          bottom: 22,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
          color: fxInk(light),
        }}
      >
        <span
          style={{
            fontSize: 42,
            fontWeight: 300,
            letterSpacing: '-0.04em',
            lineHeight: 1,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {m.digits}
        </span>
        <span className={L} style={{ fontSize: lmin(13), color: fxInk2(light) }}>
          {lit} of {CS} stars lit · {m.endLine}
        </span>
      </div>
    </div>
  );
}
