import { CONSENT_EVENT, SETTINGS_KEY, discard, flush, permitted, readSettings, track, type TFields } from './client';
import { errorName, isToolPath, pagePath, referrerHost, refFromSearch, tidyMessage, token } from './shape';

type TVia = 'load' | 'route' | 'allow';

const MAX_ERRORS = 5;

let running = false;
let lastPath = '';
let captured = false;
let landing: { referrer: string; ref: string } | null = null;
let errors = 0;
let loading = false;
let sessions: { stop: () => void; leave: () => void } | null = null;

// The face and background on screen when a session starts; the tool's defaults stand in for an unset choice.
function look(): { face: string; background: string } {
  const settings = readSettings();
  return { face: token(settings?.face) || 'ring', background: token(settings?.vibe) || 'aurora' };
}

// The session watcher loads only on the pages that run a session, where the wake code is already on the page.
function watchTool(): void {
  if (sessions || loading || !isToolPath(lastPath)) return;
  loading = true;
  void import('./session-watch')
    .then((m) => {
      if (running && !sessions) sessions = m.watchSessions(track, look);
    })
    .catch(() => undefined)
    .finally(() => {
      loading = false;
    });
}

function pageView(via: TVia): void {
  lastPath = pagePath(location.pathname);
  const fields: TFields = { via };
  // Where the visit came from rides on its first counted page only.
  if (landing?.referrer) fields.referrer = landing.referrer;
  if (landing?.ref) fields.ref = landing.ref;
  landing = null;
  track('page_view', fields);
  watchTool();
}

function reportError(cause: unknown, fallback: string): void {
  if (errors >= MAX_ERRORS) return;
  errors += 1;
  const text = cause instanceof Error ? cause.message : typeof cause === 'string' ? cause : fallback;
  track('client_error', { code: errorName(cause), message: tidyMessage(text || fallback) });
}

const onHidden = () => {
  if (document.visibilityState === 'hidden') flush();
};
const onLeave = () => {
  sessions?.leave();
  flush();
};
const onShow = (e: PageTransitionEvent) => {
  if (e.persisted) pageView('load');
};
const onError = (e: ErrorEvent) => reportError(e.error, e.message);
const onRejection = (e: PromiseRejectionEvent) => reportError(e.reason, '');
const onInstall = () => track('pwa_install');
const onPip = () => track('pip_open');

const pipWindows = (): EventTarget | undefined =>
  (window as Window & { documentPictureInPicture?: EventTarget }).documentPictureInPicture;

function start(): void {
  running = true;
  document.addEventListener('visibilitychange', onHidden);
  window.addEventListener('pagehide', onLeave);
  window.addEventListener('pageshow', onShow);
  window.addEventListener('error', onError);
  window.addEventListener('unhandledrejection', onRejection);
  window.addEventListener('appinstalled', onInstall);
  pipWindows()?.addEventListener('enter', onPip);
}

function stop(): void {
  running = false;
  document.removeEventListener('visibilitychange', onHidden);
  window.removeEventListener('pagehide', onLeave);
  window.removeEventListener('pageshow', onShow);
  window.removeEventListener('error', onError);
  window.removeEventListener('unhandledrejection', onRejection);
  window.removeEventListener('appinstalled', onInstall);
  pipWindows()?.removeEventListener('enter', onPip);
  sessions?.stop();
  sessions = null;
  discard();
}

// Starts on an Allow and stops the moment the answer changes; the page that gave the answer is counted.
function sync(via: TVia): void {
  const want = permitted();
  if (want && !running) {
    start();
    pageView(via === 'load' && lastPath ? 'route' : via);
  } else if (!want && running) stop();
}

const onConsent = () => sync('allow');
const onStorage = (e: StorageEvent) => {
  if (e.key === null || e.key === SETTINGS_KEY) sync('load');
};
// A switch may save the answer without announcing it, so each click is followed by one look at the saved answer.
const onClick = () => {
  setTimeout(onConsent, 0);
};

export function mountTelemetry(): () => void {
  if (!captured) {
    captured = true;
    landing = {
      referrer: referrerHost(document.referrer, location.hostname),
      ref: refFromSearch(location.search),
    };
  }
  window.addEventListener(CONSENT_EVENT, onConsent);
  window.addEventListener('storage', onStorage);
  document.addEventListener('click', onClick);
  sync('load');
  return () => {
    window.removeEventListener(CONSENT_EVENT, onConsent);
    window.removeEventListener('storage', onStorage);
    document.removeEventListener('click', onClick);
    if (running) {
      flush();
      stop();
    }
  };
}

export function routeChanged(): void {
  if (!running || !permitted()) {
    sync('route');
    return;
  }
  if (pagePath(location.pathname) !== lastPath) pageView('route');
}
