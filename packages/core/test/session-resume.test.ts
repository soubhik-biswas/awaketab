import { describe, expect, it } from 'vitest';
import { createWakeLock } from '../../wake/src/index.js';
import { createFakeApi } from '../../wake/test/fake.js';
import { createSession } from '../src/session.js';
import { createStorage, memoryAdapter } from '../src/storage.js';
import { DEFAULT_SETTINGS } from '../src/types.js';

function engineAt(storage: ReturnType<typeof createStorage>, now: { t: number }, resumeIndefiniteMs?: number) {
  const lock = createWakeLock({ wakeLock: createFakeApi().api, documentLike: document, fallback: 'none' });
  return createSession({
    lock,
    storage,
    channel: null,
    settings: () => DEFAULT_SETTINGS,
    now: () => now.t,
    ...(resumeIndefiniteMs !== undefined ? { resumeIndefiniteMs } : {}),
  });
}

describe('resumeIndefiniteMs', () => {
  it('keeps the 12 h web default for indefinite sessions', async () => {
    const storage = createStorage(memoryAdapter());
    const now = { t: 1_000_000 };
    const first = engineAt(storage, now);
    await first.start({ type: 'indefinite' }, { presetId: 'pinf', mode: 'standard' });
    first.destroy();
    now.t += 11 * 3_600_000;
    expect(engineAt(storage, now).getResumable()?.plan.type).toBe('indefinite');
    now.t += 2 * 3_600_000;
    expect(engineAt(storage, now).getResumable()).toBeNull();
  });

  it('lets the extension worker resume an indefinite session of any age', async () => {
    const storage = createStorage(memoryAdapter());
    const now = { t: 1_000_000 };
    const first = engineAt(storage, now, Number.POSITIVE_INFINITY);
    await first.start({ type: 'indefinite' }, { presetId: 'pinf', mode: 'standard', source: 'ext' });
    first.destroy();
    now.t += 30 * 3_600_000;
    const second = engineAt(storage, now, Number.POSITIVE_INFINITY);
    expect(second.getResumable()?.source).toBe('ext');
    expect(await second.resumeSession()).toBe('held');
    expect(second.session?.startedAt).toBe(1_000_000);
    second.destroy();
  });
});

describe('resuming after a pause', () => {
  const T0 = Date.parse('2026-10-31T10:00:00Z');
  const MIN = 60_000;

  it('a session paused and resumed is still running after a restart past its first end time', async () => {
    const storage = createStorage(memoryAdapter());
    const now = { t: T0 };
    const first = engineAt(storage, now);
    await first.start({ type: 'duration', ms: 30 * MIN }, { presetId: 'p30', mode: 'standard', source: 'ext' });
    now.t = T0 + 10 * MIN;
    first.pause();
    now.t = T0 + 70 * MIN;
    await first.resume();
    expect(first.session?.endsAt).toBe(T0 + 90 * MIN);
    first.destroy();

    now.t = T0 + 80 * MIN;
    const second = engineAt(storage, now);
    const stored = second.getResumable();
    expect(stored?.status).toBe('active');
    expect(stored?.endsAt).toBe(T0 + 90 * MIN);
    const ticks: Array<number | null> = [];
    second.on('tick', (e) => ticks.push(e.remainingMs));
    expect(await second.resumeSession()).toBe('held');
    expect(second.session?.status).toBe('active');
    expect((second.session?.endsAt ?? 0) - now.t).toBe(10 * MIN);
    second.destroy();
  });

  it('is no longer resumable once the moved end time has passed', async () => {
    const storage = createStorage(memoryAdapter());
    const now = { t: T0 };
    const first = engineAt(storage, now);
    await first.start({ type: 'duration', ms: 30 * MIN }, { presetId: 'p30', mode: 'standard' });
    now.t = T0 + 10 * MIN;
    first.pause();
    now.t = T0 + 70 * MIN;
    await first.resume();
    first.destroy();
    now.t = T0 + 91 * MIN;
    expect(engineAt(storage, now).getResumable()).toBeNull();
  });

  it('a session still paused keeps the time it had, however long the restart takes', async () => {
    const storage = createStorage(memoryAdapter());
    const now = { t: T0 };
    const first = engineAt(storage, now);
    await first.start({ type: 'duration', ms: 30 * MIN }, { presetId: 'p30', mode: 'standard' });
    now.t = T0 + 10 * MIN;
    first.pause();
    first.destroy();

    now.t = T0 + 5 * 60 * MIN;
    const second = engineAt(storage, now);
    expect(second.getResumable()?.status).toBe('paused');
    expect(await second.resumeSession()).toBe('held');
    expect((second.session?.endsAt ?? 0) - now.t).toBe(20 * MIN);
    expect(second.session?.pausedMs).toBe(290 * MIN);
    second.destroy();
  });

  it('reads a session saved with the first end time and a paused total as ending later by that total', () => {
    const storage = createStorage(memoryAdapter());
    storage.adapter.set(
      'at.v1.session',
      JSON.stringify({
        v: 1,
        id: 'old',
        plan: { type: 'duration', ms: 30 * MIN },
        presetId: 'p30',
        mode: 'standard',
        startedAt: T0,
        endsAt: T0 + 30 * MIN,
        status: 'active',
        pausedAt: null,
        pausedMs: 60 * MIN,
        endedAt: null,
        endReason: null,
        awakeSeconds: 600,
        modeState: {},
        source: 'ext',
      }),
    );
    expect(storage.session()?.endsAt).toBe(T0 + 90 * MIN);
    const now = { t: T0 + 80 * MIN };
    expect(engineAt(storage, now).getResumable()?.id).toBe('old');
    storage.writeSession(storage.session());
    expect(storage.session()?.endsAt).toBe(T0 + 90 * MIN);
  });
});
