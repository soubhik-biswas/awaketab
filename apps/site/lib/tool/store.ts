import { useSyncExternalStore } from 'react';

export interface ILocalStore<T> {
  get(): T;
  set(next: T | ((prev: T) => T)): void;
  subscribe(cb: () => void): () => void;
  reset(): void;
}

function readRaw(key: string): unknown {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? undefined : (JSON.parse(raw) as unknown);
  } catch {
    return undefined;
  }
}

function writeRaw(key: string, value: unknown) {
  try {
    if (value === undefined) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Private windows and blocked storage keep working from memory.
  }
}

// A localStorage-backed value with a defensive parser, shared by every hook and kept in step across tabs.
export function createLocalStore<T>(
  key: string,
  parse: (raw: unknown) => T,
  serialise: (value: T) => unknown = (v) => v,
): ILocalStore<T> {
  const subs = new Set<() => void>();
  let value: T | undefined;
  let listening = false;
  const load = (): T => {
    if (value === undefined) value = parse(typeof window === 'undefined' ? undefined : readRaw(key));
    return value;
  };
  const notify = () => {
    for (const cb of subs) cb();
  };
  const onStorage = (e: StorageEvent) => {
    if (e.key !== key && e.key !== null) return;
    value = parse(readRaw(key));
    notify();
  };
  return {
    get: load,
    set(next) {
      const prev = load();
      value = typeof next === 'function' ? (next as (p: T) => T)(prev) : next;
      writeRaw(key, serialise(value));
      notify();
    },
    subscribe(cb) {
      subs.add(cb);
      if (!listening && typeof window !== 'undefined') {
        listening = true;
        window.addEventListener('storage', onStorage);
      }
      return () => {
        subs.delete(cb);
      };
    },
    reset() {
      value = parse(undefined);
      writeRaw(key, undefined);
      notify();
    },
  };
}

export function useLocalStore<T>(store: ILocalStore<T>, serverValue: T): T {
  return useSyncExternalStore(store.subscribe, store.get, () => serverValue);
}

export const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

export const uid = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2);
