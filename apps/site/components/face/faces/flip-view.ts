type TEase = (t: number) => number;

interface IViewState {
  root: HTMLElement;
  value: string | null;
  valueUpdateCount: number;
  dirty: boolean;
  isInitialValue: () => boolean;
  style: { flipDuration: number; flipEasing: string };
}

interface IView {
  update: (value: string) => void;
  draw: () => void;
  destroy: () => void;
}

type TPlugin = (host: typeof HOST) => (root: HTMLElement) => IView;

export interface IFlap {
  set: (value: string) => void;
  destroy: () => void;
}
export type TFlapMount = (root: HTMLElement, value: string) => IFlap;

const FLAP_MS = 640;
// The flap lets go softly, falls, and settles on the card below without a bounce.
const fall: TEase = (t) => 1 - (1 - t ** 1.5) ** 3;
const EASES: Readonly<Record<string, TEase>> = {
  'ease-out-cubic': (t) => 1 - (1 - t) ** 3,
  'ease-out-sine': (t) => Math.sin((t * Math.PI) / 2),
};

// What the library's flip view asks of its host. The face feeds the values itself, so the library's counter engine
// (and its frame loop that never stops) stays out of the page.
const HOST = {
  DOM: {
    create: (tag: string, className: string): HTMLElement => {
      const el = document.createElement(tag);
      el.className = className;
      return el;
    },
    // A hidden tab runs no frames: the cards take the new value at once instead of queueing a flap for every second.
    visible: (el: HTMLElement): boolean => !document.hidden && el.isConnected,
    transform: (el: HTMLElement, name: string, value: number): void => {
      el.style.transform = `${name}(${value})`;
    },
  },
  Animation: { animate: null },
  Extension: {
    Type: { EASING_FUNCTION: 'easing' },
    getExtension: (_type: string, name: string): TEase => EASES[name] ?? fall,
  },
  Date: { performance: (): number => performance.now() },
  View: {
    rooter: (state: IViewState, root: HTMLElement): object => {
      state.root = root;
      return {};
    },
    updater: (state: IViewState): Pick<IView, 'update'> => {
      state.dirty = true;
      state.value = null;
      state.valueUpdateCount = 0;
      state.isInitialValue = () => state.valueUpdateCount <= 1;
      return {
        update: (value) => {
          if (state.value === value) return;
          state.value = value;
          state.valueUpdateCount++;
          state.dirty = true;
        },
      };
    },
    styler: (state: IViewState): object => {
      state.style = { flipDuration: FLAP_MS, flipEasing: 'fall' };
      return {};
    },
    drawer: (state: IViewState, draw: (state: IViewState) => void): Pick<IView, 'draw'> => ({
      draw: () => {
        if (!state.dirty) return;
        draw(state);
        state.dirty = false;
      },
    }),
    destroyer: (state: IViewState): Pick<IView, 'destroy'> => ({
      destroy: () => {
        state.root.textContent = '';
      },
    }),
  },
};

let mount: TFlapMount | null = null;
let loading: Promise<void> | null = null;
const waiting = new Set<() => void>();

export const flapMount = (): TFlapMount | null => mount;

export const onFlapMount = (fn: () => void): (() => void) => {
  waiting.add(fn);
  return () => {
    waiting.delete(fn);
  };
};

// Fetches the split-flap view the first time a flip face may move; until then, and if it fails, the cards stay still.
export function loadFlap(): void {
  if (mount || loading) return;
  // @ts-expect-error The library ships no type declarations.
  const lib = import('@pqina/flip/dist/tick.view.flip.module') as Promise<{ default: TPlugin | null }>;
  loading = lib
    .then(({ default: plugin }) => {
      if (!plugin) return;
      const view = plugin(HOST);
      mount = (root, value) => {
        const v = view(root);
        const set = (next: string) => {
          v.update(next);
          v.draw();
        };
        set(value);
        return { set, destroy: v.destroy };
      };
      for (const fn of waiting) fn();
    })
    .catch(() => {
      loading = null;
    });
}
