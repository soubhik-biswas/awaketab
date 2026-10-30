import { defaultCache } from '@serwist/turbopack/worker';
import { NetworkOnly, Serwist, type PrecacheEntry } from 'serwist';
import { WIDGET_ACTION, WIDGET_SYNC } from '../lib/surfaces/widget-protocol';

interface IExtendable extends Event {
  waitUntil(p: Promise<unknown>): void;
}

interface IWindowClient {
  url: string;
  focus(): Promise<unknown>;
  postMessage(msg: unknown): void;
}

interface IWidget {
  instanceId: string;
  definition?: { tag?: string };
}

interface IWidgetEvent extends IExtendable {
  widget?: IWidget;
  action?: string;
  data?: unknown;
}

interface IWidgets {
  matchAll(o: { tag: string }): Promise<IWidget[]>;
  updateByTag(tag: string, payload: { template: string; data: string }): Promise<void>;
  updateByInstanceId(id: string, payload: { template: string; data: string }): Promise<void>;
}

interface ISwScope {
  __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  location: Location;
  widgets?: IWidgets;
  clients: {
    matchAll(o: { type: 'window'; includeUncontrolled: boolean }): Promise<IWindowClient[]>;
    openWindow(url: string): Promise<unknown>;
  };
  addEventListener(
    type: string,
    cb: (e: IWidgetEvent & { data?: unknown; notification?: { close(): void } }) => void,
  ): void;
}

declare const self: ISwScope;
declare const __AT_SW_REVISION__: string;

const LOCALES = ['es', 'pt-br', 'de', 'fr', 'ja', 'zh', 'hi'];
const REVISION = __AT_SW_REVISION__;
const TEMPLATES: Record<string, string> = {
  awake: '/widgets/awake.json',
  presets: '/widgets/presets.json',
  session: '/widgets/session.json',
};
const PRESETS = new Set(['p60', 'p45', 'p30']);

const localeOf = (pathname: string): string => {
  const first = pathname.split('/')[1] ?? '';
  return LOCALES.includes(first) ? first : 'en';
};
const offlineOf = (locale: string) => (locale === 'en' ? '/offline' : `/${locale}/offline`);
const homeOf = (locale: string) => (locale === 'en' ? '/' : `/${locale}`);

const serwist = new Serwist({
  precacheEntries: [
    ...(self.__SW_MANIFEST ?? []),
    ...['en', ...LOCALES].map((l) => ({ url: offlineOf(l), revision: REVISION })),
    { url: '/widgets/data.json', revision: REVISION },
    ...Object.values(TEMPLATES).map((url) => ({ url, revision: REVISION })),
  ],
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    {
      matcher: ({ url }) => url.pathname.startsWith('/api/') || url.pathname.startsWith('/embed'),
      handler: new NetworkOnly(),
    },
    ...defaultCache,
  ],
  fallbacks: {
    entries: [
      {
        url: '/offline',
        matcher: ({ request }) =>
          request.destination === 'document' && localeOf(new URL(request.url).pathname) === 'en',
      },
      ...LOCALES.map((l) => ({
        url: offlineOf(l),
        matcher: ({ request }: { request: Request }) =>
          request.destination === 'document' && localeOf(new URL(request.url).pathname) === l,
      })),
    ],
  },
});

serwist.addEventListeners();

let widgetState: string | null = null;

async function payload(tag: string): Promise<{ template: string; data: string }> {
  const template = await (await fetch(TEMPLATES[tag] ?? '/widgets/awake.json')).text();
  const data = widgetState ?? (await (await fetch('/widgets/data.json')).text());
  return { template, data };
}

async function updateOne(widget: IWidget | undefined) {
  if (!self.widgets || !widget) return;
  await self.widgets.updateByInstanceId(widget.instanceId, await payload(widget.definition?.tag ?? 'awake'));
}

async function updateAll() {
  const widgets = self.widgets;
  if (!widgets) return;
  for (const tag of Object.keys(TEMPLATES)) {
    const list = await widgets.matchAll({ tag });
    if (list.length > 0) await widgets.updateByTag(tag, await payload(tag));
  }
}

// A widget tap reaches an open AwakeTab window, or opens one on that action.
async function runAction(action: string, preset: string | undefined) {
  const list = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
  const ours = list.filter((c) => new URL(c.url).origin === self.location.origin);
  const tool = ours.find((c) => {
    const path = new URL(c.url).pathname.replace(/\/$/u, '');
    return path === '' || path === homeOf(localeOf(path));
  });
  if (tool) {
    tool.postMessage({ type: WIDGET_ACTION, action, preset });
    await tool.focus();
    return;
  }
  const home = homeOf(localeOf(ours[0] ? new URL(ours[0].url).pathname : '/'));
  const url = action === 'preset' && preset && PRESETS.has(preset) ? `${home}?preset=${preset}&autostart=1` : home;
  await self.clients.openWindow(url);
}

self.addEventListener('widgetinstall', (e) => e.waitUntil(updateOne(e.widget)));
self.addEventListener('widgetresume', (e) => e.waitUntil(updateOne(e.widget)));
self.addEventListener('widgetclick', (e) => {
  const verb = e.action === 'extend' || e.action === 'stop' || e.action === 'preset' ? e.action : 'open';
  const data = e.data && typeof e.data === 'object' ? (e.data as Record<string, unknown>) : {};
  e.waitUntil(runAction(verb, typeof data.preset === 'string' ? data.preset : undefined));
});

self.addEventListener('message', (e) => {
  const msg = e.data as { type?: unknown; data?: unknown } | null;
  if (!msg || msg.type !== WIDGET_SYNC || !msg.data || typeof msg.data !== 'object') return;
  widgetState = JSON.stringify(msg.data);
  e.waitUntil(updateAll());
});

self.addEventListener('notificationclick', (e) => {
  e.notification?.close();
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(async (list) => {
      const tab = list.find((c) => new URL(c.url).origin === self.location.origin);
      if (tab) await tab.focus();
      else await self.clients.openWindow('/');
    }),
  );
});
