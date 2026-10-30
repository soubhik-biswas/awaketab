import { BLACK, WHITE } from '../art';
import { alpha } from '../geometry';
import { card, type IDrawProps, L, lmin, MONO } from '../kit';

const GROUND = { light: '#F1F2F9', night: '#05060E' };
const HUES = ['#3FB8FF', '#7B5CFF', '#FF7DD8'] as const;
const SHAPE = '42% 58% 63% 37% / 45% 41% 59% 55%';

// A morphing gradient orb, like a voice assistant at rest.
export default function Blob({ m }: IDrawProps) {
  const grad = m.multi
    ? `conic-gradient(from 200deg, ${m.lamp}, ${HUES.join(', ')}, ${m.lamp})`
    : `conic-gradient(from 200deg, ${m.accent}, ${alpha(m.accent, 0x88)}, ${m.accent})`;
  return (
    <div style={card(m, { background: m.night ? GROUND.night : GROUND.light })}>
      <div
        style={{
          position: 'absolute',
          left: 46,
          top: 22,
          width: 240,
          height: 240,
          borderRadius: '50%',
          background: grad,
          filter: 'blur(34px)',
          opacity: 0.55,
        }}
      />
      <div
        className="afx-morph"
        style={{
          position: 'absolute',
          left: 66,
          top: 32,
          width: 200,
          height: 200,
          borderRadius: SHAPE,
          background: grad,
          boxShadow: `inset 0 10px 30px ${WHITE(0.35)}, inset 0 -20px 40px ${BLACK(0.25)}`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 66,
          top: 32,
          width: 200,
          height: 200,
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
            fontSize: 58,
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
          top: 248,
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
