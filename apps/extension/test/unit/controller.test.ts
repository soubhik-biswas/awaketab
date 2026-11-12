import { STORAGE_KEYS, type ISession } from '@awaketab/core';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ALARMS, OFFSCREEN_PAGE } from '../../src/controller';
import { EXT_KEYS } from '../../src/settings';
import { BADGE } from '../../src/status';
import { createFakeChrome, flush } from './fake-chrome';
import { proRecord, wired } from './helpers';

const session = (fake: ReturnType<typeof createFakeChrome>) =>
  fake.local.data.get(STORAGE_KEYS.session) as ISession | undefined;
const controllers: Array<{ dispose(): void }> = [];
const track = <T extends { dispose(): void }>(ctl: T): T => {
  controllers.push(ctl);
  return ctl;
};

afterEach(() => {
  for (const ctl of controllers.splice(0)) ctl.dispose();
  vi.useRealTimers();
});

describe('background controller — keep-awake and badge', () => {
  it('starts from the popup: chrome.power display request, volt badge with minutes, 0.5-min tick, end alarm', async () => {
    const fake = createFakeChrome();
    const ctl = track(wired(fake));
    const state = await ctl.onMessage({ type: 'start', presetId: 'p60', tab: { tabId: 7, windowId: 1 } });
    expect(state?.view).toBe('awake');
    expect(state?.lock).toBe('held');
    expect(state?.session?.source).toBe('ext');
    expect(state?.session?.modeState).toMatchObject({ origin: 'user', tabId: 7, windowId: 1 });
    expect(fake.power.at(-1)).toEqual({ call: 'request', level: 'display' });
    expect(fake.badge.text).toBe('60');
    expect(fake.badge.color).toBe(BADGE.awake.bg);
    expect(fake.badge.textColor).toBe(BADGE.awake.fg);
    expect(fake.badge.title).toBe('AwakeTab — Awake · 60 min');
    expect(fake.alarms.get(ALARMS.tick)?.periodInMinutes).toBe(0.5);
    expect(Math.abs((fake.alarms.get(ALARMS.end)?.scheduledTime ?? 0) - (state?.session?.endsAt ?? 0))).toBeLessThan(
      50,
    );
  });

  it('no end reads ∞ on the badge and sets no end alarm; the badge timer switch shows ON instead', async () => {
    const fake = createFakeChrome();
    const ctl = track(wired(fake));
    await ctl.onMessage({ type: 'start', presetId: 'pinf' });
    expect(fake.badge.text).toBe('∞');
    expect(fake.alarms.has(ALARMS.end)).toBe(false);
    await fake.api.storage.local.set({ [EXT_KEYS.ext]: { v: 1, badge: false } });
    await flush(200);
    expect(fake.badge.text).toBe('ON');
  });

  it('pause releases the keep-awake and shows an amber II; resume asks again; stop clears everything', async () => {
    const fake = createFakeChrome();
    const ctl = track(wired(fake));
    await ctl.onMessage({ type: 'start', presetId: 'p30' });
    const paused = await ctl.onMessage({ type: 'pause' });
    expect(paused?.view).toBe('paused');
    expect(fake.power.at(-1)).toEqual({ call: 'release' });
    expect(fake.badge.text).toBe('II');
    expect(fake.badge.color).toBe(BADGE.paused.bg);
    expect(fake.alarms.has(ALARMS.tick)).toBe(false);
    expect(fake.alarms.has(ALARMS.end)).toBe(false);
    const resumed = await ctl.onMessage({ type: 'resume' });
    expect(resumed?.view).toBe('awake');
    expect(fake.power.at(-1)).toEqual({ call: 'request', level: 'display' });
    expect(fake.alarms.has(ALARMS.end)).toBe(true);
    const stopped = await ctl.onMessage({ type: 'stop' });
    expect(stopped?.view).toBe('ready');
    expect(fake.badge.text).toBe('');
    expect(fake.alarms.has(ALARMS.tick)).toBe(false);
  });

  it('a refused request is blocked: red ! badge, no session left running', async () => {
    const fake = createFakeChrome({ deny: true });
    const ctl = track(wired(fake));
    const state = await ctl.onMessage({ type: 'start', presetId: 'p15' });
    expect(state?.view).toBe('blocked');
    expect(state?.lock).toBe('denied');
    expect(session(fake)?.status).toBe('aborted');
    expect(fake.badge.text).toBe('!');
    expect(fake.badge.color).toBe(BADGE.blocked.bg);
    expect(fake.badge.title).toBe('AwakeTab — Blocked');
  });

  it('reports unsupported honestly when chrome.power is missing and never starts a session', async () => {
    const fake = createFakeChrome({ power: false });
    const ctl = track(wired(fake));
    const state = await ctl.onMessage({ type: 'start', presetId: 'pinf' });
    expect(state?.view).toBe('blocked');
    expect(state?.lock).toBe('unsupported');
    expect(state?.session).toBeNull();
  });

  it('Alt+Shift+A (the toggle command) starts the last length and stops again', async () => {
    const fake = createFakeChrome();
    fake.local.data.set(STORAGE_KEYS.settings, { defaultPreset: 'p15' });
    const ctl = track(wired(fake));
    await ctl.onCommand('toggle');
    expect(ctl.state().session?.presetId).toBe('p15');
    expect(ctl.state().origin).toBe('command');
    await ctl.onCommand('toggle');
    expect(ctl.state().view).toBe('ready');
  });

  it('picking another length mid-session replaces the plan with one lock', async () => {
    const fake = createFakeChrome();
    const ctl = track(wired(fake));
    await ctl.onMessage({ type: 'start', presetId: 'p15' });
    const state = await ctl.onMessage({ type: 'start', presetId: 'p60' });
    expect(state?.session?.plan).toEqual({ type: 'duration', ms: 3_600_000 });
    expect(state?.lock).toBe('held');
    expect(fake.offscreen).toEqual([]);
    await flush();
    // The popup opens on the length used last.
    expect((fake.local.data.get(STORAGE_KEYS.settings) as { defaultPreset?: string }).defaultPreset).toBe('p60');
  });

  it('ignores malformed messages', async () => {
    const fake = createFakeChrome();
    const ctl = track(wired(fake));
    expect(await ctl.onMessage({ type: 'start', presetId: 'p999' })).toBeNull();
    expect(await ctl.onMessage({ type: 'eval', code: '1' })).toBeNull();
    expect(await ctl.onMessage('start')).toBeNull();
    expect(fake.power).toEqual([]);
  });
});

describe('background controller — service-worker lifecycle', () => {
  it('re-hydrates a live session after a worker restart and re-issues the keep-awake', async () => {
    const fake = createFakeChrome();
    const first = wired(fake);
    const started = await first.onMessage({ type: 'start', presetId: 'p60' });
    await flush();
    first.dispose();
    fake.power.length = 0;
    const second = track(wired(fake));
    await second.onAlarm(ALARMS.tick);
    expect(second.state().session?.id).toBe(started?.session?.id);
    expect(second.state().lock).toBe('held');
    expect(fake.power[0]).toEqual({ call: 'request', level: 'display' });
  });

  it('a paused session stays paused across a restart, and Resume continues with the time that was left', async () => {
    const fake = createFakeChrome();
    let now = Date.parse('2026-10-31T10:00:00Z');
    const first = wired(fake, { now: () => now });
    await first.onMessage({ type: 'start', presetId: 'p30' });
    now += 10 * 60_000;
    await first.onMessage({ type: 'pause' });
    await flush();
    first.dispose();
    now += 60 * 60_000;
    fake.power.length = 0;
    const second = track(wired(fake, { now: () => now }));
    await second.onAlarm(ALARMS.tick);
    expect(second.state().view).toBe('paused');
    expect(fake.power).not.toContainEqual(expect.objectContaining({ call: 'request' }));
    expect(fake.badge.text).toBe('II');
    const resumed = await second.onMessage({ type: 'resume' });
    expect(resumed?.view).toBe('awake');
    expect(fake.badge.text).toBe('20');
  });

  it('a session paused and resumed is still running after a restart past its first end time', async () => {
    const fake = createFakeChrome();
    const t0 = Date.parse('2026-10-31T10:00:00Z');
    let now = t0;
    const first = wired(fake, { now: () => now });
    await first.onMessage({ type: 'start', presetId: 'p30' });
    now = t0 + 10 * 60_000;
    await first.onMessage({ type: 'pause' });
    now = t0 + 70 * 60_000;
    const resumed = await first.onMessage({ type: 'resume' });
    expect(resumed?.session?.endsAt).toBe(t0 + 90 * 60_000);
    expect(fake.alarms.get(ALARMS.end)?.scheduledTime).toBe(t0 + 90 * 60_000);
    await flush();
    first.dispose();

    now = t0 + 80 * 60_000;
    fake.power.length = 0;
    const second = track(wired(fake, { now: () => now }));
    await second.onAlarm(ALARMS.tick);
    expect(session(fake)?.status).toBe('active');
    expect(second.state().view).toBe('awake');
    expect(second.state().lock).toBe('held');
    expect(fake.power[0]).toEqual({ call: 'request', level: 'display' });
    expect(fake.badge.text).toBe('10');
    expect(fake.alarms.get(ALARMS.end)?.scheduledTime).toBe(t0 + 90 * 60_000);

    now = t0 + 90 * 60_000 + 20_000;
    second.dispose();
    const third = track(wired(fake, { now: () => now }));
    await third.onAlarm(ALARMS.end);
    expect(session(fake)?.status).toBe('completed');
    expect(session(fake)?.endedAt).toBe(t0 + 90 * 60_000);
  });

  it('a session saved with the first end time and a paused total is not ended early by the update', async () => {
    const fake = createFakeChrome();
    const t0 = Date.parse('2026-10-31T10:00:00Z');
    fake.local.data.set(STORAGE_KEYS.session, {
      v: 1,
      id: 'before-update',
      plan: { type: 'duration', ms: 30 * 60_000 },
      presetId: 'p30',
      mode: 'standard',
      startedAt: t0,
      endsAt: t0 + 30 * 60_000,
      status: 'active',
      pausedAt: null,
      pausedMs: 60 * 60_000,
      endedAt: null,
      endReason: null,
      awakeSeconds: 600,
      modeState: { origin: 'user' },
      source: 'ext',
    });
    const ctl = track(wired(fake, { now: () => t0 + 80 * 60_000 }));
    await ctl.onAlarm(ALARMS.tick);
    expect(ctl.state().view).toBe('awake');
    expect(ctl.state().session?.id).toBe('before-update');
    expect(fake.badge.text).toBe('10');
  });

  it('finalises a session that ended while the worker slept', async () => {
    const fake = createFakeChrome();
    let now = Date.parse('2026-10-31T08:00:00Z');
    const first = wired(fake, { now: () => now });
    await first.onMessage({ type: 'start', presetId: 'p15' });
    await flush();
    first.dispose();
    now += 15 * 60_000 + 20_000;
    fake.power.length = 0;
    const second = track(wired(fake, { now: () => now }));
    await second.onAlarm(ALARMS.end);
    expect(session(fake)?.status).toBe('completed');
    expect(fake.power).toContainEqual({ call: 'release' });
    expect(fake.power).not.toContainEqual(expect.objectContaining({ call: 'request' }));
    expect(second.state().view).toBe('ready');
  });

  it('completes on time while alive, releases the keep-awake and plays the chosen chime offscreen', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
    vi.setSystemTime(Date.parse('2026-10-31T08:00:00Z'));
    const fake = createFakeChrome();
    fake.local.data.set(STORAGE_KEYS.settings, { sound: { id: 'bell', volume: 0.4 } });
    const ctl = track(wired(fake));
    await ctl.onMessage({ type: 'start', presetId: 'p15' });
    await vi.advanceTimersByTimeAsync(15 * 60_000 + 1_000);
    await flush(30);
    expect(ctl.state().session?.status).toBe('completed');
    expect(fake.power.at(-1)).toEqual({ call: 'release' });
    expect(fake.badge.text).toBe('');
    expect(fake.offscreen).toEqual([`${OFFSCREEN_PAGE}?kind=bell&volume=0.4`]);
  });

  it('plays the two tones when they are chosen', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
    const fake = createFakeChrome();
    fake.local.data.set(STORAGE_KEYS.settings, { sound: { id: 'chime', volume: 0.6 } });
    const ctl = track(wired(fake));
    await ctl.onMessage({ type: 'start', presetId: 'p15' });
    await vi.advanceTimersByTimeAsync(15 * 60_000 + 1_000);
    await flush(30);
    expect(fake.offscreen).toEqual([`${OFFSCREEN_PAGE}?kind=two&volume=0.6`]);
  });

  it('stays silent on a new install, where no chime was chosen', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
    const fake = createFakeChrome();
    const ctl = track(wired(fake));
    await ctl.onMessage({ type: 'start', presetId: 'p15' });
    await vi.advanceTimersByTimeAsync(15 * 60_000 + 1_000);
    await flush(30);
    expect(ctl.state().session?.status).toBe('completed');
    expect(fake.offscreen).toEqual([]);
  });

  it('stays silent when the sound is off', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
    const fake = createFakeChrome();
    fake.local.data.set(STORAGE_KEYS.settings, { sound: { id: 'none', volume: 0.6 } });
    const ctl = track(wired(fake));
    await ctl.onMessage({ type: 'start', presetId: 'p15' });
    await vi.advanceTimersByTimeAsync(15 * 60_000 + 1_000);
    await flush(30);
    expect(ctl.state().session?.status).toBe('completed');
    expect(fake.offscreen).toEqual([]);
  });

  it('clears the alarms an older version set for its schedules', async () => {
    const fake = createFakeChrome();
    await fake.api.alarms.create('at.sched.work.start', { when: Date.now() + 60_000 });
    const ctl = track(wired(fake));
    await ctl.ready();
    expect([...fake.alarms.keys()].filter((n) => n.startsWith('at.sched.'))).toEqual([]);
  });

  it('opens no tab on install and records the install time', async () => {
    const fake = createFakeChrome();
    const ctl = track(wired(fake));
    await ctl.onInstalled('install');
    expect(fake.opened).toEqual([]);
    expect((fake.local.data.get(STORAGE_KEYS.meta) as { installedAt?: number }).installedAt).toBeGreaterThan(0);
  });
});

describe('background controller — storage, sync and privacy', () => {
  it('stores session and settings under at.v1.* and syncs settings, never the licence', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const fake = createFakeChrome();
    fake.local.data.set(STORAGE_KEYS.license, await proRecord());
    const ctl = track(wired(fake));
    await ctl.onMessage({ type: 'start', presetId: 'pinf' });
    await fake.api.storage.local.set({ [STORAGE_KEYS.settings]: { theme: 'dark' } });
    await fake.api.storage.local.set({ [EXT_KEYS.ext]: { v: 1, badge: false } });
    await flush();
    await vi.advanceTimersByTimeAsync(3_000);
    expect(fake.local.data.has(STORAGE_KEYS.session)).toBe(true);
    expect(fake.local.data.has(EXT_KEYS.device)).toBe(true);
    const synced = fake.sync.sets.flatMap((items) => Object.keys(items));
    expect(synced).toEqual(expect.arrayContaining([STORAGE_KEYS.settings, EXT_KEYS.ext]));
    expect(synced).not.toContain(STORAGE_KEYS.license);
    expect(synced).not.toContain(EXT_KEYS.device);
    expect(synced).not.toContain(STORAGE_KEYS.session);
  });

  it('seeds a fresh profile from chrome.storage.sync', async () => {
    const fake = createFakeChrome();
    fake.sync.data.set(EXT_KEYS.ext, { v: 1, badge: false });
    const ctl = track(wired(fake));
    await ctl.ready();
    await ctl.onMessage({ type: 'start', presetId: 'p15' });
    expect(fake.badge.text).toBe('ON');
  });

  it('sends nothing over the network without a stored licence', async () => {
    const fetchFn = vi.fn(() => Promise.resolve(new Response('{}')));
    const fake = createFakeChrome();
    const ctl = track(wired(fake, { fetchFn }));
    await ctl.onMessage({ type: 'start', presetId: 'p15' });
    await ctl.onMessage({ type: 'stop' });
    await ctl.onAlarm(ALARMS.license);
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it('drops a licence an earlier version stored once it is revoked; nothing depends on it', async () => {
    const at = Date.parse('2026-10-31T10:00:00Z');
    const fake = createFakeChrome();
    fake.local.data.set(STORAGE_KEYS.license, await proRecord(['ext.autostart'], at - 2 * 86_400_000));
    const fetchFn = vi.fn(() => Promise.resolve(Response.json({ revoked: true })));
    const ctl = track(wired(fake, { now: () => at, fetchFn }));
    await ctl.onAlarm(ALARMS.license);
    await flush(30);
    expect(fetchFn).toHaveBeenCalled();
    expect(fake.local.data.has(STORAGE_KEYS.license)).toBe(false);
  });
});

describe('background controller — auto-wake and release when hidden (free)', () => {
  const sites = (on = true) => ({
    v: 1,
    autostart: { on, sites: [{ host: 'meet.example.com', durationMin: null }] },
  });

  it('a matching tab starts with no licence, closing the last one stops; other sites are ignored', async () => {
    const fake = createFakeChrome();
    fake.local.data.set(EXT_KEYS.ext, sites());
    fake.granted.origins.add('https://meet.example.com/*');
    const ctl = track(wired(fake));
    await ctl.onTabUpdated(1, { status: 'complete' }, { id: 1 });
    await ctl.onTabUpdated(2, { status: 'complete' }, { id: 2, url: 'https://news.example.org/' });
    expect(ctl.state().session).toBeNull();
    const tab = { id: 3, windowId: 1, url: 'https://meet.example.com/abc' };
    fake.tabs.push(tab);
    await ctl.onTabUpdated(3, { status: 'complete' }, tab);
    expect(ctl.state().origin).toBe('autostart');
    expect(ctl.state().lock).toBe('held');
    fake.tabs.splice(0);
    await ctl.onTabRemoved(3);
    expect(ctl.state().view).toBe('ready');
  });

  it('the auto-wake switch turns it off without forgetting the sites', async () => {
    const fake = createFakeChrome();
    fake.local.data.set(EXT_KEYS.ext, sites(false));
    fake.granted.origins.add('https://meet.example.com/*');
    const ctl = track(wired(fake));
    await ctl.onTabUpdated(3, { status: 'complete' }, { id: 3, url: 'https://meet.example.com/abc' });
    expect(ctl.state().session).toBeNull();
  });

  it('release when hidden: another tab pauses it as "tab hidden", coming back resumes it', async () => {
    const fake = createFakeChrome();
    fake.local.data.set(EXT_KEYS.ext, { v: 1, releaseHidden: true });
    fake.tabs.push({ id: 7, windowId: 1, active: true }, { id: 8, windowId: 1, active: false });
    const ctl = track(wired(fake));
    await ctl.onMessage({ type: 'start', presetId: 'p60', tab: { tabId: 7, windowId: 1 } });
    fake.tabs[0] = { id: 7, windowId: 1, active: false };
    fake.tabs[1] = { id: 8, windowId: 1, active: true };
    await ctl.onTabActivated({ tabId: 8, windowId: 1 });
    expect(ctl.state().view).toBe('paused');
    expect(ctl.state().hidden).toBe(true);
    expect(fake.badge.text).toBe('II');
    expect(fake.badge.title).toBe('AwakeTab — Paused · tab hidden');
    fake.tabs[0] = { id: 7, windowId: 1, active: true };
    fake.tabs[1] = { id: 8, windowId: 1, active: false };
    await ctl.onTabActivated({ tabId: 7, windowId: 1 });
    expect(ctl.state().view).toBe('awake');
    fake.windows.set(1, 'minimized');
    await ctl.onWindowFocus(-1);
    expect(ctl.state().view).toBe('paused');
  });

  it('with the switch off (the default) the session keeps the screen on in any tab', async () => {
    const fake = createFakeChrome();
    fake.tabs.push({ id: 7, windowId: 1, active: false }, { id: 8, windowId: 1, active: true });
    const ctl = track(wired(fake));
    await ctl.onMessage({ type: 'start', presetId: 'p60', tab: { tabId: 7, windowId: 1 } });
    await ctl.onTabActivated({ tabId: 8, windowId: 1 });
    expect(ctl.state().view).toBe('awake');
  });
});
