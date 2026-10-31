import type { TFaceState } from '@/components/face';
import { formatTime, formatUntil, secondsSinceMidnight } from '@/lib/format';
import { isAwake, isLive, remainSec, type IWakeSnapshot, type TWakeState } from '@/lib/wake';

export type TSurfaceTone = 'lamp' | 'warning' | 'info' | 'destructive' | 'ended' | 'muted';
type TSurfaceLabel =
  'awake' | 'fallback' | 'starting' | 'paused' | 'hidden' | 'needsyou' | 'blocked' | 'unsupported' | 'ended' | 'idle';

export interface ISurfaceView {
  wake: TWakeState;
  face: TFaceState;
  label: TSurfaceLabel;
  tone: TSurfaceTone;
  solid: boolean;
  live: boolean;
  awake: boolean;
  canExtend: boolean;
  remain: number;
  total: number;
  indef: boolean;
  nowSec: number;
  endsAt: number | null;
  until: string | null;
  endedAt: string | null;
}

export const EXTEND_SEC = 900;

const FACE: Record<TWakeState, TFaceState> = {
  idle: 'idle',
  starting: 'starting',
  running: 'running',
  fallback: 'fallback',
  paused: 'paused',
  needsyou: 'paused',
  blocked: 'blocked',
  unsupported: 'unsupported',
  ended: 'up',
};

const TONE: Record<TSurfaceLabel, TSurfaceTone> = {
  awake: 'lamp',
  fallback: 'lamp',
  starting: 'info',
  paused: 'warning',
  hidden: 'warning',
  needsyou: 'info',
  blocked: 'destructive',
  unsupported: 'muted',
  ended: 'ended',
  idle: 'muted',
};

type TSnap = Pick<
  IWakeSnapshot,
  'state' | 'now' | 'totalSec' | 'endsAt' | 'pausedAt' | 'pauseReason' | 'endedAt' | 'mode'
>;

function labelOf(s: TSnap, held: boolean): TSurfaceLabel {
  if (held && isLive(s.state) && s.pausedAt === null) return s.mode === 'video' ? 'fallback' : 'awake';
  switch (s.state) {
    case 'running':
      return 'awake';
    case 'fallback':
      return 'fallback';
    case 'starting':
      return 'starting';
    case 'paused':
      return s.pauseReason === 'hidden' ? 'hidden' : 'paused';
    case 'needsyou':
      return 'needsyou';
    case 'blocked':
      return 'blocked';
    case 'unsupported':
      return 'unsupported';
    case 'ended':
      return 'ended';
    default:
      return 'idle';
  }
}

// One reading of the wake engine for the mini clock and widgets. `held` is a lock the surface holds itself (the
// mini clock's own window), which keeps the screen awake while the tab behind it is hidden.
export function surfaceView(s: TSnap, opts: { held?: boolean; locale?: string; fmt?: 12 | 24 } = {}): ISurfaceView {
  const locale = opts.locale ?? 'en';
  const fmt = opts.fmt;
  const now = s.now || Date.now();
  const label = labelOf(s, opts.held === true);
  const awake = label === 'awake' || label === 'fallback';
  const live = isLive(s.state);
  const face: TFaceState = awake ? (label === 'fallback' ? 'fallback' : 'running') : FACE[s.state];
  return {
    wake: s.state,
    face,
    label,
    tone: TONE[label],
    solid: awake,
    live,
    awake: awake || isAwake(s.state),
    canExtend: live && s.endsAt !== null,
    remain: remainSec({ ...s, now }),
    total: s.totalSec,
    indef: live ? s.endsAt === null : s.totalSec === 0,
    nowSec: secondsSinceMidnight(now),
    endsAt: live ? s.endsAt : null,
    until: live && s.endsAt !== null ? formatUntil(s.endsAt, s.pausedAt ?? now, { locale, fmt }) : null,
    endedAt: s.state === 'ended' && s.endedAt !== null ? formatTime(s.endedAt, locale, fmt) : null,
  };
}

export const TONE_TEXT: Record<TSurfaceTone, string> = {
  lamp: 'text-lamp',
  warning: 'text-warning',
  info: 'text-info',
  destructive: 'text-destructive',
  ended: 'text-ended',
  muted: 'text-muted-foreground-strong',
};

export function digits(sec: number): string {
  const total = Math.max(0, Math.ceil(sec));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const p = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${p(m)}:${p(total % 60)}` : `${p(m)}:${p(total % 60)}`;
}

type TUnitT = (key: 'unit.min' | 'unit.h') => string;

// The tool's short length, "38 min" or "1 h 20 min", in the reader's language.
export function shortDuration(sec: number, t: TUnitT): string {
  const h = Math.floor(sec / 3600);
  const m = Math.round((sec % 3600) / 60);
  if (!h) return `${String(Math.max(m, sec > 0 ? 1 : 0))} ${t('unit.min')}`;
  return m ? `${String(h)} ${t('unit.h')} ${String(m)} ${t('unit.min')}` : `${String(h)} ${t('unit.h')}`;
}
