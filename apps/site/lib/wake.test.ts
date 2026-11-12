import { STORAGE_KEYS, type ISession as IStoredSession } from '@awaketab/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const T0 = Date.parse('2026-11-13T10:00:00.000Z');
const MIN = 60_000;

class FakeSentinel extends EventTarget {
  released = false;
  release = (): Promise<void> => {
    if (!this.released) {
      this.released = true;
      this.dispatchEvent(new Event('release'));
    }
    return Promise.resolve();
  };
}

function fakeApi() {
  const sentinels: FakeSentinel[] = [];
  const state = { reject: null as Error | null, asked: 0 };
  const api = {
    request: (): Promise<FakeSentinel> => {
      state.asked += 1;
      if (state.reject) return Promise.reject(state.reject);
      const s = new FakeSentinel();
      sentinels.push(s);
      return Promise.resolve(s);
    },
  };
  return { api, sentinels, state, live: () => sentinels.filter((s) => !s.released) };
}

type TMessage = { type: string; tabId: string; ts: number; state?: string; target?: string; action?: string };

// Every channel opened in a test shares one bus, as tabs of one browser do.
function fakeBus() {
  const ends = new Set<FakeChannel>();
  class FakeChannel extends EventTarget {
    constructor() {
      super();
      ends.add(this);
    }
    postMessage(data: TMessage) {
      for (const end of ends) if (end !== this) end.dispatchEvent(new MessageEvent('message', { data }));
    }
    close() {
      ends.delete(this);
    }
  }
  return FakeChannel;
}

let api: ReturnType<typeof fakeApi>;

async function load() {
  vi.resetModules();
  const { wake } = await import('./wake');
  wake.subscribe(() => undefined);
  return wake;
}

const stored = (): IStoredSession | null =>
  JSON.parse(localStorage.getItem(STORAGE_KEYS.session) ?? 'null') as IStoredSession | null;

function saved(patch: Partial<IStoredSession> = {}): IStoredSession {
  return {
    v: 1,
    id: 'saved',
    plan: { type: 'duration', ms: 30 * MIN },
    presetId: 'p30',
    mode: 'standard',
    startedAt: T0 - 10 * MIN,
    endsAt: T0 + 20 * MIN,
    status: 'active',
    pausedAt: null,
    pausedMs: 0,
    endedAt: null,
    endReason: null,
    awakeSeconds: 600,
    modeState: {},
    source: 'web',
    ...patch,
  };
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(T0);
  localStorage.clear();
  api = fakeApi();
  Object.defineProperty(window, 'isSecureContext', { configurable: true, value: true });
  Object.defineProperty(navigator, 'wakeLock', { configurable: true, value: api.api });
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' });
  vi.stubGlobal('BroadcastChannel', fakeBus());
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('the tick always reaches the end of the session', () => {
  it('ends on time and lets the screen sleep when stored stats are malformed', async () => {
    localStorage.setItem(STORAGE_KEYS.stats, '{"v":1,"days":null,"totalMinutes":"x"}');
    const errors = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const wake = await load();
    wake.start(120);
    await vi.advanceTimersByTimeAsync(0);
    expect(wake.getSnapshot().state).toBe('running');
    await vi.advanceTimersByTimeAsync(121_000);
    expect(wake.getSnapshot().state).toBe('ended');
    expect(api.live()).toHaveLength(0);
    expect(errors).not.toHaveBeenCalled();
    const stats = JSON.parse(localStorage.getItem(STORAGE_KEYS.stats) ?? '{}') as { totalMinutes: number };
    expect(stats.totalMinutes).toBe(2);
  });

  it('keeps ticking when a tick throws, and logs the failure once', async () => {
    const errors = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const wake = await load();
    let throwing = false;
    wake.subscribe(() => {
      if (throwing) throw new Error('listener broke');
    });
    wake.start(60);
    await vi.advanceTimersByTimeAsync(0);
    throwing = true;
    await vi.advanceTimersByTimeAsync(30_000);
    throwing = false;
    expect(errors).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(31_000);
    expect(wake.getSnapshot().state).toBe('ended');
    expect(api.live()).toHaveLength(0);
    expect(errors).toHaveBeenCalledTimes(1);
  });

  it('still ends and releases when writing the result fails', async () => {
    const errors = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const wake = await load();
    wake.on('finished', () => {
      throw new Error('history broke');
    });
    wake.start(60);
    await vi.advanceTimersByTimeAsync(61_000);
    expect(wake.getSnapshot().state).toBe('ended');
    expect(api.live()).toHaveLength(0);
    expect(errors).toHaveBeenCalledTimes(1);
  });

  it('Stop releases even when recording the session fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const wake = await load();
    wake.on('finished', () => {
      throw new Error('history broke');
    });
    wake.start(600);
    await vi.advanceTimersByTimeAsync(5_000);
    wake.stop();
    await vi.advanceTimersByTimeAsync(0);
    expect(wake.getSnapshot().state).toBe('idle');
    expect(api.live()).toHaveLength(0);
  });
});

describe('a session restored after a reload', () => {
  it('asks for the lock by itself and runs again without a tap', async () => {
    localStorage.setItem(STORAGE_KEYS.session, JSON.stringify(saved()));
    const wake = await load();
    expect(wake.getSnapshot().state).toBe('needsyou');
    await vi.advanceTimersByTimeAsync(0);
    expect(api.state.asked).toBe(1);
    expect(wake.getSnapshot().state).toBe('running');
    expect(wake.getSnapshot().endsAt).toBe(T0 + 20 * MIN);
    expect(api.live()).toHaveLength(1);
  });

  it('stays "needs you", quietly, when the browser wants a tap first', async () => {
    api.state.reject = new DOMException('needs a user gesture', 'NotAllowedError');
    localStorage.setItem(STORAGE_KEYS.session, JSON.stringify(saved()));
    const wake = await load();
    const refused = vi.fn();
    wake.on('refused', refused);
    await vi.advanceTimersByTimeAsync(5_000);
    expect(api.state.asked).toBeGreaterThanOrEqual(1);
    expect(wake.getSnapshot().state).toBe('needsyou');
    expect(wake.getSnapshot().announce).toBeNull();
    expect(refused).not.toHaveBeenCalled();
    api.state.reject = null;
    wake.resume();
    await vi.advanceTimersByTimeAsync(0);
    expect(wake.getSnapshot().state).toBe('running');
  });

  it('says blocked when the refusal has a cause a tap cannot fix', async () => {
    api.state.reject = new DOMException('disallowed by permissions policy', 'NotAllowedError');
    localStorage.setItem(STORAGE_KEYS.session, JSON.stringify(saved()));
    const wake = await load();
    await vi.advanceTimersByTimeAsync(0);
    expect(wake.getSnapshot().state).toBe('blocked');
    expect(wake.getSnapshot().advice).toBe('permissions_policy');
  });

  it('does not ask while the page is hidden, and a paused session stays paused', async () => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
    localStorage.setItem(STORAGE_KEYS.session, JSON.stringify(saved()));
    const hidden = await load();
    await vi.advanceTimersByTimeAsync(0);
    expect(api.state.asked).toBe(0);
    expect(hidden.getSnapshot().state).toBe('needsyou');

    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' });
    localStorage.setItem(STORAGE_KEYS.session, JSON.stringify(saved({ status: 'paused', pausedAt: T0 - MIN })));
    const paused = await load();
    await vi.advanceTimersByTimeAsync(0);
    expect(api.state.asked).toBe(0);
    expect(paused.getSnapshot().state).toBe('paused');
  });

  it('a later refusal of a session that came back is still reported', async () => {
    localStorage.setItem(STORAGE_KEYS.session, JSON.stringify(saved()));
    const wake = await load();
    await vi.advanceTimersByTimeAsync(0);
    expect(wake.getSnapshot().state).toBe('running');
    api.state.reject = new DOMException('refused', 'NotAllowedError');
    for (const s of api.sentinels) void s.release();
    await vi.advanceTimersByTimeAsync(5_000);
    expect(wake.getSnapshot().state).toBe('blocked');
  });
});

describe('the stored end time', () => {
  it('is the real end: it moves with a pause and survives a reload', async () => {
    const wake = await load();
    wake.start(30 * 60);
    await vi.advanceTimersByTimeAsync(10 * MIN);
    wake.pause();
    await vi.advanceTimersByTimeAsync(0);
    expect(stored()?.status).toBe('paused');
    expect(stored()?.endsAt).toBe(T0 + 30 * MIN);
    await vi.advanceTimersByTimeAsync(60 * MIN);
    wake.resume();
    await vi.advanceTimersByTimeAsync(0);
    expect(wake.getSnapshot().endsAt).toBe(T0 + 90 * MIN);
    expect(stored()?.endsAt).toBe(T0 + 90 * MIN);
    expect(stored()?.pausedMs).toBe(60 * MIN);
    expect(stored()?.plan).toEqual({ type: 'duration', ms: 30 * MIN });
    window.dispatchEvent(new Event('pagehide'));

    await vi.advanceTimersByTimeAsync(5 * MIN);
    const again = await load();
    await vi.advanceTimersByTimeAsync(0);
    expect(again.getSnapshot().state).toBe('running');
    expect(again.getSnapshot().endsAt).toBe(T0 + 90 * MIN);
  });

  it('reads a session saved with the first end time and a paused total as ending later by that total', async () => {
    localStorage.setItem(
      STORAGE_KEYS.session,
      JSON.stringify(saved({ startedAt: T0 - 80 * MIN, endsAt: T0 - 50 * MIN, pausedMs: 60 * MIN })),
    );
    const wake = await load();
    await vi.advanceTimersByTimeAsync(0);
    expect(wake.getSnapshot().state).toBe('running');
    expect(wake.getSnapshot().endsAt).toBe(T0 + 10 * MIN);
  });
});

describe('another tab that holds the lock', () => {
  const peer = () => new BroadcastChannel('awaketab');
  const lock = (tabId: string, state: string): TMessage => ({ type: 'lock', tabId, ts: Date.now(), state });

  it('is forgotten once it has been silent for ten seconds', async () => {
    const wake = await load();
    const other = peer();
    other.postMessage(lock('other', 'held'));
    expect(wake.getSnapshot().peerHolds).toBe(true);
    await vi.advanceTimersByTimeAsync(9_000);
    expect(wake.getSnapshot().peerHolds).toBe(true);
    await vi.advanceTimersByTimeAsync(3_000);
    expect(wake.getSnapshot().peerHolds).toBe(false);
  });

  it('stays known while it keeps saying so', async () => {
    const wake = await load();
    const other = peer();
    for (let i = 0; i < 10; i += 1) {
      other.postMessage(lock('other', 'held'));
      await vi.advanceTimersByTimeAsync(3_000);
    }
    expect(wake.getSnapshot().peerHolds).toBe(true);
    other.postMessage({ type: 'bye', tabId: 'other', ts: Date.now() });
    expect(wake.getSnapshot().peerHolds).toBe(false);
  });

  it('hears from this tab every few seconds while it keeps the screen awake, and not after', async () => {
    const heard: TMessage[] = [];
    const other = peer();
    other.addEventListener('message', (ev) => heard.push((ev as MessageEvent<TMessage>).data));
    const wake = await load();
    wake.start(600);
    await vi.advanceTimersByTimeAsync(0);
    heard.length = 0;
    await vi.advanceTimersByTimeAsync(10_000);
    const beats = heard.filter((m) => m.type === 'lock' && m.state === 'held');
    expect(beats.length).toBeGreaterThanOrEqual(3);
    expect(beats.length).toBeLessThanOrEqual(4);
    wake.stop();
    await vi.advanceTimersByTimeAsync(0);
    heard.length = 0;
    await vi.advanceTimersByTimeAsync(10_000);
    expect(heard.filter((m) => m.state === 'held')).toHaveLength(0);
  });
});
