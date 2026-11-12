import { describe, expect, it } from 'vitest';
import { STORAGE_KEYS } from '../src/constants.js';
import { createStorage, memoryAdapter } from '../src/storage.js';
import { creditMinutes } from '../src/stats.js';
import { DEFAULT_SETTINGS, DEFAULT_STATS } from '../src/types.js';

describe('storage', () => {
  it('applies defaults for missing keys', () => {
    const store = createStorage(memoryAdapter());
    expect(store.settings().defaultPreset).toBe(DEFAULT_SETTINGS.defaultPreset);
    expect(store.session()).toBeNull();
  });

  it('returns defaults for corrupt JSON', () => {
    const mem = memoryAdapter();
    mem.set(STORAGE_KEYS.settings, '{not json');
    const store = createStorage(mem);
    expect(store.settings().theme).toBe('auto');
  });

  it('migrate is idempotent and clearAll removes at.v1 keys', () => {
    const mem = memoryAdapter();
    const store = createStorage(mem);
    store.writeSettings({ ...store.settings(), telemetry: false });
    store.migrate();
    store.migrate();
    expect(store.settings().telemetry).toBe(false);
    store.clearAll();
    expect(mem.get(STORAGE_KEYS.settings)).toBeNull();
  });

  it('repairs corrupt stats instead of throwing', () => {
    const mem = memoryAdapter();
    const store = createStorage(mem);
    for (const raw of [
      '{"v":1,"days":null}',
      '{"v":1,"days":"x","totalMinutes":"many","sessions":null}',
      '{"v":1,"days":[1,2],"daySessions":null,"dayFocus":7}',
      '[]',
      'null',
      '42',
      '{not json',
    ]) {
      mem.set(STORAGE_KEYS.stats, raw);
      const stats = store.stats();
      expect(stats.days, raw).toEqual({});
      expect(stats.totalMinutes, raw).toBe(0);
      expect(stats.sessions, raw).toBe(0);
      expect(stats.daySessions, raw).toBeUndefined();
      expect(() => {
        creditMinutes(stats, Date.now(), 1);
      }, raw).not.toThrow();
      expect(stats.totalMinutes, raw).toBe(1);
    }
  });

  it('keeps what is sound in stats that are only partly corrupt', () => {
    const mem = memoryAdapter();
    const store = createStorage(mem);
    const today = new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(
      new Date(),
    );
    mem.set(
      STORAGE_KEYS.stats,
      JSON.stringify({ v: 1, days: { [today]: 12, junk: 'x' }, totalMinutes: 90, sessions: 'three' }),
    );
    const stats = store.stats();
    expect(stats.days).toEqual({ [today]: 12 });
    expect(stats.totalMinutes).toBe(90);
    expect(stats.sessions).toBe(0);
  });

  it('never hands a default object out twice', () => {
    const store = createStorage(memoryAdapter());
    store.stats().days.x = 5;
    expect(store.stats().days).toEqual({});
    expect(DEFAULT_STATS.days).toEqual({});
  });

  it('drops a stored session it cannot trust and repairs the rest', () => {
    const mem = memoryAdapter();
    const store = createStorage(mem);
    const good = {
      v: 1,
      id: 'a',
      plan: { type: 'duration', ms: 60_000 },
      presetId: 'custom',
      mode: 'standard',
      startedAt: 1_000,
      endsAt: 61_000,
      status: 'active',
      pausedAt: null,
      pausedMs: 0,
      endedAt: null,
      endReason: null,
      awakeSeconds: 0,
      modeState: {},
      source: 'web',
    };
    for (const bad of [
      'null',
      '"active"',
      '[]',
      '{}',
      '{not json',
      JSON.stringify({ ...good, plan: null }),
      JSON.stringify({ ...good, plan: { type: 'duration' } }),
      JSON.stringify({ ...good, plan: { type: 'until', endsAt: 61_000 } }),
      JSON.stringify({ ...good, startedAt: 'now' }),
      JSON.stringify({ ...good, endsAt: 'later' }),
      JSON.stringify({ ...good, status: 'paused', pausedAt: 'a while ago' }),
    ]) {
      mem.set(STORAGE_KEYS.session, bad);
      expect(store.session(), bad).toBeNull();
    }
    mem.set(STORAGE_KEYS.session, JSON.stringify(good));
    expect(store.session()).toEqual(good);
    mem.set(STORAGE_KEYS.session, JSON.stringify({ ...good, pausedMs: null, modeState: null }));
    expect(store.session()).toEqual(good);
    mem.set(STORAGE_KEYS.session, JSON.stringify({ ...good, plan: { type: 'indefinite' }, endsAt: null }));
    expect(store.session()?.endsAt).toBeNull();
  });
});
