import { BLACK, WHITE } from '../art';
import { alpha } from '../geometry';
import { card, fit, type IDrawProps, L, lmin, MONO, PLATE } from '../kit';

const GROUND = { light: '#F1F2F9', night: '#05060E' };
const HUES = ['#3FB8FF', '#7B5CFF', '#FF7DD8'] as const;
const SHAPE = '42% 58% 63% 37% / 45% 41% 59% 55%';
// The orb's own shade, deepest behind the time: white digits keep their contrast over every hue as it turns.
const CORE = (a: number) => `rgba(5,6,14,${a})`;
const SHADE = `radial-gradient(circle closest-side, ${CORE(0.5)}, ${CORE(0.42)} 60%, ${CORE(0.34)} 82%, ${CORE(0.2)})`;
const SHADE_SOFT = `radial-gradient(circle closest-side, ${CORE(0.18)}, ${CORE(0)})`;
const BOX = { left: 66, top: 34, width: 200, height: 200 } as const;

// A morphing gradient orb, like a voice assistant at rest.
export default function Blob({ m }: IDrawProps) {
  // By day a resting state keeps its deep colour nearly solid, which already holds white text, so it needs little shade.
  const soft = !m.night && !m.multi;
  const grad = m.multi
    ? `conic-gradient(from 200deg, ${m.lamp}, ${HUES.join(', ')}, ${m.lamp})`
    : `conic-gradient(from 200deg, ${m.accent}, ${alpha(m.accent, soft ? 0xcc : 0x88)}, ${m.accent})`;
  return (
    <div className={PLATE} style={card(m, { background: m.night ? GROUND.night : GROUND.light })}>
      <div
        style={{
          position: 'absolute',
          ...BOX,
          borderRadius: '50%',
          background: grad,
          filter: 'blur(20px)',
          opacity: 0.6,
        }}
      />
      <div
        className="afx-morph"
        style={{
          position: 'absolute',
          ...BOX,
          borderRadius: SHAPE,
          background: `${soft ? SHADE_SOFT : SHADE}, ${grad}`,
          boxShadow: `inset 0 10px 30px ${WHITE(0.35)}, inset 0 -20px 40px ${BLACK(0.25)}`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          ...BOX,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
          color: '#FFFFFF',
          textShadow: `0 2px 14px ${BLACK(0.3)}`,
        }}
      >
        <span
          className={L}
          style={{ fontFamily: MONO, fontSize: lmin(12), letterSpacing: '.2em', textTransform: 'uppercase' }}
        >
          {m.topWord}
        </span>
        <span
          style={{
            fontSize: fit(m, 58, 48),
            fontWeight: 300,
            letterSpacing: '-0.045em',
            lineHeight: 1,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {m.digits}
        </span>
      </div>
      <span
        className={L}
        style={{
          position: 'absolute',
          left: 0,
          width: 332,
          top: 250,
          textAlign: 'center',
          fontSize: lmin(14),
          color: m.t.ink2,
        }}
      >
        {m.endLine}
      </span>
    </div>
  );
}
