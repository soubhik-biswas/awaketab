import type { TAdviceCode } from '@awaketab/wake';

export type TWakeState =
  'idle' | 'starting' | 'running' | 'fallback' | 'paused' | 'needsyou' | 'blocked' | 'unsupported' | 'ended';
export type TPauseReason = 'user' | 'hidden';
export type TLockMode = 'native' | 'video';

export interface ISession {
  state: TWakeState;
  now: number;
  totalSec: number;
  startedAt: number | null;
  endsAt: number | null;
  pausedAt: number | null;
  pausedMs: number;
  pauseReason: TPauseReason | null;
  endedAt: number | null;
  advice: TAdviceCode | null;
  checkedAt?: number | null;
  mode: TLockMode | null;
  supported: boolean;
  lastExtendSec: number;
}

export type TSessionEvent =
  | { type: 'start'; now: number; totalSec: number; supported: boolean }
  | { type: 'fallback'; now: number }
  | { type: 'held'; mode: TLockMode; now: number }
  | { type: 'hidden'; now: number }
  | {
      type: 'refused';
      mode: TLockMode;
      to: 'denied' | 'unsupported';
      advice: TAdviceCode | null;
      held: boolean;
      now: number;
    }
  | { type: 'pause'; now: number }
  | { type: 'resume'; now: number }
  | { type: 'stop'; now: number }
  | { type: 'extend'; sec: number; now: number }
  | { type: 'undo'; now: number }
  | { type: 'length'; sec: number; now: number }
  | { type: 'until'; endsAt: number; now: number }
  | { type: 'tick'; now: number }
  | { type: 'end'; now: number };

const MAX_SEC = 7 * 24 * 3600;

export const IDLE_SESSION: ISession = {
  state: 'idle',
  now: 0,
  totalSec: 3600,
  startedAt: null,
  endsAt: null,
  pausedAt: null,
  pausedMs: 0,
  pauseReason: null,
  endedAt: null,
  advice: null,
  checkedAt: null,
  mode: null,
  supported: true,
  lastExtendSec: 0,
};

const LIVE: readonly TWakeState[] = ['starting', 'running', 'fallback', 'paused', 'needsyou', 'blocked'];

export const isLive = (s: TWakeState): boolean => LIVE.includes(s);
export const isAwake = (s: TWakeState): boolean => s === 'running' || s === 'fallback';

function clampSec(sec: number): number {
  if (!Number.isFinite(sec) || sec <= 0) return 0;
  return Math.min(MAX_SEC, Math.round(sec));
}

// Seconds left, derived from the end timestamp so sleep, a hidden tab or a clock change never drift it.
export function remainSec(s: Pick<ISession, 'state' | 'now' | 'totalSec' | 'endsAt' | 'pausedAt'>): number {
  if (s.state === 'idle' || s.state === 'unsupported') return s.totalSec;
  if (s.state === 'ended') return 0;
  if (s.endsAt === null) return 0;
  return Math.max(0, Math.ceil((s.endsAt - (s.pausedAt ?? s.now)) / 1000));
}

export function elapsedSec(s: Pick<ISession, 'now' | 'startedAt' | 'pausedAt' | 'pausedMs'>): number {
  if (s.startedAt === null) return 0;
  return Math.max(0, Math.floor(((s.pausedAt ?? s.now) - s.startedAt - s.pausedMs) / 1000));
}

function fresh(s: ISession, now: number, sec: number): ISession {
  return {
    ...s,
    state: 'starting',
    now,
    totalSec: sec,
    startedAt: now,
    endsAt: sec > 0 ? now + sec * 1000 : null,
    pausedAt: null,
    pausedMs: 0,
    pauseReason: null,
    endedAt: null,
    advice: null,
    checkedAt: null,
    mode: null,
    lastExtendSec: 0,
  };
}

// The session machine: idle → starting → running ⇄ paused, running → ended, a refused or released lock → blocked or
// needs you, and a fix or the video fallback back to running. Side effects (asking for the lock) live in lib/wake.ts.
// Paused is only ever the person's own Pause: it freezes the clock. A hidden tab that lost the lock needs you
// instead, and its clock keeps running to the same end time.
export function reduce(s: ISession, e: TSessionEvent): ISession {
  switch (e.type) {
    case 'start': {
      if (s.state === 'starting' || isAwake(s.state)) return s;
      const next = fresh(s, e.now, clampSec(e.totalSec));
      return e.supported ? next : { ...next, state: 'unsupported', supported: false };
    }
    case 'fallback': {
      const base =
        s.state === 'unsupported' || s.state === 'idle' || s.state === 'ended' ? fresh(s, e.now, s.totalSec) : s;
      return { ...base, state: 'starting', mode: 'video', pauseReason: null, now: e.now };
    }
    case 'held': {
      if (!isLive(s.state) || s.pausedAt !== null) return s;
      return {
        ...s,
        state: e.mode === 'native' ? 'running' : 'fallback',
        mode: e.mode,
        pauseReason: null,
        advice: null,
        checkedAt: null,
      };
    }
    case 'hidden':
      return isAwake(s.state) ? { ...s, state: 'needsyou', pauseReason: 'hidden' } : s;
    case 'refused': {
      // A refusal never wins while a lock is actually held: no battery-saver warning over a working session.
      if (e.held || !isLive(s.state) || s.pausedAt !== null) return s;
      const checked = { advice: e.advice, checkedAt: e.now };
      if (s.pauseReason === 'hidden' || e.advice === 'hidden_document') return { ...s, ...checked, state: 'needsyou' };
      if (e.mode === 'native' && e.to === 'unsupported') return { ...s, ...checked, state: 'unsupported', mode: null };
      if (e.mode === 'video')
        return { ...s, ...checked, state: s.state === 'starting' ? 'unsupported' : 'needsyou', mode: null };
      return { ...s, ...checked, state: 'blocked', mode: null };
    }
    case 'pause':
      if (!isAwake(s.state) && s.state !== 'blocked' && s.state !== 'needsyou') return s;
      return { ...s, state: 'paused', pauseReason: 'user', pausedAt: e.now };
    case 'resume': {
      if (s.state !== 'paused' && s.state !== 'needsyou') return s;
      if (s.pausedAt === null) return { ...s, now: e.now, pauseReason: null };
      const gap = e.now - s.pausedAt;
      return {
        ...s,
        now: e.now,
        pauseReason: null,
        pausedMs: s.pausedMs + gap,
        endsAt: s.endsAt === null ? null : s.endsAt + gap,
        pausedAt: null,
      };
    }
    case 'stop':
      return {
        ...s,
        state: 'idle',
        now: e.now,
        startedAt: null,
        endsAt: null,
        pausedAt: null,
        pausedMs: 0,
        pauseReason: null,
        endedAt: null,
        mode: null,
        advice: null,
        checkedAt: null,
      };
    case 'extend': {
      if (e.sec <= 0) return s;
      if (s.state === 'ended' || s.state === 'idle')
        return { ...fresh(s, e.now, clampSec(e.sec)), lastExtendSec: e.sec };
      if (s.endsAt === null) return s;
      const left = remainSec(s);
      if (left + e.sec > MAX_SEC) return s;
      return {
        ...s,
        endsAt: s.endsAt + e.sec * 1000,
        totalSec: Math.max(s.totalSec, left + e.sec),
        lastExtendSec: e.sec,
      };
    }
    case 'undo': {
      if (!s.lastExtendSec || s.endsAt === null) return s;
      const floor = (s.pausedAt ?? e.now) + 60_000;
      return { ...s, endsAt: Math.max(floor, s.endsAt - s.lastExtendSec * 1000), lastExtendSec: 0 };
    }
    case 'length': {
      const sec = clampSec(e.sec);
      if (!isLive(s.state))
        return { ...s, totalSec: sec, state: s.state === 'ended' ? 'idle' : s.state, endedAt: null };
      const from = s.pausedAt ?? e.now;
      return { ...s, totalSec: sec, endsAt: sec > 0 ? from + sec * 1000 : null };
    }
    case 'until': {
      const sec = Math.round((e.endsAt - e.now) / 1000);
      if (sec <= 0) return s;
      if (!isLive(s.state) || s.endsAt === null) return fresh(s, e.now, clampSec(sec));
      const from = s.pausedAt ?? e.now;
      return { ...s, endsAt: from + sec * 1000, totalSec: Math.max(s.totalSec, sec), lastExtendSec: 0 };
    }
    case 'tick':
      return { ...s, now: e.now };
    case 'end':
      if (!isLive(s.state)) return s;
      return {
        ...s,
        state: 'ended',
        now: e.now,
        endedAt: s.endsAt ?? e.now,
        pausedAt: null,
        pauseReason: null,
        mode: null,
        lastExtendSec: 0,
      };
  }
}

// True when the clock has run out on a live, counting session.
export function isDue(s: ISession, now: number): boolean {
  return isLive(s.state) && s.pausedAt === null && s.endsAt !== null && s.endsAt - now <= 0;
}
