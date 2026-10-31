import { useSyncExternalStore } from 'react';
import type { TFilter } from '@/lib/tool/collections';

export type TPanel =
  | 'none'
  | 'faces'
  | 'palette'
  | 'recents'
  | 'settings'
  | 'help'
  | 'studio'
  | 'feedback'
  | 'vibes'
  | 'share'
  | 'devices'
  | 'sound'
  | 'clear'
  | 'language'
  | 'pro'
  | 'proDone'
  | 'plan';

export type TDrawerPanel = Exclude<TPanel, 'none' | 'faces' | 'palette'>;
type TBanner = 'none' | 'offline' | 'conflict' | 'update';
export type TDevice = 'desktop' | 'tabletL' | 'tabletP' | 'phone';
export type TRating = 'love' | 'good' | 'bad';
export type TBlockReason = 'battery' | 'unknown' | 'insecure' | 'policy';

const DRAWER_PANELS: readonly TDrawerPanel[] = [
  'recents',
  'settings',
  'help',
  'studio',
  'feedback',
  'vibes',
  'share',
  'devices',
  'sound',
  'clear',
  'language',
  'pro',
  'proDone',
  'plan',
];

export const isDrawerPanel = (p: TPanel): p is TDrawerPanel => (DRAWER_PANELS as readonly string[]).includes(p);

// Dev-only overrides the QA tray sets so every drawn frame can be reached without waiting for it to happen.
export interface IQaOverrides {
  banner?: TBanner;
  empty?: boolean;
  samples?: boolean;
  offsetMs?: number;
  controls?: 'shown' | 'hidden';
  first?: boolean;
  nudge?: boolean;
  reason?: TBlockReason;
  pro?: boolean;
}

export interface IToolUi {
  panel: TPanel;
  filter: TFilter;
  rating: TRating | null;
  first: boolean;
  update: boolean;
  qa: IQaOverrides;
}

const INITIAL: IToolUi = {
  panel: 'none',
  filter: 'featured',
  rating: null,
  first: false,
  update: false,
  qa: {},
};

let state: IToolUi = INITIAL;
const subs = new Set<() => void>();

export const toolUi = {
  get: (): IToolUi => state,
  set(patch: Partial<IToolUi>) {
    state = { ...state, ...patch };
    for (const cb of subs) cb();
  },
  subscribe: (cb: () => void) => {
    subs.add(cb);
    return () => {
      subs.delete(cb);
    };
  },
  open(panel: TPanel) {
    toolUi.set({ panel });
  },
  close() {
    toolUi.set({ panel: 'none' });
  },
  qa(patch: IQaOverrides) {
    toolUi.set({ qa: { ...state.qa, ...patch } });
  },
};

export function useToolUi(): IToolUi {
  return useSyncExternalStore(toolUi.subscribe, toolUi.get, () => INITIAL);
}
