'use client';

import { createContext, useContext } from 'react';
import type { TFace } from '@awaketab/core';
import type { IHistoryItem } from '@/lib/tool/history';
import type { IToolModel, TFaceTheme } from '@/lib/tool/model';
import type { IPreset } from '@/lib/tool/presets';
import type { IProSnapshot } from '@/lib/tool/pro';
import type { IToolSettings, TThemeChoice } from '@/lib/tool/settings';
import type { IToolUi, TDevice, TToolView } from '@/lib/tool/ui';
import type { IWakeSnapshot } from '@/lib/wake';

export interface IToolActions {
  start: (sec?: number) => void;
  toggle: () => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  extend: (sec: number) => void;
  undo: () => void;
  setLength: (sec: number) => void;
  until: (endsAt: number) => void;
  useFallback: () => void;
  checkAgain: () => void;
  takeOver: () => void;
  dismissPeer: () => void;
  go: (view: TToolView) => void;
  close: () => void;
  setFace: (face: TFace) => void;
  setTheme: (choice: TThemeChoice) => void;
  cycleTheme: () => void;
  applyPreset: (p: IPreset, start?: boolean) => void;
  savePreset: () => void;
  copyLink: () => void;
  clearHistory: () => void;
  updateSettings: (patch: Partial<IToolSettings>) => void;
}

export interface IToolContext {
  m: IToolModel;
  snap: IWakeSnapshot;
  settings: IToolSettings;
  ui: IToolUi;
  device: TDevice;
  theme: TFaceTheme;
  themeChoice: TThemeChoice;
  night: boolean;
  viewport: { w: number; h: number };
  pro: IProSnapshot;
  presets: IPreset[];
  history: IHistoryItem[];
  online: boolean;
  shareUrl: string;
  a: IToolActions;
}

export const ToolContext = createContext<IToolContext | null>(null);

export function useTool(): IToolContext {
  const ctx = useContext(ToolContext);
  if (!ctx) throw new Error('useTool needs <Tool>');
  return ctx;
}
