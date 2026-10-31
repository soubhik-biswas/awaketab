import { FACE_IDS, type TFace } from '@awaketab/core';
import { dayDiff } from '@/lib/tool/clock';
import type { TPresetIcon } from '@/lib/tool/presets';
import { createLocalStore, isRecord, uid, useLocalStore } from '@/lib/tool/store';

export interface IHistoryItem {
  id: string;
  label: string;
  icon: TPresetIcon;
  face: TFace;
  startedAt: number;
  endedAt: number;
  totalSec: number;
  awakeSec: number;
  reason: 'completed' | 'user';
}

const HISTORY_KEY = 'at.v1.history';
const MAX_ITEMS = 200;
const KEEP_DAYS = 365;

function parseItem(v: unknown): IHistoryItem | null {
  if (!isRecord(v) || typeof v.id !== 'string') return null;
  const startedAt = Number(v.startedAt);
  const endedAt = Number(v.endedAt);
  if (!Number.isFinite(startedAt) || !Number.isFinite(endedAt) || endedAt < startedAt) return null;
  return {
    id: v.id,
    label: typeof v.label === 'string' ? v.label.slice(0, 80) : '',
    icon: typeof v.icon === 'string' ? (v.icon as TPresetIcon) : 'timer',
    face: (FACE_IDS as readonly string[]).includes(String(v.face)) ? (v.face as TFace) : 'ring',
    startedAt,
    endedAt,
    totalSec: Math.max(0, Number(v.totalSec) || 0),
    awakeSec: Math.max(0, Number(v.awakeSec) || 0),
    reason: v.reason === 'user' ? 'user' : 'completed',
  };
}

function parse(raw: unknown): IHistoryItem[] {
  if (!isRecord(raw) || !Array.isArray(raw.items)) return [];
  const now = Date.now();
  return raw.items
    .map(parseItem)
    .filter((x): x is IHistoryItem => x !== null && dayDiff(x.endedAt, now) <= KEEP_DAYS)
    .sort((a, b) => b.startedAt - a.startedAt)
    .slice(0, MAX_ITEMS);
}

const historyStore = createLocalStore<IHistoryItem[]>(HISTORY_KEY, parse, (items) => ({ v: 1, items }));

const EMPTY: IHistoryItem[] = [];

export function useHistory(): IHistoryItem[] {
  return useLocalStore(historyStore, EMPTY);
}

// Sessions shorter than a minute are not worth a row.
export function addHistory(item: Omit<IHistoryItem, 'id'>) {
  if (item.endedAt - item.startedAt < 60_000) return;
  historyStore.set((prev) => [{ ...item, id: uid() }, ...prev].slice(0, MAX_ITEMS));
}

export function clearHistory() {
  historyStore.set([]);
}

export interface IHistoryDay {
  key: string;
  at: number;
  items: IHistoryItem[];
}

export function groupByDay(items: IHistoryItem[]): IHistoryDay[] {
  const days: IHistoryDay[] = [];
  for (const item of items) {
    const d = new Date(item.startedAt);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    const last = days[days.length - 1];
    if (last && last.key === key) last.items.push(item);
    else days.push({ key, at: item.startedAt, items: [item] });
  }
  return days;
}

// The boards' history, spread over the week so the weekly chart has something to draw.
export function sampleHistory(now: number): IHistoryItem[] {
  const at = (daysAgo: number, h: number, m: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() - daysAgo);
    d.setHours(h, m, 0, 0);
    return d.getTime();
  };
  const row = (label: string, icon: TPresetIcon, face: TFace, s: number, e: number): IHistoryItem => ({
    id: `sample-${s}`,
    label,
    icon,
    face,
    startedAt: s,
    endedAt: e,
    totalSec: Math.round((e - s) / 1000),
    awakeSec: Math.round((e - s) / 1000),
    reason: 'completed',
  });
  return [
    row('Presenting to the board', 'presentation', 'pilot', at(0, 10, 0), at(0, 10, 45)),
    row('Kitchen', 'chef', 'bold', at(1, 18, 10), at(1, 19, 0)),
    row('Night desk', 'night', 'moon', at(1, 22, 20), at(1, 23, 58)),
    row('Wall board', 'timer', 'hud', at(2, 9, 0), at(2, 11, 24)),
    row('Slides', 'presentation', 'pilot', at(3, 14, 0), at(3, 15, 36)),
  ];
}
