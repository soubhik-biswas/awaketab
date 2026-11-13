import { BLACK, NAVY, type TThemed, WHITE } from '../art';
import { alpha, f1 } from '../geometry';
import { big, D, EndLine, fit, type IDrawProps, Kicker, L, lmin, MONO } from '../kit';

// The cell is 248 × 108; its well sits 8 in, and ten charge segments of 10 % each fill the well 6 in from its edge.
const CELL_W = 248;
const CELL_H = 108;
const SEGS = 10;
const SEG_GAP = 4;
const SEG_H = 80;
const SEG_W = (CELL_W - 16 - 12 - (SEGS - 1) * SEG_GAP) / SEGS;
const CAP_GAP = 9;
const CAP_W = 12;

const CASE_BG: TThemed<string> = {
  light: 'linear-gradient(180deg, #FFFFFF 0%, #F1F2F8 50%, #E7E8F1 100%)',
  dark: 'linear-gradient(180deg, #1F2433 0%, #141824 50%, #0D1018 100%)',
  oled: '#05060A',
};
// A thick glass case: a hairline, a clear band and an outer edge, with a lit top and a shaded bottom.
const CASE_SHADOW: TThemed<string> = {
  light: `inset 0 1px 0 #FFFFFF, inset 0 -1px 0 ${NAVY(0.08)}, 0 0 0 1px #CFD0DE, 0 0 0 4px #F7F7FB, 0 0 0 5px #D8D9E5, 0 16px 32px ${NAVY(0.12)}`,
  dark: `inset 0 1px 0 ${WHITE(0.12)}, inset 0 -1px 0 ${BLACK(0.6)}, 0 0 0 1px #2C3140, 0 0 0 4px ${WHITE(0.02)}, 0 0 0 5px #222632, 0 20px 40px ${BLACK(0.5)}`,
  oled: `inset 0 1px 0 ${WHITE(0.08)}, 0 0 0 1px #1A2236`,
};
const WELL_BG: TThemed<string> = { light: '#E6E7EF', dark: '#080A11', oled: '#000000' };
const WELL_SHADOW: TThemed<string> = {
  light: `inset 0 2px 6px ${NAVY(0.14)}`,
  dark: `inset 0 2px 6px ${BLACK(0.65)}`,
  oled: `inset 0 0 0 1px ${WHITE(0.05)}`,
};
const TRACK: TThemed<string> = { light: NAVY(0.06), dark: WHITE(0.045), oled: WHITE(0.05) };
const CAP_BG: TThemed<string> = {
  light: 'linear-gradient(180deg, #F4F5F9 0%, #C5C7D3 55%, #DDDEE7 100%)',
  dark: 'linear-gradient(180deg, #4A5168 0%, #262B3A 55%, #343A4D 100%)',
  oled: '#11141C',
};
const CAP_RING: TThemed<string> = { light: '#CFD0DE', dark: '#2C3140', oled: '#1A2236' };

const mix = (c: string, pct: number, base: string): string => `color-mix(in srgb, ${c} ${pct}%, ${base})`;

// Time left as a charge level: ten segments, the last one lit only as far as the time it still holds.
export default function Battery({ m }: IDrawProps) {
  const { theme, night } = m;
  const q = m.indef ? 1 : m.ringFrac;
  const c = m.heat(q);
  const units = Math.min(SEGS, Math.max(0, q * SEGS));
  const whole = Math.floor(units);
  const litW = Math.min(SEGS * SEG_W + (SEGS - 1) * SEG_GAP, whole * (SEG_W + SEG_GAP) + (units - whole) * SEG_W);
  const lit = `linear-gradient(180deg, ${mix(c, 62, '#FFFFFF')} 0%, ${c} 38%, ${mix(c, 78, '#000000')} 100%)`;
  const glow = night
    ? `inset 0 1px 0 ${WHITE(0.35)}, 0 0 10px ${alpha(c, 0x4d)}`
    : `inset 0 1px 0 ${WHITE(0.45)}, 0 1px 2px ${NAVY(0.18)}`;
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: 360,
        height: 310,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
      }}
    >
      <div
        style={{
          width: CELL_W,
          marginLeft: 5,
          marginRight: CAP_GAP + CAP_W,
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          whiteSpace: 'nowrap',
        }}
      >
        <Kicker m={m} />
        <span className={L} style={{ fontFamily: MONO, fontSize: lmin(13), color: m.heatT(q) }}>
          {m.indef ? '∞' : m.pctLabel}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: CAP_GAP, marginLeft: 5 }}>
        <div
          style={{
            position: 'relative',
            width: CELL_W,
            height: CELL_H,
            borderRadius: 24,
            background: CASE_BG[theme],
            boxShadow: CASE_SHADOW[theme],
          }}
        >
          <div
            style={{
              position: 'absolute',
              left: 8,
              top: 8,
              width: CELL_W - 16,
              height: CELL_H - 16,
              borderRadius: 16,
              overflow: 'hidden',
              isolation: 'isolate',
              background: WELL_BG[theme],
              boxShadow: WELL_SHADOW[theme],
            }}
          >
            {Array.from({ length: SEGS }, (_, i) => {
              const w = Math.min(1, Math.max(0, units - i)) * SEG_W;
              return (
                <div
                  key={i}
                  style={{
                    position: 'absolute',
                    left: `${f1(6 + i * (SEG_W + SEG_GAP))}px`,
                    top: 6,
                    width: `${f1(SEG_W)}px`,
                    height: SEG_H,
                    borderRadius: 5,
                    background: TRACK[theme],
                  }}
                >
                  <div
                    className="af-tr"
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      width: `${f1(w)}px`,
                      height: SEG_H,
                      borderRadius: 5,
                      background: lit,
                      boxShadow: w > 0.5 ? glow : 'none',
                    }}
                  />
                </div>
              );
            })}
            {m.live && litW > 0 && (
              <div
                className={`af-tr ${D}`}
                style={{
                  position: 'absolute',
                  left: 6,
                  top: 6,
                  width: `${f1(litW)}px`,
                  height: SEG_H,
                  overflow: 'hidden',
                }}
              >
                <span
                  className="afx-sheen"
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    width: 52,
                    height: SEG_H,
                    background: `linear-gradient(90deg, transparent, ${WHITE(0.3)}, transparent)`,
                  }}
                />
              </div>
            )}
          </div>
          <div
            style={{
              position: 'absolute',
              left: 14,
              top: 11,
              width: CELL_W - 28,
              height: 24,
              borderRadius: 12,
              background: `linear-gradient(180deg, ${WHITE(night ? 0.16 : 0.75)}, ${WHITE(0)})`,
            }}
          />
        </div>
        <div
          style={{
            width: CAP_W,
            height: 40,
            borderRadius: '0 6px 6px 0',
            background: CAP_BG[theme],
            boxShadow: `inset 0 1px 0 ${WHITE(night ? 0.18 : 0.9)}, 0 0 0 1px ${CAP_RING[theme]}`,
          }}
        />
      </div>
      <span style={{ ...big(fit(m, m.long ? 46 : 58, 40)), marginTop: 8, whiteSpace: 'nowrap' }}>{m.digits}</span>
      <EndLine m={m} px={15} />
    </div>
  );
}
