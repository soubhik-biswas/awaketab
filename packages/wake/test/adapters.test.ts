import { afterEach, describe, expect, it, vi } from 'vitest';
import { h, render } from 'preact';
import { act } from 'preact/test-utils';
import { createApp, defineComponent } from 'vue';
import { useWakeLock as usePreact } from '../src/adapters/preact.js';
import { useWakeLock as useReact } from '../src/adapters/react.js';
import { useWakeLock as useVue } from '../src/adapters/vue.js';
import { createFakeApi } from './fake.js';

// A stand-in for React's hooks: state lives in slots that survive a cleanup, and effects can be cleaned up and run
// again on the same slots, which is what StrictMode does to every component in development.
const react = vi.hoisted(() => {
  type TEffect = () => undefined | (() => void);
  let slots: unknown[] = [];
  let cursor = 0;
  let effects: TEffect[] = [];
  let cleanups: Array<() => void> = [];
  const slot = <T>(make: () => T): { k: number; v: T } => {
    const k = cursor;
    cursor += 1;
    if (!(k in slots)) slots[k] = make();
    return { k, v: slots[k] as T };
  };
  return {
    hooks: {
      useState<T>(init: T | (() => T)) {
        const { k, v } = slot(() => (typeof init === 'function' ? (init as () => T)() : init));
        const set = (next: T | ((prev: T) => T)) => {
          slots[k] = typeof next === 'function' ? (next as (prev: T) => T)(slots[k] as T) : next;
        };
        return [v, set];
      },
      useRef: <T>(init: T) => slot(() => ({ current: init })).v,
      useCallback: <T>(fn: T) => slot(() => fn).v,
      useEffect(fn: TEffect) {
        effects.push(fn);
      },
    },
    render<T>(component: () => T): T {
      cursor = 0;
      effects = [];
      return component();
    },
    runEffects() {
      for (const fn of effects) {
        const off = fn();
        if (off) cleanups.push(off);
      }
    },
    cleanup() {
      for (const off of cleanups.splice(0)) off();
    },
    forget() {
      slots = [];
      effects = [];
      cleanups = [];
    },
  };
});

vi.mock('react', () => react.hooks);

const live = (fake: ReturnType<typeof createFakeApi>) => fake.sentinels.filter((s) => !s.released);

afterEach(() => {
  react.cleanup();
  react.forget();
  document.body.replaceChildren();
});

describe('React adapter', () => {
  const mount = (fake: ReturnType<typeof createFakeApi>) => {
    const component = () => useReact({ wakeLock: fake.api, documentLike: document, fallback: 'none' });
    react.render(component);
    react.runEffects();
    return () => react.render(component);
  };

  it('requests, reports the state and releases on unmount', async () => {
    const fake = createFakeApi();
    const rerender = mount(fake);
    expect(rerender().supported).toBe(true);
    expect(await rerender().request()).toBe('held');
    expect(rerender().state).toBe('held');
    react.cleanup();
    expect(live(fake)).toHaveLength(0);
    expect(await rerender().request()).toBe('idle');
  });

  it('works after an effect cleanup and re-run on the same component', async () => {
    const fake = createFakeApi();
    const rerender = mount(fake);
    react.cleanup();
    react.runEffects();
    expect(await rerender().request()).toBe('held');
    expect(rerender().state).toBe('held');
    expect(live(fake)).toHaveLength(1);
    await rerender().release();
    expect(rerender().state).toBe('idle');
    expect(live(fake)).toHaveLength(0);
  });

  it('mount, unmount, mount: the second mount holds a lock of its own', async () => {
    const fake = createFakeApi();
    const first = mount(fake);
    await first().request();
    react.cleanup();
    react.forget();
    expect(live(fake)).toHaveLength(0);
    const second = mount(fake);
    expect(await second().request()).toBe('held');
    expect(fake.sentinels).toHaveLength(2);
    expect(live(fake)).toHaveLength(1);
  });
});

describe('Preact adapter', () => {
  it('mount, unmount, mount: each mount gets a working lock and unmount releases it', async () => {
    const fake = createFakeApi();
    const root = document.body.appendChild(document.createElement('div'));
    let hook: ReturnType<typeof usePreact> | null = null;
    const Probe = () => {
      hook = usePreact({ wakeLock: fake.api, documentLike: document, fallback: 'none' });
      return null;
    };
    const current = () => hook as ReturnType<typeof usePreact> | null;

    await act(() => {
      render(h(Probe, null), root);
    });
    expect(current()?.supported).toBe(true);
    await act(async () => {
      expect(await current()?.request()).toBe('held');
    });
    expect(current()?.state).toBe('held');

    const stale = current();
    await act(() => {
      render(null, root);
    });
    expect(live(fake)).toHaveLength(0);
    expect(await stale?.request()).toBe('idle');

    await act(() => {
      render(h(Probe, null), root);
    });
    await act(async () => {
      expect(await current()?.request()).toBe('held');
    });
    expect(current()?.state).toBe('held');
    expect(fake.sentinels).toHaveLength(2);
    expect(live(fake)).toHaveLength(1);
    await act(() => {
      render(null, root);
    });
    expect(live(fake)).toHaveLength(0);
  });
});

describe('Vue adapter', () => {
  it('mount, unmount, mount: each mount gets a working lock and unmount releases it', async () => {
    const fake = createFakeApi();
    let hook: ReturnType<typeof useVue> | null = null;
    const Probe = defineComponent({
      setup() {
        hook = useVue({ wakeLock: fake.api, documentLike: document, fallback: 'none' });
        return () => null;
      },
    });
    const current = () => hook as ReturnType<typeof useVue> | null;

    const first = createApp(Probe);
    first.mount(document.body.appendChild(document.createElement('div')));
    expect(current()?.supported.value).toBe(true);
    expect(await current()?.request()).toBe('held');
    expect(current()?.state.value).toBe('held');
    const stale = current();
    first.unmount();
    expect(live(fake)).toHaveLength(0);
    expect(await stale?.request()).toBe('idle');

    const second = createApp(Probe);
    second.mount(document.body.appendChild(document.createElement('div')));
    expect(await current()?.request()).toBe('held');
    expect(current()?.state.value).toBe('held');
    expect(fake.sentinels).toHaveLength(2);
    expect(live(fake)).toHaveLength(1);
    second.unmount();
    expect(live(fake)).toHaveLength(0);
  });
});
