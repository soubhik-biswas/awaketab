import type { TFields } from './client';
import { token } from './shape';

// The part of the wake snapshot this file reads, so a change elsewhere in the snapshot cannot break it.
export interface IWakeView {
  state: string;
  startedAt: number | null;
  endsAt: number | null;
  pausedAt: number | null;
  totalSec: number;
  advice: string | null;
  mode: string | null;
}

export interface ILook {
  face: string;
  background: string;
}

interface ISessionMemo {
  awakeMs: number;
  seenAt: number;
  fallback: boolean;
  needsSince: number | null;
  shown: boolean;
}

interface ISessionEvent {
  event: string;
  fields: TFields;
}

export const IDLE_VIEW: IWakeView = {
  state: 'idle',
  startedAt: null,
  endsAt: null,
  pausedAt: null,
  totalSec: 0,
  advice: null,
  mode: null,
};

const LIVE = ['starting', 'running', 'fallback', 'paused', 'needsyou', 'blocked'];
// A gap longer than this between two looks is a sleeping computer, not time kept awake.
const MAX_STEP_MS = 10_000;
// The lock is asked for again by itself when the tab comes back; only a wait this long means a tap was needed.
const RESUME_WAIT_MS = 1500;
const RECENT_START_MS = 10_000;

const PRESETS: Record<number, string> = {
  0: 'pinf',
  900: 'p15',
  1800: 'p30',
  2700: 'p45',
  3600: 'p60',
  7200: 'p120',
  14400: 'p240',
};

export const isLive = (s: IWakeView): boolean => s.startedAt !== null && LIVE.includes(s.state);
const isAwake = (s: IWakeView): boolean => s.state === 'running' || s.state === 'fallback';
export const minutes = (ms: number): number => Math.round(ms / 60_000);

export const newMemo = (now: number): ISessionMemo => ({
  awakeMs: 0,
  seenAt: now,
  fallback: false,
  needsSince: null,
  shown: false,
});

function startFields(next: IWakeView, look: ILook): TFields {
  const sec = next.endsAt === null ? 0 : next.totalSec;
  return {
    planType: sec === 0 ? 'indefinite' : 'duration',
    presetId: PRESETS[sec] ?? 'custom',
    lengthMin: Math.round(sec / 60),
    face: look.face,
    background: look.background,
  };
}

function endReason(next: IWakeView): string {
  if (next.state === 'ended') return 'completed';
  if (next.state === 'idle') return 'stopped';
  return isLive(next) ? 'replaced' : 'failed';
}

function deniedReason(prev: IWakeView, next: IWakeView): string {
  if (prev.mode === 'video') return 'fallback_failed';
  return token(next.advice) || (next.state === 'unsupported' ? 'unsupported' : 'denied');
}

// Compares two snapshots of the wake store and names what happened between them.
export function step(
  memo: ISessionMemo,
  prev: IWakeView,
  next: IWakeView,
  now: number,
  visible: boolean,
  look: () => ILook,
): { memo: ISessionMemo; events: ISessionEvent[] } {
  const events: ISessionEvent[] = [];
  let m: ISessionMemo = { ...memo, seenAt: now };
  if (isAwake(prev)) m.awakeMs += Math.min(Math.max(0, now - memo.seenAt), MAX_STEP_MS);

  const wasLive = isLive(prev);
  const live = isLive(next);
  const same = wasLive && live && prev.startedAt === next.startedAt;

  if (wasLive && !same) {
    events.push({ event: 'session_end', fields: { reason: endReason(next), durationMin: minutes(m.awakeMs) } });
    m = newMemo(now);
  }
  if (live && !same) events.push({ event: 'session_start', fields: startFields(next, look()) });

  if ((next.state === 'blocked' || next.state === 'unsupported') && prev.state !== next.state) {
    events.push({ event: 'lock_denied', fields: { reason: deniedReason(prev, next) } });
  }

  if (live && next.state === 'fallback' && !m.fallback) {
    events.push({ event: 'fallback_used', fields: {} });
    m.fallback = true;
  }

  const moved = same && prev.endsAt !== null && next.endsAt !== null ? next.endsAt - prev.endsAt : 0;
  // A pause moves the end too, so only a session that is counting can be extended.
  if (moved >= 60_000 && prev.pausedAt === null && next.pausedAt === null) {
    events.push({ event: 'session_extend', fields: { addedMin: minutes(moved) } });
  }

  if (live && next.state === 'needsyou') {
    if (!visible) m.needsSince = null;
    else {
      m.needsSince ??= now;
      if (!m.shown && now - m.needsSince >= RESUME_WAIT_MS) {
        events.push({ event: 'resume_shown', fields: {} });
        m.shown = true;
      }
    }
  } else {
    if (m.shown && same && isAwake(next)) events.push({ event: 'resume_accepted', fields: {} });
    m.needsSince = null;
    m.shown = false;
  }
  return { memo: m, events };
}

// A session that began moments before the watcher did (an autostart link) still counts as started here.
export function startedJustNow(first: IWakeView, now: number): boolean {
  if (!isLive(first) || first.startedAt === null) return false;
  if (first.state === 'needsyou' || first.state === 'paused') return false;
  return now - first.startedAt < RECENT_START_MS;
}
