import { SERIF } from '../fonts';
import { type IDrawProps, Kicker } from '../kit';
import type { TFaceModel, TFaceState } from '../model';

const ONES = [
  'zero',
  'one',
  'two',
  'three',
  'four',
  'five',
  'six',
  'seven',
  'eight',
  'nine',
  'ten',
  'eleven',
  'twelve',
  'thirteen',
  'fourteen',
  'fifteen',
  'sixteen',
  'seventeen',
  'eighteen',
  'nineteen',
];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty'];

export const num = (n: number): string =>
  n < 20 ? (ONES[n] ?? '') : `${TENS[Math.floor(n / 10)] ?? ''}${n % 10 ? `-${ONES[n % 10] ?? ''}` : ''}`;
const hourWord = (x: number): string => ONES[x % 12 || 12] ?? '';
const cap = (x: string): string => x.charAt(0).toUpperCase() + x.slice(1);

// The face's sentence in three parts: the lamp-coloured lead, the rest of the line and the italic second line.
export function sentence(m: TFaceModel): readonly [string, string, string] {
  const { eh, em, h } = m;
  const endW =
    em === 0
      ? `${hourWord(eh)} o'clock`
      : em === 15
        ? `quarter past ${hourWord(eh)}`
        : em === 30
          ? `half past ${hourWord(eh)}`
          : em === 45
            ? `quarter to ${hourWord(eh + 1)}`
            : em < 30
              ? `${num(em)} past ${hourWord(eh)}`
              : `${num(60 - em)} to ${hourWord(eh + 1)}`;
  const remW =
    h > 0
      ? `${num(h)} hour${h > 1 ? 's' : ''}${m.m ? ` ${num(m.m)} min` : ''}`
      : m.m > 0
        ? `${num(m.m)} minute${m.m > 1 ? 's' : ''}`
        : 'less than a minute';
  const tm = Math.round(m.total / 60);
  const W: Record<TFaceState, readonly [string, string, string]> = {
    running: [cap(remW), 'left,', `until ${endW}.`],
    fallback: [cap(remW), 'left,', `until ${endW} — via the video fallback.`],
    starting: ['Asking', 'the browser to keep the screen on…', ''],
    paused: ['Paused', `with ${remW} left.`, 'Come back to this tab to continue.'],
    blocked: ['Not awake.', 'The browser refused the lock.', 'The fix is one tap away.'],
    unsupported: ['Not awake yet.', 'This browser has no wake lock.', 'Tap to use the video fallback.'],
    up: ["Time's up.", '', `Ended at ${endW}.`],
    idle: [
      `${cap(tm >= 60 ? `${num(Math.floor(tm / 60))} hour${tm >= 120 ? 's' : ''}` : `${num(tm)} minutes`)},`,
      "whenever you're ready.",
      `It would end at ${endW}.`,
    ],
  };
  return W[m.st];
}

// Time in a sentence, with a blinking cursor and a hairline of time left.
export default function Words({ m }: IDrawProps) {
  const { t, accent } = m;
  const [a, b, c] = sentence(m);
  return (
    <div
      style={{
        position: 'absolute',
        left: 34,
        right: 34,
        top: 0,
        height: 310,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: 18,
      }}
    >
      <Kicker m={m} />
      <p
        style={{
          margin: 0,
          fontFamily: SERIF,
          fontWeight: 300,
          fontSize: 38,
          lineHeight: 1.12,
          letterSpacing: '-0.01em',
          textWrap: 'balance',
        }}
      >
        <span style={{ color: accent }}>{a}</span> {b}
        <span
          className="afx-blink"
          style={{
            display: 'inline-block',
            width: 3,
            height: 30,
            marginLeft: 6,
            verticalAlign: -3,
            background: accent,
            opacity: m.liveOp,
          }}
        />
      </p>
      <p
        style={{
          margin: 0,
          fontFamily: SERIF,
          fontStyle: 'italic',
          fontWeight: 300,
          fontSize: 20,
          lineHeight: 1.3,
          color: t.ink2,
        }}
      >
        {c}
      </p>
      <div style={{ position: 'relative', height: 2, borderRadius: 1, background: t.track }}>
        <div
          className="af-tr"
          style={{ position: 'absolute', left: 0, top: 0, height: 2, width: m.fracPct, background: accent }}
        />
      </div>
    </div>
  );
}
