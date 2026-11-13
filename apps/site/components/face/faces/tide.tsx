import { Fragment, useId } from 'react';
import { BLACK, NAVY, type TThemed, WHITE } from '../art';
import { big, D, fit, type IDrawProps, Kicker, L, lmin, MONO, PLATE } from '../kit';

// A glass 240 × 290 at 60, 10 with a 7 px wall; the water stands in the 226 × 276 hollow inside it.
const GLASS_TOP = 10;
const GLASS_H = 290;
const WALL = 7;
const CAV_W = 226;
const CAV_H = 276;
// A full glass stops 26 below the hollow's top, so the moving surface never reaches the rim.
const WATER_MAX = 250;
const FLOOR = GLASS_TOP + WALL + CAV_H;
const SCALE = [0, 0.25, 0.5, 0.75, 1];
// Graduations every 5 %, from 10 % up, where the hollow's rounded floor leaves room for them.
const GRADS = Array.from({ length: 19 }, (_, i) => (i + 2) / 20);
// Ten 44 px half-waves: the loop moves 176 px, so 440 px keeps the 226 px hollow covered at every step.
const crest = (y: number, dy: number): string =>
  `M0 ${y} Q22 ${y + dy} 44 ${y}${Array.from({ length: 9 }, (_, i) => ` T${(i + 2) * 44} ${y}`).join('')}`;
const WAVE_W = 440;
// The surface's mean sits MEAN down each wave drawing, so the drawing's top is placed MEAN above the level.
const MEAN = 8;
const AMP = 7;
const BODY_H = MEAN + CAV_H;
const RISE = 5;
const mark = (total: number, q: number): string =>
  total >= 7200
    ? q === 0
      ? '0'
      : `${Number(((total / 3600) * q).toFixed(1))}h`
    : String(Math.round((total / 60) * q));
const BUBBLES = [
  { left: 40, bottom: 10, d: 6, delay: 0 },
  { left: 150, bottom: 4, d: 7, delay: 1.6 },
  { left: 92, bottom: 16, d: 5, delay: 3 },
];

const WALL_BG: TThemed<string> = {
  light: 'linear-gradient(135deg, #FFFFFF 0%, #EFF0F7 55%, #E2E4EE 100%)',
  dark: 'linear-gradient(135deg, #232B40 0%, #151A28 50%, #0C0F17 100%)',
  oled: '#06070B',
};
const WALL_SHADOW: TThemed<string> = {
  light: `inset 1px 1px 0 #FFFFFF, inset -1px -1px 0 ${NAVY(0.07)}, 0 0 0 1px #D4D4E2, 0 18px 36px ${NAVY(0.12)}`,
  dark: `inset 1px 1px 0 ${WHITE(0.14)}, inset -1px -1px 0 ${BLACK(0.5)}, 0 0 0 1px #262A35, 0 24px 48px ${BLACK(0.5)}`,
  oled: `inset 1px 1px 0 ${WHITE(0.1)}, 0 0 0 1px #1A2236`,
};
const HOLLOW_BG: TThemed<string> = {
  light: 'linear-gradient(90deg, #E9EBF3 0%, #FAFBFE 32%, #F3F4F9 70%, #E4E6EF 100%)',
  dark: 'linear-gradient(90deg, #090D18 0%, #121A2C 34%, #0E1422 70%, #070A12 100%)',
  oled: '#000000',
};
const HOLLOW_SHADOW: TThemed<string> = {
  light: `inset 0 2px 8px ${NAVY(0.1)}, inset 0 0 0 1px ${NAVY(0.06)}`,
  dark: `inset 0 2px 10px ${BLACK(0.6)}, inset 0 0 0 1px ${WHITE(0.04)}`,
  oled: `inset 0 0 0 1px ${WHITE(0.06)}`,
};
// The ground the water's colour is mixed into, so the body stays opaque under the moving far surface.
const WATER_BASE: TThemed<string> = { light: '#FFFFFF', dark: '#0B1120', oled: '#000000' };

const mix = (c: string, pct: number, base: string): string => `color-mix(in srgb, ${c} ${pct}%, ${base})`;

// The water climbs the glass a few px at each wall, the meniscus.
const meniscus = (right: boolean): { fill: string; edge: string } => {
  const [wall, inner, ctl] = right ? [14, 0, 12.5] : [0, 14, 1.5];
  const edge = `M${wall} ${MEAN - RISE} Q${ctl} ${MEAN} ${inner} ${MEAN}`;
  return { edge, fill: `${edge} V${MEAN + RISE} H${wall} Z` };
};
const MENISCI = [meniscus(false), meniscus(true)];

// The water level is the time left. Calm and glanceable.
export default function Tide({ m }: IDrawProps) {
  const { t, accent, theme, night } = m;
  const grad = `af-td${useId().replace(/[^a-zA-Z0-9_-]/gu, '')}`;
  const q = m.indef ? 1 : m.ringFrac;
  const water = Number((WATER_MAX * q).toFixed(1));
  const base = WATER_BASE[theme];
  // Night water deepens toward the floor by darkening; day water by gaining colour.
  const [far, surface, body, deep] = night ? [46, 40, 28, 18] : [18, 26, 34, 48];
  const glint = night ? mix(accent, 55, '#FFFFFF') : WHITE(0.9);
  const spec = (a: number): string => WHITE(night ? a : Math.min(1, a * 3.5));
  const tick = night ? WHITE(0.28) : NAVY(0.28);
  let majors = '';
  let minors = '';
  for (const g of GRADS) {
    const y = (CAV_H - WATER_MAX * g).toFixed(1);
    if (Math.round(g * 20) % 5 === 0) majors += `M207 ${y}H219`;
    else minors += `M213 ${y}H219`;
  }
  // The end line breaks only between its phrases, never inside a time.
  const phrases = m.endLine.split(' · ');
  return (
    <>
      <div
        className={PLATE}
        style={{
          position: 'absolute',
          left: 60,
          top: GLASS_TOP,
          width: 240,
          height: GLASS_H,
          borderRadius: 52,
          isolation: 'isolate',
          background: WALL_BG[theme],
          boxShadow: WALL_SHADOW[theme],
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: WALL,
            top: WALL,
            width: CAV_W,
            height: CAV_H,
            borderRadius: 45,
            overflow: 'hidden',
            isolation: 'isolate',
            background: HOLLOW_BG[theme],
            boxShadow: HOLLOW_SHADOW[theme],
          }}
        >
          {water > 0 && (
            <div className="af-tr" style={{ position: 'absolute', left: 0, bottom: 0, width: CAV_W, height: water }}>
              <svg
                className="afx-wave2"
                style={{ position: 'absolute', left: 0, top: -MEAN - 3 }}
                width={WAVE_W}
                height="20"
                viewBox={`0 0 ${WAVE_W} 20`}
                aria-hidden="true"
              >
                <path d={`${crest(MEAN, AMP * 0.8)} V20 H0 Z`} style={{ fill: mix(accent, far, base) }} />
              </svg>
              <svg
                className="afx-wave"
                style={{ position: 'absolute', left: 0, top: -MEAN }}
                width={WAVE_W}
                height={BODY_H}
                viewBox={`0 0 ${WAVE_W} ${BODY_H}`}
                aria-hidden="true"
              >
                <defs>
                  <linearGradient id={grad} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" style={{ stopColor: mix(accent, surface, base) }} />
                    <stop offset=".1" style={{ stopColor: mix(accent, body, base) }} />
                    <stop offset="1" style={{ stopColor: mix(accent, deep, base) }} />
                  </linearGradient>
                </defs>
                <path d={`${crest(MEAN, -AMP)} V${BODY_H} H0 Z`} fill={`url(#${grad})`} />
                <path d={crest(MEAN, -AMP)} fill="none" strokeWidth="1.4" opacity=".6" style={{ stroke: glint }} />
              </svg>
              {MENISCI.map((s, i) => (
                <svg
                  key={i}
                  style={{ position: 'absolute', top: -MEAN, ...(i ? { right: 0 } : { left: 0 }) }}
                  width="14"
                  height={MEAN + RISE}
                  viewBox={`0 0 14 ${MEAN + RISE}`}
                  aria-hidden="true"
                >
                  <path d={s.fill} style={{ fill: mix(accent, surface, base) }} />
                  <path d={s.edge} fill="none" strokeWidth="1.4" opacity=".6" style={{ stroke: glint }} />
                </svg>
              ))}
              {m.live && (
                <div
                  className={D}
                  style={{ position: 'absolute', left: 0, top: 0, width: CAV_W, height: water, overflow: 'hidden' }}
                >
                  {BUBBLES.map((b) => (
                    <span
                      key={b.left}
                      className="afx-rise"
                      data-delay={b.delay}
                      style={{
                        position: 'absolute',
                        left: b.left,
                        bottom: b.bottom,
                        width: b.d,
                        height: b.d,
                        borderRadius: '50%',
                        border: `1px solid ${glint}`,
                        background: `radial-gradient(circle at 35% 30%, ${WHITE(0.75)} 0 16%, transparent 30%)`,
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
          <svg
            className={D}
            style={{ position: 'absolute', left: 0, top: 0 }}
            width={CAV_W}
            height={CAV_H}
            viewBox={`0 0 ${CAV_W} ${CAV_H}`}
            aria-hidden="true"
          >
            <path d={majors} strokeWidth="1.5" style={{ stroke: tick }} />
            <path d={minors} strokeWidth="1" style={{ stroke: tick }} />
          </svg>
        </div>
        <span
          style={{
            position: 'absolute',
            left: 14,
            top: 30,
            width: 8,
            height: 168,
            borderRadius: 4,
            background: `linear-gradient(180deg, ${spec(0.22)}, ${spec(0)})`,
          }}
        />
        <span
          style={{
            position: 'absolute',
            left: 14,
            top: 206,
            width: 8,
            height: 22,
            borderRadius: 4,
            background: spec(0.08),
          }}
        />
        <span
          style={{
            position: 'absolute',
            left: 227,
            top: 44,
            width: 2.5,
            height: 110,
            borderRadius: 2,
            background: `linear-gradient(180deg, ${spec(0.12)}, ${spec(0)})`,
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: 240,
            height: GLASS_H,
            padding: '0 30px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            textAlign: 'center',
          }}
        >
          <Kicker m={m} color={t.ink} />
          <span style={{ ...big(fit(m, m.long ? 40 : 54, 36)), whiteSpace: 'nowrap' }}>{m.digits}</span>
          <span className={L} style={{ fontSize: lmin(14), color: t.ink }}>
            {phrases.map((p, i) => (
              <Fragment key={p}>
                {i > 0 && ' '}
                <span style={{ whiteSpace: 'nowrap' }}>{i < phrases.length - 1 ? `${p} ·` : p}</span>
              </Fragment>
            ))}
          </span>
        </div>
      </div>
      {!m.indef &&
        m.total > 0 &&
        SCALE.map((s) => (
          <span
            key={s}
            className={L}
            style={{
              position: 'absolute',
              left: 306,
              top: Math.round(FLOOR - WATER_MAX * s - 8),
              lineHeight: '16px',
              whiteSpace: 'nowrap',
              fontFamily: MONO,
              fontSize: lmin(12),
              color: t.ink2,
            }}
          >
            {mark(m.total, s)}
          </span>
        ))}
    </>
  );
}
