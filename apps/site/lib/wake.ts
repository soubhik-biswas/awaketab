import { useSyncExternalStore } from 'react';
import { createStorage, creditMinutes, countDay, type ISession, type TEndReason } from '@awaketab/core';
import {
  createWakeLock,
  type IChangeEvent,
  type IWakeLockHandle,
  type TAdviceCode,
  type TLockState,
} from '@awaketab/wake';

export type TWakeState =
  'idle' | 'starting' | 'running' | 'fallback' | 'paused' | 'needsyou' | 'blocked' | 'unsupported' | 'ended';
export type TPauseReason = 'user' | 'hidden';
type TAnnounceKind = 'start' | 'extend' | 'lowtime' | 'hidden' | 'refused' | 'ended';
type TFinishReason = 'completed' | 'user';

export interface IAnnounce {
  id: number;
  kind: TAnnounceKind;
  endsAt: number | null;
  extendSec: number;
}

export interface IWakeSnapshot {
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
  mode: 'native' | 'video' | null;
  supported: boolean;
  lastExtendSec: number;
  peerHolds: boolean;
  announce: IAnnounce | null;
}

interface IFinished {
  startedAt: number;
  endedAt: number;
  totalSec: number;
  awakeSec: number;
  reason: TFinishReason;
}

type TEvents = {
  lowtime: { endsAt: number };
  ended: { endedAt: number };
  extended: { sec: number; endsAt: number };
  refused: { advice: TAdviceCode | null };
  finished: IFinished;
};

type TListener<K extends keyof TEvents> = (ev: TEvents[K]) => void;

const LOW_TIME_SEC = 300;
const MAX_SEC = 7 * 24 * 3600;
const RESUME_NO_END_MS = 12 * 3_600_000;
const CHANNEL = 'awaketab';

const INITIAL: IWakeSnapshot = {
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
  mode: null,
  supported: true,
  lastExtendSec: 0,
  peerHolds: false,
  announce: null,
};

const LIVE: readonly TWakeState[] = ['starting', 'running', 'fallback', 'paused', 'needsyou', 'blocked'];

export const isLive = (s: TWakeState): boolean => LIVE.includes(s);
export const isAwake = (s: TWakeState): boolean => s === 'running' || s === 'fallback';

// Seconds left, derived from the end timestamp so sleep, a hidden tab or a clock change never drift it.
export function remainSec(s: Pick<IWakeSnapshot, 'state' | 'now' | 'totalSec' | 'endsAt' | 'pausedAt'>): number {
  if (s.state === 'idle' || s.state === 'unsupported') return s.totalSec;
  if (s.state === 'ended') return 0;
  if (s.endsAt === null) return 0;
  return Math.max(0, Math.ceil((s.endsAt - (s.pausedAt ?? s.now)) / 1000));
}

export function elapsedSec(s: Pick<IWakeSnapshot, 'now' | 'startedAt' | 'pausedAt' | 'pausedMs'>): number {
  if (s.startedAt === null) return 0;
  return Math.max(0, Math.floor(((s.pausedAt ?? s.now) - s.startedAt - s.pausedMs) / 1000));
}

class WakeController {
  private snap: IWakeSnapshot = { ...INITIAL };
  private readonly subs = new Set<() => void>();
  private readonly events: { [K in keyof TEvents]: Set<TListener<K>> } = {
    lowtime: new Set(),
    ended: new Set(),
    extended: new Set(),
    refused: new Set(),
    finished: new Set(),
  };
  private native: IWakeLockHandle | null = null;
  private video: IWakeLockHandle | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private channel: BroadcastChannel | null = null;
  private readonly peers = new Set<string>();
  private readonly tabId =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : String(Math.random());
  private sessionId = '';
  private awakeSec = 0;
  private announceId = 0;
  private started = false;
  private readonly store = typeof window === 'undefined' ? null : createStorage();

  subscribe = (cb: () => void): (() => void) => {
    this.boot();
    this.subs.add(cb);
    return () => {
      this.subs.delete(cb);
    };
  };

  getSnapshot = (): IWakeSnapshot => this.snap;

  getServerSnapshot = (): IWakeSnapshot => INITIAL;

  on<K extends keyof TEvents>(type: K, cb: TListener<K>): () => void {
    this.events[type].add(cb);
    return () => {
      this.events[type].delete(cb);
    };
  }

  private emit<K extends keyof TEvents>(type: K, ev: TEvents[K]) {
    for (const cb of this.events[type]) cb(ev);
  }

  private set(patch: Partial<IWakeSnapshot>) {
    this.snap = { ...this.snap, ...patch };
    for (const cb of this.subs) cb();
  }

  private say(kind: TAnnounceKind, extendSec = 0) {
    this.announceId += 1;
    return { announce: { id: this.announceId, kind, endsAt: this.snap.endsAt, extendSec } };
  }

  private boot() {
    if (this.started || typeof window === 'undefined') return;
    this.started = true;
    this.native = createWakeLock({ fallback: 'none', reacquireOnVisible: false });
    this.video = createWakeLock({ wakeLock: null, fallback: 'video', reacquireOnVisible: false });
    this.native.on('change', (e) => {
      this.onLock('native', e);
    });
    this.video.on('change', (e) => {
      this.onLock('video', e);
    });
    document.addEventListener('visibilitychange', this.onVisibility);
    window.addEventListener('pagehide', this.onPageHide);
    this.openChannel();
    this.snap = { ...this.snap, now: Date.now(), supported: this.native.supported };
    this.restore();
    this.schedule();
  }

  private schedule() {
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(this.tick, 1000 - (Date.now() % 1000) + 5);
  }

  private tick = () => {
    const now = Date.now();
    const s = this.snap;
    const patch: Partial<IWakeSnapshot> = { now };
    if (isAwake(s.state)) {
      this.awakeSec += 1;
      if (this.awakeSec % 60 === 0) this.creditMinute(now);
    }
    const counting = isLive(s.state) && s.pausedAt === null && s.endsAt !== null;
    if (counting && s.endsAt !== null) {
      const before = Math.ceil((s.endsAt - s.now) / 1000);
      const left = Math.ceil((s.endsAt - now) / 1000);
      if (left <= 0) {
        this.set(patch);
        void this.finish('completed');
        this.schedule();
        return;
      }
      if (before > LOW_TIME_SEC && left <= LOW_TIME_SEC && isAwake(s.state)) {
        Object.assign(patch, this.say('lowtime'));
        this.emit('lowtime', { endsAt: s.endsAt });
      }
    }
    this.set(patch);
    if (isLive(this.snap.state) && now % 15_000 < 1000) this.persist();
    this.schedule();
  };

  private onVisibility = () => {
    const hidden = document.visibilityState === 'hidden';
    const s = this.snap;
    if (hidden) {
      if (isAwake(s.state)) this.set({ state: 'paused', pauseReason: 'hidden', ...this.say('hidden') });
      return;
    }
    this.set({ now: Date.now() });
    if (s.state === 'paused' && s.pauseReason === 'hidden') {
      void this.acquire(s.mode === 'video' ? 'video' : 'native', true);
    }
  };

  private onPageHide = () => {
    this.persist();
    this.post({ type: 'bye', tabId: this.tabId, ts: Date.now() });
  };

  private onLock(which: 'native' | 'video', e: IChangeEvent) {
    const s = this.snap;
    if (!isLive(s.state)) return;
    if (s.mode !== null && s.mode !== which && e.to !== 'held' && e.to !== 'fallback') return;
    this.post({ type: 'lock', tabId: this.tabId, ts: Date.now(), state: e.to });
    if (s.pausedAt !== null) return;
    if (e.to === 'held' || e.to === 'fallback') {
      const wasStarting = s.state === 'starting';
      this.set({
        state: e.to === 'held' ? 'running' : 'fallback',
        mode: which,
        pauseReason: null,
        advice: null,
        ...(wasStarting ? this.say('start') : {}),
      });
      this.persist();
      return;
    }
    if (e.to === 'lost' && e.reason === 'released_hidden') {
      if (isAwake(s.state)) this.set({ state: 'paused', pauseReason: 'hidden', ...this.say('hidden') });
      return;
    }
    if (e.to === 'denied' || e.to === 'unsupported') this.refused(which, e.to, e.advice ?? null);
  }

  private refused(which: 'native' | 'video', to: TLockState, advice: TAdviceCode | null) {
    const s = this.snap;
    if (s.pauseReason === 'hidden' || advice === 'hidden_document') {
      this.set({ state: 'needsyou', advice });
      this.persist();
      return;
    }
    if (which === 'native' && to === 'unsupported') {
      this.set({ state: 'unsupported', advice, mode: null });
      return;
    }
    if (which === 'video') {
      this.set({ state: s.state === 'starting' ? 'unsupported' : 'needsyou', advice, mode: null });
      return;
    }
    this.set({ state: 'blocked', advice, mode: null, ...this.say('refused') });
    this.emit('refused', { advice });
    this.persist();
  }

  private async acquire(which: 'native' | 'video', fromHidden = false) {
    const handle = which === 'native' ? this.native : this.video;
    if (!handle) return;
    if (which === 'video') void this.native?.release();
    else void this.video?.release();
    const result = await handle.request();
    const s = this.snap;
    if (!isLive(s.state) || s.pausedAt !== null) return;
    if (result === 'held' || result === 'fallback') {
      if (s.state !== 'running' && s.state !== 'fallback') {
        this.onLock(which, { from: 'requesting', to: result, reason: 'acquired', at: Date.now() });
      }
      return;
    }
    if (result === 'denied' || result === 'unsupported') {
      if (fromHidden) {
        this.set({ state: 'needsyou', advice: handle.advice });
        this.persist();
        return;
      }
      if (s.state !== 'blocked' && s.state !== 'unsupported' && s.state !== 'needsyou') {
        this.refused(which, result, handle.advice);
      }
    }
  }

  private async releaseAll() {
    await Promise.all([this.native?.release(), this.video?.release()]);
    this.post({ type: 'lock', tabId: this.tabId, ts: Date.now(), state: 'idle' });
  }

  start(totalSec = this.snap.totalSec) {
    this.boot();
    const s = this.snap;
    if (s.state === 'starting' || isAwake(s.state)) return;
    const now = Date.now();
    const sec = clampSec(totalSec);
    this.sessionId = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : String(now);
    this.awakeSec = 0;
    this.set({
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
      mode: null,
      lastExtendSec: 0,
      peerHolds: false,
    });
    if (this.native && !this.native.supported) {
      this.set({ state: 'unsupported', advice: this.native.advice });
      return;
    }
    void this.acquire('native');
  }

  useFallback() {
    this.boot();
    const s = this.snap;
    const now = Date.now();
    if (s.state === 'unsupported' || s.state === 'idle' || s.state === 'ended') {
      const sec = s.totalSec;
      this.sessionId = String(now);
      this.awakeSec = 0;
      this.set({ startedAt: now, endsAt: sec > 0 ? now + sec * 1000 : null, pausedAt: null, pausedMs: 0 });
    }
    this.set({ state: 'starting', mode: 'video', pauseReason: null, now });
    void this.acquire('video');
  }

  checkAgain() {
    const s = this.snap;
    if (s.state !== 'blocked' && s.state !== 'needsyou') return;
    void this.acquire('native');
  }

  pause() {
    const s = this.snap;
    if (!isAwake(s.state) && s.state !== 'blocked' && s.state !== 'needsyou') return;
    this.set({ state: 'paused', pauseReason: 'user', pausedAt: Date.now() });
    void this.releaseAll();
    this.persist();
  }

  resume() {
    const s = this.snap;
    if (s.state !== 'paused' && s.state !== 'needsyou') return;
    const now = Date.now();
    const patch: Partial<IWakeSnapshot> = { now, pauseReason: null };
    if (s.pausedAt !== null) {
      const gap = now - s.pausedAt;
      patch.pausedMs = s.pausedMs + gap;
      patch.endsAt = s.endsAt === null ? null : s.endsAt + gap;
      patch.pausedAt = null;
    }
    this.set(patch);
    void this.acquire(s.mode === 'video' ? 'video' : 'native');
  }

  toggle() {
    const s = this.snap.state;
    if (s === 'idle' || s === 'ended') this.start();
    else if (s === 'paused' || s === 'needsyou') this.resume();
    else if (isAwake(s)) this.pause();
  }

  stop() {
    const s = this.snap;
    if (isLive(s.state)) this.record('user', Date.now());
    void this.releaseAll();
    this.set({
      state: 'idle',
      startedAt: null,
      endsAt: null,
      pausedAt: null,
      pausedMs: 0,
      pauseReason: null,
      endedAt: null,
      mode: null,
      advice: null,
    });
    this.clearSession();
  }

  // From an ended session a further stretch starts fresh; otherwise it moves the end time.
  extend(sec: number) {
    const s = this.snap;
    if (sec <= 0) return;
    if (s.state === 'ended' || s.state === 'idle') {
      this.start(sec);
      this.set({ lastExtendSec: sec });
      this.announceExtend(sec);
      return;
    }
    if (s.endsAt === null) return;
    const left = remainSec(s);
    if (left + sec > MAX_SEC) return;
    this.set({ endsAt: s.endsAt + sec * 1000, totalSec: Math.max(s.totalSec, left + sec), lastExtendSec: sec });
    this.announceExtend(sec);
    this.persist();
  }

  private announceExtend(sec: number) {
    const endsAt = this.snap.endsAt ?? Date.now();
    this.set(this.say('extend', sec));
    this.emit('extended', { sec, endsAt });
  }

  undoExtend() {
    const s = this.snap;
    if (!s.lastExtendSec || s.endsAt === null) return;
    const floor = (s.pausedAt ?? Date.now()) + 60_000;
    this.set({ endsAt: Math.max(floor, s.endsAt - s.lastExtendSec * 1000), lastExtendSec: 0 });
    this.persist();
  }

  // Keep awake until a wall-clock time: moves a live session's end, or starts one from idle.
  until(endsAt: number) {
    const s = this.snap;
    const now = Date.now();
    const sec = Math.round((endsAt - now) / 1000);
    if (sec <= 0) return;
    if (!isLive(s.state) || s.endsAt === null) {
      this.start(sec);
      return;
    }
    const from = s.pausedAt ?? now;
    this.set({ endsAt: from + sec * 1000, totalSec: Math.max(s.totalSec, sec), lastExtendSec: 0 });
    this.persist();
  }

  setLength(totalSec: number) {
    const s = this.snap;
    const sec = clampSec(totalSec);
    if (!isLive(s.state)) {
      this.set({ totalSec: sec, state: s.state === 'ended' ? 'idle' : s.state, endedAt: null });
      return;
    }
    const from = s.pausedAt ?? Date.now();
    this.set({ totalSec: sec, endsAt: sec > 0 ? from + sec * 1000 : null });
    this.persist();
  }

  takeOver() {
    for (const target of this.peers) {
      this.post({ type: 'intent', tabId: this.tabId, ts: Date.now(), target, action: 'stop' });
    }
    this.peers.clear();
    this.set({ peerHolds: false });
    this.start();
  }

  dismissPeer() {
    this.set({ peerHolds: false });
  }

  private async finish(reason: TFinishReason) {
    const s = this.snap;
    const endedAt = s.endsAt ?? Date.now();
    this.record(reason, endedAt);
    await this.releaseAll();
    this.set({
      state: 'ended',
      endedAt,
      pausedAt: null,
      pauseReason: null,
      mode: null,
      lastExtendSec: 0,
      ...this.say('ended'),
    });
    this.emit('ended', { endedAt });
    this.clearSession();
  }

  private record(reason: TFinishReason, endedAt: number) {
    const s = this.snap;
    if (s.startedAt === null) return;
    const stats = this.store?.stats();
    if (stats && this.store) {
      if (this.awakeSec % 60 >= 30) creditMinutes(stats, endedAt, 1);
      if (this.awakeSec >= 60) {
        stats.sessions += 1;
        stats.daySessions = countDay(stats.daySessions, endedAt);
      }
      stats.lastSessionAt = endedAt;
      this.store.writeStats(stats);
    }
    this.emit('finished', { startedAt: s.startedAt, endedAt, totalSec: s.totalSec, awakeSec: this.awakeSec, reason });
    this.awakeSec = 0;
  }

  private creditMinute(now: number) {
    if (!this.store) return;
    const stats = this.store.stats();
    creditMinutes(stats, now, 1);
    this.store.writeStats(stats);
  }

  private persist() {
    const s = this.snap;
    if (!this.store || s.startedAt === null || !isLive(s.state)) return;
    const status = s.pausedAt !== null ? 'paused' : 'active';
    const session: ISession = {
      v: 1,
      id: this.sessionId || String(s.startedAt),
      plan: s.endsAt === null ? { type: 'indefinite' } : { type: 'duration', ms: s.endsAt - s.pausedMs - s.startedAt },
      presetId: presetIdOf(s.totalSec),
      mode: 'standard',
      startedAt: s.startedAt,
      endsAt: s.endsAt === null ? null : s.endsAt - s.pausedMs,
      status,
      pausedAt: s.pausedAt,
      pausedMs: s.pausedMs,
      endedAt: null,
      endReason: null,
      awakeSeconds: this.awakeSec,
      modeState: {},
      source: 'web',
    };
    this.store.writeSession(session);
  }

  private clearSession() {
    const cur = this.store?.session();
    if (!cur || !this.store) return;
    const reason: TEndReason = this.snap.state === 'ended' ? 'completed' : 'user';
    this.store.writeSession({
      ...cur,
      status: reason === 'completed' ? 'completed' : 'aborted',
      endedAt: Date.now(),
      endReason: reason,
    });
  }

  // A session that was live when the tab closed comes back as "Needs you": the lock needs asking again.
  private restore() {
    const saved = this.store?.session();
    if (!saved || (saved.status !== 'active' && saved.status !== 'paused') || saved.source !== 'web') return;
    const now = Date.now();
    const endsAt = saved.endsAt === null ? null : saved.endsAt + saved.pausedMs;
    const paused = saved.status === 'paused' && saved.pausedAt !== null;
    const left = endsAt === null ? null : endsAt - (paused && saved.pausedAt !== null ? saved.pausedAt : now);
    if (left !== null && left <= 0) return;
    if (endsAt === null && now - saved.startedAt > RESUME_NO_END_MS) return;
    const totalSec =
      saved.plan.type === 'duration'
        ? Math.round(saved.plan.ms / 1000)
        : endsAt === null
          ? 0
          : Math.round((endsAt - saved.startedAt) / 1000);
    this.sessionId = saved.id;
    this.awakeSec = saved.awakeSeconds;
    this.snap = {
      ...this.snap,
      state: paused ? 'paused' : 'needsyou',
      pauseReason: paused ? 'user' : null,
      totalSec,
      startedAt: saved.startedAt,
      endsAt,
      pausedAt: paused ? saved.pausedAt : null,
      pausedMs: saved.pausedMs,
    };
  }

  private openChannel() {
    if (typeof BroadcastChannel === 'undefined') return;
    this.channel = new BroadcastChannel(CHANNEL);
    this.channel.addEventListener('message', (ev: MessageEvent<TTabMessage | null>) => {
      const msg = ev.data;
      if (!msg || msg.tabId === this.tabId) return;
      if (msg.type === 'hello') {
        const st = this.native?.state ?? 'idle';
        const ours = this.snap.mode === 'video' ? (this.video?.state ?? 'idle') : st;
        this.post({ type: 'lock', tabId: this.tabId, ts: Date.now(), state: isAwake(this.snap.state) ? ours : 'idle' });
      }
      if (msg.type === 'lock') {
        if (msg.state === 'held' || msg.state === 'fallback') this.peers.add(msg.tabId);
        else this.peers.delete(msg.tabId);
      }
      if (msg.type === 'bye') this.peers.delete(msg.tabId);
      if (msg.type === 'intent' && msg.target === this.tabId && msg.action === 'stop') this.stop();
      const holds = this.peers.size > 0 && !isAwake(this.snap.state);
      if (holds !== this.snap.peerHolds) this.set({ peerHolds: holds });
    });
    this.post({ type: 'hello', tabId: this.tabId, ts: Date.now() });
  }

  private post(msg: TTabMessage) {
    try {
      this.channel?.postMessage(msg);
    } catch {
      this.channel = null;
    }
  }

  // Dev-only: the QA tray jumps straight to a drawn state without asking the browser.
  qaJump(patch: Partial<IWakeSnapshot>) {
    this.boot();
    void this.releaseAll();
    this.awakeSec = 0;
    this.set({ now: Date.now(), ...patch });
  }

  qaEnded() {
    this.emit('ended', { endedAt: this.snap.endedAt ?? Date.now() });
  }
}

type TTabMessage =
  | { type: 'hello'; tabId: string; ts: number }
  | { type: 'lock'; tabId: string; ts: number; state: TLockState }
  | { type: 'intent'; tabId: string; ts: number; target: string; action: 'stop' | 'add'; ms?: number }
  | { type: 'bye'; tabId: string; ts: number };

function clampSec(sec: number): number {
  if (!Number.isFinite(sec) || sec <= 0) return 0;
  return Math.min(MAX_SEC, Math.round(sec));
}

function presetIdOf(sec: number): ISession['presetId'] {
  const map: Record<number, ISession['presetId']> = {
    0: 'pinf',
    900: 'p15',
    1800: 'p30',
    2700: 'p45',
    3600: 'p60',
    7200: 'p120',
    14400: 'p240',
  };
  return map[sec] ?? 'custom';
}

export const wake = new WakeController();

export function useWake(): IWakeSnapshot {
  return useSyncExternalStore(wake.subscribe, wake.getSnapshot, wake.getServerSnapshot);
}
