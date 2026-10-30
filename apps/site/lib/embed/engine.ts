import { createWakeLock, type IWakeLockHandle, type TAdviceCode, type TLockState } from '@awaketab/wake';
import type { IEmbedParams, TPageMessage } from './protocol';

export interface IEmbedSession {
  startedAt: number;
  endsAt: number | null;
  pausedAt: number | null;
  pausedMs: number;
}

export interface IEmbedSnapshot {
  lock: TLockState;
  advice: TAdviceCode | null;
  session: IEmbedSession | null;
  tapNeeded: boolean;
}

const PRESET_MS: Record<string, number | null> = {
  p15: 900_000,
  p30: 1_800_000,
  p45: 2_700_000,
  p60: 3_600_000,
  p120: 7_200_000,
  p240: 14_400_000,
  pinf: null,
};

// The next time the wall clock reads HH:MM (today, or tomorrow when that has passed).
export function untilWall(wall: string, now: number): number {
  const [h, m] = wall.split(':').map(Number);
  const d = new Date(now);
  d.setHours(h ?? 0, m ?? 0, 0, 0);
  if (d.getTime() <= now + 30_000) d.setDate(d.getDate() + 1);
  return d.getTime();
}

// How long a start runs: a page command's ms wins, then its until, then its preset, then the tag's own preset.
export function planEnd(
  params: Pick<IEmbedParams, 'preset' | 'until'>,
  now: number,
  cmd?: Extract<TPageMessage, { type: 'awaketab:start' }>,
): number | null {
  if (cmd?.ms !== undefined) return now + cmd.ms;
  if (cmd?.until) return untilWall(cmd.until, now);
  const preset = cmd?.preset ?? params.preset;
  if (preset === 'until') return params.until ? untilWall(params.until, now) : null;
  const ms = PRESET_MS[preset] ?? null;
  return ms === null ? null : now + ms;
}

export function presetMs(params: Pick<IEmbedParams, 'preset' | 'until'>, now: number): number {
  const end = planEnd(params, now);
  return end === null ? 0 : end - now;
}

export const isRunning = (lock: TLockState) => lock === 'held' || lock === 'fallback';

export function remainingMs(s: IEmbedSession, now: number): number | null {
  if (s.endsAt === null) return null;
  return Math.max(0, s.endsAt - (s.pausedAt ?? now));
}

export function elapsedMs(s: IEmbedSession, now: number): number {
  return Math.max(0, (s.pausedAt ?? now) - s.startedAt - s.pausedMs);
}

// The widget's own small engine: one wake lock (with the labelled video fallback), one session, in memory only, and
// no BroadcastChannel, so a widget on one site never talks to AwakeTab tabs or widgets elsewhere.
export class EmbedEngine {
  private snap: IEmbedSnapshot = { lock: 'idle', advice: null, session: null, tapNeeded: false };
  private readonly subs = new Set<() => void>();
  private readonly ended = new Set<() => void>();
  private lock: IWakeLockHandle | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(private readonly make: () => IWakeLockHandle = () => createWakeLock()) {}

  subscribe = (cb: () => void) => {
    this.subs.add(cb);
    return () => {
      this.subs.delete(cb);
    };
  };

  getSnapshot = () => this.snap;

  onEnded(cb: () => void) {
    this.ended.add(cb);
    return () => {
      this.ended.delete(cb);
    };
  }

  private set(patch: Partial<IEmbedSnapshot>) {
    this.snap = { ...this.snap, ...patch };
    for (const cb of this.subs) cb();
  }

  private handle(): IWakeLockHandle {
    if (!this.lock) {
      this.lock = this.make();
      this.lock.on('change', (e) => this.set({ lock: e.to, advice: e.advice ?? this.lock?.advice ?? null }));
    }
    return this.lock;
  }

  async start(endsAt: number | null, programmatic = false): Promise<TLockState> {
    const now = Date.now();
    this.set({ session: { startedAt: now, endsAt, pausedAt: null, pausedMs: 0 }, tapNeeded: false });
    const lock = this.handle();
    const result = await lock.request();
    // A command from the page cannot start the video fallback without a tap in the frame.
    this.set({ lock: result, advice: lock.advice, tapNeeded: programmatic && result === 'unsupported' });
    if (!isRunning(result)) this.set({ session: null });
    else this.watch();
    return result;
  }

  stop() {
    void this.lock?.release();
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.set({ session: null, tapNeeded: false, lock: this.lock?.state ?? 'idle' });
  }

  // Cook mode pauses the countdown with a tap but keeps the screen on, as the hands are busy.
  togglePause() {
    const s = this.snap.session;
    if (!s) return;
    const now = Date.now();
    this.set({
      session:
        s.pausedAt === null
          ? { ...s, pausedAt: now }
          : {
              ...s,
              pausedAt: null,
              pausedMs: s.pausedMs + (now - s.pausedAt),
              endsAt: s.endsAt === null ? null : s.endsAt + (now - s.pausedAt),
            },
    });
  }

  private watch() {
    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(() => {
      const s = this.snap.session;
      if (!s || s.endsAt === null || s.pausedAt !== null) return;
      if (Date.now() >= s.endsAt) {
        this.stop();
        for (const cb of this.ended) cb();
      }
    }, 500);
  }

  destroy() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.lock?.destroy();
    this.lock = null;
  }
}
