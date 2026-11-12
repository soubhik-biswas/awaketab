import { classifyDenial, isTransientAdvice, policyBlocks } from './classify.js';
import { createEmitter } from './emitter.js';
import { createFallbackVideo, type IFallbackHandle } from './fallback.js';
import type {
  TAdviceCode,
  IChangeEvent,
  IErrorEvent,
  TLockState,
  IWakeLockHandle,
  IWakeLockLike,
  IWakeLockOptions,
  IWakeLockSentinelLike,
} from './types.js';

export type {
  TAdviceCode,
  IChangeEvent,
  IErrorEvent,
  TLockReason,
  TLockState,
  IRetryOptions,
  IWakeLockHandle,
  IWakeLockLike,
  IWakeLockOptions,
  IWakeLockSentinelLike,
} from './types.js';
export { classifyDenial } from './classify.js';

const DEFAULT_RETRY = { attempts: 3, baseMs: 500 };

export const isWakeLockSupported = (): boolean =>
  typeof navigator !== 'undefined' &&
  'wakeLock' in navigator &&
  (typeof window === 'undefined' || window.isSecureContext);

function inertHandle(): IWakeLockHandle {
  return {
    get state() {
      return 'idle' as const;
    },
    get supported() {
      return false;
    },
    get usingFallback() {
      return false;
    },
    get mode() {
      return null;
    },
    get advice() {
      return null;
    },
    request() {
      return Promise.resolve('idle' as const);
    },
    async release() {},
    on() {
      return () => undefined;
    },
    destroy() {},
  };
}

function resolveApi(opts: IWakeLockOptions): IWakeLockLike | null | undefined {
  if (opts.wakeLock !== undefined) return opts.wakeLock;
  const nav = opts.navigatorLike as { wakeLock?: IWakeLockLike } | undefined;
  if (nav && 'wakeLock' in nav) return nav.wakeLock ?? null;
  if (typeof navigator !== 'undefined' && 'wakeLock' in navigator) {
    return navigator.wakeLock;
  }
  return undefined;
}

function uaOf(opts: IWakeLockOptions): string {
  const nav = opts.navigatorLike as { userAgent?: string } | undefined;
  return nav?.userAgent ?? (typeof navigator !== 'undefined' ? navigator.userAgent : '');
}

export function createWakeLock(options: IWakeLockOptions = {}): IWakeLockHandle {
  if (typeof window === 'undefined' && !options.document && !options.documentLike) {
    return inertHandle();
  }

  const doc = options.documentLike ?? options.document ?? (typeof document !== 'undefined' ? document : undefined);
  const fallbackMode = options.fallback ?? 'video';
  const reacquire = options.reacquireOnVisible !== false;
  const retryOpt = options.retry === false ? { attempts: 0, baseMs: 0 } : { ...DEFAULT_RETRY, ...options.retry };
  const nudgeMs = options.nudgeIntervalMs ?? 20_000;
  const api = resolveApi(options);
  const ua = uaOf(options);
  const emitter = createEmitter<{ change: IChangeEvent; error: IErrorEvent }>();

  let state: TLockState = api ? 'idle' : 'unsupported';
  let mode: 'native' | 'video' | null = null;
  let advice: TAdviceCode | null = api ? null : 'unsupported_browser';
  let sentinel: IWakeLockSentinelLike | null = null;
  let video: IFallbackHandle | null = null;
  let destroyed = false;
  // True from request() until release(): what the caller last asked for, whatever the browser has done since.
  let wanted = false;
  let attempt = 0;
  let pending: Promise<TLockState> | null = null;
  let retryTimer: ReturnType<typeof setTimeout> | null = null;
  let visibleReleases: number[] = [];
  const jobs: Array<() => Promise<void>> = [];
  let draining = false;

  // Requests and releases run one at a time, in the order they were called; the first starts in the caller's own
  // call stack so the video fallback can play inside the tap.
  function serial<T>(task: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      jobs.push(() => task().then(resolve, reject));
      if (!draining) void drain();
    });
  }

  async function drain() {
    draining = true;
    for (let job = jobs.shift(); job; job = jobs.shift()) await job();
    draining = false;
  }

  const stopped = () => !wanted || destroyed;
  const again = () => void serial(() => nativeRequest('retry'));

  const onRelease = () => {
    if (destroyed) return;
    const hidden = doc?.visibilityState === 'hidden';
    sentinel?.removeEventListener('release', onRelease);
    sentinel = null;
    transition('lost', hidden ? 'released_hidden' : 'released_platform', hidden ? 'hidden_document' : advice);
    if (!hidden) {
      const now = Date.now();
      visibleReleases = visibleReleases.filter((t) => now - t < 10_000);
      visibleReleases.push(now);
      if (visibleReleases.length >= 3) {
        transition('denied', 'denied', null);
        scheduleRetry();
        return;
      }
      again();
    }
  };

  // A sentinel the browser released without the event reaching the page is still a loss.
  const missed = () => {
    if (state === 'held' && sentinel?.released) onRelease();
  };

  const onStall = () => {
    if (state !== 'fallback') return;
    video?.unwatch();
    video?.pause();
    transition('lost', 'released_platform', 'unsupported_browser');
  };

  const onVis = () => {
    if (destroyed) return;
    if (doc?.visibilityState === 'hidden') {
      if (state === 'fallback') {
        video?.unwatch();
        video?.pause();
        transition('lost', 'released_hidden', 'hidden_document');
      }
      return;
    }
    missed();
    if (state === 'lost' && reacquire) {
      again();
    } else if (state === 'denied' && advice === 'hidden_document') {
      attempt = 0;
      again();
    }
  };

  // While held, a fullscreen change asks for nothing: a second request would leave a second sentinel alive, and a
  // lock the browser dropped for the change arrives as a release event anyway.
  const onFs = () => {
    if (destroyed) return;
    missed();
    if (state === 'denied') again();
  };

  if (doc) {
    doc.addEventListener('visibilitychange', onVis);
    doc.addEventListener('fullscreenchange', onFs);
  }

  function transition(
    to: TLockState,
    reason: IChangeEvent['reason'],
    nextAdvice?: TAdviceCode | null,
    extra?: { error?: unknown },
  ) {
    const from = state;
    state = to;
    if (nextAdvice !== undefined) advice = nextAdvice;
    if (to === 'held' || to === 'fallback') advice = null;
    if (from !== to) {
      const event: IChangeEvent = { from, to, reason, at: Date.now() };
      if (advice) event.advice = advice;
      if (extra?.error !== undefined) event.error = extra.error;
      emitter.emit('change', event);
    }
  }

  function clearRetry() {
    if (retryTimer) {
      clearTimeout(retryTimer);
      retryTimer = null;
    }
  }

  function scheduleRetry() {
    if (stopped()) return;
    if (retryOpt.attempts <= 0 || attempt + 1 >= retryOpt.attempts) return;
    if (doc?.visibilityState === 'hidden') return;
    const delay = retryOpt.baseMs * 2 ** attempt;
    retryTimer = setTimeout(() => {
      retryTimer = null;
      attempt += 1;
      again();
    }, delay);
  }

  function inIframe(): boolean {
    try {
      return typeof window !== 'undefined' && window.self !== window.top;
    } catch {
      return true;
    }
  }

  function secure(): boolean {
    if (typeof window === 'undefined') return true;
    return window.isSecureContext;
  }

  // Lets go of the stored sentinel. Its listener goes first, so this release is never read as the browser's.
  function drop(): Promise<void> | undefined {
    const old = sentinel;
    sentinel = null;
    if (!old) return undefined;
    old.removeEventListener('release', onRelease);
    return old.released ? undefined : old.release().catch(() => undefined);
  }

  function dropVideo() {
    video?.remove();
    video = null;
  }

  async function nativeRequest(reason: 'request' | 'retry'): Promise<TLockState> {
    if (stopped()) return state;
    if (!api) return fallbackRequest(reason);
    clearRetry();
    if (sentinel && !sentinel.released) return state;
    transition('requesting', reason);
    try {
      const next = await api.request('screen');
      if (stopped()) {
        await next.release().catch(() => undefined);
        if (!destroyed) transition('idle', 'user_release');
        return state;
      }
      await drop();
      sentinel = next;
      next.addEventListener('release', onRelease);
      mode = 'native';
      attempt = 0;
      transition('held', 'acquired', null);
      return state;
    } catch (error) {
      if (stopped()) {
        if (!destroyed) transition('idle', 'user_release');
        return state;
      }
      const name = error instanceof Error ? error.name : '';
      if (name === 'SecurityError') {
        transition('unsupported', 'unsupported', 'insecure_context', { error });
        emitter.emit('error', { error, at: Date.now(), state, advice });
        return state;
      }
      const code = classifyDenial(error, {
        visible: doc?.visibilityState !== 'hidden',
        secure: secure(),
        inIframe: inIframe(),
        ua,
        policyBlocks: policyBlocks(doc),
      });
      transition('denied', 'denied', code, { error });
      emitter.emit('error', { error, at: Date.now(), state, advice: code });
      if (isTransientAdvice(code) && doc?.visibilityState !== 'hidden' && code !== 'hidden_document') {
        scheduleRetry();
      }
      return state;
    }
  }

  async function fallbackRequest(reason: 'request' | 'retry'): Promise<TLockState> {
    if (stopped()) return state;
    if (fallbackMode !== 'video' || !doc) {
      transition('unsupported', 'unsupported', secure() ? 'unsupported_browser' : 'insecure_context');
      emitter.emit('error', { error: new Error('unsupported'), at: Date.now(), state, advice });
      return state;
    }
    if (state === 'fallback') return state;
    transition('requesting', reason);
    video ??= createFallbackVideo(doc, options.videoSources);
    const mine = video;
    try {
      // Resolves only once the clip is seen to be playing, so `fallback` is never reported on a refused or stalled one.
      await mine.play();
      if (stopped()) throw new Error('stopped');
      mode = 'video';
      mine.watch(nudgeMs, onStall);
      transition('fallback', 'fallback_started', null);
      return state;
    } catch (error) {
      if (destroyed) return state;
      mine.remove();
      if (video === mine) video = null;
      if (!wanted) {
        transition('idle', 'user_release');
        return state;
      }
      transition('unsupported', 'unsupported', 'unsupported_browser', { error });
      emitter.emit('error', { error, at: Date.now(), state, advice });
      return state;
    }
  }

  async function releaseNow(): Promise<void> {
    clearRetry();
    await drop();
    dropVideo();
    // keep denied/unsupported so the pill can show the fix (docs/04 §3 row 20 is user idle only from held/lost)
    if (state !== 'idle' && state !== 'denied' && state !== 'unsupported') {
      transition('idle', 'user_release');
    }
  }

  const handle: IWakeLockHandle = {
    get state() {
      return state;
    },
    get supported() {
      return Boolean(api) && secure();
    },
    get usingFallback() {
      return state === 'fallback';
    },
    get mode() {
      return mode;
    },
    get advice() {
      return advice;
    },
    request() {
      if (destroyed) return Promise.resolve('idle' as const);
      wanted = true;
      if (pending) return pending;
      const mine = serial(async () => {
        attempt = 0;
        return nativeRequest('request');
      }).finally(() => {
        if (pending === mine) pending = null;
      });
      pending = mine;
      return mine;
    },
    release() {
      if (destroyed) return Promise.resolve();
      wanted = false;
      pending = null;
      clearRetry();
      // A video request still waiting on the browser is abandoned at once, so Stop never waits behind it.
      if (state === 'requesting') dropVideo();
      return serial(releaseNow);
    },
    on(event, cb) {
      if (event === 'change') return emitter.on('change', cb as (e: IChangeEvent) => void);
      return emitter.on('error', cb as (e: IErrorEvent) => void);
    },
    destroy() {
      if (destroyed) return;
      wanted = false;
      clearRetry();
      void drop();
      dropVideo();
      destroyed = true;
      if (doc) {
        doc.removeEventListener('visibilitychange', onVis);
        doc.removeEventListener('fullscreenchange', onFs);
      }
      emitter.clear();
      state = 'idle';
      mode = null;
    },
  };

  if (!api) {
    advice = secure() ? 'unsupported_browser' : 'insecure_context';
    state = 'unsupported';
  }

  return handle;
}
