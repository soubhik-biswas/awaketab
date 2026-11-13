import { BLACK, NAVY, type TThemed, WHITE } from '../art';
import { alpha, arc, f1, P, ticks } from '../geometry';
import { D, DialLabel, fit, type IDrawProps, Kicker, L, lmin, mono, MONO, PLATE, Svg } from '../kit';
import type { TFaceTheme } from '../model';

interface IInstrument {
  bezel: string;
  bezelShadow: string;
  screenShadow: string;
  lip: string;
  lipEdge: string;
  glass: string;
  box: string;
  boxDrop: string;
}

// A matte instrument bezel with light from the top left; by day it is pale enamel around a daylight screen.
const KIT: TThemed<IInstrument> = {
  light: {
    bezel: 'radial-gradient(circle at 30% 20%, #FFFFFF 0%, #ECEDF3 55%, #D9DBE5 100%)',
    bezelShadow: `0 18px 40px ${NAVY(0.14)}, 0 0 0 1px #CDD0DC, inset 1px 1.5px 0 #FFFFFF, inset -1px -2px 0 ${NAVY(0.08)}`,
    screenShadow: `inset 2px 3px 8px ${NAVY(0.2)}, inset 0 0 0 1px ${NAVY(0.14)}`,
    lip: '#C3C7D2',
    lipEdge: '#FFFFFF',
    glass: `radial-gradient(75% 55% at 30% 20%, ${WHITE(0.55)}, transparent 62%)`,
    box: 'rgba(255,255,255,.92)',
    boxDrop: NAVY(0.12),
  },
  dark: {
    bezel: 'radial-gradient(circle at 30% 20%, #2B303C 0%, #151820 55%, #0C0E13 100%)',
    bezelShadow: `0 24px 50px ${BLACK(0.5)}, 0 0 0 1px #262A35, inset 1px 1.5px 0 ${WHITE(0.09)}, inset -1px -2px 0 ${BLACK(0.5)}`,
    screenShadow: `inset 3px 4px 10px ${BLACK(0.7)}, inset 0 0 0 1px ${BLACK(0.8)}`,
    lip: '#030405',
    lipEdge: WHITE(0.06),
    glass: `radial-gradient(75% 55% at 30% 20%, ${WHITE(0.06)}, transparent 62%)`,
    box: 'rgba(4,6,8,.86)',
    boxDrop: BLACK(0.35),
  },
  oled: {
    bezel: '#05070C',
    bezelShadow: '0 0 0 1px #1A2236',
    screenShadow: 'inset 0 0 0 1px #10131A',
    lip: '#0B0D12',
    lipEdge: WHITE(0.04),
    glass: `radial-gradient(75% 55% at 30% 20%, ${WHITE(0.04)}, transparent 62%)`,
    box: '#000000',
    boxDrop: BLACK(0),
  },
};

// The screen is tinted by its own phosphor, which takes the state colour.
const screen = (theme: TFaceTheme, acc: string): string =>
  theme === 'light'
    ? `radial-gradient(circle, color-mix(in srgb, ${acc} 5%, #FBFCFC) 0%, color-mix(in srgb, ${acc} 11%, #EDF0F2) 100%)`
    : theme === 'oled'
      ? '#000000'
      : `radial-gradient(circle, color-mix(in srgb, ${acc} 10%, #06090B) 0%, color-mix(in srgb, ${acc} 5%, #05070A) 64%, #020304 100%)`;

const T5 = ticks(115, 119, 72, (i) => i % 2 === 1);
const T10 = ticks(112, 119, 36, (i) => i % 3 !== 0);
const T30 = ticks(108, 119, 12);
const BEARINGS = Array.from({ length: 12 }, (_, i) => i * 30);
const TRACK = 104;

// A radar scope: the contact's bearing is the time left, and the phosphor trail fades behind the sweep.
export default function Radar({ m }: IDrawProps) {
  const { t, accent: acc, theme } = m;
  const kit = KIT[theme];
  const deg = 360 * m.ringFrac;
  const [bx, by] = P(TRACK, deg);
  const bright = m.awake || m.st === 'idle' || m.st === 'starting';
  return (
    <>
      <div
        style={{
          position: 'absolute',
          left: 32,
          top: 7,
          width: 296,
          height: 296,
          borderRadius: '50%',
          background: kit.bezel,
          boxShadow: kit.bezelShadow,
        }}
      />
      <div
        className={PLATE}
        style={{
          position: 'absolute',
          left: 60,
          top: 35,
          width: 240,
          height: 240,
          borderRadius: '50%',
          overflow: 'hidden',
          isolation: 'isolate',
          background: screen(theme, acc),
          boxShadow: kit.screenShadow,
        }}
      >
        <div
          className="afx-radar"
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            // The beam leads clockwise and its afterglow decays over the third of a turn behind it.
            background: `conic-gradient(from 240deg, transparent 0deg, ${alpha(acc, 0x06)} 50deg, ${alpha(acc, 0x14)} 90deg, ${alpha(acc, 0x30)} 110deg, ${alpha(acc, 0x66)} 119.5deg, transparent 120deg 360deg)`,
            opacity: bright ? 1 : 0.32,
            // At rest the beam has just passed the contact, so it reads as freshly painted.
            transform: `rotate(${(deg + 10).toFixed(1)}deg)`,
          }}
        >
          <div
            style={{
              position: 'absolute',
              left: 119.25,
              top: 0,
              width: 1.5,
              height: 120,
              borderRadius: 1,
              background: `linear-gradient(to top, ${alpha(acc, 0x1a)}, ${acc})`,
              boxShadow: m.night ? `0 0 5px ${alpha(acc, 0x80)}` : undefined,
            }}
          />
        </div>
      </div>
      <Svg>
        <path className={D} d="M180 37V273M62 155H298" strokeWidth="1" style={{ stroke: alpha(acc, 0x1f) }} />
        <circle cx="180" cy="155" r="60" fill="none" strokeWidth="1" style={{ stroke: alpha(acc, 0x33) }} />
        <circle cx="180" cy="155" r="90" fill="none" strokeWidth="1" style={{ stroke: alpha(acc, 0x33) }} />
        <path className={D} d={T5} strokeWidth="1" style={{ stroke: alpha(acc, 0x4d) }} />
        <path className={D} d={T10} strokeWidth="1.2" style={{ stroke: alpha(acc, 0x80) }} />
        <path d={T30} strokeWidth="1.6" opacity=".9" style={{ stroke: acc }} />
        <circle cx="180" cy="155" r="122" fill="none" strokeWidth="4" style={{ stroke: kit.lip }} />
        <circle cx="180" cy="155" r="124.2" fill="none" strokeWidth=".8" style={{ stroke: kit.lipEdge }} />
        <circle
          className={D}
          cx="180"
          cy="155"
          r={TRACK}
          fill="none"
          strokeWidth="1"
          strokeDasharray="1.5 4.5"
          style={{ stroke: alpha(acc, 0x40) }}
        />
        <path
          d={arc(TRACK, 0, deg)}
          fill="none"
          strokeWidth="1.5"
          strokeLinecap="round"
          style={{ stroke: alpha(acc, 0x8c) }}
        />
        <path
          d={arc(TRACK, deg - 9, deg)}
          fill="none"
          strokeWidth="6"
          strokeLinecap="round"
          style={{ stroke: alpha(acc, 0x4d) }}
        />
        <circle className="afx-pulse" cx={f1(bx)} cy={f1(by)} r="9" opacity={m.haloOp} style={{ fill: acc }} />
        <circle cx={f1(bx)} cy={f1(by)} r="4.5" style={{ fill: acc }} />
        {m.night && <circle cx={f1(bx)} cy={f1(by)} r="1.8" fill="#FFFFFF" opacity=".75" />}
      </Svg>
      {BEARINGS.map((b) => (
        <DialLabel
          key={b}
          m={m}
          text={String(b).padStart(3, '0')}
          rr={136.5}
          deg={b}
          fs={11}
          color={t.ink2}
          extra={{ fontFamily: MONO, fontWeight: 500, letterSpacing: '.02em' }}
        />
      ))}
      <div
        className={D}
        style={{
          position: 'absolute',
          left: 60,
          top: 35,
          width: 240,
          height: 240,
          borderRadius: '50%',
          background: kit.glass,
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 110,
          top: 118,
          width: 140,
          height: 74,
          borderRadius: 14,
          background: kit.box,
          boxShadow: `inset 0 0 0 1px ${alpha(acc, 0x4d)}, inset 0 1px 0 ${m.night ? WHITE(0.06) : '#FFFFFF'}, 0 4px 14px ${kit.boxDrop}`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 1,
          lineHeight: 1.15,
        }}
      >
        <Kicker m={m} style={{ fontSize: lmin(10) }} />
        <span
          style={{
            color: t.ink,
            fontSize: fit(m, 28, 24),
            fontWeight: 500,
            letterSpacing: '-0.02em',
            lineHeight: 1,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {m.digits}
        </span>
        <span className={L} style={{ ...mono(11, '.08em', acc), fontVariantNumeric: 'tabular-nums' }}>
          {m.indef ? 'NO END' : m.endShort}
        </span>
      </div>
    </>
  );
}
