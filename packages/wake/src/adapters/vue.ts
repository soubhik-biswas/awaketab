import { onMounted, onUnmounted, ref } from 'vue';
import { createWakeLock } from '../index.js';
import type { IWakeLockHandle, IWakeLockOptions, TLockState } from '../types.js';

export function useWakeLock(options?: IWakeLockOptions) {
  const state = ref<TLockState>('idle');
  const supported = ref(false);
  let lock: IWakeLockHandle | null = null;

  onMounted(() => {
    lock = createWakeLock(options);
    state.value = lock.state;
    supported.value = lock.supported;
    lock.on('change', (e) => {
      state.value = e.to;
    });
  });
  onUnmounted(() => {
    lock?.destroy();
    lock = null;
  });

  return {
    state,
    supported,
    request: (): Promise<TLockState> => lock?.request() ?? Promise.resolve('idle'),
    release: (): Promise<void> => lock?.release() ?? Promise.resolve(),
  };
}
