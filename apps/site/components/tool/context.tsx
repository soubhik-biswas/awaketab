'use client';

import { createContext, useContext, useMemo, useSyncExternalStore } from 'react';
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
import { secondsOfDay } from '@/lib/tool/clock';
import { elapsedSec, isLive, remainSec, useWake, wake, type IWakeSnapshot, type TWakeState } from '@/lib/wake';

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
  dim: boolean;
  fullscreen: boolean;
  canFullscreen: boolean;
  panel: TPanel;
  total: number;
  indef: boolean;
  offset: number;
  startedAt: number | null;
  endedAt: number | null;
  checkedAt: number | null;
  face: TGlanceFace;
  reason: TBlockReason;
  banner: TBannerKind | null;
  topH: number;
  dockH: number;
  root: HTMLDivElement | null;
  time: (ms: number) => string;
  until: (ms: number) => string;
  dur: (sec: number) => string;
  durLong: (sec: number) => string;
  faceName: (face: unknown) => string;
  tf: TT;
  a: IToolActions;
}

// The part of the tool that moves with the clock. Everything in IGlance holds still between real changes, so only
// what reads the clock is drawn again each second.
export interface ITick {
  snap: IWakeSnapshot;
  now: number;
  nowSec: number;
  remain: number;
  endsAt: number;
}

export const ToolContext = createContext<IGlance | null>(null);

export function useGlance(): IGlance {
  const ctx = useContext(ToolContext);
  if (!ctx) throw new Error('useGlance needs the tool');
  return ctx;
}

// idleSec is the length chosen in Set mode; offset moves the clock for the dev boards.
function tickOf(snap: IWakeSnapshot, idleSec: number, offset: number): ITick {
  const now = (snap.now || Date.now()) + offset;
  const st = snap.state;
  const live = isLive(st);
  const indef = live ? snap.endsAt === null : idleSec === 0;
  const total = live || st === 'ended' ? snap.totalSec : idleSec;
  const remain = live ? (indef ? elapsedSec(snap) : remainSec(snap)) : st === 'ended' ? 0 : total;
  return { snap, now, nowSec: secondsOfDay(now), remain, endsAt: now + (indef ? 0 : remain) * 1000 };
}

// The clock, every second: for the face and whatever else counts with it.
export function useTick(): ITick {
  const g = useGlance();
  const snap = useWake();
  const idleSec = g.settings.totalSec;
  return useMemo(() => tickOf(snap, idleSec, g.offset), [snap, idleSec, g.offset]);
}

// One value read from the clock (a formatted time, a flag): the caller is drawn again only when that value changes.
// The value must be a string, number or boolean.
export function useTickValue<T extends string | number | boolean>(select: (tick: ITick) => T): T {
  const g = useGlance();
  const read = (snap: IWakeSnapshot) => select(tickOf(snap, g.settings.totalSec, g.offset));
  return useSyncExternalStore(
    wake.subscribe,
    () => read(wake.getSnapshot()),
    () => read(wake.getServerSnapshot()),
  );
}
