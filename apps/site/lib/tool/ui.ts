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

export type TBanner = 'none' | 'offline' | 'conflict' | 'update';
export type TFaceCol = 'featured' | 'digital' | 'analog' | 'ambient' | 'all';
export type TDevice = 'desktop' | 'tabletL' | 'tabletP' | 'phone';

export interface IQaOverrides {
  banner?: TBanner;
  emptyPresets?: boolean;
  samples?: boolean;
  offsetMs?: number;
}

export interface IToolUi {
  view: TToolView;
  palQuery: string;
  clearText: string;
  copied: boolean;
  faceCol: TFaceCol;
  update: boolean;
  qa: IQaOverrides;
}

const INITIAL: IToolUi = {
  view: 'timer',
  palQuery: '',
  clearText: '',
  copied: false,
  faceCol: 'featured',
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
