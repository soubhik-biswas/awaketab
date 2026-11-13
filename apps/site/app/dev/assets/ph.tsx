'use client';

import type { ReactNode } from 'react';
import { Check } from 'lucide-react';
import type { TFaceId } from '@/components/face';
import type { TVibe } from '@/lib/tool/settings';
import { Accent, BrowserFrame, cardOf, CentredHeader, FaceAt, Logo, Text, ToolShot, VibeTile, VIOLET } from './kit';

const PH_FRAME = { x: 202, y: 150, w: 866 } as const;

export function Ph01() {
  return (
    <>
      <CentredHeader
        tone="dark"
        eyebrow="Free · no install · no account"
        eyebrowY={48}
        headline={
          <>
            Keep this screen <Accent>awake.</Accent>
          </>
        }
        headlineY={97}
      />
      <Logo tone="dark" x={38} y={48} size={32} />
      <BrowserFrame tone="dark" {...PH_FRAME}>
        <ToolShot w={PH_FRAME.w} />
      </BrowserFrame>
    </>
  );
}

export function Ph02() {
  return (
    <>
      <CentredHeader
        tone="light"
        eyebrow="Glance mode"
        eyebrowY={48}
        headline={
          <>
            Touch it for three seconds. <Accent>Trust it for an hour.</Accent>
          </>
        }
        headlineY={97}
      />
      <BrowserFrame tone="light" {...PH_FRAME}>
        <ToolShot w={PH_FRAME.w} />
      </BrowserFrame>
    </>
  );
}

const PH03: readonly TFaceId[] = [
  'ring',
  'aurora',
  'liquid',
  'halo',
  'eclipse',
  'flip',
  'bold',
  'glass',
  'chrono',
  'orbit',
  'neon',
  'moon',
];

export function Ph03() {
  const xs = [135, 335, 535, 735, 935, 1135];
  return (
    <>
      <CentredHeader
        tone="dark"
        eyebrow="46 faces · all free"
        eyebrowY={98}
        headline={
          <>
            Forty-six clocks. <Accent>Zero paywalls.</Accent>
          </>
        }
        headlineY={154}
      />
      {PH03.map((id, i) => (
        <FaceAt key={id} face={id} theme="dark" cx={xs[i % 6] ?? 0} cy={i < 6 ? 336 : 542} size={cardOf(150)} />
      ))}
    </>
  );
}

const PH04: readonly { vibe: TVibe; label: string; face: TFaceId; border?: string }[] = [
  { vibe: 'aurora', label: 'Aurora', face: 'aurora' },
  { vibe: 'night', label: 'Night sky', face: 'moon' },
  { vibe: 'rain', label: 'Rain on glass', face: 'liquid' },
  { vibe: 'sunset', label: 'Sunset', face: 'halo', border: 'rgba(240,196,120,.45)' },
  { vibe: 'lava', label: 'Lava lamp', face: 'blob' },
  { vibe: 'calm', label: 'Calm', face: 'ring' },
];

export function Ph04() {
  const xs = [69, 260, 452, 644, 836, 1029];
  return (
    <>
      <CentredHeader
        tone="dark"
        eyebrow="New · vibes"
        eyebrowY={98}
        headline={
          <>
            Set the mood. <Accent>Six living backgrounds.</Accent>
          </>
        }
        headlineY={152}
      />
      {PH04.map((v, i) => (
        <VibeTile
          key={v.vibe}
          vibe={v.vibe}
          label={v.label}
          x={xs[i] ?? 0}
          y={256}
          w={175}
          h={380}
          r={22}
          fs={17}
          inset={16}
          {...(v.border ? { border: v.border } : {})}
        >
          <FaceAt face={v.face} theme="dark" cx={87.5} cy={190} size={cardOf(138)} />
        </VibeTile>
      ))}
    </>
  );
}

function Item({ y, colour, children }: { y: number; colour: string; children: ReactNode }) {
  return (
    <Text x={29} y={y} className="font-sans" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
      <span
        style={{
          width: 22,
          height: 22,
          borderRadius: '50%',
          background: colour,
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flex: 'none',
        }}
      >
        <Check size={14} strokeWidth={3} aria-hidden="true" />
      </span>
      <span style={{ fontSize: 17, color: '#3a3f52' }}>{children}</span>
    </Text>
  );
}

interface IPlanProps {
  x: number;
  y: number;
  w: number;
  h: number;
  pro?: boolean;
  eyebrow: string;
  title: readonly string[];
  items: readonly string[];
  itemsY: readonly number[];
}

function Plan({ x, y, w, h, pro = false, eyebrow, title, items, itemsY }: IPlanProps) {
  const colour = pro ? VIOLET : '#117a3b';
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: w,
        height: h,
        boxSizing: 'border-box',
        borderRadius: 28,
        background: '#ffffff',
        border: pro ? `2px solid ${VIOLET}` : '1px solid #d4d4db',
        boxShadow: pro
          ? '0 34px 70px -30px rgba(102,51,245,.35), 0 10px 24px -14px rgba(40,44,90,.16)'
          : '0 34px 70px -30px rgba(40,44,90,.28), 0 10px 24px -14px rgba(40,44,90,.14)',
      }}
    >
      <Text
        x={29}
        y={38}
        className="font-mono uppercase"
        style={{ fontSize: 14, fontWeight: 500, letterSpacing: '.18em', color: colour }}
      >
        {eyebrow}
      </Text>
      {title.map((line, i) => (
        <Text
          key={line}
          x={29}
          y={81 + i * 41}
          className="font-display"
          style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.03em', color: '#0b1020' }}
        >
          {line}
        </Text>
      ))}
      {items.map((it, i) => (
        <Item key={it} y={itemsY[i] ?? 0} colour={colour}>
          {it}
        </Item>
      ))}
    </div>
  );
}

export function Ph05() {
  return (
    <>
      <CentredHeader
        tone="light"
        eyebrow="Honest pricing"
        eyebrowY={110}
        headline={
          <>
            Keeping awake <Accent>stays free.</Accent>
          </>
        }
        headlineY={165}
        size={58}
      />
      <Plan
        x={182}
        y={267}
        w={439}
        h={319}
        eyebrow="Free · forever"
        title={['Everything on this', 'screen']}
        items={[
          'All 46 faces and all six vibes',
          'Any length, or no end at all',
          'Presets, history, face studio, sounds',
          'No account, no ads, no tracking',
        ]}
        itemsY={[168, 204, 241, 277]}
      />
      <Plan
        pro
        x={648}
        y={266}
        w={442}
        h={321}
        eyebrow="Pro · optional"
        title={['For many screens']}
        items={[
          'One setup synced to up to 5 screens',
          'Start or stop any screen from one',
          'History across devices, with export',
          'Coming later · keeping awake stays free',
        ]}
        itemsY={[128, 164, 201, 237]}
      />
    </>
  );
}
