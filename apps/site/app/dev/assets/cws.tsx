'use client';

import type { ReactNode } from 'react';
import { ArrowUpRight, Pause } from 'lucide-react';
import { Mark } from '@/components/brand/mark';
import { StatusPill, type TStatusState } from '@/components/product/status-pill';
import type { TFaceState } from '@/components/face';
import {
  Accent,
  Backdrop,
  BrowserFrame,
  CentredHeader,
  dial,
  FaceAt,
  Headline,
  Text,
  ToolShot,
  VIOLET_FILL,
  VIOLET_INK,
} from './kit';

const CWS_FRAME = { x: 179, y: 150, w: 922 } as const;
// The frame's content area starts inside the 1 px border, under the 40 px title bar.
const OX = CWS_FRAME.x + 1;
const OY = CWS_FRAME.y + 41;

function ToolCws({ tone, eyebrow, headline }: { tone: 'dark' | 'light'; eyebrow: string; headline: ReactNode }) {
  return (
    <>
      <CentredHeader tone={tone} eyebrow={eyebrow} eyebrowY={48} headline={headline} headlineY={97} />
      <BrowserFrame tone={tone} {...CWS_FRAME}>
        <ToolShot w={CWS_FRAME.w} />
      </BrowserFrame>
    </>
  );
}

export const Cws01 = () => (
  <ToolCws
    tone="dark"
    eyebrow="Free · no install · no account"
    headline={
      <>
        Keep this screen <Accent>awake.</Accent>
      </>
    }
  />
);

export const Cws02 = () => (
  <ToolCws
    tone="light"
    eyebrow="Glance mode"
    headline={
      <>
        Readable from <Accent>across the room.</Accent>
      </>
    }
  />
);

export const Cws03 = () => (
  <ToolCws
    tone="dark"
    eyebrow="46 faces · all free"
    headline={
      <>
        Pick a clock that <Accent>feels like yours.</Accent>
      </>
    }
  />
);

const RECIPE = ['Fold in the butter,', 'then rest the', 'dough for 20', 'minutes.'];
const RECIPE_Y = [300, 345, 391, 437];
const BARS = [
  [695, 482],
  [635, 508],
  [666, 534],
] as const;

function Popup() {
  const line = '1px solid rgba(255,255,255,.08)';
  return (
    <div
      style={{
        position: 'absolute',
        left: 750,
        top: 201,
        width: 333,
        height: 449,
        borderRadius: 22,
        overflow: 'hidden',
        background: '#21242c',
        border: '1px solid rgba(255,255,255,.08)',
        boxSizing: 'border-box',
        boxShadow: '0 40px 80px -24px rgba(11,16,32,.55), 0 14px 30px -12px rgba(11,16,32,.35)',
        color: '#f2f4fa',
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          right: 0,
          height: 56,
          background: '#303139',
          borderBottom: line,
        }}
      >
        <div style={{ position: 'absolute', left: 15, top: 28, transform: 'translateY(-50%)', display: 'flex' }}>
          <Mark lockup="horizontal" tone="dark" size={22} />
        </div>
        <span
          className="font-sans"
          style={{
            position: 'absolute',
            right: 15,
            top: 15,
            height: 27,
            padding: '0 10px',
            boxSizing: 'border-box',
            borderRadius: 999,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 12,
            fontWeight: 600,
            color: '#3df58e',
            border: '1px solid #3df58e',
            background: 'rgba(61,245,142,.1)',
          }}
        >
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'currentColor' }} />
          38 min left
        </span>
      </div>
      <FaceAt face="ring" theme="dark" cx={916 - 751} cy={361 - 202} size={dial(172)} />
      <div
        className="font-sans"
        style={{
          position: 'absolute',
          left: 14,
          top: 289,
          width: 302,
          height: 44,
          boxSizing: 'border-box',
          padding: 4,
          borderRadius: 999,
          background: 'rgba(255,255,255,.05)',
          border: line,
          display: 'flex',
          gap: 4,
        }}
      >
        {['15m', '30m', '1h', '∞'].map((s) => (
          <span
            key={s}
            style={{
              flex: 1,
              borderRadius: 999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 14,
              fontWeight: s === '1h' ? 700 : 500,
              color: s === '1h' ? '#f2f4fa' : '#a6afc2',
              background: s === '1h' ? 'rgba(255,255,255,.14)' : 'transparent',
            }}
          >
            {s}
          </span>
        ))}
      </div>
      <div
        className="font-sans"
        style={{
          position: 'absolute',
          left: 14,
          top: 347,
          width: 302,
          height: 47,
          borderRadius: 999,
          background: VIOLET_FILL,
          boxShadow: '0 10px 26px -8px rgba(154,119,255,.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          fontSize: 16,
          fontWeight: 700,
          color: VIOLET_INK,
        }}
      >
        <Pause size={16} fill="currentColor" strokeWidth={0} aria-hidden="true" />
        Pause
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 409, borderTop: line }} />
      <Text x={15} y={429} className="font-sans" style={{ fontSize: 13, color: '#a6afc2' }}>
        Works in any tab
      </Text>
      <div
        className="font-sans"
        style={{
          position: 'absolute',
          right: 15,
          top: 429,
          transform: 'translateY(-50%)',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          fontSize: 13,
          fontWeight: 700,
          lineHeight: 1,
        }}
      >
        Open full app
        <ArrowUpRight size={14} strokeWidth={2.5} aria-hidden="true" />
      </div>
    </div>
  );
}

export function Cws04() {
  return (
    <>
      <CentredHeader
        tone="dark"
        eyebrow="One click from the toolbar"
        eyebrowY={48}
        headline={
          <>
            Works in any tab, <Accent>until you stop it.</Accent>
          </>
        }
        headlineY={97}
      />
      <BrowserFrame tone="light" url="recipes.example/sourdough" urlW={205} {...CWS_FRAME}>
        <div style={{ position: 'absolute', inset: 0, background: '#f2f2f8' }}>
          <Text
            x={236 - OX}
            y={255 - OY}
            className="font-mono uppercase"
            style={{ fontSize: 13, letterSpacing: '.16em', color: '#6b7083' }}
          >
            Recipe · step 4 of 9
          </Text>
          {RECIPE.map((l, i) => (
            <Text
              key={l}
              x={236 - OX}
              y={(RECIPE_Y[i] ?? 0) - OY}
              className="font-display"
              style={{
                fontSize: 40,
                fontWeight: 800,
                letterSpacing: '-0.035em',
                color: '#0b1020',
              }}
            >
              {l}
            </Text>
          ))}
          {BARS.map(([end, y]) => (
            <span
              key={y}
              style={{
                position: 'absolute',
                left: 236 - OX,
                top: y - OY - 6,
                width: end - 236,
                height: 12,
                borderRadius: 6,
                background: '#dcdce4',
              }}
            />
          ))}
        </div>
      </BrowserFrame>
      <Popup />
    </>
  );
}

const STATES: readonly {
  face: TFaceState;
  pill: TStatusState;
  label: string;
  caption: readonly [string, string];
}[] = [
  {
    face: 'running',
    pill: 'awake',
    label: 'Awake · until 11:42 AM',
    caption: ['The browser said yes. Green means', 'it is really on.'],
  },
  {
    face: 'paused',
    pill: 'paused',
    label: 'Paused · 38 min kept',
    caption: ['You stepped away. One tap to pick it', 'back up.'],
  },
  {
    face: 'blocked',
    pill: 'blocked',
    label: 'Not awake · battery saver',
    caption: ['If something blocks it, you see it in', 'words — and the fix.'],
  },
];

export function Cws05() {
  return (
    <>
      <Backdrop tone="light" />
      <Text
        center
        y={105}
        className="font-mono uppercase"
        style={{ fontSize: 14, fontWeight: 500, letterSpacing: '.25em', paddingLeft: '.25em', color: 'var(--a-lamp)' }}
      >
        It never pretends
      </Text>
      <Headline center y={158} size={52}>
        Green only when <Accent>it’s really on.</Accent>
      </Headline>
      {STATES.map((s, i) => (
        <div
          key={s.face}
          style={{
            position: 'absolute',
            left: [116, 475, 833][i],
            top: 259,
            width: 331,
            height: 392,
            boxSizing: 'border-box',
            borderRadius: 28,
            background: '#ffffff',
            border: '1px solid #d9d9e5',
            boxShadow: '0 30px 60px -30px rgba(40,44,90,.25), 0 8px 20px -12px rgba(40,44,90,.12)',
          }}
        >
          <FaceAt face="ring" theme="light" state={s.face} cx={165} cy={124} size={dial(196)} />
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: 290,
              transform: 'translateY(-50%)',
              display: 'flex',
              justifyContent: 'center',
            }}
          >
            <StatusPill state={s.pill} label={s.label} />
          </div>
          {s.caption.map((c, k) => (
            <Text key={c} center y={334 + k * 22} className="font-sans" style={{ fontSize: 15, color: '#4b5165' }}>
              {c}
            </Text>
          ))}
        </div>
      ))}
    </>
  );
}
