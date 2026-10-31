import { PRO_ENABLED } from '@/lib/features';
import { dayDiff } from '@/lib/tool/clock';
import { createLocalStore, isRecord, useLocalStore } from '@/lib/tool/store';

// What the journey rules need, kept on this device only: when it was first seen, how many real sessions ran,
// when the first one ended and until when the Pro nudge stays quiet.
export interface IJourney {
  firstSeen: number;
  sessions: number;
  firstDoneAt: number | null;
  quietUntil: number;
}

const JOURNEY_KEY = 'at.v1.journey';
const QUIET_MS = 30 * 86_400_000;
const EMPTY: IJourney = { firstSeen: 0, sessions: 0, firstDoneAt: null, quietUntil: 0 };

const num = (v: unknown, d: number) => (typeof v === 'number' && Number.isFinite(v) ? v : d);

function parse(raw: unknown): IJourney {
  if (!isRecord(raw)) return { ...EMPTY };
  return {
    firstSeen: num(raw.firstSeen, 0),
    sessions: Math.max(0, Math.round(num(raw.sessions, 0))),
    firstDoneAt: typeof raw.firstDoneAt === 'number' ? raw.firstDoneAt : null,
    quietUntil: num(raw.quietUntil, 0),
  };
}

const journeyStore = createLocalStore<IJourney>(JOURNEY_KEY, parse, (j) => ({ v: 1, ...j }));

export function useJourney(): IJourney {
  return useLocalStore(journeyStore, EMPTY);
}

export function markSeen(now = Date.now()) {
  if (journeyStore.get().firstSeen === 0) journeyStore.set((j) => ({ ...j, firstSeen: now }));
}

export function countSession() {
  journeyStore.set((j) => ({ ...j, sessions: j.sessions + 1 }));
}

// True only the first time a session reaches Time's up on this device.
export function firstDone(now = Date.now()): boolean {
  if (journeyStore.get().firstDoneAt !== null) return false;
  journeyStore.set((j) => ({ ...j, firstDoneAt: now }));
  return true;
}

export function quietNudge(now = Date.now()) {
  journeyStore.set((j) => ({ ...j, quietUntil: now + QUIET_MS }));
}

// One gentle Pro nudge, only after real use: 10 sessions, 2 presets or a second screen; never on the first day.
export function nudgeDue(j: IJourney, presets: number, screens: number, now = Date.now()): boolean {
  if (!PRO_ENABLED) return false;
  if (j.firstSeen === 0 || dayDiff(j.firstSeen, now) < 1 || j.sessions < 1) return false;
  if (now < j.quietUntil) return false;
  return j.sessions >= 10 || presets >= 2 || screens >= 2;
}
