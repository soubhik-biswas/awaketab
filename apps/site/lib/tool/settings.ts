import { DEFAULT_SETTINGS, FACE_IDS, migrateFace, type ISettings, type TFace, type TPresetId } from '@awaketab/core';
import { createLocalStore, isRecord, useLocalStore } from '@/lib/tool/store';

export type TChimeKind = 'two' | 'bell' | 'off';
export type TThemeChoice = 'auto' | 'light' | 'dark' | 'oled';
export type TVibe = 'aurora' | 'night' | 'rain' | 'sunset' | 'lava' | 'calm';
export type TVibeMotion = 'still' | 'calm' | 'lively';

export const VIBES: readonly TVibe[] = ['aurora', 'night', 'rain', 'sunset', 'lava', 'calm'];
const MOTIONS: readonly TVibeMotion[] = ['still', 'calm', 'lively'];

export interface IToolSettings {
  face: TFace;
  totalSec: number;
  label: string;
  h12: boolean;
  // False until the person picks a dial; until then the clock follows the language.
  clockSet: boolean;
  secs: boolean;
  chime: TChimeKind;
  dim: boolean;
  theme: TThemeChoice;
  vibe: TVibe;
  motion: TVibeMotion;
  ambientOn: boolean;
  keepControls: boolean;
  // Open the mini clock when the person leaves the tab during a session, where the browser allows it.
  autoMini: boolean;
}

export const SETTINGS_KEY = 'at.v1.settings';
const THEMES: readonly TThemeChoice[] = ['auto', 'light', 'dark', 'oled'];

// A first visit starts on one hour, the length every board draws.
const TOOL_DEFAULTS: IToolSettings = {
  face: 'ring',
  totalSec: 3600,
  label: '',
  h12: true,
  clockSet: false,
  secs: true,
  chime: 'two',
  dim: false,
  theme: 'auto',
  vibe: 'aurora',
  motion: 'calm',
  ambientOn: false,
  keepControls: false,
  autoMini: true,
};

const PRESET_SEC: Record<Exclude<TPresetId, 'custom' | 'until'>, number> = {
  p15: 900,
  p30: 1800,
  p45: 2700,
  p60: 3600,
  p120: 7200,
  p240: 14400,
  pinf: 0,
};

function presetIdFor(sec: number): TPresetId {
  const hit = (Object.entries(PRESET_SEC) as [TPresetId, number][]).find(([, v]) => v === sec);
  return hit ? hit[0] : 'custom';
}

type TStored = ISettings & {
  dimAtNight?: boolean;
  faceStyles?: unknown;
  vibe?: TVibe;
  vibeMotion?: TVibeMotion;
  ambientOn?: boolean;
  keepControls?: boolean;
  autoMini?: boolean;
};

function fromStored(raw: unknown): { stored: TStored | null; tool: IToolSettings } {
  if (!isRecord(raw)) return { stored: null, tool: { ...TOOL_DEFAULTS } };
  const s = { ...DEFAULT_SETTINGS, ...raw } as TStored;
  // The record comes from storage, so its fields are read as unknown and checked.
  const loose: Partial<Record<keyof TStored, unknown>> = s;
  const preset = s.defaultPreset;
  const totalSec =
    preset === 'custom' || preset === 'until'
      ? Math.max(60, Math.round((Number(loose.lastCustomMs) || 3_600_000) / 1000))
      : ((PRESET_SEC as Partial<Record<string, number>>)[preset] ?? 3600);
  const sound = isRecord(s.sound) ? s.sound : DEFAULT_SETTINGS.sound;
  const ambient: Partial<Record<keyof ISettings['ambient'], unknown>> = isRecord(s.ambient)
    ? { ...DEFAULT_SETTINGS.ambient, ...s.ambient }
    : DEFAULT_SETTINGS.ambient;
  const theme: TThemeChoice = THEMES.find((choice) => choice === String(loose.theme)) ?? 'auto';
  return {
    stored: s,
    tool: {
      face: migrateFace(s.face, s.faceStyles),
      totalSec,
      label: typeof s.intention === 'string' ? s.intention.slice(0, 80) : '',
      h12: ambient.clock24h !== true,
      clockSet: typeof ambient.clock24h === 'boolean',
      secs: ambient.showSeconds !== false,
      chime: sound.id === 'none' ? 'off' : sound.id === 'bell' ? 'bell' : 'two',
      dim: s.dimAtNight === true,
      theme,
      vibe: VIBES.find((v) => v === String(loose.vibe)) ?? 'aurora',
      motion: MOTIONS.find((v) => v === String(loose.vibeMotion)) ?? 'calm',
      ambientOn: loose.ambientOn === true,
      keepControls: loose.keepControls === true,
      autoMini: loose.autoMini !== false,
    },
  };
}

function readRaw(): Record<string, unknown> | null {
  try {
    const raw = JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? 'null') as unknown;
    return isRecord(raw) ? raw : null;
  } catch {
    return null;
  }
}

// The tool reads and writes the shared at.v1.settings record, which the analytics card writes too, so fields it does
// not own are kept as they are. Visits are counted only after a yes, so no answer is ever written for the person.
function toStored(tool: IToolSettings): Omit<TStored, 'telemetry'> & { telemetry?: boolean } {
  // Unreadable settings are replaced by the defaults.
  const raw = readRaw();
  const base: TStored = raw ? { ...DEFAULT_SETTINGS, ...raw } : { ...DEFAULT_SETTINGS };
  const asked = raw?.telemetry;
  const { faceStyles: _drop, telemetry: _unasked, ...rest } = base;
  const preset = presetIdFor(tool.totalSec);
  return {
    ...rest,
    v: 1,
    face: (FACE_IDS as readonly string[]).includes(tool.face) ? tool.face : 'ring',
    defaultPreset: preset,
    lastCustomMs: preset === 'custom' ? tool.totalSec * 1000 : rest.lastCustomMs,
    intention: tool.label.slice(0, 80),
    ambient: {
      ...DEFAULT_SETTINGS.ambient,
      ...rest.ambient,
      clock24h: tool.clockSet ? !tool.h12 : null,
      showSeconds: tool.secs,
    },
    sound: {
      ...DEFAULT_SETTINGS.sound,
      ...rest.sound,
      id: tool.chime === 'off' ? 'none' : tool.chime === 'bell' ? 'bell' : 'chime',
    },
    dimAtNight: tool.dim,
    theme: tool.theme,
    vibe: tool.vibe,
    vibeMotion: tool.motion,
    ambientOn: tool.ambientOn,
    keepControls: tool.keepControls,
    autoMini: tool.autoMini,
    ...(typeof asked === 'boolean' ? { telemetry: asked } : {}),
  };
}

const settingsStore = createLocalStore<IToolSettings>(SETTINGS_KEY, (raw) => fromStored(raw).tool, toStored);

export function updateSettings(patch: Partial<IToolSettings>) {
  settingsStore.set((prev) => ({ ...prev, ...patch }));
}

const ONBOARDING_KEY = 'at.v1.onboarding';
const ANALYTICS_TIP = 'analytics';

// "Count my visits" is on only when the person has said yes, in Settings or on the analytics card.
export function readTelemetry(): boolean {
  return readRaw()?.telemetry === true;
}

// The Settings switch gives the same answer as the analytics card, so the card stops asking once it is used.
export function setTelemetry(on: boolean) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...(readRaw() ?? { v: 1 }), telemetry: on }));
    const raw = JSON.parse(localStorage.getItem(ONBOARDING_KEY) ?? 'null') as unknown;
    const onboarding = isRecord(raw) ? raw : {};
    const tips: unknown[] = Array.isArray(onboarding.dismissedTips) ? onboarding.dismissedTips : [];
    if (!tips.includes(ANALYTICS_TIP)) tips.push(ANALYTICS_TIP);
    localStorage.setItem(ONBOARDING_KEY, JSON.stringify({ ...onboarding, v: 1, dismissedTips: tips }));
  } catch {
    // Blocked storage: the answer lasts for this visit only.
  }
  document.documentElement.dataset.consent = '';
}

export function useToolSettings(): IToolSettings {
  return useLocalStore(settingsStore, TOOL_DEFAULTS);
}
