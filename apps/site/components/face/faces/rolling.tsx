'use client';

import { type CSSProperties, useLayoutEffect, useRef } from 'react';
import { BLACK, CARD_SHADOW, NAVY, themed, type TThemed, WHITE } from '../art';
import { alpha } from '../geometry';
import { EndLine, type IDrawProps, Kicker, L, mono, PLATE } from '../kit';
import type { TFaceTheme } from '../model';

const W = 66;
const H = 156;
const LINE = 100;
const MID = (H - LINE) / 2;
// Neighbours sit closer than a full line, so the digits to come show as a readable part of a drum, not a sliver.
const PITCH = 84;
const ROWS = [-2, -1, 0, 1, 2] as const;
const ROLL_MS = 560;
const ROLL_EASE = 'cubic-bezier(.2,.8,.2,1)';
// The drum curves away from the window: the digits to come fade out before its edge instead of being cut by it.
const FADE =
  'linear-gradient(180deg, transparent 0, transparent 4%, rgba(0,0,0,.25) 16%, #000 28%, #000 72%, rgba(0,0,0,.25) 84%, transparent 96%)';

// Two pairs of drums with the colon between them: 304 wide, inside a 324 × 168 well, inside a 336 wide housing.
const DRUM_X = [0, 74, 164, 238] as const;
const COLON_X = 152;
const WELL_W = 324;
const WELL_H = 168;
const PAD_X = 10;
const PAD_Y = 6;
const AXIS = PAD_Y + H / 2;
const BAND = 64;

const DRUM: TThemed<string> = {
  light: 'linear-gradient(180deg, #D8DAE3 0%, #F3F4F8 22%, #FFFFFF 42%, #F6F7FA 62%, #D7D9E2 100%)',
  dark: 'linear-gradient(180deg, #0B0D12 0%, #1B1E27 24%, #272A35 44%, #1D2029 64%, #0B0C11 100%)',
  oled: 'linear-gradient(180deg, #000000 0%, #0C0E13 26%, #15181F 46%, #0D0F14 66%, #000000 100%)',
};
const DRUM_EDGE: TThemed<string> = {
  light: `inset 0 1px 0 #FFFFFF, inset 0 -1px 0 ${NAVY(0.1)}, inset 1px 0 0 ${NAVY(0.05)}, inset -1px 0 0 ${NAVY(0.05)}`,
  dark: `inset 0 1px 0 ${WHITE(0.06)}, inset 0 -1px 0 ${BLACK(0.6)}`,
  oled: 'inset 0 0 0 1px #12151C',
};
const HOUSING: TThemed<CSSProperties> = {
  light: {
    background: 'linear-gradient(165deg, #FFFFFF 0%, #F4F5F9 50%, #E9EBF1 100%)',
    boxShadow: CARD_SHADOW.light,
  },
  dark: {
    background: `radial-gradient(120% 90% at 18% 0%, ${WHITE(0.07)}, transparent 55%), linear-gradient(165deg, #181B23 0%, #0E1015 100%)`,
    boxShadow: CARD_SHADOW.dark,
  },
  oled: { background: '#000000', boxShadow: CARD_SHADOW.oled },
};
const WELL: TThemed<CSSProperties> = {
  light: { background: '#C6CAD6', boxShadow: '0 1px 0 #FFFFFF' },
  dark: { background: '#040507', boxShadow: `0 1px 0 ${WHITE(0.05)}` },
  oled: { background: '#000000', boxShadow: 'none' },
};
// The rim of the well casts its shade over the drums, so they read as set below the housing.
const RIM: TThemed<string> = {
  light: `inset 0 2px 6px ${NAVY(0.22)}, inset 0 0 0 1px ${NAVY(0.12)}`,
  dark: `inset 0 3px 8px ${BLACK(0.7)}, inset 0 0 0 1px ${BLACK(0.8)}`,
  oled: 'inset 0 0 0 1px #1A2236',
};
const GLASS: TThemed<string> = {
  light: `linear-gradient(180deg, ${WHITE(0.28)}, transparent 38%, transparent 70%, ${NAVY(0.03)})`,
  dark: `linear-gradient(180deg, ${WHITE(0.07)}, transparent 40%, transparent 70%, ${BLACK(0.12)})`,
  oled: `linear-gradient(180deg, ${WHITE(0.05)}, transparent 40%)`,
};

const row = (k: number): CSSProperties => ({
  position: 'absolute',
  left: 0,
  right: 0,
  top: MID + k * PITCH,
  textAlign: 'center',
  fontSize: 80,
  lineHeight: `${LINE}px`,
  fontWeight: 500,
});

// One step either way rolls that way; a bigger jump rolls down when the digit grows and up when it shrinks.
const startOffset = (was: number, d: number, mod: number): number => {
  if ((was - 1 + mod) % mod === d) return PITCH;
  if ((was + 1) % mod === d) return -PITCH;
  return d > was ? -PITCH : PITCH;
};

interface IDrum {
  d: number;
  mod: number;
  roll: boolean;
  theme: TFaceTheme;
  ink: string;
  x: number;
}

// The digit above is the one just gone and the digit below the one to come; a change rolls the drum one row.
function Drum({ d, mod, roll, theme, ink, x }: IDrum) {
  const strip = useRef<HTMLDivElement>(null);
  const last = useRef(d);

  useLayoutEffect(() => {
    const was = last.current;
    last.current = d;
    const el = strip.current;
    if (!roll || !el || was === d || typeof el.animate !== 'function') return;
    for (const a of el.getAnimations()) a.cancel();
    el.animate([{ transform: `translateY(${startOffset(was, d, mod)}px)` }, { transform: 'translateY(0)' }], {
      duration: ROLL_MS,
      easing: ROLL_EASE,
    });
  }, [d, mod, roll]);

  return (
    <div
      style={{
        position: 'absolute',
        left: PAD_X + x,
        top: PAD_Y,
        width: W,
        height: H,
        borderRadius: 6,
        background: DRUM[theme],
        color: ink,
        overflow: 'hidden',
        isolation: 'isolate',
        boxShadow: DRUM_EDGE[theme],
      }}
    >
      <div style={{ position: 'absolute', inset: 0, maskImage: FADE, WebkitMaskImage: FADE }}>
        <div ref={strip} style={{ position: 'absolute', left: 0, top: 0, width: W, height: H }}>
          {ROWS.map((r) => (
            <span key={r} style={row(r)}>
              {(d - r + mod * 2) % mod}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// An engraved unit under a pair of drums, between two hairlines.
function Unit({ left, text, line, ink }: { left: number; text: string; line: string; ink: string }) {
  const rule: CSSProperties = { flex: 1, height: 1, background: line };
  return (
    <div
      style={{
        position: 'absolute',
        left,
        top: 0,
        width: 140,
        height: 28,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}
    >
      <span style={rule} />
      <span style={{ ...mono(12, '.22em', ink), lineHeight: 1, textTransform: 'uppercase', marginRight: '-.22em' }}>
        {text}
      </span>
      <span style={rule} />
    </div>
  );
}

// Odometer drums in a recessed well: the digits to come are always just visible, and each drum rolls when its digit
// changes.
export default function Rolling({ m }: IDrawProps) {
  const { t, accent, theme } = m;
  const mods = m.h > 0 ? [10, 10, 6, 10] : [6, 10, 6, 10];
  const roll = !m.still && !m.thumb;
  // A no-end session counts up, so before it starts its drums rest on zero instead of on a length it does not have.
  const four = m.indef && m.st === 'idle' ? [0, 0, 0, 0] : m.four;
  const units = m.h > 0 ? ['hr', 'min'] : ['min', 'sec'];
  // The compact face hides its words, so the housing drops its unit row and sits in the middle.
  const top = m.compact ? 65 : 52;
  const dot: CSSProperties = {
    position: 'absolute',
    left: PAD_X + COLON_X - 3.5,
    width: 7,
    height: 7,
    borderRadius: '50%',
    background: accent,
  };
  const lamp: CSSProperties = { position: 'absolute', inset: 0, borderRadius: '50%' };
  return (
    <>
      <div
        className={L}
        style={{
          position: 'absolute',
          left: 0,
          top: 24,
          width: 360,
          height: 22,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
        }}
      >
        <span style={{ position: 'relative', width: 8, height: 8, flex: 'none' }}>
          <span className="afx-pulse" style={{ ...lamp, background: accent, opacity: m.haloOp }} />
          <span
            style={{ ...lamp, background: m.hollow ? 'transparent' : accent, boxShadow: `inset 0 0 0 2px ${accent}` }}
          />
        </span>
        <Kicker m={m} />
      </div>
      <div
        className={PLATE}
        style={{
          position: 'absolute',
          left: 12,
          top,
          width: WELL_W + 12,
          height: m.compact ? WELL_H + 12 : WELL_H + 34,
          borderRadius: 24,
          ...themed(theme, HOUSING),
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: 6,
            top: 6,
            width: WELL_W,
            height: WELL_H,
            borderRadius: 18,
            overflow: 'hidden',
            isolation: 'isolate',
            ...themed(theme, WELL),
          }}
        >
          {four.map((d, i) => (
            <Drum key={i} d={d} mod={mods[i] ?? 10} roll={roll} theme={theme} ink={t.cardInk} x={DRUM_X[i] ?? 0} />
          ))}
          <span className="afx-blink" style={{ position: 'absolute', inset: 0 }}>
            <span style={{ ...dot, top: AXIS - 16.5 }} />
            <span style={{ ...dot, top: AXIS + 9.5 }} />
          </span>
          <div
            style={{
              position: 'absolute',
              left: PAD_X,
              top: AXIS - BAND / 2,
              width: WELL_W - 2 * PAD_X,
              height: BAND,
              background: GLASS[theme],
              borderTop: `1px solid ${alpha(accent, 0x8c)}`,
              borderBottom: `1px solid ${alpha(accent, 0x8c)}`,
            }}
          />
          <svg
            style={{ position: 'absolute', left: 0, top: 0 }}
            width={WELL_W}
            height={WELL_H}
            viewBox={`0 0 ${WELL_W} ${WELL_H}`}
            aria-hidden="true"
          >
            <path
              d={`M2 ${AXIS - 5}L8 ${AXIS}L2 ${AXIS + 5}Z M${WELL_W - 2} ${AXIS - 5}L${WELL_W - 8} ${AXIS}L${WELL_W - 2} ${AXIS + 5}Z`}
              style={{ fill: accent }}
            />
          </svg>
          <div style={{ position: 'absolute', inset: 0, borderRadius: 'inherit', boxShadow: RIM[theme] }} />
        </div>
        {!m.compact && (
          <div className={L} style={{ position: 'absolute', left: 0, top: WELL_H + 6, width: WELL_W + 12, height: 28 }}>
            <Unit left={6 + PAD_X} text={units[0] ?? ''} line={t.line} ink={t.ink2} />
            <Unit left={6 + PAD_X + DRUM_X[2]} text={units[1] ?? ''} line={t.line} ink={t.ink2} />
          </div>
        )}
      </div>
      <div style={{ position: 'absolute', left: 0, top: 266, width: 360, textAlign: 'center' }}>
        <EndLine m={m} px={15} />
      </div>
    </>
  );
}
