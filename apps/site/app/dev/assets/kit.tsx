'use client';

import type { ComponentProps, CSSProperties, ReactNode } from 'react';
import { Mark } from '@/components/brand/mark';
import { Face } from '@/components/face';
import { VibeScene } from '@/components/tool/vibe-scene';
import type { TVibe } from '@/lib/tool/settings';

export type TTone = 'dark' | 'light';
type TVars = CSSProperties & Record<`--${string}`, string>;

const TOKENS = {
  dark: {
    bg: '#05060a',
    ink: '#f2f4fa',
    lamp: '#3df58e',
    mute: '#a6afc2',
    grad: '#54f3a3, #7f8cce 60%, #8379d4',
    grid: 'rgba(255,255,255,.022)',
    glowA: '#0e2d1f',
    glowB: '#241c4b',
  },
  light: {
    bg: '#f4f4f9',
    ink: '#0b1020',
    lamp: '#117a3b',
    mute: '#4b5165',
    grad: '#10824c, #5f67ce 60%, #6f5be3',
    grid: 'rgba(11,16,32,.045)',
    glowA: '#dbebe6',
    glowB: '#e2dcf8',
  },
} as const;

export const VIOLET = '#6633f5';
export const VIOLET_FILL = 'linear-gradient(180deg, #a98cff, #8f6dff)';
export const VIOLET_INK = '#120b2e';

// The CSS variables every text helper reads, set once on the frame root.
export const toneVars = (tone: TTone): TVars => {
  const t = TOKENS[tone];
  return {
    '--a-bg': t.bg,
    '--a-ink': t.ink,
    '--a-lamp': t.lamp,
    '--a-mute': t.mute,
    '--a-grad': t.grad,
    background: t.bg,
    color: t.ink,
  };
};

// The session every face shows: 38:12 left at 11:03:48 AM, ending at 11:42 AM; a ready face shows the full hour.
const RUN = { state: 'running', remain: 2292, total: 3600, nowSec: 39_828, motion: 'off' } as const;
export const READY = { state: 'idle', remain: 3600, total: 3600, nowSec: 39_828, motion: 'off' } as const;

// Ring-style faces draw a 292 px dial plate on the 360 artboard; card faces a 332 px card. Both centre on (180, 155).
export const dial = (d: number) => Math.round((d * 360) / 292);
export const cardOf = (w: number) => Math.round((w * 360) / 332);

export function FaceAt({
  cx,
  cy,
  size,
  ...face
}: ComponentProps<typeof Face> & { cx: number; cy: number; size: number }) {
  return (
    <div style={{ position: 'absolute', left: cx - size / 2, top: cy - (size * 155) / 360 }}>
      <Face bare {...RUN} {...face} size={size} />
    </div>
  );
}

export function Backdrop({ tone, hairline = tone === 'dark' }: { tone: TTone; hairline?: boolean }) {
  const t = TOKENS[tone];
  return (
    <div aria-hidden="true" style={{ position: 'absolute', inset: 0 }}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: [
            `linear-gradient(90deg, ${t.grid} 1px, transparent 1px) 0 0 / 56px 56px`,
            `linear-gradient(180deg, ${t.grid} 1px, transparent 1px) 0 0 / 56px 56px`,
            `radial-gradient(ellipse 40% 50% at 0% 0%, ${t.glowA}, transparent)`,
            `radial-gradient(ellipse 32% 34% at 100% 100%, ${t.glowB}, transparent)`,
            t.bg,
          ].join(', '),
        }}
      />
      {hairline ? (
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            right: 0,
            height: 1,
            background: 'linear-gradient(90deg, #175535, #248752 25%, #2b7f78 40%, #55608e 60%, #4b3c79 75%, #1c172e)',
          }}
        />
      ) : null}
    </div>
  );
}

interface ITextProps {
  x?: number;
  y: number;
  center?: boolean;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}

// One line of text placed by the centre of its line box, as the inventory measures it.
export function Text({ x = 0, y, center = false, className, style, children }: ITextProps) {
  return (
    <div
      className={className}
      style={{
        position: 'absolute',
        top: y,
        transform: 'translateY(-50%)',
        lineHeight: 1.15,
        whiteSpace: 'nowrap',
        ...(center ? { left: 0, right: 0, textAlign: 'center' } : { left: x }),
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function Eyebrow({
  size,
  track = '.18em',
  ...p
}: Omit<ITextProps, 'className'> & { size: number; track?: string }) {
  return (
    <Text
      {...p}
      className="font-mono uppercase"
      style={{
        fontSize: size,
        fontWeight: 500,
        letterSpacing: track,
        color: 'var(--a-lamp)',
        ...(p.center ? { paddingLeft: track } : {}),
        ...p.style,
      }}
    />
  );
}

export function Headline({ size, ...p }: Omit<ITextProps, 'className'> & { size: number }) {
  return (
    <Text
      {...p}
      className="font-display"
      style={{ fontSize: size, fontWeight: 800, letterSpacing: '-0.04em', color: 'var(--a-ink)', ...p.style }}
    />
  );
}

export function Accent({ children }: { children: ReactNode }) {
  return (
    <span
      className="font-accent italic"
      style={{
        display: 'inline-block',
        fontWeight: 400,
        fontSize: '1.08em',
        letterSpacing: '-0.01em',
        paddingRight: '.06em',
        backgroundImage: 'linear-gradient(90deg, var(--a-grad))',
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
        color: 'transparent',
      }}
    >
      {children}
    </span>
  );
}

export function Domain({ size }: { size: number }) {
  return (
    <span className="font-mono" style={{ fontSize: size }}>
      awaketab.com
    </span>
  );
}

function Footer({ x, y, children }: { x: number; y: number; children: ReactNode }) {
  return (
    <Text x={x} y={y} className="font-sans" style={{ fontSize: 19, color: 'var(--a-mute)' }}>
      {children}
      <span style={{ margin: '0 12px' }}>•</span>
      <Domain size={16} />
    </Text>
  );
}

export function Logo({
  tone,
  x = 0,
  y,
  size,
  center = false,
}: {
  tone: TTone;
  x?: number;
  y: number;
  size: number;
  center?: boolean;
}) {
  return (
    <div
      style={{
        position: 'absolute',
        top: y,
        transform: 'translateY(-50%)',
        display: 'flex',
        ...(center ? { left: 0, right: 0, justifyContent: 'center' } : { left: x }),
      }}
    >
      <Mark lockup="horizontal" tone={tone} size={size} />
    </div>
  );
}

// The OG split: logo, eyebrow, a two-line headline and the footer on the left; the art is the caller's.
export function OgText({
  tone,
  eyebrow,
  line1,
  line2,
  footer,
}: {
  tone: TTone;
  eyebrow: string;
  line1: ReactNode;
  line2: ReactNode;
  footer: string;
}) {
  return (
    <>
      <Backdrop tone={tone} />
      <Logo tone={tone} x={76} y={80} size={32} />
      <Eyebrow x={72} y={180} size={15}>
        {eyebrow}
      </Eyebrow>
      <Headline x={72} y={242} size={68}>
        {line1}
      </Headline>
      <Headline x={72} y={310} size={68}>
        {line2}
      </Headline>
      <Footer x={72} y={558}>
        {footer}
      </Footer>
    </>
  );
}

// The centred header of the Product Hunt and Chrome Web Store templates.
export function CentredHeader({
  tone,
  eyebrow,
  eyebrowY,
  headline,
  headlineY,
  size = 52,
}: {
  tone: TTone;
  eyebrow: string;
  eyebrowY: number;
  headline: ReactNode;
  headlineY: number;
  size?: number;
}) {
  return (
    <>
      <Backdrop tone={tone} />
      <Eyebrow center y={eyebrowY} size={14} track=".25em">
        {eyebrow}
      </Eyebrow>
      <Headline center y={headlineY} size={size}>
        {headline}
      </Headline>
    </>
  );
}

interface IBrowserProps {
  x: number;
  y: number;
  w: number;
  tone: TTone;
  url?: string;
  urlW?: number;
  children: ReactNode;
}

// The browser window the tool screenshots sit in; the content area keeps the tool's 1440 × 900 shape.
export function BrowserFrame({ x, y, w, tone, url = 'awaketab.com', urlW = 114, children }: IBrowserProps) {
  const dark = tone === 'dark';
  const cw = w - 2;
  const ch = Math.round(cw / 1.6);
  const line = dark ? 'rgba(255,255,255,.09)' : '#d4d4db';
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: w,
        height: ch + 42,
        boxSizing: 'border-box',
        borderRadius: 22,
        border: `1px solid ${line}`,
        background: dark ? '#12141c' : '#ffffff',
        boxShadow: dark
          ? '0 40px 90px -24px rgba(0,0,0,.75), 0 12px 30px -12px rgba(0,0,0,.5)'
          : '0 40px 90px -30px rgba(40,44,90,.3), 0 10px 28px -14px rgba(40,44,90,.18)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'relative',
          height: 40,
          boxSizing: 'border-box',
          borderBottom: `1px solid ${line}`,
        }}
      >
        {[22, 40, 58].map((cx) => (
          <span
            key={cx}
            style={{
              position: 'absolute',
              left: cx - 5,
              top: 14,
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: dark ? 'rgba(255,255,255,.2)' : '#d4d4db',
            }}
          />
        ))}
        <span
          className="font-mono"
          style={{
            position: 'absolute',
            left: '50%',
            top: 7,
            width: urlW,
            height: 24,
            transform: 'translateX(-50%)',
            borderRadius: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 13,
            background: dark ? 'rgba(255,255,255,.06)' : '#f0f0f5',
            color: dark ? '#a6afc2' : '#4b5165',
          }}
        >
          {url}
        </span>
      </div>
      <div
        style={{
          position: 'relative',
          width: cw,
          height: ch,
          overflow: 'hidden',
          borderRadius: '0 0 21px 21px',
        }}
      >
        {children}
      </div>
    </div>
  );
}

// The live tool, drawn at 1440 × 900 and scaled to the frame's content width; the coordinator sets its state.
export function ToolShot({ w }: { w: number }) {
  const cw = w - 2;
  return (
    <iframe
      data-tool
      src="/dev/tool?frame=1"
      title="AwakeTab"
      width={1440}
      height={900}
      style={{
        display: 'block',
        width: 1440,
        height: 900,
        border: 0,
        transform: `scale(${cw / 1440})`,
        transformOrigin: '0 0',
      }}
    />
  );
}

interface IVibeTileProps {
  vibe: TVibe;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  r: number;
  fs: number;
  inset: number;
  border?: string;
  children?: ReactNode;
}

export function VibeTile({ vibe, label, x, y, w, h, r, fs, inset, border, children }: IVibeTileProps) {
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: w,
        height: h,
        borderRadius: r,
        overflow: 'hidden',
        isolation: 'isolate',
        boxShadow: '0 24px 48px -20px rgba(0,0,0,.7)',
      }}
    >
      <VibeScene vibe={vibe} night motion="still" still />
      {children}
      <span
        className="font-sans"
        style={{
          position: 'absolute',
          left: inset,
          bottom: inset,
          fontSize: fs,
          fontWeight: 700,
          lineHeight: 1,
          color: '#ffffff',
        }}
      >
        {label}
      </span>
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: r,
          border: `1px solid ${border ?? 'rgba(255,255,255,.1)'}`,
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}
