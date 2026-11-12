import { DEFAULT_SETTINGS, STORAGE_KEYS, type ISettings, type TPresetId } from '@awaketab/core';

export const EXT_KEYS = { ext: 'at.v1.ext', device: 'at.v1.device' } as const;

export const SYNC_KEYS: readonly string[] = [STORAGE_KEYS.settings, EXT_KEYS.ext];

const AUTOSTART_SITES_MAX = 50;

export interface IAutostartSite {
  host: string;
  durationMin: number | null;
}

// The options page: the badge timer, auto-wake on chosen sites and release-when-hidden.
export interface IExtSettings {
  v: 1;
  badge: boolean;
  releaseHidden: boolean;
  autostart: { on: boolean; sites: IAutostartSite[] };
}

const DEFAULT_EXT: IExtSettings = {
  v: 1,
  badge: true,
  releaseHidden: false,
  autostart: { on: true, sites: [] },
};

const EXT_DEFAULT_SETTINGS: ISettings = {
  ...DEFAULT_SETTINGS,
  telemetry: false,
  notifications: false,
  defaultPreset: 'p60',
  // The end chime is a choice made in Options, so a new install is silent.
  sound: { ...DEFAULT_SETTINGS.sound, id: 'none' },
};

// The popup's four length chips, in their order.
export const EXT_PRESETS = ['p15', 'p30', 'p60', 'pinf'] as const;
export type TExtPreset = (typeof EXT_PRESETS)[number];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isExtPreset(value: unknown): value is TExtPreset {
  return typeof value === 'string' && (EXT_PRESETS as readonly string[]).includes(value);
}

// The end chimes Options offers, by their `settings.sound.id`: silent, the two tones, the bell.
export const EXT_CHIMES = ['none', 'chime', 'bell'] as const;
export type TExtChime = (typeof EXT_CHIMES)[number];

export function isExtChime(value: unknown): value is TExtChime {
  return typeof value === 'string' && (EXT_CHIMES as readonly string[]).includes(value);
}

export function chimeOf(settings: ISettings): TExtChime {
  const id = settings.sound.id;
  return id === 'none' || id === 'bell' ? id : 'chime';
}

export function readSettings(raw: unknown): ISettings {
  if (!isRecord(raw)) return structuredClone(EXT_DEFAULT_SETTINGS);
  const merged = { ...structuredClone(EXT_DEFAULT_SETTINGS), ...(raw as Partial<ISettings>) };
  merged.telemetry = false;
  merged.notifications = false;
  if (!isExtPreset(merged.defaultPreset)) merged.defaultPreset = 'p60';
  return merged;
}

function sanitizeSite(raw: unknown): IAutostartSite | null {
  if (!isRecord(raw) || typeof raw.host !== 'string') return null;
  const host = normalizeHost(raw.host);
  if (!host) return null;
  const minutes = raw.durationMin;
  const durationMin =
    typeof minutes === 'number' && Number.isInteger(minutes) && minutes > 0 && minutes <= 24 * 60 ? minutes : null;
  return { host, durationMin };
}

// Older records carried a power level, schedules and a browser-start switch; they read as the defaults.
export function readExt(raw: unknown): IExtSettings {
  if (!isRecord(raw)) return structuredClone(DEFAULT_EXT);
  const autostart = isRecord(raw.autostart) ? raw.autostart : {};
  const sites = Array.isArray(autostart.sites)
    ? autostart.sites.map(sanitizeSite).filter((s): s is IAutostartSite => s !== null)
    : [];
  return {
    v: 1,
    badge: raw.badge !== false,
    releaseHidden: raw.releaseHidden === true,
    autostart: { on: autostart.on !== false, sites: sites.slice(0, AUTOSTART_SITES_MAX) },
  };
}

const HOST = /^(\*\.)?(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z][a-z0-9-]{0,61}[a-z0-9]$/u;

export function normalizeHost(input: string): string | null {
  let value = input.trim().toLowerCase();
  if (!value) return null;
  const wildcard = value.startsWith('*.');
  if (wildcard) value = value.slice(2);
  if (/^[a-z][a-z0-9+.-]*:\/\//u.test(value)) {
    if (!value.startsWith('https://')) return null;
    try {
      value = new URL(value).hostname;
    } catch {
      return null;
    }
  } else {
    value = value.split(/[/?#]/u)[0] ?? '';
  }
  value = value.replace(/\.$/u, '');
  const host = `${wildcard ? '*.' : ''}${value}`;
  if (host.length > 253 || !HOST.test(host) || /^\d+(\.\d+)*$/u.test(value)) return null;
  return host;
}

export function originPattern(host: string): string {
  return `https://${host}/*`;
}

export function matchSite(url: string | undefined, sites: readonly IAutostartSite[]): IAutostartSite | null {
  if (!url) return null;
  let hostname: string;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:') return null;
    hostname = parsed.hostname.toLowerCase();
  } catch {
    return null;
  }
  for (const site of sites) {
    if (site.host.startsWith('*.')) {
      const base = site.host.slice(2);
      if (hostname === base || hostname.endsWith(`.${base}`)) return site;
    } else if (hostname === site.host) {
      return site;
    }
  }
  return null;
}

export function presetOf(settings: ISettings): TExtPreset {
  const id: TPresetId = settings.defaultPreset;
  return isExtPreset(id) ? id : 'p60';
}
