import { useSyncExternalStore } from 'react';

export type TToolView =
  | 'timer'
  | 'faces'
  | 'presets'
  | 'history'
  | 'clear'
  | 'settings'
  | 'devices'
  | 'fix'
  | 'share'
  | 'extend'
  | 'more'
  | 'welcome'
  | 'palette'
  | 'focus'
  | 'sound'
  | 'studio'
  | 'account';

export type TBanner = 'none' | 'offline' | 'conflict';
export type TDevice = 'desktop' | 'tabletL' | 'tabletP' | 'phone';

export interface IQaOverrides {
  banner?: TBanner;
  emptyPresets?: boolean;
  samples?: boolean;
  now?: number;
}

export interface IToolUi {
  view: TToolView;
  palQuery: string;
  clearText: string;
  copied: boolean;
  qa: IQaOverrides;
}

const INITIAL: IToolUi = { view: 'timer', palQuery: '', clearText: '', copied: false, qa: {} };

let state: IToolUi = INITIAL;
const subs = new Set<() => void>();

export const toolUi = {
  get: (): IToolUi => state,
  set(patch: Partial<IToolUi>) {
    state = { ...state, ...patch };
    for (const cb of subs) cb();
  },
  subscribe(cb: () => void) {
    subs.add(cb);
    return () => {
      subs.delete(cb);
    };
  },
  go(view: TToolView) {
    toolUi.set({ view, palQuery: '', clearText: view === 'clear' ? state.clearText : '', copied: false });
  },
  close() {
    toolUi.set({ view: 'timer', palQuery: '', clearText: '' });
  },
  qa(patch: IQaOverrides) {
    toolUi.set({ qa: { ...state.qa, ...patch } });
  },
};

export function useToolUi(): IToolUi {
  return useSyncExternalStore(toolUi.subscribe, toolUi.get, () => INITIAL);
}

// Views that belong to the "More" tab on phone and tablet portrait.
export const MORE_VIEWS: readonly TToolView[] = ['more', 'settings', 'devices', 'fix', 'share', 'sound', 'studio', 'account'];
