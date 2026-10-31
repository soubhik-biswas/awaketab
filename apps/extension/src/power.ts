import type { TAdviceCode, TLockState } from '@awaketab/core';
import type { IChangeEvent, IWakeLockHandle } from '@awaketab/wake';
import type { IExtApi } from './api';

export interface IPowerLock extends IWakeLockHandle {
  reassert(): void;
}

// chrome.power as a wake-lock handle for the session engine: one display request per extension, held from the
// service worker, so it works in any tab and while other apps are in front.
export function createPowerLock(opts: { power: IExtApi['power']; now?: () => number }): IPowerLock {
  const now = opts.now ?? Date.now;
  const listeners = new Set<(e: IChangeEvent) => void>();
  let state: TLockState = opts.power ? 'idle' : 'unsupported';
  let advice: TAdviceCode | null = opts.power ? null : 'unsupported_browser';

  function go(to: TLockState, reason: IChangeEvent['reason'], nextAdvice: TAdviceCode | null = null) {
    const from = state;
    state = to;
    advice = nextAdvice;
    if (from === to) return;
    const event: IChangeEvent = { from, to, reason, at: now() };
    if (nextAdvice) event.advice = nextAdvice;
    for (const cb of listeners) cb(event);
  }

  function issue(): boolean {
    try {
      opts.power?.requestKeepAwake('display');
      return true;
    } catch {
      go('denied', 'denied', 'permissions_policy');
      return false;
    }
  }

  const handle: IPowerLock = {
    get state() {
      return state;
    },
    get supported() {
      return Boolean(opts.power);
    },
    usingFallback: false,
    get mode() {
      return state === 'held' ? ('native' as const) : null;
    },
    get advice() {
      return advice;
    },
    request() {
      if (!opts.power) {
        go('unsupported', 'unsupported', 'unsupported_browser');
        return Promise.resolve(state);
      }
      if (state === 'held') {
        issue();
        return Promise.resolve(state);
      }
      go('requesting', 'request');
      if (issue()) go('held', 'acquired');
      return Promise.resolve(state);
    },
    release() {
      if (state === 'held' || state === 'requesting') {
        try {
          opts.power?.releaseKeepAwake();
        } finally {
          go('idle', 'user_release');
        }
      }
      return Promise.resolve();
    },
    reassert() {
      if (state === 'held') issue();
    },
    on(_event: 'change' | 'error', cb: (e: never) => void) {
      if (_event !== 'change') return () => undefined;
      const fn = cb as (e: IChangeEvent) => void;
      listeners.add(fn);
      return () => {
        listeners.delete(fn);
      };
    },
    destroy() {
      void handle.release();
      listeners.clear();
    },
  };
  return handle;
}
