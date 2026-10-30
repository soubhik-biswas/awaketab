import { BLACK } from '../art';
import { SERIF } from '../fonts';
import { DialLabel, type IDrawProps, L, MONO, lmin } from '../kit';
import { AnalogDial } from './analog-dial';

const NUMERALS = [
  ['12', 0],
  ['3', 90],
  ['9', 270],
] as const;

// A deeper dial with serif numerals, a minute track, a lamp sector and a small digital window.
export default function Luxe({ m }: IDrawProps) {
  const { t, accent } = m;
  return (
    <AnalogDial m={m} luxe>
      {NUMERALS.map(([n, deg]) => (
        <DialLabel
          key={n}
          m={m}
          text={n}
          rr={110}
          deg={deg}
          fs={26}
          color={t.ink}
          extra={{ fontFamily: SERIF, fontWeight: 300 }}
        />
      ))}
      <div
        className={L}
        style={{
          position: 'absolute',
          left: 136,
          top: 206,
          width: 88,
          height: 30,
          borderRadius: 6,
          background: t.panel,
          border: `1px solid ${t.line}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          fontFamily: MONO,
          fontSize: lmin(13),
          fontVariantNumeric: 'tabular-nums',
          boxShadow: `inset 0 1px 3px ${BLACK(0.25)}`,
        }}
      >
        <span style={{ color: accent }}>●</span>
        {m.digits}
      </div>
    </AnalogDial>
  );
}
