import type { TPresetId } from '@awaketab/core';
import { digits, type ISurfaceView } from '@/lib/surfaces/session';
import { WIDGET_ACTION, WIDGET_SYNC } from '@/lib/surfaces/widget-protocol';

type TWidgetPresetKey = 'presenting' | 'cooking' | 'reading';
type TWidgetLengthKey = 'hour' | 'min45' | 'min30';

export interface IWidgetPreset {
  key: TWidgetPresetKey;
  len: TWidgetLengthKey;
  preset: TPresetId;
  sec: number;
}

// The three presets the widgets board draws, in its order.
export const WIDGET_PRESETS: readonly IWidgetPreset[] = [
  { key: 'presenting', len: 'hour', preset: 'p60', sec: 3600 },
  { key: 'cooking', len: 'min45', preset: 'p45', sec: 2700 },
  { key: 'reading', len: 'min30', preset: 'p30', sec: 1800 },
];

export type TWidgetAction =
  { action: 'extend' } | { action: 'stop' } | { action: 'open' } | { action: 'preset'; preset: TPresetId };

export interface IWidgetData {
  live: boolean;
  awake: boolean;
  status: string;
  line: string;
  digits: string;
  label: string;
  extend: string;
  stop: string;
  presetsTitle: string;
  presets: Array<{ name: string; length: string; preset: TPresetId }>;
}

export interface IWidgetStrings {
  status: string;
  line: string;
  label: string;
  extend: string;
  stop: string;
  presetsTitle: string;
  presets: Array<{ name: string; length: string }>;
}

// What the installed app's Windows widgets show, built from the same reading of the engine as the mini clock.
export function widgetData(view: ISurfaceView, s: IWidgetStrings): IWidgetData {
  return {
    live: view.live,
    awake: view.awake,
    status: s.status,
    line: s.line,
    digits: view.indef ? '∞' : digits(view.remain),
    label: s.label,
    extend: s.extend,
    stop: s.stop,
    presetsTitle: s.presetsTitle,
    presets: WIDGET_PRESETS.map((p, i) => ({
      name: s.presets[i]?.name ?? p.key,
      length: s.presets[i]?.length ?? '',
      preset: p.preset,
    })),
  };
}

export function readWidgetAction(data: unknown): TWidgetAction | null {
  if (!data || typeof data !== 'object') return null;
  const m = data as Record<string, unknown>;
  if (m.type !== WIDGET_ACTION) return null;
  if (m.action === 'extend' || m.action === 'stop' || m.action === 'open') return { action: m.action };
  if (m.action === 'preset' && WIDGET_PRESETS.some((p) => p.preset === m.preset)) {
    return { action: 'preset', preset: m.preset as TPresetId };
  }
  return null;
}

export function presetSeconds(preset: TPresetId): number | null {
  return WIDGET_PRESETS.find((p) => p.preset === preset)?.sec ?? null;
}

export function postWidgetData(data: IWidgetData, nav: Navigator | undefined = globalThis.navigator): void {
  const sw = nav?.serviceWorker?.controller;
  sw?.postMessage({ type: WIDGET_SYNC, data });
}
