import { STORAGE_KEYS, TAB_ID_KEY } from './constants.js';
import {
  DEFAULT_META,
  DEFAULT_ONBOARDING,
  DEFAULT_SETTINGS,
  DEFAULT_STATS,
  FACE_IDS,
  type ILicenseRecord,
  type IMeta,
  type IOnboarding,
  type ISession,
  type ISettings,
  type IStats,
  type TFace,
} from './types.js';
import { computeStreaks, exportStatsCsv, pruneDays } from './stats.js';

// Ids that were renamed, and the faces Glance retired (31 Oct 2026) with the closest face that stays.
const OLD_FACES: Readonly<Record<string, TFace>> = {
  word: 'words',
  matrix: 'lcd',
  led: 'lcd',
  terminal: 'lcd',
  pulse: 'waveform',
};

// A stored face id as a Glance face: old and retired ids map across, Analog saved with the Luxe style becomes Luxe,
// and anything unknown reads as Ring.
export function migrateFace(face: unknown, styles?: unknown): TFace {
  if (face === 'analog' && (styles as { analog?: unknown } | undefined)?.analog === 'luxe') return 'luxe';
  if (typeof face !== 'string') return 'ring';
  if ((FACE_IDS as readonly string[]).includes(face)) return face as TFace;
  return OLD_FACES[face] ?? 'ring';
}

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const isTime = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

// A stored session the engine can run, or null: a session whose plan or times are not real is dropped rather than
// left to stall a clock.
function readSession(v: unknown): ISession | null {
  if (!isRecord(v) || !isRecord(v.plan)) return null;
  const { startedAt, endsAt, pausedAt } = v;
  const { type, ms, wall } = v.plan;
  const pausedMs = isTime(v.pausedMs) ? v.pausedMs : 0;
  if (!isTime(startedAt) || (endsAt !== null && !isTime(endsAt)) || (pausedAt !== null && !isTime(pausedAt)))
    return null;
  if (type === 'duration' ? !isTime(ms) : type === 'until' && typeof wall !== 'string') return null;
  v.pausedMs = pausedMs;
  if (!isRecord(v.modeState)) v.modeState = {};
  // Sessions saved before the end time moved with each pause kept the first end time and the paused total beside it.
  if (isTime(ms) && endsAt !== null && pausedMs > 0 && endsAt === startedAt + ms) v.endsAt = endsAt + pausedMs;
  return v as unknown as ISession;
}

export interface IStorageAdapter {
  get(k: string): string | null;
  set(k: string, v: string): void;
  remove(k: string): void;
}

export const memoryAdapter = (): IStorageAdapter => {
  const m = new Map<string, string>();
  return {
    get: (k) => m.get(k) ?? null,
    set: (k, v) => {
      m.set(k, v);
    },
    remove: (k) => {
      m.delete(k);
    },
  };
};

export function localStorageAdapter(): IStorageAdapter {
  return {
    get: (k) => localStorage.getItem(k),
    set: (k, v) => {
      localStorage.setItem(k, v);
    },
    remove: (k) => {
      localStorage.removeItem(k);
    },
  };
}

export function createStorage(adapter?: IStorageAdapter): {
  adapter: IStorageAdapter;
  persistent: boolean;
  settings(): ISettings;
  writeSettings(s: ISettings): void;
  session(): ISession | null;
  writeSession(s: ISession | null): void;
  stats(): IStats;
  writeStats(s: IStats): void;
  license(): ILicenseRecord | null;
  writeLicense(s: ILicenseRecord | null): void;
  meta(): IMeta;
  writeMeta(s: IMeta): void;
  onboarding(): IOnboarding;
  writeOnboarding(s: IOnboarding): void;
  migrate(): void;
  clearAll(): void;
  exportCsv(): string;
} {
  let persistent = true;
  let used = adapter;
  if (!used) {
    try {
      const probe = localStorageAdapter();
      probe.set('at.__probe', '1');
      probe.remove('at.__probe');
      used = probe;
    } catch {
      used = memoryAdapter();
      persistent = false;
    }
  }
  const a = used;

  // Whatever is stored under a key, or null when it is missing or not JSON.
  function parse(key: string): unknown {
    try {
      const raw = a.get(key);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function read<T extends object>(key: string, fallback: T): T {
    const parsed = parse(key);
    return isRecord(parsed) ? { ...structuredClone(fallback), ...parsed } : structuredClone(fallback);
  }

  function write(key: string, value: unknown) {
    try {
      if (value === null) a.remove(key);
      else a.set(key, JSON.stringify(value));
    } catch {
      persistent = false;
    }
  }

  return {
    adapter: a,
    get persistent() {
      return persistent;
    },
    settings: () => {
      const { faceStyles, ...s } = read(STORAGE_KEYS.settings, DEFAULT_SETTINGS) as ISettings & {
        faceStyles?: unknown;
      };
      s.face = migrateFace(s.face, faceStyles);
      return s;
    },
    writeSettings: (s) => {
      write(STORAGE_KEYS.settings, s);
    },
    session: () => readSession(parse(STORAGE_KEYS.session)),
    writeSession: (s) => {
      write(STORAGE_KEYS.session, s);
    },
    stats: () => {
      const { daySessions, dayFocus, ...rest }: IStats = read(STORAGE_KEYS.stats, DEFAULT_STATS);
      const s: IStats = rest;
      s.days = pruneDays(isRecord(s.days) ? s.days : {});
      if (!isTime(s.totalMinutes)) s.totalMinutes = 0;
      if (!isTime(s.sessions)) s.sessions = 0;
      // Optional per-day counters: absent in older data, pruned with `days`, dropped if corrupt.
      if (daySessions && typeof daySessions === 'object') s.daySessions = pruneDays(daySessions);
      if (dayFocus && typeof dayFocus === 'object') s.dayFocus = pruneDays(dayFocus);
      const streaks = computeStreaks(s.days);
      s.currentStreakDays = streaks.currentStreakDays;
      s.longestStreakDays = Math.max(s.longestStreakDays, streaks.longestStreakDays);
      return s;
    },
    writeStats: (s) => {
      write(STORAGE_KEYS.stats, s);
    },
    license: () => parse(STORAGE_KEYS.license) as ILicenseRecord | null,
    writeLicense: (s) => {
      write(STORAGE_KEYS.license, s);
    },
    meta: () => {
      const m = read(STORAGE_KEYS.meta, DEFAULT_META);
      if (!m.installedAt) m.installedAt = Date.now();
      return m;
    },
    writeMeta: (s) => {
      write(STORAGE_KEYS.meta, s);
    },
    onboarding: () => read(STORAGE_KEYS.onboarding, DEFAULT_ONBOARDING),
    writeOnboarding: (s) => {
      write(STORAGE_KEYS.onboarding, s);
    },
    migrate() {
      this.settings();
      this.stats();
      this.meta();
      this.onboarding();
    },
    clearAll() {
      for (const k of Object.values(STORAGE_KEYS)) a.remove(k);
      if (typeof sessionStorage !== 'undefined') sessionStorage.removeItem(TAB_ID_KEY);
    },
    exportCsv() {
      return exportStatsCsv(this.stats());
    },
  };
}

export const migrate = (store = createStorage()) => {
  store.migrate();
};
export const readStats = (store = createStorage()) => store.stats();
export const exportStatsCsvFromStore = (store = createStorage()) => store.exportCsv();
export const clearAllData = (store = createStorage()) => {
  store.clearAll();
};
