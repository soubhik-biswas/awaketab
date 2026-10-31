import { useSyncExternalStore } from 'react';
import {
  createStorage,
  creditMinutes,
  countDay,
  type ISession as IStoredSession,
  type TEndReason,
} from '@awaketab/core';
import { createWakeLock, type IChangeEvent, type IWakeLockHandle, type TLockState } from '@awaketab/wake';
import {
  IDLE_SESSION,
  isAwake,
  isDue,
  isLive,
  reduce,
  type ISession,
  type TLockMode,
  type TSessionEvent,
} from '@/lib/tool/session';

export { elapsedSec, isAwake, isLive, remainSec } from '@/lib/tool/session';
export type { TPauseReason, TWakeState } from '@/lib/tool/session';

type TAnnounceKind = 'start' | 'extend' | 'lowtime' | 'hidden' | 'refused' | 'paused' | 'ended';
type TFinishReason = 'completed' | 'user';

export interface IAnnounce {
  id: number;
  kind: TAnnounceKind;
  endsAt: number | null;
  extendSec: number;
}

export interface IWakeSnapshot extends ISession {
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
  refused: { advice: IWakeSnapshot['advice'] };
  finished: IFinished;
};

type TListener<K extends keyof TEvents> = (ev: TEvents[K]) => void;

const LOW_TIME_SEC = 300;
const RESUME_NO_END_MS = 12 * 3_600_000;
const CHANNEL = 'awaketab';

const INITIAL: IWakeSnapshot = { ...IDLE_SESSION, peerHolds: false, announce: null };

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

  private notify() {
    for (const cb of this.subs) cb();
  }

  private send(e: TSessionEvent, extra: Partial<IWakeSnapshot> = {}) {
    const before = this.snap;
    const next = reduce(before, e);
    if (next === before && Object.keys(extra).length === 0) return;
    this.snap = { ...before, ...next, ...extra };
    this.notify();
  }

  private patch(extra: Partial<IWakeSnapshot>) {
    this.snap = { ...this.snap, ...extra };
    this.notify();
  }

  private say(kind: TAnnounceKind, extendSec = 0): Pick<IWakeSnapshot, 'announce'> {
    this.announceId += 1;
    return { announce: { id: this.announceId, kind, endsAt: this.snap.endsAt, extendSec } };
  }

  private holding(): boolean {
    return this.native?.state === 'held' || this.video?.state === 'fallback';
  }

  private boot() {
    if (this.started || typeof window === 'undefined') return;
    this.started = true;
    this.native = createWakeLock({ fallback: 'none', reacquireOnVisible: false });
    this.video = createWakeLock({ wakeLock: null, fallback: 'video', reacquireOnVisible: false });
    this.native.on('change', (e) => this.onLock('native', e));
    this.video.on('change', (e) => this.onLock('video', e));
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
    if (isAwake(s.state)) {
      this.awakeSec += 1;
      if (this.awakeSec % 60 === 0) this.creditMinute(now);
    }
    if (isDue(s, now)) {
      this.send({ type: 'tick', now });
      void this.finish('completed');
      this.schedule();
      return;
    }
    let extra: Partial<IWakeSnapshot> = {};
    if (isAwake(s.state) && s.pausedAt === null && s.endsAt !== null) {
      const before = Math.ceil((s.endsAt - s.now) / 1000);
      const left = Math.ceil((s.endsAt - now) / 1000);
      if (before > LOW_TIME_SEC && left <= LOW_TIME_SEC) {
        extra = this.say('lowtime');
        this.emit('lowtime', { endsAt: s.endsAt });
      }
    }
    this.send({ type: 'tick', now }, extra);
    if (isLive(this.snap.state) && now % 15_000 < 1000) this.persist();
    this.schedule();
  };

  // The lock is asked for again whenever the tab comes back into view.
  private onVisibility = () => {
    const now = Date.now();
    if (document.visibilityState === 'hidden') {
      if (isAwake(this.snap.state)) this.send({ type: 'hidden', now }, this.say('hidden'));
      return;
    }
    this.send({ type: 'tick', now });
    const s = this.snap;
    const wasHidden = s.state === 'paused' && s.pauseReason === 'hidden';
    if (wasHidden || (s.state === 'needsyou' && s.pausedAt === null)) {
      void this.acquire(s.mode === 'video' ? 'video' : 'native', true);
    }
  };

  private onPageHide = () => {
    this.persist();
    this.post({ type: 'bye', tabId: this.tabId, ts: Date.now() });
  };

  private onLock(which: TLockMode, e: IChangeEvent) {
    const s = this.snap;
    if (!isLive(s.state)) return;
    if (s.mode !== null && s.mode !== which && e.to !== 'held' && e.to !== 'fallback') return;
    this.post({ type: 'lock', tabId: this.tabId, ts: Date.now(), state: e.to });
    if (s.pausedAt !== null) return;
    const now = Date.now();
    if (e.to === 'held' || e.to === 'fallback') {
      const wasStarting = s.state === 'starting';
      this.send({ type: 'held', mode: which, now }, wasStarting ? this.say('start') : {});
      this.persist();
      return;
    }
    if (e.to === 'lost' && e.reason === 'released_hidden') {
      if (isAwake(s.state)) this.send({ type: 'hidden', now }, this.say('hidden'));
      return;
    }
    if (e.to === 'denied' || e.to === 'unsupported') this.refused(which, e.to, e.advice ?? null);
  }

  private refused(which: TLockMode, to: 'denied' | 'unsupported', advice: IWakeSnapshot['advice']) {
    const before = this.snap.state;
    this.send({ type: 'refused', mode: which, to, advice, held: this.holding(), now: Date.now() });
    const after = this.snap.state;
    if (after === before) return;
    if (after === 'blocked') {
      this.patch(this.say('refused'));
      this.emit('refused', { advice });
    }
    this.persist();
  }

  private async acquire(which: TLockMode, fromHidden = false) {
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
      if (fromHidden && !this.holding()) {
        this.patch({ state: 'needsyou', advice: handle.advice, checkedAt: Date.now() });
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
    this.sessionId = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : String(now);
    this.awakeSec = 0;
    this.send(
      { type: 'start', now, totalSec, supported: this.native ? this.native.supported : true },
      { peerHolds: false },
    );
    if (this.snap.state === 'starting') void this.acquire('native');
  }

  useFallback() {
    this.boot();
    const s = this.snap;
    if (s.state === 'unsupported' || s.state === 'idle' || s.state === 'ended') {
      this.sessionId = String(Date.now());
      this.awakeSec = 0;
    }
    this.send({ type: 'fallback', now: Date.now() });
    void this.acquire('video');
  }

  checkAgain() {
    const s = this.snap;
    if (s.state !== 'blocked' && s.state !== 'needsyou') return;
    this.patch({ checkedAt: Date.now() });
    void this.acquire('native');
  }

  pause() {
    const before = this.snap.state;
    this.send({ type: 'pause', now: Date.now() });
    if (this.snap.state === before) return;
    this.patch(this.say('paused'));
    void this.releaseAll();
    this.persist();
  }

  resume() {
    const s = this.snap;
    if (s.state !== 'paused' && s.state !== 'needsyou') return;
    this.send({ type: 'resume', now: Date.now() });
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
    this.send({ type: 'stop', now: Date.now() });
    this.clearSession();
  }

  // From an ended session a further stretch starts fresh; otherwise it moves the end time.
  extend(sec: number) {
    const s = this.snap;
    if (sec <= 0) return;
    if (s.state === 'ended' || s.state === 'idle') {
      this.sessionId = String(Date.now());
      this.awakeSec = 0;
      this.send({ type: 'extend', sec, now: Date.now() }, { peerHolds: false });
      void this.acquire('native');
      this.announceExtend(sec);
      return;
    }
    const before = this.snap.endsAt;
    this.send({ type: 'extend', sec, now: Date.now() });
    if (this.snap.endsAt === before) return;
    this.announceExtend(sec);
    this.persist();
  }

  private announceExtend(sec: number) {
    const endsAt = this.snap.endsAt ?? Date.now();
    this.patch(this.say('extend', sec));
    this.emit('extended', { sec, endsAt });
  }

  undoExtend() {
    this.send({ type: 'undo', now: Date.now() });
    this.persist();
  }

  // Keep awake until a wall-clock time: moves a live session's end, or starts one from idle.
  until(endsAt: number) {
    const s = this.snap;
    if (!isLive(s.state) || s.endsAt === null) {
      const sec = Math.round((endsAt - Date.now()) / 1000);
      if (sec > 0) this.start(sec);
      return;
    }
    this.send({ type: 'until', endsAt, now: Date.now() });
    this.persist();
  }

  setLength(totalSec: number) {
    this.send({ type: 'length', sec: totalSec, now: Date.now() });
    if (isLive(this.snap.state)) this.persist();
  }

  takeOver() {
    for (const target of this.peers) {
      this.post({ type: 'intent', tabId: this.tabId, ts: Date.now(), target, action: 'stop' });
    }
    this.peers.clear();
    this.patch({ peerHolds: false });
    this.start();
  }

  dismissPeer() {
    this.patch({ peerHolds: false });
  }

  private async finish(reason: TFinishReason) {
    const s = this.snap;
    const endedAt = s.endsAt ?? Date.now();
    this.record(reason, endedAt);
    await this.releaseAll();
    this.send({ type: 'end', now: Date.now() }, this.say('ended'));
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
    const session: IStoredSession = {
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
      if (holds !== this.snap.peerHolds) this.patch({ peerHolds: holds });
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
    this.patch({ now: Date.now(), ...patch });
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

function presetIdOf(sec: number): IStoredSession['presetId'] {
  const map: Record<number, IStoredSession['presetId']> = {
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
