'use client';

import type { TFaceId } from '@/components/face';
import type { TVibe } from '@/lib/tool/settings';
import { Accent, cardOf, dial, FaceAt, OgText, READY, type TTone, VibeTile } from './kit';

function RingOg({ tone }: { tone: TTone }) {
  return (
    <>
      <OgText
        tone={tone}
        eyebrow="The screen-awake clock"
        line1="Keep this"
        line2={
          <>
            screen <Accent>awake.</Accent>
          </>
        }
        footer="Free · no install · no account"
      />
      <FaceAt face="ring" theme={tone} cx={910} cy={310} size={dial(376)} />
    </>
  );
}

export const Og01 = () => <RingOg tone="dark" />;
export const Og02 = () => <RingOg tone="light" />;

const OG03: readonly (readonly TFaceId[])[] = [
  ['aurora', 'flip', 'liquid'],
  ['chrono', 'eclipse', 'neon'],
  ['halo', 'glass', 'moon'],
];

export function Og03() {
  const xs = [737, 902, 1069];
  const ys = [134, 300, 466];
  return (
    <>
      <OgText
        tone="dark"
        eyebrow="46 faces · all free"
        line1="Forty-six clocks."
        line2={<Accent>Zero paywalls.</Accent>}
        footer="Analog, digital, ambient"
      />
      {OG03.map((row, r) =>
        row.map((id, c) => (
          <FaceAt key={id} face={id} theme="dark" cx={xs[c] ?? 0} cy={ys[r] ?? 0} size={cardOf(138)} />
        )),
      )}
    </>
  );
}

const DEVICES: readonly { face: TFaceId; title: string; sub: string; on: boolean }[] = [
  { face: 'ring', title: 'This laptop', sub: 'Awake until 11:42 AM', on: true },
  { face: 'halo', title: 'Kitchen iPad', sub: '38 min left', on: true },
  { face: 'bold', title: 'Living-room TV', sub: 'Asleep · last used yesterday', on: false },
];

export function Og04() {
  return (
    <>
      <OgText
        tone="dark"
        eyebrow="AwakeTab Pro · optional"
        line1="One setup."
        line2={<Accent>Every screen.</Accent>}
        footer="Keeping awake stays free"
      />
      {DEVICES.map((d, i) => (
        <div
          key={d.title}
          style={{
            position: 'absolute',
            left: 720,
            top: [110, 228, 346][i],
            width: 420,
            height: 104,
            boxSizing: 'border-box',
            borderRadius: 18,
            background: '#0e1016',
            border: '1px solid rgba(255,255,255,.1)',
            boxShadow: '0 18px 40px -18px rgba(0,0,0,.7)',
          }}
        >
          <FaceAt face={d.face} theme="dark" cx={55} cy={51} size={64} />
          <div style={{ position: 'absolute', left: 108, top: 30, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <strong className="font-sans" style={{ fontSize: 18, fontWeight: 700, lineHeight: 1.1, color: '#f2f4fa' }}>
              {d.title}
            </strong>
            <span className="font-sans" style={{ fontSize: 15, lineHeight: 1.2, color: '#a6afc2' }}>
              {d.sub}
            </span>
          </div>
          <span
            className="font-sans"
            style={{
              position: 'absolute',
              right: 20,
              top: 34,
              width: 64,
              height: 36,
              boxSizing: 'border-box',
              borderRadius: 999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 7,
              fontSize: 14,
              fontWeight: 600,
              color: d.on ? '#3df58e' : '#a6afc2',
              border: `1px solid ${d.on ? '#3df58e' : 'rgba(166,175,194,.4)'}`,
              background: d.on ? 'rgba(61,245,142,.1)' : 'transparent',
            }}
          >
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'currentColor' }} />
            {d.on ? 'On' : 'Off'}
          </span>
        </div>
      ))}
    </>
  );
}

export function Og07() {
  return (
    <>
      <OgText
        tone="dark"
        eyebrow="A shared setup"
        line1="Someone sent"
        line2={
          <>
            you <Accent>a ready clock.</Accent>
          </>
        }
        footer="Opens ready to start. Nothing personal inside."
      />
      <FaceAt face="flip" theme="dark" {...READY} total={2700} remain={2700} cx={930} cy={302} size={400} />
    </>
  );
}

const OG08: readonly { vibe: TVibe; label: string }[] = [
  { vibe: 'aurora', label: 'Aurora' },
  { vibe: 'night', label: 'Night sky' },
  { vibe: 'rain', label: 'Rain on glass' },
  { vibe: 'sunset', label: 'Sunset' },
  { vibe: 'lava', label: 'Lava lamp' },
  { vibe: 'calm', label: 'Calm' },
];

export function Og08() {
  return (
    <>
      <OgText
        tone="dark"
        eyebrow="New · vibes"
        line1={
          <>
            Set the mood. <Accent>Six</Accent>
          </>
        }
        line2={<Accent>living backgrounds.</Accent>}
        footer="Aurora, night sky, rain, sunset, lava, calm"
      />
      {OG08.map((v, i) => (
        <VibeTile
          key={v.vibe}
          vibe={v.vibe}
          label={v.label}
          x={[667, 832, 995][i % 3] ?? 0}
          y={i < 3 ? 80 : 325}
          w={148}
          h={228}
          r={18}
          fs={15}
          inset={12}
        />
      ))}
    </>
  );
}
