import type { CSSProperties } from 'react';
import { CARD_SHADOW, WHITE } from '../art';
import '../face-art.css';
import { EndLine, type IDrawProps, Kicker } from '../kit';

type THands = readonly [number, number];
// Each digit is six small clocks (two columns, three rows); 225° on both hands leaves a clock blank.
const DIGIT: Readonly<Record<string, readonly THands[]>> = {
  '0': [
    [90, 180],
    [270, 180],
    [0, 180],
    [0, 180],
    [0, 90],
    [0, 270],
  ],
  '1': [
    [225, 225],
    [180, 180],
    [225, 225],
    [0, 180],
    [225, 225],
    [0, 0],
  ],
  '2': [
    [90, 90],
    [270, 180],
    [90, 180],
    [0, 270],
    [0, 90],
    [270, 270],
  ],
  '3': [
    [90, 90],
    [270, 180],
    [90, 90],
    [0, 180],
    [90, 90],
    [0, 270],
  ],
  '4': [
    [180, 180],
    [180, 180],
    [0, 90],
    [0, 180],
    [225, 225],
    [0, 0],
  ],
  '5': [
    [90, 180],
    [270, 270],
    [0, 90],
    [270, 180],
    [90, 90],
    [0, 270],
  ],
  '6': [
    [90, 180],
    [270, 270],
    [0, 180],
    [270, 180],
    [0, 90],
    [0, 270],
  ],
  '7': [
    [90, 90],
    [270, 180],
    [225, 225],
    [0, 180],
    [225, 225],
    [0, 0],
  ],
  '8': [
    [90, 180],
    [270, 180],
    [0, 90],
    [270, 180],
    [0, 90],
    [0, 270],
  ],
  '9': [
    [90, 180],
    [270, 180],
    [0, 90],
    [0, 180],
    [90, 90],
    [0, 270],
  ],
};
const BASE_X = [14, 95, 192, 273];
const GROUND = {
  light: 'linear-gradient(180deg, #FFFFFF, #F3F0E9)',
  dark: 'linear-gradient(180deg, #131B30, #0A0F1C)',
  oled: '#000000',
};
const MINI = {
  light: 'radial-gradient(circle at 50% 30%, #FFFFFF, #ECE8DF)',
  dark: 'radial-gradient(circle at 50% 30%, #1E2844, #10172A)',
  oled: '#05070C',
};

const handStyle = (deg: number, color: string, opacity: number): CSSProperties => ({
  position: 'absolute',
  left: 16,
  top: 0,
  width: 4,
  height: 18,
  borderRadius: 2,
  background: color,
  opacity,
  transformOrigin: '50% 100%',
  transform: `rotate(${deg}deg)`,
  transition: 'transform .9s cubic-bezier(.65,0,.25,1)',
});

// Twenty-four tiny clocks whose hands swing into place to spell the time left.
export default function Clocks({ m }: IDrawProps) {
  const { t, mc1, fill } = m;
  const heatBar = m.multi
    ? `linear-gradient(90deg, ${fill.ember}, ${fill.amber} 12%, ${fill.lime} 35%, ${m.lamp} 70%)`
    : m.accent;
  const colon = (top: number): CSSProperties => ({
    position: 'absolute',
    left: 176,
    top,
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: mc1,
  });
  return (
    <>
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 36,
          width: 360,
          height: 240,
          borderRadius: 26,
          background: GROUND[m.theme],
          boxShadow: CARD_SHADOW[m.theme],
        }}
      />
      <Kicker m={m} style={{ position: 'absolute', left: 0, top: 52, width: 360, textAlign: 'center' }} />
      {m.four.map((d, di) =>
        (DIGIT[String(d)] ?? DIGIT['0'] ?? []).map(([h1, h2], ci) => {
          const blank = h1 === 225 && h2 === 225;
          const hc = blank ? t.ink2 : di < 2 ? t.ink : mc1;
          const op = blank ? 0.28 : 1;
          return (
            <div
              key={`${di}-${ci}`}
              style={{
                position: 'absolute',
                left: (BASE_X[di] ?? 0) + (ci % 2) * 37,
                top: 80 + Math.floor(ci / 2) * 37,
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: MINI[m.theme],
                boxShadow: `inset 0 1px 0 ${WHITE(0.06)}, 0 0 0 1px ${t.line}`,
              }}
            >
              <span style={handStyle(h1, hc, op)} />
              <span style={handStyle(h2, hc, op)} />
              <span
                style={{
                  position: 'absolute',
                  left: 14,
                  top: 14,
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: hc,
                  opacity: op,
                }}
              />
            </div>
          );
        }),
      )}
      <span className="afx-blink" style={colon(110)} />
      <span className="afx-blink" style={colon(148)} />
      <div
        style={{
          position: 'absolute',
          left: 40,
          top: 214,
          width: 280,
          height: 4,
          borderRadius: 2,
          background: t.track,
          overflow: 'hidden',
        }}
      >
        <div className="af-tr" style={{ height: 4, width: m.fracPct, borderRadius: 2, background: heatBar }} />
      </div>
      <EndLine m={m} px={14} style={{ position: 'absolute', left: 0, top: 230, width: 360, textAlign: 'center' }} />
    </>
  );
}
