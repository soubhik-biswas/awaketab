import { afterEach, describe, expect, it, vi } from 'vitest';
import { createWakeLock } from '../src/index.js';
import { createFakeApi, fakeMedia, FakeSentinel, setVisibility } from './fake.js';

const live = (fake: ReturnType<typeof createFakeApi>) => fake.sentinels.filter((s) => !s.released);

// An API whose requests stay pending until the test settles them, in the order they were made.
function deferredApi() {
  const fake = createFakeApi();
  const waiting: Array<() => void> = [];
  const api = {
    request: () =>
      new Promise<FakeSentinel>((resolve) => {
        waiting.push(() => {
          const s = new FakeSentinel();
          fake.sentinels.push(s);
          resolve(s);
        });
      }),
  };
  return { ...fake, api, waiting, settle: () => waiting.shift()?.() };
}

describe('one live sentinel at a time', () => {
  let media: ReturnType<typeof fakeMedia> | null = null;

  afterEach(() => {
    media?.restore();
    media = null;
    vi.useRealTimers();
    document.body.replaceChildren();
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' });
  });

  it('keeps exactly one live sentinel through any number of fullscreen changes, and none after release', async () => {
    const fake = createFakeApi();
    const asked = vi.spyOn(fake.api, 'request');
    const lock = createWakeLock({ wakeLock: fake.api, documentLike: document, fallback: 'none' });
    await lock.request();
    for (let i = 0; i < 6; i += 1) {
      document.dispatchEvent(new Event('fullscreenchange'));
      await Promise.resolve();
      await Promise.resolve();
    }
    expect(asked).toHaveBeenCalledTimes(1);
    expect(fake.sentinels).toHaveLength(1);
    expect(live(fake)).toHaveLength(1);
    expect(lock.state).toBe('held');
    await lock.release();
    expect(live(fake)).toHaveLength(0);
    expect(lock.state).toBe('idle');
    lock.destroy();
  });

  it('gets one sentinel back when the browser drops the lock for a fullscreen change', async () => {
    const fake = createFakeApi();
    const lock = createWakeLock({ wakeLock: fake.api, documentLike: document, fallback: 'none' });
    await lock.request();
    void fake.sentinels[0]?.release();
    document.dispatchEvent(new Event('fullscreenchange'));
    await vi.waitFor(() => expect(lock.state).toBe('held'));
    expect(fake.sentinels).toHaveLength(2);
    expect(live(fake)).toHaveLength(1);
    await lock.release();
    expect(live(fake)).toHaveLength(0);
    lock.destroy();
  });

  it('request() while held resolves held without asking the browser again', async () => {
    const fake = createFakeApi();
    const asked = vi.spyOn(fake.api, 'request');
    const lock = createWakeLock({ wakeLock: fake.api, documentLike: document, fallback: 'none' });
    await lock.request();
    const changes: string[] = [];
    lock.on('change', (e) => changes.push(e.to));
    expect(await lock.request()).toBe('held');
    expect(await lock.request()).toBe('held');
    expect(asked).toHaveBeenCalledTimes(1);
    expect(changes).toEqual([]);
    expect(live(fake)).toHaveLength(1);
    lock.destroy();
  });

  it('two request() calls in a row share one browser request', async () => {
    const fake = deferredApi();
    const lock = createWakeLock({ wakeLock: fake.api, documentLike: document, fallback: 'none' });
    const first = lock.request();
    const second = lock.request();
    expect(fake.waiting).toHaveLength(1);
    fake.settle();
    expect(await first).toBe('held');
    expect(await second).toBe('held');
    expect(fake.sentinels).toHaveLength(1);
    lock.destroy();
  });

  it('rapid request, release, request settles held with one live sentinel', async () => {
    const fake = deferredApi();
    const lock = createWakeLock({ wakeLock: fake.api, documentLike: document, fallback: 'none' });
    const first = lock.request();
    const released = lock.release();
    const second = lock.request();
    // The second request waits for the first and the release to settle: the browser has been asked once so far.
    expect(fake.waiting).toHaveLength(1);
    fake.settle();
    await first;
    await released;
    await vi.waitFor(() => expect(fake.waiting).toHaveLength(1));
    fake.settle();
    expect(await second).toBe('held');
    expect(lock.state).toBe('held');
    expect(fake.sentinels).toHaveLength(2);
    expect(live(fake)).toHaveLength(1);
    await lock.release();
    expect(live(fake)).toHaveLength(0);
    lock.destroy();
  });

  it('release during a pending request ends idle with no live sentinel', async () => {
    const fake = deferredApi();
    const lock = createWakeLock({ wakeLock: fake.api, documentLike: document, fallback: 'none' });
    const asked = lock.request();
    expect(lock.state).toBe('requesting');
    const released = lock.release();
    fake.settle();
    await asked;
    await released;
    expect(lock.state).toBe('idle');
    expect(fake.sentinels).toHaveLength(1);
    expect(live(fake)).toHaveLength(0);
    lock.destroy();
  });

  it('stop then start in the same tick leaves one live sentinel', async () => {
    const fake = createFakeApi();
    const lock = createWakeLock({ wakeLock: fake.api, documentLike: document, fallback: 'none' });
    await lock.request();
    void lock.release();
    expect(await lock.request()).toBe('held');
    expect(fake.sentinels).toHaveLength(2);
    expect(live(fake)).toHaveLength(1);
    expect(fake.sentinels[0]?.released).toBe(true);
    lock.destroy();
  });

  it('releases a sentinel it replaces, and its late release event is not read as a loss', async () => {
    const fake = createFakeApi();
    const lock = createWakeLock({ wakeLock: fake.api, documentLike: document, fallback: 'none' });
    await lock.request();
    const old = fake.sentinels[0];
    // The browser released it without the event reaching the page.
    if (old) old.released = true;
    expect(await lock.request()).toBe('held');
    expect(fake.sentinels).toHaveLength(2);
    const states: string[] = [];
    lock.on('change', (e) => states.push(e.to));
    old?.dispatchEvent(new Event('release'));
    expect(states).toEqual([]);
    expect(lock.state).toBe('held');
    expect(live(fake)).toHaveLength(1);
    lock.destroy();
  });

  it('notices on a fullscreen change that the browser released the sentinel without an event', async () => {
    const fake = createFakeApi();
    const lock = createWakeLock({ wakeLock: fake.api, documentLike: document, fallback: 'none' });
    await lock.request();
    const old = fake.sentinels[0];
    if (old) old.released = true;
    const reasons: string[] = [];
    lock.on('change', (e) => reasons.push(`${e.to}:${e.reason}`));
    document.dispatchEvent(new Event('fullscreenchange'));
    await vi.waitFor(() => expect(lock.state).toBe('held'));
    expect(reasons).toEqual(['lost:released_platform', 'requesting:retry', 'held:acquired']);
    expect(fake.sentinels).toHaveLength(2);
    expect(live(fake)).toHaveLength(1);
    lock.destroy();
  });

  it('a lock lost while hidden comes back as a single sentinel', async () => {
    const fake = createFakeApi();
    const lock = createWakeLock({ wakeLock: fake.api, documentLike: document, fallback: 'none' });
    await lock.request();
    setVisibility(document, 'hidden');
    fake.releaseAll();
    setVisibility(document, 'visible');
    document.dispatchEvent(new Event('fullscreenchange'));
    await vi.waitFor(() => expect(lock.state).toBe('held'));
    expect(live(fake)).toHaveLength(1);
    lock.destroy();
  });
});

describe('destroy()', () => {
  let media: ReturnType<typeof fakeMedia> | null = null;

  afterEach(() => {
    media?.restore();
    media = null;
    vi.useRealTimers();
    vi.restoreAllMocks();
    document.body.replaceChildren();
  });

  it('releases the sentinel and removes every document listener', async () => {
    const fake = createFakeApi();
    const added = vi.spyOn(document, 'addEventListener');
    const removed = vi.spyOn(document, 'removeEventListener');
    const lock = createWakeLock({ wakeLock: fake.api, documentLike: document, fallback: 'none' });
    await lock.request();
    const sentinel = fake.sentinels[0];
    const detached = sentinel ? vi.spyOn(sentinel, 'removeEventListener') : null;
    lock.destroy();
    expect(sentinel?.released).toBe(true);
    expect(live(fake)).toHaveLength(0);
    expect(detached).toHaveBeenCalledWith('release', expect.any(Function));
    const listeners = added.mock.calls.map(([type, cb]) => [type, cb]);
    expect(listeners.map(([type]) => type).sort()).toEqual(['fullscreenchange', 'visibilitychange']);
    for (const [type, cb] of listeners) expect(removed).toHaveBeenCalledWith(type, cb);
    expect(lock.state).toBe('idle');
    expect(await lock.request()).toBe('idle');
    expect(fake.sentinels).toHaveLength(1);
  });

  it('leaves no retry timer behind', async () => {
    vi.useFakeTimers();
    const fake = createFakeApi();
    fake.api.request = () => Promise.reject(new DOMException('denied', 'NotAllowedError'));
    const lock = createWakeLock({ wakeLock: fake.api, documentLike: document, fallback: 'none' });
    await lock.request();
    expect(vi.getTimerCount()).toBe(1);
    lock.destroy();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('releases a sentinel that arrives after destroy', async () => {
    const fake = deferredApi();
    const lock = createWakeLock({ wakeLock: fake.api, documentLike: document, fallback: 'none' });
    const asked = lock.request();
    lock.destroy();
    fake.settle();
    await asked;
    expect(fake.sentinels).toHaveLength(1);
    expect(live(fake)).toHaveLength(0);
    expect(lock.state).toBe('idle');
  });

  it('removes the fallback video and its timers', async () => {
    vi.useFakeTimers();
    media = fakeMedia();
    const lock = createWakeLock({ wakeLock: null, documentLike: document, fallback: 'video' });
    void lock.request();
    await vi.waitFor(() => expect(lock.state).toBe('fallback'));
    expect(document.querySelectorAll('video')).toHaveLength(1);
    lock.destroy();
    expect(document.querySelector('video')).toBeNull();
    expect(media.paused).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
    expect(lock.state).toBe('idle');
  });
});
