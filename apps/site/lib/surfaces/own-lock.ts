export type TOwnLock = 'off' | 'held' | 'lost' | 'denied' | 'unsupported';

interface ISentinel extends EventTarget {
  released: boolean;
  release(): Promise<void>;
}

interface IWakeLockApi {
  request(type: 'screen'): Promise<ISentinel>;
}

// A screen wake lock owned by one window (the mini clock's floating window or popup), so the screen stays awake
// while the tab that opened it sits behind other windows. It asks again whenever that window is shown.
export function holdOwnLock(win: Window, onChange: (state: TOwnLock) => void): () => void {
  const nav: { wakeLock?: IWakeLockApi } = win.navigator;
  const api = nav.wakeLock;
  if (!api) {
    onChange('unsupported');
    return () => undefined;
  }
  let sentinel: ISentinel | null = null;
  let alive = true;
  const onRelease = () => {
    sentinel = null;
    if (alive) onChange('lost');
  };
  const ask = async () => {
    if (!alive || sentinel || win.document.visibilityState !== 'visible') return;
    try {
      const s = await api.request('screen');
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- the cleanup can run while the request is pending
      if (!alive) {
        void s.release();
        return;
      }
      sentinel = s;
      s.addEventListener('release', onRelease, { once: true });
      onChange('held');
    } catch {
      onChange('denied');
    }
  };
  const onVisible = () => {
    if (win.document.visibilityState === 'visible') void ask();
  };
  win.document.addEventListener('visibilitychange', onVisible);
  void ask();
  return () => {
    alive = false;
    win.document.removeEventListener('visibilitychange', onVisible);
    const s = sentinel;
    sentinel = null;
    if (s && !s.released) void s.release();
  };
}
