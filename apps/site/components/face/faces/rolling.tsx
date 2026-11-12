'use client';

import { type CSSProperties, useLayoutEffect, useRef } from 'react';
import { BLACK, NAVY, WHITE } from '../art';
import { alpha } from '../geometry';
import { EndLine, type IDrawProps } from '../kit';

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

const DRUM_SHADOW = {
  light: `0 10px 22px ${NAVY(0.1)}, inset 0 0 0 1px #D6D9E3`,
  night: `0 10px 22px ${BLACK(0.25)}, inset 0 0 0 1px ${WHITE(0.05)}`,
};
const CURVE = {
  light: `linear-gradient(180deg, ${NAVY(0.07)}, transparent 24%, transparent 76%, ${NAVY(0.07)})`,
  night: `linear-gradient(180deg, ${BLACK(0.35)}, transparent 24%, transparent 76%, ${BLACK(0.35)})`,
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
  night: boolean;
  card: string;
  ink: string;
}

// The digit above is the one just gone and the digit below the one to come; a change rolls the drum one row.
function Drum({ d, mod, roll, night, card, ink }: IDrum) {
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

  const k = night ? 'night' : 'light';
  const edge = alpha(card, 0xeb);
  const clear = alpha(card, 0);
  return (
    <div
      style={{
        position: 'relative',
        width: W,
        height: H,
        borderRadius: 12,
        background: card,
        color: ink,
        overflow: 'hidden',
        isolation: 'isolate',
        boxShadow: DRUM_SHADOW[k],
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
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 'inherit',
          background: `${CURVE[k]}, linear-gradient(180deg, ${edge}, ${clear} 32%, ${clear} 68%, ${edge})`,
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}

// Odometer drums: the digits to come are always just visible, and each drum rolls when its digit changes.
export default function Rolling({ m }: IDrawProps) {
  const { t, accent } = m;
  const mods = m.h > 0 ? [10, 10, 6, 10] : [6, 10, 6, 10];
  const roll = !m.still && !m.thumb;
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        // Thumbnails drop the end line, so the drums alone sit in the middle.
        top: m.compact ? 77 : 50,
        width: 360,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 20,
      }}
    >
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 8 }}>
        {m.four.map((d, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Drum d={d} mod={mods[i] ?? 10} roll={roll} night={m.night} card={t.card} ink={t.cardInk} />
            {i === 1 && (
              <span className="afx-blink" style={{ fontSize: 56, fontWeight: 300, color: accent }}>
                :
              </span>
            )}
          </div>
        ))}
        <div
          style={{
            position: 'absolute',
            left: -10,
            right: -10,
            top: 46,
            height: 64,
            borderTop: `1px solid ${alpha(accent, 0x99)}`,
            borderBottom: `1px solid ${alpha(accent, 0x99)}`,
            pointerEvents: 'none',
          }}
        />
      </div>
      <EndLine m={m} px={15} />
    </div>
  );
}
