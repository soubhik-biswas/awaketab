import type { ISession, TAdviceCode, TLockState } from '@awaketab/core';
import { isExtPreset, type TExtPreset } from './settings';
import type { TExtView, TOrigin } from './status';

export interface ITabRef {
  tabId: number;
  windowId: number;
}

export type TExtRequest =
  | { type: 'state' }
  | { type: 'start'; presetId: TExtPreset; tab?: ITabRef }
  | { type: 'stop' }
  | { type: 'pause' }
  | { type: 'resume' }
  | { type: 'toggle' };

export interface IExtState {
  view: TExtView;
  lock: TLockState;
  advice: TAdviceCode | null;
  session: ISession | null;
  origin: TOrigin | null;
  hidden: boolean;
  now: number;
}

const isId = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v) && v >= 0;

function tabRef(raw: unknown): ITabRef | undefined {
  if (typeof raw !== 'object' || raw === null) return undefined;
  const t = raw as Record<string, unknown>;
  return isId(t.tabId) && isId(t.windowId) ? { tabId: t.tabId, windowId: t.windowId } : undefined;
}

export function parseRequest(raw: unknown): TExtRequest | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const msg = raw as Record<string, unknown>;
  switch (msg.type) {
    case 'state':
    case 'stop':
    case 'pause':
    case 'resume':
    case 'toggle':
      return { type: msg.type };
    case 'start': {
      if (!isExtPreset(msg.presetId)) return null;
      const tab = tabRef(msg.tab);
      return tab ? { type: 'start', presetId: msg.presetId, tab } : { type: 'start', presetId: msg.presetId };
    }
    default:
      return null;
  }
}
