const VERSION = 'v1';
const SHELL = `at-shell-${VERSION}`;
const ASSETS = `at-assets-${VERSION}`;
const PAGES = `at-pages-${VERSION}`;
const OFFLINE = '/offline';
const PRECACHE = [OFFLINE, '/favicon.svg', '/icons/icon-192.png', '/icons/icon-512.png'];
const LOCALES = ['es', 'pt-br', 'de', 'fr', 'ja', 'zh', 'hi'];
const NO_CACHE = [/^\/api\//u, /^\/embed(?:\/|\.js$)/u, /^\/dev\//u];

const WIDGET_SYNC = 'awaketab:widgets';
const WIDGET_ACTION = 'awaketab:widget-action';
const WIDGET_TEMPLATES = { awake: '/widgets/awake.json', presets: '/widgets/presets.json', session: '/widgets/session.json' };
const WIDGET_DATA = '/widgets/data.json';
const PRESETS = { p60: '/timer?preset=p60&autostart=1', p45: '/timer?preset=p45&autostart=1', p30: '/timer?preset=p30&autostart=1' };

let widgetState = null;

const sameOrigin = (url) => url.origin === self.location.origin;
const cacheable = (res) => res && res.ok && !res.redirected && res.type === 'basic';

function offlineFor(pathname) {
  const first = pathname.split('/')[1] || '';
  return LOCALES.includes(first) ? [`/${first}${OFFLINE}`, OFFLINE] : [OFFLINE];
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keep = new Set([SHELL, ASSETS, PAGES]);
      for (const key of await caches.keys()) if (!keep.has(key)) await caches.delete(key);
      await self.clients.claim();
    })(),
  );
});

async function fromNetworkFirst(request) {
  const cache = await caches.open(PAGES);
  try {
    const res = await fetch(request);
    if (cacheable(res)) await cache.put(request, res.clone());
    return res;
  } catch {
    const hit = await cache.match(request, { ignoreSearch: true });
    if (hit) return hit;
    const shell = await caches.open(SHELL);
    for (const page of offlineFor(new URL(request.url).pathname)) {
      const fallback = (await shell.match(page)) || (await cache.match(page));
      if (fallback) return fallback;
    }
    return Response.error();
  }
}

async function fromCacheFirst(request) {
  const cache = await caches.open(ASSETS);
  const hit = await cache.match(request);
  if (hit) return hit;
  const res = await fetch(request);
  if (cacheable(res)) await cache.put(request, res.clone());
  return res;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (!sameOrigin(url) || NO_CACHE.some((re) => re.test(url.pathname))) return;
  if (request.mode === 'navigate') {
    event.respondWith(fromNetworkFirst(request));
    return;
  }
  if (url.pathname.startsWith('/_next/static/') || /^\/(?:icons|brand|fonts)\//u.test(url.pathname)) {
    event.respondWith(fromCacheFirst(request));
  }
});

async function widgetPayload(tag) {
  const template = await (await fetch(WIDGET_TEMPLATES[tag] || WIDGET_TEMPLATES.awake)).text();
  const data = widgetState ? JSON.stringify(widgetState) : await (await fetch(WIDGET_DATA)).text();
  return { template, data };
}

async function updateWidget(widget) {
  if (!self.widgets || !widget || !widget.definition) return;
  const payload = await widgetPayload(widget.definition.tag);
  await self.widgets.updateByInstanceId(widget.instanceId, payload);
}

async function updateAllWidgets() {
  if (!self.widgets) return;
  for (const tag of Object.keys(WIDGET_TEMPLATES)) {
    const list = await self.widgets.matchAll({ tag });
    if (!list || list.length === 0) continue;
    const payload = await widgetPayload(tag);
    await self.widgets.updateByTag(tag, payload);
  }
}

async function runAction(action, preset) {
  const list = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
  const tab = list.find((c) => sameOrigin(new URL(c.url)) && new URL(c.url).pathname.endsWith('/timer'));
  if (tab) {
    tab.postMessage({ type: WIDGET_ACTION, action, preset });
    return tab.focus();
  }
  const url = action === 'preset' && PRESETS[preset] ? PRESETS[preset] : '/timer';
  return self.clients.openWindow(url);
}

self.addEventListener('widgetinstall', (event) => event.waitUntil(updateWidget(event.widget)));
self.addEventListener('widgetresume', (event) => event.waitUntil(updateWidget(event.widget)));
self.addEventListener('widgetclick', (event) => {
  const data = event.data && typeof event.data === 'object' ? event.data : {};
  const verb = ['extend', 'stop', 'preset', 'open'].includes(event.action) ? event.action : 'open';
  event.waitUntil(runAction(verb, data.preset));
});

self.addEventListener('message', (event) => {
  const msg = event.data;
  if (msg === 'SKIP_WAITING') {
    self.skipWaiting();
    return;
  }
  if (msg && msg.type === WIDGET_SYNC && msg.data && typeof msg.data === 'object') {
    widgetState = msg.data;
    event.waitUntil(updateAllWidgets());
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      const tab = list.find((c) => sameOrigin(new URL(c.url)));
      return tab ? tab.focus() : self.clients.openWindow('/timer');
    }),
  );
});
