export const UPDATE_EVENT = 'awaketab:update';

// Tells the tool a new build is ready: a worker that finished installing, or one that took over, while an older
// one was already serving this tab. A first visit has no older worker, so it stays quiet.
export function watchForUpdate(): () => void {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return () => undefined;
  const sw = navigator.serviceWorker;
  const had = sw.controller !== null;
  let alive = true;
  const say = () => {
    if (alive && had) window.dispatchEvent(new Event(UPDATE_EVENT));
  };
  const watch = (worker: ServiceWorker | null) => {
    worker?.addEventListener('statechange', () => {
      if (worker.state === 'installed') say();
    });
  };
  sw.addEventListener('controllerchange', say);
  void sw
    .getRegistration()
    .then((reg) => {
      if (!reg || !alive) return;
      if (reg.waiting) say();
      watch(reg.installing);
      reg.addEventListener('updatefound', () => watch(reg.installing));
    })
    .catch(() => undefined);
  return () => {
    alive = false;
    sw.removeEventListener('controllerchange', say);
  };
}
