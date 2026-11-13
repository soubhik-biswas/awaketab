import type { CSSProperties } from 'react';
import { BLACK, NAVY, themed, type TThemed, WHITE } from '../art';
import { SERIF } from '../fonts';
import { card, D, digitSize, fit, type IDrawProps, L, lmin, MONO, PLATE } from '../kit';
import type { TFaceModel } from '../model';

const PAPER = '#E8E6DF';
const INK = '#1E1E1C';
const INK_SOFT = 'rgba(30,30,28,.4)';
const INK_MID = 'rgba(30,30,28,.6)';

// The reader's soft-touch case: warm grey by day, graphite at night, black in OLED; lit from the top left.
const BEZEL: TThemed<CSSProperties> = {
  light: {
    background: 'linear-gradient(150deg, #ECE9E1 0%, #DDDAD1 55%, #D2CEC4 100%)',
    boxShadow: `0 22px 44px ${NAVY(0.12)}, 0 0 0 1px #CBC7BC, inset 1px 1px 0 ${WHITE(0.7)}, inset -1px -1px 0 ${BLACK(0.06)}`,
  },
  dark: {
    background: 'linear-gradient(150deg, #26262B 0%, #1C1C21 55%, #151519 100%)',
    boxShadow: `0 28px 60px ${BLACK(0.55)}, 0 0 0 1px #2A2A31, inset 1px 1px 0 ${WHITE(0.07)}, inset -1px -1px 0 ${BLACK(0.4)}`,
  },
  oled: { background: '#060606', boxShadow: `0 0 0 1px #1A2236, inset 1px 1px 0 ${WHITE(0.05)}` },
};
// The screen sits below the case: shaded under its top-left lip, caught by the light on its lower-right edge, with
// the front light spreading from the top. It lies over the page, so the night filter never flips its light.
const GLASS: TThemed<CSSProperties> = {
  light: {
    background: `radial-gradient(140% 110% at 0% 0%, ${WHITE(0.22)}, ${WHITE(0)} 55%)`,
    boxShadow: `inset 1px 1.5px 2.5px ${BLACK(0.16)}, inset 0 0 0 1px ${BLACK(0.07)}, 0.5px 0.5px 0 ${WHITE(0.6)}`,
  },
  dark: {
    background: `radial-gradient(140% 110% at 0% 0%, ${WHITE(0.035)}, ${WHITE(0)} 55%)`,
    boxShadow: `inset 1px 1.5px 3px ${BLACK(0.55)}, inset 0 0 0 1px ${BLACK(0.45)}, 0.5px 0.5px 0 ${WHITE(0.05)}`,
  },
  oled: { boxShadow: `inset 0 0 0 1px ${WHITE(0.04)}` },
};
// Night paper: dark and OLED invert the page and turn its hues back, OLED almost to black.
const NIGHT_FILTER: TThemed<string | undefined> = {
  light: undefined,
  dark: 'invert(.93) hue-rotate(180deg) contrast(.95)',
  oled: 'invert(.98) hue-rotate(180deg)',
};
const LOGO: TThemed<CSSProperties> = {
  light: { background: BLACK(0.12), boxShadow: `0 1px 0 ${WHITE(0.6)}` },
  dark: { background: BLACK(0.5), boxShadow: `0 1px 0 ${WHITE(0.05)}` },
  oled: { background: WHITE(0.05) },
};

// The screen inside the case, and the page laid out on it.
const SX = 12;
const SW = 308;
const SH = 258;
const MID = 106;
const TICKS = [0, 25, 50, 75, 100] as const;

// The state in words (paper has no colour to spare): left, paused, not awake, starting.
const line = (m: TFaceModel): string =>
  m.st === 'up'
    ? 'finished — the screen may sleep'
    : m.st === 'idle'
      ? `ready · ${m.endLine}`
      : m.indef && m.awake
        ? m.endLine
        : `${m.topWord} · ${m.endLine}`;

// A reader's progress rail: a hairline with end caps and quarter marks, the time left printed solid over it.
function Rail({ m }: IDrawProps) {
  return (
    <div style={{ position: 'relative', flex: 1, height: 9 }}>
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 4,
          height: 1,
          background: m.indef ? `repeating-linear-gradient(90deg, ${INK_MID} 0 3px, transparent 3px 6px)` : INK_SOFT,
        }}
      />
      {!m.indef && (
        <div style={{ position: 'absolute', left: 0, top: 3, height: 3, width: m.fracPct, background: INK }} />
      )}
      {TICKS.map((q) => {
        const tall = q === 0 || q === 100 ? 9 : q === 50 ? 7 : 5;
        return (
          <div
            key={q}
            style={{
              position: 'absolute',
              left: `${q}%`,
              top: (9 - tall) / 2,
              width: 1,
              height: tall,
              marginLeft: -0.5,
              background: INK_MID,
            }}
          />
        );
      })}
    </div>
  );
}

// Paper-like and calm, with serif digits and a faint ghost of the last refresh; dark themes turn it into night paper.
export default function Eink({ m }: IDrawProps) {
  const size = fit(m, digitSize(m, 'big'), 58);
  const digits: CSSProperties = {
    position: 'absolute',
    left: 0,
    width: SW,
    // Centred between the header rule and the status line whatever the reading's size.
    top: MID - size / 2,
    textAlign: 'center',
    whiteSpace: 'nowrap',
    fontFamily: SERIF,
    fontSize: size,
    fontWeight: 300,
    lineHeight: 1,
    fontVariantNumeric: 'tabular-nums lining-nums',
  };
  const screen: CSSProperties = { position: 'absolute', left: SX, top: SX, width: SW, height: SH, borderRadius: 14 };
  const filter = themed(m.theme, NIGHT_FILTER);
  return (
    <div className={PLATE} style={card(m, { borderRadius: 26, ...themed(m.theme, BEZEL) })}>
      <div
        style={{
          ...screen,
          ...(filter ? { filter } : null),
          backgroundColor: PAPER,
          // Paper fibre: two fine grains at different pitches, so no regular pattern shows.
          backgroundImage:
            'radial-gradient(rgba(0,0,0,.035) 1px, transparent 1.2px), radial-gradient(rgba(0,0,0,.025) .8px, transparent 1px)',
          backgroundSize: '4px 4px, 7px 7px',
          backgroundPosition: '0 0, 2px 3px',
          color: INK,
        }}
      >
        <div
          className={L}
          style={{
            position: 'absolute',
            left: 18,
            right: 18,
            top: 14,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingBottom: 8,
            borderBottom: `1px solid ${INK}`,
            fontFamily: MONO,
            fontSize: lmin(12),
            letterSpacing: '.06em',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          <span>AwakeTab</span>
          <span>{m.nowShort}</span>
        </div>
        <span style={{ ...digits, opacity: 0.06, transform: 'translate(3px, 2px)' }}>{m.digits}</span>
        <span style={digits}>{m.digits}</span>
        <span
          className={L}
          style={{
            position: 'absolute',
            left: 0,
            width: SW,
            top: 164,
            textAlign: 'center',
            fontFamily: SERIF,
            fontStyle: 'italic',
            fontWeight: 400,
            whiteSpace: 'nowrap',
            fontSize: lmin(15),
          }}
        >
          {line(m)}
        </span>
        <div
          className={L}
          style={{
            position: 'absolute',
            left: 18,
            right: 18,
            bottom: 18,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            fontFamily: MONO,
            fontSize: lmin(12),
          }}
        >
          <Rail m={m} />
          <span style={{ flex: 'none', minWidth: 40, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
            {m.indef ? 'no end' : m.pctLabel}
          </span>
        </div>
      </div>
      <div style={{ ...screen, pointerEvents: 'none', ...themed(m.theme, GLASS) }} />
      <span
        className={D}
        style={{
          position: 'absolute',
          left: 154,
          top: 275,
          width: 24,
          height: 2,
          borderRadius: 1,
          ...themed(m.theme, LOGO),
        }}
      />
    </div>
  );
}
