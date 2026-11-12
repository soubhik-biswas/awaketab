export class FakeSentinel extends EventTarget {
  released = false;
  type = 'screen' as const;
  release = async () => {
    if (this.released) return;
    this.released = true;
    this.dispatchEvent(new Event('release'));
  };
}

export function createFakeApi() {
  const sentinels: FakeSentinel[] = [];
  let rejectWith: Error | null = null;
  const api = {
    request: async () => {
      if (rejectWith) {
        const err = rejectWith;
        rejectWith = null;
        throw err;
      }
      const s = new FakeSentinel();
      sentinels.push(s);
      return s;
    },
  };
  return {
    api,
    sentinels,
    rejectNextWith(err: Error) {
      rejectWith = err;
    },
    releaseAll() {
      for (const s of sentinels) void s.release();
    },
  };
}

export function setVisibility(doc: Document, vis: DocumentVisibilityState) {
  Object.defineProperty(doc, 'visibilityState', { configurable: true, get: () => vis });
  Object.defineProperty(doc, 'hidden', { configurable: true, get: () => vis === 'hidden' });
  doc.dispatchEvent(new Event('visibilitychange'));
}

// Stands in for a real media element: happy-dom's video never plays. `clock` moves a little on every read while the
// element plays and `moving` is true, the way currentTime does in a browser.
export function fakeMedia() {
  const proto = HTMLVideoElement.prototype;
  const ctl = {
    paused: true,
    moving: true,
    readyState: 4,
    clock: 0,
    duration: 10,
    plays: 0,
    reject: null as Error | null,
    hang: false,
    restore() {
      for (const key of ['play', 'pause', 'paused', 'readyState', 'currentTime', 'duration'] as const) {
        Reflect.deleteProperty(proto, key);
      }
    },
  };
  Object.defineProperties(proto, {
    play: {
      configurable: true,
      value() {
        ctl.plays += 1;
        if (ctl.hang) return new Promise<void>(() => undefined);
        if (ctl.reject) return Promise.reject(ctl.reject);
        ctl.paused = false;
        return Promise.resolve();
      },
    },
    pause: {
      configurable: true,
      value() {
        ctl.paused = true;
      },
    },
    paused: { configurable: true, get: () => ctl.paused },
    readyState: { configurable: true, get: () => ctl.readyState },
    duration: { configurable: true, get: () => ctl.duration },
    currentTime: {
      configurable: true,
      get() {
        if (!ctl.paused && ctl.moving) ctl.clock += 0.25;
        return ctl.clock;
      },
      set(v: number) {
        ctl.clock = v;
      },
    },
  });
  return ctl;
}
