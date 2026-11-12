import type { CSSProperties } from 'react';
import { EndLine, type IDrawProps, L, mono } from '../kit';
import { CARD_W, FLIP_CSS, FlipCard } from './flip-cards';

const GAP = 12;
const DOT = 10;

// A hollow dot is the shape of "not awake", so the colon never says it by colour alone.
const dot = (accent: string, hollow: boolean): CSSProperties => ({
  display: 'block',
  width: DOT,
  height: DOT,
  borderRadius: '50%',
  background: hollow ? 'transparent' : accent,
  boxShadow: hollow ? `inset 0 0 0 2px ${accent}` : undefined,
});

// The unit sits centred under its card; the left pad cancels the tracking after its last letter.
const unit: CSSProperties = { width: CARD_W, paddingLeft: '.16em', textAlign: 'center' };

// Split-flap cards with a real hinge gap: when a pair of digits changes, its top flap falls onto the new value.
export default function Flip({ m }: IDrawProps) {
  const { t, accent } = m;
  // The dock button is too small to show a falling flap.
  const flap = !m.still && !m.thumb;
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        // Thumbnails drop the labels, so the cards alone sit in the middle.
        top: m.compact ? 71 : 34,
        width: 360,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <style>{FLIP_CSS}</style>
      <div style={{ display: 'flex', alignItems: 'center', gap: GAP }}>
        <FlipCard value={m.ga} flap={flap} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          <span className="afx-breath" style={dot(accent, m.hollow)} />
          <span className="afx-breath" style={dot(accent, m.hollow)} />
        </div>
        <FlipCard value={m.gb} flap={flap} />
      </div>
      <div className={L} style={{ display: 'flex', gap: GAP * 2 + DOT, ...mono(12, '.16em', t.ink2) }}>
        <span style={unit}>{m.h > 0 ? 'HR' : 'MIN'}</span>
        <span style={unit}>{m.h > 0 ? 'MIN' : 'SEC'}</span>
      </div>
      <EndLine m={m} px={15} />
    </div>
  );
}
