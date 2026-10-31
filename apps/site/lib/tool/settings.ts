import { DEFAULT_SETTINGS, FACE_IDS, migrateFace, type ISettings, type TFace, type TPresetId } from '@awaketab/core';
import { createLocalStore, isRecord, useLocalStore } from '@/lib/tool/store';

export type TChimeKind = 'two' | 'bell' | 'off';
export type TThemeChoice = 'auto' | 'light' | 'dark' | 'oled';

export interface IToolSettings {
  face: TFace;
  totalSec: number;
  label: string;
  h12: boolean;
  secs: boolean;
  chime: TChimeKind;
  dim: boolean;
  theme: TThemeChoice;
}

export const SETTINGS_KEY = 'at.v1.settings';
const THEMES: readonly TThemeChoice[] = ['auto', 'light', 'dark', 'oled'];

// A first visit starts on one hour, the length every board draws.
const TOOL_DEFAULTS: IToolSettings = {
  face: 'ring',
  totalSec: 3600,
  label: '',
  h12: true,
  secs: true,
  chime: 'two',
  dim: false,
  theme: 'auto',
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

type TStored = ISettings & { dimAtNight?: boolean; faceStyles?: unknown };

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
      secs: ambient.showSeconds !== false,
      chime: sound.id === 'none' ? 'off' : sound.id === 'bell' ? 'bell' : 'two',
      dim: s.dimAtNight === true,
      theme,
    },
  };
}

// The tool reads and writes the shared at.v1.settings record, so the old site's choices carry over.
function toStored(tool: IToolSettings): TStored {
  let base: TStored = { ...DEFAULT_SETTINGS };
  try {
    const raw = JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? 'null') as unknown;
    if (isRecord(raw)) base = { ...DEFAULT_SETTINGS, ...raw };
  } catch {
    // Unreadable settings are replaced by the defaults below.
  }
  const { faceStyles: _drop, ...rest } = base;
  const preset = presetIdFor(tool.totalSec);
  return {
    ...rest,
    v: 1,
    face: (FACE_IDS as readonly string[]).includes(tool.face) ? tool.face : 'ring',
    defaultPreset: preset,
    lastCustomMs: preset === 'custom' ? tool.totalSec * 1000 : rest.lastCustomMs,
    intention: tool.label.slice(0, 80),
    ambient: { ...DEFAULT_SETTINGS.ambient, ...rest.ambient, clock24h: !tool.h12, showSeconds: tool.secs },
    sound: {
      ...DEFAULT_SETTINGS.sound,
      ...rest.sound,
      id: tool.chime === 'off' ? 'none' : tool.chime === 'bell' ? 'bell' : 'chime',
    },
    dimAtNight: tool.dim,
    theme: tool.theme,
  };
}

const settingsStore = createLocalStore<IToolSettings>(SETTINGS_KEY, (raw) => fromStored(raw).tool, toStored);

export function updateSettings(patch: Partial<IToolSettings>) {
  settingsStore.set((prev) => ({ ...prev, ...patch }));
}

export function useToolSettings(): IToolSettings {
  return useLocalStore(settingsStore, TOOL_DEFAULTS);
}
