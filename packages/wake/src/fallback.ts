export interface IFallbackHandle {
  el: HTMLVideoElement;
  play(): Promise<void>;
  pause(): void;
  remove(): void;
  watch(ms: number, onStall: () => void): void;
  unwatch(): void;
}

const CHECK_MS = 250;
const CHECKS = 8;

export function createFallbackVideo(doc: Document, sources: { webm?: string; mp4?: string } = {}): IFallbackHandle {
  const v = doc.createElement('video');
  v.playsInline = true;
  v.preload = 'auto';
  v.setAttribute('playsinline', '');
  v.setAttribute('webkit-playsinline', '');
  v.setAttribute('aria-hidden', 'true');
  v.title = 'AwakeTab keeps the screen awake';
  v.disablePictureInPicture = true;
  // Drawn on the page and never muted: a browser keeps the display on only for a video it renders that has sound.
  v.style.cssText = 'position:fixed;left:0;bottom:0;width:1px;height:1px;opacity:0.01;pointer-events:none';
  doc.body.appendChild(v);

  let last: HTMLSourceElement | null = null;
  let loading: Promise<void> | null = null;
  let timer: ReturnType<typeof setInterval> | null = null;
  let pending: Promise<void> | null = null;
  let stop: (() => void) | null = null;
  let on = false;

  const running = (from: number) => !v.paused && v.readyState >= 2 && v.currentTime !== from;

  // WebKit lets the screen sleep when a looping clip wraps, so the clip rewinds before its end instead of using `loop`.
  v.addEventListener('timeupdate', () => {
    if (v.currentTime > v.duration * 0.8) v.currentTime = 0;
  });
  v.addEventListener('ended', () => {
    v.currentTime = 0;
    if (on) void v.play().catch(() => undefined);
  });

  // The clips live in their own module, fetched on first use, so the core entry stays small.
  const load = (): Promise<void> =>
    (sources.webm && sources.mp4 ? Promise.resolve(sources) : import('./video.js')).then((clip) => {
      for (const [type, src] of [
        ['video/webm', sources.webm ?? clip.webm],
        ['video/mp4', sources.mp4 ?? clip.mp4],
      ] as const) {
        if (!src) continue;
        last = doc.createElement('source');
        last.type = type;
        last.src = src;
        v.appendChild(last);
      }
    });

  const started = () =>
    new Promise<void>((resolve, reject) => {
      // play() never settles once every <source> has failed, so the last source's error rejects it instead.
      if (last)
        last.onerror = () => {
          reject(new Error('no source'));
        };
      v.play().then(resolve, reject);
    });

  // play() resolving is not proof: the clip counts as playing only once its clock has moved.
  const moving = () =>
    new Promise<void>((resolve, reject) => {
      const from = v.currentTime;
      let n = 0;
      const id = setInterval(() => {
        n += 1;
        const ok = on && running(from);
        if (!ok && on && n < CHECKS) return;
        clearInterval(id);
        if (ok) resolve();
        else reject(new Error('stalled'));
      }, CHECK_MS);
    });

  const play = (): Promise<void> => {
    on = true;
    // Called in the tap itself, before the clip has arrived, so the element may play later without another tap.
    void Promise.resolve(v.play()).catch(() => undefined);
    pending ??= new Promise<void>((resolve, reject) => {
      stop = () => {
        reject(new Error('stopped'));
      };
      (loading ??= load()).then(started).then(moving).then(resolve, reject);
    }).finally(() => {
      pending = null;
    });
    return pending;
  };

  const halt = () => {
    on = false;
    stop?.();
    v.pause();
  };

  const unwatch = () => {
    if (timer) clearInterval(timer);
    timer = null;
  };

  return {
    el: v,
    play,
    pause: halt,
    watch(ms, onStall) {
      unwatch();
      let at = v.currentTime;
      timer = setInterval(() => {
        const ok = running(at);
        at = v.currentTime;
        if (ok) return;
        // One restart before reporting the loss: a stalled clip often only needs play() again.
        play().then(
          () => {
            at = v.currentTime;
          },
          () => {
            if (on) onStall();
          },
        );
      }, ms);
    },
    unwatch,
    remove() {
      unwatch();
      halt();
      v.remove();
    },
  };
}
