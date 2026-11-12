import { localeOf, pagePath, viewportClass } from './shape';

export type TFields = Record<string, string | number>;

export const SETTINGS_KEY = 'at.v1.settings';
export const CONSENT_EVENT = 'awaketab:consent';

const ENDPOINT = '/api/e';
const MAX_BATCH = 20;
// The server refuses a body over 8 KB, so a batch is cut before it gets there.
const MAX_BODY = 7000;
const FLUSH_MS = 15_000;
const VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? 'web';

let queue: TFields[] = [];
let timer: ReturnType<typeof setTimeout> | null = null;
let pageId = '';

export function readSettings(): Record<string, unknown> | null {
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? 'null');
    return typeof raw === 'object' && raw !== null && !Array.isArray(raw) ? (raw as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

// Only the production site counts, and never a page shown inside another site's frame.
function buildCounts(): boolean {
  if (process.env.NODE_ENV !== 'production' || process.env.NEXT_PUBLIC_DEPLOY_ENV === 'play') return false;
  try {
    return window.self === window.top;
  } catch {
    return false;
  }
}

function optedOut(): boolean {
  const signals = navigator as Navigator & { globalPrivacyControl?: unknown; doNotTrack?: unknown };
  return signals.globalPrivacyControl === true || signals.doNotTrack === '1';
}

// Counting needs an explicit Allow; a missing, false or unreadable answer means nothing is sent.
export function permitted(): boolean {
  if (typeof window === 'undefined' || !buildCounts() || optedOut()) return false;
  return readSettings()?.telemetry === true;
}

// The consent card and any later switch call this after saving the answer, so this tab reacts at once.
export function consentChanged(): void {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(CONSENT_EVENT));
}

// Fullscreen is left out: a browser tab in full screen matches it too.
const APP_MODES = ['standalone', 'minimal-ui', 'window-controls-overlay'];

function installed(): boolean {
  if ((navigator as Navigator & { standalone?: unknown }).standalone === true) return true;
  return APP_MODES.some((mode) => window.matchMedia(`(display-mode: ${mode})`).matches);
}

// Held in memory for this page only: it ties a session's start to its end and is gone on reload.
function pageSession(): string {
  if (!pageId) pageId = 'randomUUID' in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2);
  return pageId;
}

function post(body: string): void {
  try {
    if (navigator.sendBeacon(ENDPOINT, body)) return;
  } catch {
    // Some browsers and blockers have no beacon; the request below covers them.
  }
  void fetch(ENDPOINT, {
    method: 'POST',
    body,
    keepalive: true,
    headers: { 'content-type': 'application/json' },
  }).catch(() => undefined);
}

function takeBatch(): TFields[] {
  const batch: TFields[] = [];
  let size = 0;
  while (queue.length > 0 && batch.length < MAX_BATCH) {
    const next = queue[0];
    if (!next) break;
    size += JSON.stringify(next).length + 1;
    if (batch.length > 0 && size > MAX_BODY) break;
    batch.push(next);
    queue.shift();
  }
  return batch;
}

export function discard(): void {
  if (timer !== null) clearTimeout(timer);
  timer = null;
  queue = [];
}

export function flush(): void {
  if (timer !== null) clearTimeout(timer);
  timer = null;
  if (!permitted()) {
    queue = [];
    return;
  }
  while (queue.length > 0) {
    const batch = takeBatch();
    if (batch.length === 0) break;
    post(JSON.stringify({ events: batch }));
  }
}

export function track(event: string, fields: TFields = {}): void {
  if (!permitted()) {
    discard();
    return;
  }
  const path = pagePath(location.pathname);
  queue.push({
    event,
    ts: Date.now(),
    path,
    locale: localeOf(path),
    source: installed() ? 'pwa' : 'web',
    sid: pageSession(),
    viewport: viewportClass(window.innerWidth),
    ver: VERSION,
    ...fields,
  });
  if (queue.length >= MAX_BATCH) flush();
  else timer ??= setTimeout(flush, FLUSH_MS);
}
