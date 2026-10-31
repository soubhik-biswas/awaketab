'use client';

import { createContext, useContext } from 'react';
import type { useTranslations } from 'next-intl';
import type { TFaceTheme } from '@/components/face';
import type { TGlanceFace } from '@/lib/tool/collections';
import type { TClockFmt } from '@/lib/tool/clock';
import type { IHistoryItem } from '@/lib/tool/history';
import type { IJourney } from '@/lib/tool/journey';
import type { IPreset } from '@/lib/tool/presets';
import type { IProSnapshot } from '@/lib/tool/pro';
import type { IToolSettings, TThemeChoice, TVibe, TVibeMotion } from '@/lib/tool/settings';
import type { TToolLang } from '@/lib/tool/strings';
import type { IToolUi, TBlockReason, TDevice, TPanel, TRating } from '@/lib/tool/ui';
import type { IWakeSnapshot, TWakeState } from '@/lib/wake';

export type TT = ReturnType<typeof useTranslations>;
export type TBannerKind = 'blocked' | 'unsupported' | 'fallback' | 'needsyou' | 'conflict' | 'offline' | 'update';

export interface IToolActions {
  start: () => void;
  toggle: () => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  extend: (sec: number) => void;
  shorten: (sec: number) => void;
  undo: () => void;
  setLength: (sec: number) => void;
  useFallback: () => void;
  checkAgain: () => void;
  takeOver: () => void;
  reload: () => void;
  open: (panel: TPanel) => void;
  close: () => void;
  setFace: (face: TGlanceFace) => void;
  setTheme: (choice: TThemeChoice) => void;
  setVibe: (vibe: TVibe) => void;
  setMotion: (motion: TVibeMotion) => void;
  applyPreset: (p: IPreset) => void;
  savePreset: () => void;
  fullscreen: () => void;
  showControls: () => void;
  feedback: (rating?: TRating) => void;
  quietNudge: () => void;
  setLang: (lang: string) => void;
  update: (patch: Partial<IToolSettings>) => void;
}

export interface IGlance {
  lang: TToolLang;
  t: TT;
  fmt: TClockFmt;
  device: TDevice;
  phone: boolean;
  tabP: boolean;
  tabL: boolean;
  desk: boolean;
  narrow: boolean;
  touch: boolean;
  W: number;
  H: number;
  night: boolean;
  faceTheme: TFaceTheme;
  themeChoice: TThemeChoice;
  snap: IWakeSnapshot;
  settings: IToolSettings;
  ui: IToolUi;
  presets: IPreset[];
  history: IHistoryItem[];
  pro: IProSnapshot;
  journey: IJourney;
  st: TWakeState;
  isSet: boolean;
  hidden: boolean;
  still: boolean;
  fullscreen: boolean;
  panel: TPanel;
  total: number;
  remain: number;
  indef: boolean;
  now: number;
  nowSec: number;
  endsAt: number;
  face: TGlanceFace;
  reason: TBlockReason;
  banner: TBannerKind | null;
  topH: number;
  dockH: number;
  root: HTMLDivElement | null;
  time: (ms: number) => string;
  dur: (sec: number) => string;
  a: IToolActions;
}

export const ToolContext = createContext<IGlance | null>(null);

export function useGlance(): IGlance {
  const ctx = useContext(ToolContext);
  if (!ctx) throw new Error('useGlance needs the tool');
  return ctx;
}
