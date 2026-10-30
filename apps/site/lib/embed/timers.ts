export interface ICookTimer {
  id: string;
  name: string;
  durationMs: number;
  endsAt: number;
  doneAt: number | null;
}

export const COOK_MAX_TIMERS = 3;
export const COOK_QUICK_MIN = [5, 10, 15, 30, 60] as const;
const EMBED_SETTINGS_KEY = 'at.v1.embed.settings';

type TStore = Pick<Storage, 'getItem' | 'setItem'>;

function isTimer(v: unknown): v is ICookTimer {
  const o = v as Partial<ICookTimer> | null;
  return (
    typeof o?.id === 'string' &&
    typeof o.name === 'string' &&
    typeof o.durationMs === 'number' &&
    typeof o.endsAt === 'number' &&
    (o.doneAt === null || typeof o.doneAt === 'number')
  );
}

export function readTimers(store: TStore | null): ICookTimer[] {
  try {
    const raw = JSON.parse(store?.getItem(EMBED_SETTINGS_KEY) ?? 'null') as { cookTimers?: unknown } | null;
    return Array.isArray(raw?.cookTimers) ? raw.cookTimers.filter(isTimer).slice(0, COOK_MAX_TIMERS) : [];
  } catch {
    return [];
  }
}

export function writeTimers(store: TStore | null, list: ICookTimer[]): void {
  try {
    store?.setItem(EMBED_SETTINGS_KEY, JSON.stringify({ v: 1, cookTimers: list.slice(0, COOK_MAX_TIMERS) }));
  } catch {
    // A full or blocked storage keeps the timers for this visit only.
  }
}

export function safeStorage(win: Window): TStore | null {
  try {
    return win.localStorage;
  } catch {
    return null;
  }
}

export function addTimer(list: ICookTimer[], minutes: number, name: string, now: number, id: string): ICookTimer[] {
  if (list.length >= COOK_MAX_TIMERS || minutes < 1) return list;
  const durationMs = minutes * 60_000;
  return [...list, { id, name, durationMs, endsAt: now + durationMs, doneAt: null }];
}

// Marks the timers that ran out since the last look; returns the list and the ones that just finished.
export function settleTimers(list: ICookTimer[], now: number): { list: ICookTimer[]; done: ICookTimer[] } {
  const done: ICookTimer[] = [];
  const next = list.map((t) => {
    if (t.doneAt !== null || t.endsAt > now) return t;
    const finished = { ...t, doneAt: now };
    done.push(finished);
    return finished;
  });
  return { list: done.length > 0 ? next : list, done };
}
