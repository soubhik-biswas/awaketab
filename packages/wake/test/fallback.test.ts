import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createWakeLock } from '../src/index.js';
import { fakeMedia, setVisibility } from './fake.js';

describe('video fallback reports only what is really playing', () => {
  let media: ReturnType<typeof fakeMedia>;

  beforeEach(() => {
    media = fakeMedia();
    vi.useFakeTimers();
  });

  afterEach(() => {
    media.restore();
    vi.useRealTimers();
    document.body.replaceChildren();
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' });
  });

  const make = (nudgeIntervalMs = 20_000) =>
    createWakeLock({ wakeLock: null, documentLike: document, fallback: 'video', nudgeIntervalMs });

  // Lets the clip module arrive, then gives the engine the time it takes to see the clock move (or not).
  async function settle(ms = 300) {
    await vi.dynamicImportSettled();
    await vi.advanceTimersByTimeAsync(ms);
  }

  async function started(lock: ReturnType<typeof make>) {
    void lock.request();
    await settle();
    expect(lock.state).toBe('fallback');
  }

  it('a playing clip is reported as fallback', async () => {
    const lock = make();
    const states: string[] = [];
    lock.on('change', (e) => states.push(`${e.to}:${e.reason}`));
    const asked = lock.request();
    expect(lock.state).toBe('requesting');
    await settle();
    expect(lock.state).toBe('fallback');
    expect(await asked).toBe('fallback');
    expect(states).toEqual(['requesting:request', 'fallback:fallback_started']);
    expect(lock.mode).toBe('video');
    expect(lock.advice).toBeNull();
    lock.destroy();
  });

  it('the element is drawn on the page, has sound switched on and does not loop', async () => {
    const lock = make();
    await started(lock);
    const v = document.querySelector('video');
    expect(v?.isConnected).toBe(true);
    expect(v?.hasAttribute('hidden')).toBe(false);
    expect(v?.hasAttribute('muted')).toBe(false);
    expect(v?.muted).toBe(false);
    expect(v?.hasAttribute('loop')).toBe(false);
    expect(v?.loop).toBe(false);
    expect(v?.hasAttribute('playsinline')).toBe(true);
    expect(v?.style.display).not.toBe('none');
    expect(v?.style.width).toBe('1px');
    expect(v?.style.height).toBe('1px');
    expect(Number(v?.style.opacity)).toBeGreaterThan(0);
    expect(v?.style.pointerEvents).toBe('none');
    lock.destroy();
  });

  it('play() is called in the same call stack as request(), before the clip has loaded', () => {
    const lock = make();
    void lock.request();
    expect(media.plays).toBe(1);
    expect(document.querySelectorAll('video source')).toHaveLength(0);
    lock.destroy();
  });

  it('a rejected play() is not held: unsupported with advice and an error', async () => {
    media.reject = new DOMException('needs a tap', 'NotAllowedError');
    const lock = make();
    const errors: unknown[] = [];
    lock.on('error', (e) => errors.push(e.error));
    expect(await lock.request()).toBe('unsupported');
    expect(lock.usingFallback).toBe(false);
    expect(lock.advice).toBe('unsupported_browser');
    expect(errors).toEqual([media.reject]);
    expect(document.querySelector('video')).toBeNull();
    lock.destroy();
  });

  it('a clip whose play() resolves but whose clock never moves is not held', async () => {
    media.moving = false;
    const lock = make();
    const states: string[] = [];
    lock.on('change', (e) => states.push(e.to));
    const asked = lock.request();
    await settle(2_500);
    expect(lock.state).toBe('unsupported');
    expect(await asked).toBe('unsupported');
    expect(states).not.toContain('fallback');
    expect(lock.advice).toBe('unsupported_browser');
    expect(document.querySelector('video')).toBeNull();
    lock.destroy();
  });

  it('a clip without enough data to play is not held', async () => {
    media.readyState = 1;
    const lock = make();
    void lock.request();
    await settle(2_500);
    expect(lock.state).toBe('unsupported');
    expect(lock.usingFallback).toBe(false);
    lock.destroy();
  });

  it('a clip that stalls later is reported lost with advice, after one restart was tried', async () => {
    const lock = make(5_000);
    await started(lock);
    const events: string[] = [];
    lock.on('change', (e) => events.push(`${e.to}:${e.reason}:${e.advice ?? ''}`));
    const plays = media.plays;
    media.moving = false;
    await vi.advanceTimersByTimeAsync(5_000);
    expect(media.plays).toBeGreaterThan(plays);
    expect(lock.state).toBe('fallback');
    await vi.advanceTimersByTimeAsync(2_000);
    expect(lock.state).toBe('lost');
    expect(events).toEqual(['lost:released_platform:unsupported_browser']);
    expect(lock.usingFallback).toBe(false);
    expect(lock.advice).toBe('unsupported_browser');
    expect(media.paused).toBe(true);
    lock.destroy();
  });

  it('a clip the browser paused is reported lost when it cannot be restarted', async () => {
    const lock = make(5_000);
    await started(lock);
    media.paused = true;
    media.reject = new DOMException('needs a tap', 'NotAllowedError');
    await vi.advanceTimersByTimeAsync(5_000);
    expect(lock.state).toBe('lost');
    lock.destroy();
  });

  it('a stall that one restart cures stays fallback', async () => {
    const lock = make(5_000);
    await started(lock);
    const states: string[] = [];
    lock.on('change', (e) => states.push(e.to));
    media.paused = true;
    await vi.advanceTimersByTimeAsync(5_000);
    await vi.advanceTimersByTimeAsync(1_000);
    expect(media.paused).toBe(false);
    expect(states).toEqual([]);
    expect(lock.state).toBe('fallback');
    lock.destroy();
  });

  it('a lost clip is asked for again by request()', async () => {
    const lock = make(5_000);
    await started(lock);
    media.moving = false;
    await vi.advanceTimersByTimeAsync(7_000);
    expect(lock.state).toBe('lost');
    media.moving = true;
    void lock.request();
    await settle();
    expect(lock.state).toBe('fallback');
    expect(document.querySelectorAll('video')).toHaveLength(1);
    lock.destroy();
  });

  it('rewinds before the end and restarts on ended instead of looping', async () => {
    const lock = make();
    await started(lock);
    const v = document.querySelector('video');
    media.clock = 8.5;
    v?.dispatchEvent(new Event('timeupdate'));
    expect(media.clock).toBe(0);
    media.clock = 3;
    v?.dispatchEvent(new Event('timeupdate'));
    expect(media.clock).toBeGreaterThanOrEqual(3);
    media.paused = true;
    const plays = media.plays;
    v?.dispatchEvent(new Event('ended'));
    expect(media.clock).toBe(0);
    expect(media.plays).toBe(plays + 1);
    expect(media.paused).toBe(false);
    lock.destroy();
  });

  it('pauses while hidden and plays again when visible', async () => {
    const lock = make();
    await started(lock);
    setVisibility(document, 'hidden');
    expect(lock.state).toBe('lost');
    expect(lock.advice).toBe('hidden_document');
    expect(media.paused).toBe(true);
    document.querySelector('video')?.dispatchEvent(new Event('ended'));
    expect(media.paused).toBe(true);
    setVisibility(document, 'visible');
    await settle();
    expect(lock.state).toBe('fallback');
    expect(media.paused).toBe(false);
    lock.destroy();
  });

  it('release while the clip is still starting ends idle with no element', async () => {
    media.hang = true;
    const lock = make();
    const asked = lock.request();
    expect(lock.state).toBe('requesting');
    await lock.release();
    expect(await asked).toBe('idle');
    expect(lock.state).toBe('idle');
    expect(document.querySelector('video')).toBeNull();
    lock.destroy();
  });

  it('release from fallback removes the element and stops the watchdog', async () => {
    const lock = make(5_000);
    await started(lock);
    await lock.release();
    expect(lock.state).toBe('idle');
    expect(document.querySelector('video')).toBeNull();
    expect(media.paused).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
    lock.destroy();
  });
});
