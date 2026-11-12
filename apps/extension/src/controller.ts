import {
  createSession,
  createStorage,
  planFromPreset,
  STORAGE_KEYS,
  type ISession,
  type ISessionEngine,
  type TEndReason,
  type TPlan,
  type TPresetId,
} from '@awaketab/core';
import type { IAlarmInfo, IExtApi, IStorageChange, ITab } from './api';
import { format, resolveLocale, type TCatalog, type TLocale, type TVars } from './i18n';
import { revalidate } from './license';
import { parseRequest, type IExtState, type ITabRef } from './messages';
import { createPowerLock } from './power';
import {
  EXT_KEYS,
  matchSite,
  originPattern,
  presetOf,
  readExt,
  readSettings,
  SYNC_KEYS,
  type IExtSettings,
  type TExtPreset,
} from './settings';
import {
  badgeOf,
  hiddenPause,
  isLive,
  originOf,
  pillCopy,
  remainingMs,
  tabOf,
  viewOf,
  type IBadge,
  type TExtView,
  type TOrigin,
} from './status';
import { createChromeStorageAdapter } from './storage';

export const ALARMS = { tick: 'at.tick', end: 'at.end', license: 'at.license' } as const;
const TICK_PERIOD_MIN = 0.5;
const LICENSE_PERIOD_MIN = 60;
const SYNC_DEBOUNCE_MS = 2_000;
const CHIME_MS = 3_000;
const LEGACY_ALARM_PREFIX = 'at.sched.';
export const OFFSCREEN_PAGE = 'offscreen.html';

type TFetch = (input: string, init?: RequestInit) => Promise<Response>;

export interface IControllerOptions {
  api: IExtApi;
  catalogs: Partial<Record<TLocale, TCatalog>>;
  now?: () => number;
  fetchFn?: TFetch;
  setTimeout?: typeof setTimeout;
  clearTimeout?: typeof clearTimeout;
  coalesceMs?: number;
}

export interface IController {
  ready(): Promise<void>;
  state(): IExtState;
  onStartup(): Promise<void>;
  onInstalled(reason: string): Promise<void>;
  onAlarm(name: string): Promise<void>;
  onCommand(command: string): Promise<void>;
  onMessage(raw: unknown): Promise<IExtState | null>;
  onStorageChanged(changes: Record<string, IStorageChange>, areaName: string): Promise<void>;
  onTabUpdated(tabId: number, change: { status?: string; url?: string }, tab: ITab): Promise<void>;
  onTabRemoved(tabId: number): Promise<void>;
  onTabActivated(info: { tabId: number; windowId: number }): Promise<void>;
  onWindowFocus(windowId: number): Promise<void>;
  onPermissionsRemoved(): Promise<void>;
  dispose(): void;
}

export function createController(opts: IControllerOptions): IController {
  const { api } = opts;
  const now = opts.now ?? (() => Date.now());
  const st = opts.setTimeout ?? setTimeout;
  const ct = opts.clearTimeout ?? clearTimeout;
  const fetchFn: TFetch = opts.fetchFn ?? ((input, init) => fetch(input, init));
  const store = createChromeStorageAdapter(api.storage.local, {
    setTimeout: st,
    clearTimeout: ct,
    ...(opts.coalesceMs !== undefined ? { coalesceMs: opts.coalesceMs } : {}),
  });
  const storage = createStorage(store);
  const lock = createPowerLock({ power: api.power, now });
  let engine: ISessionEngine | null = null;
  let boot: Promise<void> | null = null;
  let switching = false;
  let syncTimer: ReturnType<typeof setTimeout> | null = null;
  let chimeTimer: ReturnType<typeof setTimeout> | null = null;
  let shown: { text: string; bg: string; title: string } = { text: '\u0000', bg: '', title: '' };

  const settings = () => readSettings(store.raw(STORAGE_KEYS.settings));
  const ext = (): IExtSettings => readExt(store.raw(EXT_KEYS.ext));
  const locale = () => resolveLocale(settings().locale, api.i18n?.getUILanguage());
  const t = (key: string, vars?: TVars) =>
    format(opts.catalogs[locale()]?.[key] ?? opts.catalogs.en?.[key] ?? key, vars);

  // The live session: the engine's, or a paused one kept in storage after a worker restart. A paused session stays
  // out of the engine until Resume, because loading it there would resume it.
  const current = (): ISession | null => {
    const live = engine?.session;
    if (isLive(live)) return live;
    const stored = storage.session();
    return stored?.status === 'paused' ? stored : (live ?? null);
  };

  // Every event handler runs one at a time: a popup click, an alarm and a tab event arriving together must not
  // interleave half-started sessions.
  let queue: Promise<unknown> = Promise.resolve();
  function serial<T>(task: () => Promise<T>): Promise<T> {
    const next = queue.then(task);
    queue = next.catch(() => undefined);
    return next;
  }

  function ready(): Promise<void> {
    boot ??= start().catch((error: unknown) => {
      boot = null;
      throw error;
    });
    return boot;
  }

  async function start(): Promise<void> {
    await store.load();
    await seedFromSync();
    if (!store.raw(EXT_KEYS.device)) await store.put(EXT_KEYS.device, { v: 1, id: crypto.randomUUID() });
    engine = createSession({
      lock,
      storage,
      channel: null,
      settings,
      now,
      setTimeout: st,
      clearTimeout: ct,
      resumeIndefiniteMs: Number.POSITIVE_INFINITY,
    });
    engine.on('ended', ({ reason }) => {
      // A length switch stops the old session inside startPlan(); that is not an end.
      if (switching) return;
      void serial(() => onEnded(reason));
    });
    engine.on('tick', () => void render());
    engine.on('lock', () => void render());
    await rehydrate();
    await clearLegacyAlarms();
    await ensureAlarm(ALARMS.license, { periodInMinutes: LICENSE_PERIOD_MIN });
    void serial(maybeRevalidate);
    await render();
  }

  async function seedFromSync(): Promise<void> {
    if (!api.storage.sync) return;
    try {
      const remote = await api.storage.sync.get([...SYNC_KEYS]);
      for (const key of SYNC_KEYS) {
        if (store.raw(key) === undefined && remote[key] !== undefined) await store.put(key, remote[key]);
      }
    } catch {
      // Sync disabled or unavailable: local storage is authoritative anyway.
    }
  }

  async function rehydrate(): Promise<void> {
    const stored = storage.session();
    if (!isLive(stored)) {
      // Never hold a keep-awake without a live session (a previous worker may have died mid-stop).
      releasePower();
      return;
    }
    if (stored.status === 'paused') {
      releasePower();
      await ensureSessionAlarms();
      return;
    }
    if (engine?.getResumable()) {
      await engine.resumeSession();
      await ensureSessionAlarms();
      return;
    }
    finalizeExpired(stored);
    await clearSessionAlarms();
  }

  function releasePower() {
    try {
      api.power?.releaseKeepAwake();
    } catch {
      // chrome.power missing or refused: nothing is held.
    }
  }

  function finalizeExpired(stored: ISession): void {
    const endedAt = stored.endsAt ?? now();
    storage.writeSession({ ...stored, status: 'completed', endReason: 'completed', endedAt });
    const stats = storage.stats();
    if (Math.floor(stored.awakeSeconds / 60) >= 1) stats.sessions += 1;
    stats.lastSessionAt = endedAt;
    storage.writeStats(stats);
    releasePower();
  }

  async function onEnded(reason: TEndReason): Promise<void> {
    await clearSessionAlarms();
    await render();
    if (reason === 'completed') await chime();
  }

  // The end-of-session chime plays in an offscreen document, the one place an MV3 extension can make a sound.
  async function chime(): Promise<void> {
    const sound = settings().sound;
    const offscreen = api.offscreen;
    if (sound.id === 'none' || !offscreen) return;
    const kind = sound.id === 'bell' ? 'bell' : 'two';
    const url = `${OFFSCREEN_PAGE}?kind=${kind}&volume=${String(sound.volume)}`;
    try {
      await offscreen.closeDocument().catch(() => undefined);
      await offscreen.createDocument({
        url,
        reasons: ['AUDIO_PLAYBACK'],
        justification: 'Plays the end-of-session chime the user chose.',
      });
      if (chimeTimer) ct(chimeTimer);
      chimeTimer = st(() => {
        chimeTimer = null;
        void offscreen.closeDocument().catch(() => undefined);
      }, CHIME_MS);
    } catch {
      // No audio is fine: the badge and the popup already say the session ended.
    }
  }

  async function ensureAlarm(name: string, info: IAlarmInfo): Promise<void> {
    const alarms = await api.alarms.getAll();
    if (!alarms.some((alarm) => alarm.name === name)) await api.alarms.create(name, info);
  }

  async function clearLegacyAlarms(): Promise<void> {
    for (const alarm of await api.alarms.getAll()) {
      if (alarm.name.startsWith(LEGACY_ALARM_PREFIX)) await api.alarms.clear(alarm.name);
    }
  }

  // A running session keeps a half-minute tick (re-asserting the keep-awake, refreshing the badge) and an alarm at
  // its end; a paused one needs neither, since its time stands still.
  async function ensureSessionAlarms(): Promise<void> {
    const session = current();
    if (!isLive(session) || session.status === 'paused') {
      await api.alarms.clear(ALARMS.tick);
      await api.alarms.clear(ALARMS.end);
      return;
    }
    const alarms = await api.alarms.getAll();
    if (!alarms.some((alarm) => alarm.name === ALARMS.tick)) {
      await api.alarms.create(ALARMS.tick, { periodInMinutes: TICK_PERIOD_MIN });
    }
    const left = remainingMs(session, now());
    if (left === null) {
      if (alarms.some((alarm) => alarm.name === ALARMS.end)) await api.alarms.clear(ALARMS.end);
      return;
    }
    const when = now() + left;
    const existing = alarms.find((alarm) => alarm.name === ALARMS.end);
    if (!existing || Math.abs(existing.scheduledTime - when) > 1_000) await api.alarms.create(ALARMS.end, { when });
  }

  async function clearSessionAlarms(): Promise<void> {
    if (isLive(current())) return;
    await api.alarms.clear(ALARMS.tick);
    await api.alarms.clear(ALARMS.end);
  }

  async function startPlan(plan: TPlan, presetId: TPresetId, origin: TOrigin, tab: ITabRef | null): Promise<void> {
    if (!engine) return;
    if (!lock.supported) {
      // Surface `unsupported` honestly instead of starting a session nothing keeps awake.
      await lock.request();
      await render();
      return;
    }
    if (isLive(engine.session)) {
      switching = true;
      try {
        engine.stop();
      } finally {
        switching = false;
      }
    }
    await engine.start(plan, { presetId, mode: 'standard', source: 'ext' });
    if (isLive(engine.session)) engine.updateSession({ modeState: { origin, ...(tab ?? {}) } });
    await ensureSessionAlarms();
    await render();
  }

  async function activeTab(): Promise<ITabRef | null> {
    try {
      const [tab] = await api.tabs.query({ active: true, lastFocusedWindow: true });
      return tab?.id !== undefined && tab.windowId !== undefined ? { tabId: tab.id, windowId: tab.windowId } : null;
    } catch {
      return null;
    }
  }

  async function startPreset(presetId: TExtPreset, origin: TOrigin, tab: ITabRef | null): Promise<void> {
    const s = settings();
    if (s.defaultPreset !== presetId) await store.put(STORAGE_KEYS.settings, { ...s, defaultPreset: presetId });
    await startPlan(planFromPreset(presetId), presetId, origin, tab);
  }

  async function stop(): Promise<void> {
    if (!engine) return;
    if (isLive(engine.session)) engine.stop();
    else if (current()?.status === 'paused') engine.discardResumable();
    else await lock.release();
    await clearSessionAlarms();
    await render();
  }

  async function pause(hidden = false): Promise<void> {
    const live = engine?.session;
    if (!engine || live?.status !== 'active') return;
    engine.pause();
    engine.updateSession({ modeState: { hidden } });
    await ensureSessionAlarms();
    await render();
  }

  async function resume(): Promise<void> {
    if (!engine) return;
    const live = engine.session;
    if (live?.status === 'paused') {
      await engine.resume();
    } else {
      const stored = storage.session();
      if (stored?.status !== 'paused') return;
      // The engine moves the end time forward by the pause, so the time that was left is the time that runs.
      if (engine.getResumable()) await engine.resumeSession();
      else finalizeExpired(stored);
    }
    if (isLive(engine.session)) engine.updateSession({ modeState: { hidden: false } });
    await ensureSessionAlarms();
    await render();
  }

  async function toggle(origin: TOrigin): Promise<void> {
    const session = current();
    if (session?.status === 'active') await stop();
    else if (session?.status === 'paused') await resume();
    else await startPreset(presetOf(settings()), origin, await activeTab());
  }

  function installed(reason: string): void {
    if (reason !== 'install') return;
    const meta = storage.meta();
    const version = api.runtime.getManifest().version;
    storage.writeMeta({ ...meta, installedAt: meta.installedAt || now(), lastSeenVersion: version });
  }

  async function checkAutostartStop(): Promise<void> {
    const session = current();
    if (!engine || !isLive(session) || originOf(session) !== 'autostart') return;
    const { on, sites } = ext().autostart;
    let open: ITab[] = [];
    if (on && sites.length) {
      try {
        open = await api.tabs.query({ url: sites.map((site) => originPattern(site.host)) });
      } catch {
        open = [];
      }
    }
    if (!open.some((tab) => matchSite(tab.url, sites))) await stop();
  }

  // Release when the tab is hidden: the session's own tab stops being the one on screen (another tab in its window,
  // or the window minimised) and the keep-awake is released; it comes back with the tab.
  async function tabVisible(ref: ITabRef): Promise<boolean> {
    try {
      const win = await api.windows?.get(ref.windowId);
      if (win?.state === 'minimized') return false;
      const [active] = await api.tabs.query({ active: true, windowId: ref.windowId });
      return active?.id === undefined || active.id === ref.tabId;
    } catch {
      return true;
    }
  }

  async function followVisibility(): Promise<void> {
    const session = current();
    const ref = tabOf(session);
    if (!ref || !isLive(session)) return;
    const releasing = ext().releaseHidden;
    if (!releasing) {
      if (hiddenPause(session)) await resume();
      return;
    }
    const visible = await tabVisible(ref);
    if (!visible && session.status === 'active') await pause(true);
    else if (visible && hiddenPause(session)) await resume();
  }

  async function maybeRevalidate(): Promise<void> {
    const record = storage.license();
    if (!record) return;
    const result = await revalidate(record, fetchFn, now());
    if (result.status === 'revoked') storage.writeLicense(null);
    else if (result.status === 'ok' && result.record) storage.writeLicense(result.record);
  }

  function queueSyncPush(): void {
    const sync = api.storage.sync;
    if (!sync) return;
    if (syncTimer) ct(syncTimer);
    syncTimer = st(() => {
      syncTimer = null;
      const items: Record<string, unknown> = {};
      for (const key of SYNC_KEYS) {
        const value = store.raw(key);
        if (value !== undefined) items[key] = value;
      }
      if (Object.keys(items).length) void sync.set(items).catch(() => undefined);
    }, SYNC_DEBOUNCE_MS);
  }

  function pillText(view: TExtView, session: ISession | null, at: number): string {
    const copy = pillCopy(view, lock.state, session, at);
    return t(copy.key, copy.vars);
  }

  async function render(): Promise<void> {
    const session = current();
    const at = now();
    const view = viewOf(lock.state, session);
    const badge: IBadge | null = badgeOf(view, session, at, ext().badge);
    const next = { text: badge?.text ?? '', bg: badge?.bg ?? '', title: `AwakeTab — ${pillText(view, session, at)}` };
    try {
      if (next.text !== shown.text) await api.action.setBadgeText({ text: next.text });
      if (badge && next.bg !== shown.bg) {
        await api.action.setBadgeBackgroundColor({ color: badge.bg });
        await api.action.setBadgeTextColor?.({ color: badge.fg });
      }
      if (next.title !== shown.title) await api.action.setTitle({ title: next.title });
      shown = { ...next, bg: badge ? next.bg : shown.bg };
    } catch {
      // The action API can reject while the browser shuts down; the next render retries.
    }
  }

  function state(): IExtState {
    const session = current() ?? storage.session();
    return {
      view: viewOf(lock.state, session),
      lock: lock.state,
      advice: lock.advice,
      session,
      origin: originOf(session),
      hidden: hiddenPause(session),
      now: now(),
    };
  }

  const handlers: Omit<IController, 'ready' | 'state' | 'dispose'> = {
    async onStartup() {
      await ready();
      if (current()?.status === 'active') lock.reassert();
    },
    async onInstalled(reason) {
      await ready();
      installed(reason);
      lock.reassert();
      await render();
    },
    async onAlarm(name) {
      await ready();
      if (name === ALARMS.tick) {
        if (current()?.status === 'active') lock.reassert();
        else await api.alarms.clear(ALARMS.tick);
      } else if (name === ALARMS.license) {
        await maybeRevalidate();
      }
      // ALARMS.end needs no branch: waking the worker resumed (or finalised) the session above.
      await render();
    },
    async onCommand(command) {
      if (command !== 'toggle') return;
      await ready();
      await toggle('command');
    },
    async onMessage(raw) {
      const req = parseRequest(raw);
      if (!req) return null;
      await ready();
      switch (req.type) {
        case 'start':
          await startPreset(req.presetId, 'user', req.tab ?? (await activeTab()));
          break;
        case 'stop':
          await stop();
          break;
        case 'pause':
          await pause();
          break;
        case 'resume':
          await resume();
          break;
        case 'toggle':
          await toggle('user');
          break;
        case 'state':
          break;
      }
      return state();
    },
    async onStorageChanged(changes, areaName) {
      await ready();
      if (areaName === 'sync') {
        for (const key of SYNC_KEYS) {
          const change = changes[key];
          if (change?.newValue === undefined) continue;
          if (JSON.stringify(change.newValue) !== JSON.stringify(store.raw(key))) await store.put(key, change.newValue);
        }
        return;
      }
      if (areaName !== 'local') return;
      const changed = store.apply(changes);
      if (!changed.length) return;
      if (changed.includes(EXT_KEYS.ext)) {
        await checkAutostartStop();
        await followVisibility();
      }
      if (changed.some((key) => SYNC_KEYS.includes(key))) queueSyncPush();
      await render();
    },
    async onTabUpdated(tabId, change, tab) {
      // Without host permission for the tab's site, Chrome withholds `tab.url`: nothing to match, no work.
      if (!tab.url || (change.status !== 'complete' && change.url === undefined)) return;
      await ready();
      if (!engine) return;
      const { on, sites } = ext().autostart;
      const site = on ? matchSite(tab.url, sites) : null;
      if (!site) {
        await checkAutostartStop();
        return;
      }
      if (isLive(current())) return;
      const plan: TPlan = site.durationMin
        ? { type: 'duration', ms: site.durationMin * 60_000 }
        : { type: 'indefinite' };
      const ref = tab.windowId !== undefined ? { tabId, windowId: tab.windowId } : null;
      await startPlan(plan, site.durationMin ? 'custom' : 'pinf', 'autostart', ref);
    },
    async onTabRemoved(tabId) {
      await ready();
      const session = current();
      if (ext().releaseHidden && tabOf(session)?.tabId === tabId && isLive(session)) await stop();
      await checkAutostartStop();
    },
    async onTabActivated() {
      await ready();
      await followVisibility();
    },
    async onWindowFocus() {
      await ready();
      await followVisibility();
    },
    async onPermissionsRemoved() {
      await ready();
      await checkAutostartStop();
    },
  };

  return {
    ready,
    state,
    onStartup: () => serial(() => handlers.onStartup()),
    onInstalled: (reason) => serial(() => handlers.onInstalled(reason)),
    onAlarm: (name) => serial(() => handlers.onAlarm(name)),
    onCommand: (command) => serial(() => handlers.onCommand(command)),
    onMessage: (raw) => serial(() => handlers.onMessage(raw)),
    onStorageChanged: (changes, areaName) => serial(() => handlers.onStorageChanged(changes, areaName)),
    // Chrome withholds `tab.url` without host permission: those events are dropped before queueing.
    onTabUpdated: (tabId, change, tab) =>
      !tab.url || (change.status !== 'complete' && change.url === undefined)
        ? Promise.resolve()
        : serial(() => handlers.onTabUpdated(tabId, change, tab)),
    onTabRemoved: (tabId) => serial(() => handlers.onTabRemoved(tabId)),
    onTabActivated: (info) => serial(() => handlers.onTabActivated(info)),
    onWindowFocus: (windowId) => serial(() => handlers.onWindowFocus(windowId)),
    onPermissionsRemoved: () => serial(() => handlers.onPermissionsRemoved()),
    dispose() {
      if (syncTimer) ct(syncTimer);
      if (chimeTimer) ct(chimeTimer);
      engine?.destroy();
    },
  };
}
