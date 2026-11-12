import type { CSSProperties } from 'react';
import { CARD_SHADOW, WHITE } from '../art';
import { EndLine, type IDrawProps, Kicker, PLATE } from '../kit';

// Each digit is six small clocks (two columns, three rows) whose hands trace its seven segments; 225° on every hand leaves a clock blank.
const SEG7 = ['abcdef', 'bc', 'abged', 'abgcd', 'fgbc', 'afgcd', 'afgedc', 'abc', 'abcdefg', 'abcdfg'] as const;
const JOIN: readonly (readonly (readonly [string, number])[])[] = [
  [
    ['a', 90],
    ['f', 180],
  ],
  [
    ['a', 270],
    ['b', 180],
  ],
  [
    ['f', 0],
    ['e', 180],
    ['g', 90],
  ],
  [
    ['b', 0],
    ['c', 180],
    ['g', 270],
  ],
  [
    ['e', 0],
    ['d', 90],
  ],
  [
    ['c', 0],
    ['d', 270],
  ],
];
const BLANK = 225;

export const digitHands = (d: number): readonly (readonly number[])[] => {
  const segs = SEG7[d] ?? SEG7[0];
  return JOIN.map((js) => {
    const on = js.filter(([seg]) => segs.includes(seg)).map(([, deg]) => deg);
    return on.length === 0 ? [BLANK, BLANK] : on.length === 1 ? [on[0] ?? 0, on[0] ?? 0] : on;
  });
};
const BLANK_DIGIT = JOIN.map(() => [BLANK, BLANK] as const);

// The four digits' hands; a leading zero stays blank, so one hour reads "1:00", never "01:00".
export const clockHands = (four: readonly number[]): readonly (readonly (readonly number[])[])[] =>
  four.map((d, i) => (i === 0 && d === 0 ? BLANK_DIGIT : digitHands(d)));

// Cells of 33 on a 34 step: four digits and the colon span x 27–333, inside the card at 10–350.
const CELL = 33;
const STEP = 34;
const HAND = 15;
const TOP = 82;
const BASE_X = [27, 102, 191, 266];
const GROUND = {
  light: 'linear-gradient(180deg, #FFFFFF, #F1F1F7)',
  dark: 'linear-gradient(180deg, #14161D, #0A0B10)',
  oled: '#000000',
};
const MINI = {
  light: 'radial-gradient(circle at 50% 30%, #FFFFFF, #E9E9F1)',
  dark: 'radial-gradient(circle at 50% 30%, #1F222C, #101218)',
  oled: '#05070C',
};

const handStyle = (deg: number, color: string, opacity: number): CSSProperties => ({
  position: 'absolute',
  left: CELL / 2 - 2.5,
  top: CELL / 2 - HAND,
  width: 5,
  height: HAND,
  borderRadius: 3,
  background: color,
  opacity,
  transformOrigin: '50% 100%',
  transform: `rotate(${deg}deg)`,
  transition: 'transform .9s cubic-bezier(.65,0,.25,1)',
});

// Twenty-four tiny clocks whose hands swing into place to spell the time left.
export default function Clocks({ m }: IDrawProps) {
  const { t, mc1 } = m;
  const heatBar = m.heat(m.frac);
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
        className={PLATE}
        style={{
          position: 'absolute',
          left: 10,
          top: 36,
          width: 340,
          height: 240,
          borderRadius: 26,
          background: GROUND[m.theme],
          boxShadow: CARD_SHADOW[m.theme],
        }}
      />
      <Kicker m={m} style={{ position: 'absolute', left: 0, top: 52, width: 360, textAlign: 'center' }} />
      {clockHands(m.four).map((digit, di) =>
        digit.map((hands, ci) => {
          const blank = hands.every((deg) => deg === BLANK);
          const hc = blank ? t.ink2 : di < 2 ? t.ink : mc1;
          const op = blank ? 0.16 : 1;
          return (
            <div
              key={`${di}-${ci}`}
              style={{
                position: 'absolute',
                left: (BASE_X[di] ?? 0) + (ci % 2) * STEP,
                top: TOP + Math.floor(ci / 2) * STEP,
                width: CELL,
                height: CELL,
                borderRadius: '50%',
                background: MINI[m.theme],
                boxShadow: `inset 0 1px 0 ${WHITE(0.06)}, 0 0 0 1px ${t.line}`,
              }}
            >
              <span style={handStyle(hands[0] ?? BLANK, hc, op)} />
              <span style={handStyle(hands[1] ?? BLANK, hc, op)} />
              <span
                style={{
                  ...handStyle(hands[2] ?? BLANK, hc, op),
                  display: hands[2] === undefined ? 'none' : undefined,
                }}
              />
              <span
                style={{
                  position: 'absolute',
                  left: CELL / 2 - 4,
                  top: CELL / 2 - 4,
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
      <span className="afx-blink" style={colon(TOP + STEP + CELL / 2 - STEP / 2 - 4)} />
      <span className="afx-blink" style={colon(TOP + 2 * STEP + CELL / 2 - STEP / 2 - 4)} />
      <div
        style={{
          position: 'absolute',
          left: 40,
          top: 206,
          width: 280,
          height: 4,
          borderRadius: 2,
          background: t.track,
          overflow: 'hidden',
        }}
      >
        <div className="af-tr" style={{ height: 4, width: m.fracPct, borderRadius: 2, background: heatBar }} />
      </div>
      <EndLine m={m} px={14} style={{ position: 'absolute', left: 20, top: 222, width: 320, textAlign: 'center' }} />
    </>
  );
}
