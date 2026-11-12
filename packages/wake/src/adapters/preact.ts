import { useCallback, useEffect, useRef, useState } from 'preact/hooks';
import { createWakeLock } from '../index.js';
import type { IWakeLockHandle, IWakeLockOptions, TLockState } from '../types.js';

export function useWakeLock(options?: IWakeLockOptions) {
  const [state, setState] = useState<TLockState>('idle');
  const [supported, setSupported] = useState(false);
  const ref = useRef<IWakeLockHandle | null>(null);

  // The lock lives and dies with the effect, so a cleanup followed by a re-run (StrictMode, a remount) gets a new one.
  useEffect(() => {
    const lock = createWakeLock(options);
    ref.current = lock;
    setSupported(lock.supported);
    setState(lock.state);
    const off = lock.on('change', (e) => {
      setState(e.to);
    });
    return () => {
      off();
      ref.current = null;
      lock.destroy();
    };
  }, []);

  const request = useCallback((): Promise<TLockState> => ref.current?.request() ?? Promise.resolve('idle'), []);
  const release = useCallback((): Promise<void> => ref.current?.release() ?? Promise.resolve(), []);

  return { state, supported, request, release };
}
