import type { CSSProperties } from 'react';
import { SERIF } from '../fonts';
import { D, type IDrawProps, L, mono } from '../kit';
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
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

// Sessions run up to a week, so hours reach three figures.
export const num = (n: number): string =>
  n >= 100
    ? `${ONES[Math.floor(n / 100)] ?? ''} hundred${n % 100 ? ` ${num(n % 100)}` : ''}`
    : n < 20
      ? (ONES[n] ?? '')
      : `${TENS[Math.floor(n / 10)] ?? ''}${n % 10 ? `-${ONES[n % 10] ?? ''}` : ''}`;
const hourWord = (x: number): string => ONES[x % 12 || 12] ?? '';
const QUARTERS = ['25%', '50%', '75%'] as const;
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
  const th = Math.floor(tm / 60);
  const tmW =
    th > 0
      ? `${num(th)} hour${th > 1 ? 's' : ''}${tm % 60 ? ` ${num(tm % 60)} min` : ''}`
      : `${num(tm)} minute${tm === 1 ? '' : 's'}`;
  // A tab that came back without its lock is not awake and waits for a tap; only the person's own pause says paused.
  const needs = [
    'Not awake,',
    `with ${remW} left.`,
    'The lock let go while this tab was hidden. Tap to resume.',
  ] as const;
  const W: Record<TFaceState, readonly [string, string, string]> = {
    running: [cap(remW), 'left,', `until ${endW}.`],
    fallback: [cap(remW), 'left,', `until ${endW} — via the video fallback.`],
    starting: ['Asking', 'the browser to keep the screen on…', ''],
    paused: ['Paused', `with ${remW} left.`, 'Resume when you are ready.'],
    blocked: ['Not awake.', 'The browser refused the lock.', 'The fix is one tap away.'],
    unsupported: ['Not awake yet.', 'This browser has no wake lock.', 'Tap to use the video fallback.'],
    up: ["Time's up.", '', `Ended at ${endW}.`],
    idle: [`${cap(tmW)},`, "whenever you're ready.", `It would end at ${endW}.`],
  };
  // With no end the clock counts time awake, so nothing is "left" and there is no end time to name.
  const open: Partial<Record<TFaceState, readonly [string, string, string]>> = {
    running: ['Awake for', `${remW},`, 'until you stop it.'],
    fallback: ['Awake for', `${remW},`, 'until you stop it — via the video fallback.'],
    paused: ['Paused', `after ${remW} awake.`, 'Resume when you are ready.'],
    idle: ['No end,', "whenever you're ready.", 'It stays on until you stop it.'],
  };
  if (m.needs) return m.indef ? [needs[0], `after ${remW} awake.`, needs[2]] : needs;
  return (m.indef && open[m.st]) || W[m.st];
}

// Time in a sentence, with a blinking cursor and a hairline from the start to the end, lit from now on.
export default function Words({ m }: IDrawProps) {
  const { t, accent } = m;
  const [a, b, c] = sentence(m);
  // Plex Serif Light averages about 0.46 em a character: longer sentences step down so they stay in three lines.
  const n = a.length + b.length + 1;
  const fs = n <= 24 ? 42 : n <= 32 ? 38 : n <= 46 ? 32 : 28;
  // Display sizes of a text face want tighter tracking.
  const track = `${(-(fs - 20) / 1000).toFixed(3)}em`;
  const now = `${((1 - m.frac) * 100).toFixed(2)}%`;
  const dot: CSSProperties = {
    position: 'absolute',
    top: -3,
    left: now,
    width: 8,
    height: 8,
    marginLeft: -4,
    borderRadius: '50%',
    background: accent,
  };
  const stamp = { ...mono(12, '.04em', t.ink2), lineHeight: 1, fontVariantNumeric: 'tabular-nums' as const };
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
      }}
    >
      <p
        style={{
          margin: 0,
          fontFamily: SERIF,
          fontWeight: 300,
          fontSize: fs,
          lineHeight: 1.1,
          letterSpacing: track,
          textWrap: 'balance',
        }}
      >
        <span style={{ color: accent }}>{a}</span> {b}
        <span
          className="afx-blink"
          style={{
            display: 'inline-block',
            width: 2,
            height: Math.round(fs * 0.8),
            marginLeft: 6,
            verticalAlign: -Math.round(fs * 0.1),
            borderRadius: 1,
            background: accent,
            opacity: m.liveOp,
          }}
        />
      </p>
      {c && (
        <p
          style={{
            margin: '12px 0 0',
            fontFamily: SERIF,
            fontStyle: 'italic',
            fontWeight: 300,
            fontSize: 20,
            lineHeight: 1.3,
            letterSpacing: '-0.004em',
            color: t.ink2,
            textWrap: 'pretty',
          }}
        >
          {c}
        </p>
      )}
      <div style={{ position: 'relative', marginTop: 26, height: 2, borderRadius: 1, background: t.track }}>
        {!m.indef && (
          <>
            {QUARTERS.map((q) => (
              <span
                key={q}
                className={D}
                style={{ position: 'absolute', left: q, top: 4, width: 1, height: 4, background: t.line }}
              />
            ))}
            <div
              className="af-tr"
              style={{ position: 'absolute', right: 0, top: 0, height: 2, width: m.fracPct, background: accent }}
            />
            <span className="af-tr" style={dot} />
            <span className="afx-pulse-d" style={{ ...dot, opacity: m.haloOp }} />
          </>
        )}
      </div>
      {!m.indef && (
        <div className={L} style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
          <span style={stamp}>{m.startShort}</span>
          <span style={{ ...stamp, color: t.ink }}>{m.endShort}</span>
        </div>
      )}
    </div>
  );
}
