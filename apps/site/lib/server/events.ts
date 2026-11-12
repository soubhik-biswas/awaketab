import { hostName, isHost, refValue, tidyMessage, token } from '@/lib/telemetry/shape';
import { EVENT_NAME_SET, MAX_BATCH, MAX_BODY_BYTES, type IEnv, type TEventName } from './env';

export interface IIncomingEvent {
  event?: unknown;
  path?: unknown;
  locale?: unknown;
  ua?: unknown;
  source?: unknown;
  sid?: unknown;
  viewport?: unknown;
  ver?: unknown;
  ts?: unknown;
  planType?: unknown;
  presetId?: unknown;
  mode?: unknown;
  reason?: unknown;
  from?: unknown;
  to?: unknown;
  plan?: unknown;
  action?: unknown;
  code?: unknown;
  page?: unknown;
  sku?: unknown;
  sponsorId?: unknown;
  durationMin?: unknown;
  addedMin?: unknown;
  stars?: unknown;
  count?: unknown;
  host?: unknown;
  target?: unknown;
  via?: unknown;
  referrer?: unknown;
  ref?: unknown;
  face?: unknown;
  background?: unknown;
  lengthMin?: unknown;
  message?: unknown;
}

export interface IAePoint {
  indexes: string[];
  blobs: string[];
  doubles: number[];
}

// The Analytics Engine row: index1 is the event name, blob1 to blob17 follow this order, double1 is the event's
// number and double2 the clock skew. New columns go on the end; docs/ANALYTICS.md lists what each one holds.
export const BLOB_COLUMNS = [
  'path',
  'locale',
  'ua',
  'source',
  'sid',
  'attr1',
  'attr2',
  'viewport',
  'ver',
  'country',
  'device',
  'browser',
  'referrer',
  'ref',
  'visitor',
  'face',
  'background',
] as const;

type TBlob = (typeof BLOB_COLUMNS)[number];

// What the server adds from the request itself. The address and the full user agent are read here and never stored.
export interface IRequestFacts {
  country: string;
  device: string;
  browser: string;
  visitor: string;
}

const NO_FACTS: IRequestFacts = { country: '', device: '', browser: '', visitor: '' };
// Only the site's own pages get the request facts; the extension and the embed widget keep what they promised.
const SITE_SOURCES = new Set(['web', 'pwa']);
const VIAS = new Set(['load', 'route', 'allow']);

function str(value: unknown, max = 120): string {
  if (typeof value !== 'string') return '';
  return value.slice(0, max);
}

function num(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

// Embed analytics (docs/11 §8): the embedding page's hostname rides on the widget's page_view in blob6; the
// share_click target (`attribution` = the widget's credit link) in blob7. Hostname only — never a path or query.
const SHARE_TARGETS = new Set(['attribution']);

function hostOf(value: unknown): string {
  return typeof value === 'string' && isHost(value) ? value : '';
}

function attr1(event: TEventName, row: IIncomingEvent): string {
  if (event === 'page_view' && row.source === 'embed') return hostOf(row.host);
  if (event === 'session_start') return str(row.planType);
  if (event === 'session_end' || event === 'lock_denied') return str(row.reason);
  if (event === 'lock_state') return str(row.from);
  if (event === 'pro_checkout_click' || event === 'pro_activated') return str(row.plan);
  if (event === 'rating_prompt') return str(row.action);
  if (event === 'client_error') return str(row.code);
  if (event === 'ad_slot_loaded') return str(row.page);
  return '';
}

function attr2(event: TEventName, row: IIncomingEvent): string {
  if (event === 'share_click') return typeof row.target === 'string' && SHARE_TARGETS.has(row.target) ? row.target : '';
  if (event === 'page_view') return typeof row.via === 'string' && VIAS.has(row.via) ? row.via : '';
  if (event === 'client_error') return tidyMessage(row.message);
  if (event === 'session_start') return str(row.presetId);
  if (event === 'lock_state') return str(row.to);
  if (event === 'pro_checkout_click') return str(row.sku);
  if (event === 'sponsor_view' || event === 'sponsor_click') return str(row.sponsorId);
  return '';
}

function numeric(event: TEventName, row: IIncomingEvent): number {
  if (event === 'session_end') return num(row.durationMin);
  if (event === 'session_start') return num(row.lengthMin);
  if (event === 'rating_prompt') return num(row.stars);
  return num(row.addedMin) || num(row.count);
}

const BOT_RE = /bot|crawl|spider|slurp|headless|lighthouse|facebookexternalhit|curl|wget|python|go-http-client/iu;

// Coarse buckets only. An iPad that asks for desktop pages counts as a desktop; the viewport class tells them apart.
export function deviceClass(ua: string): string {
  if (!ua) return 'other';
  if (BOT_RE.test(ua)) return 'bot';
  if (/iPad|Tablet|PlayBook|Silk|Kindle/u.test(ua) || (/Android/u.test(ua) && !/Mobile/u.test(ua))) return 'tablet';
  if (/Mobi|iPhone|iPod|Android/u.test(ua)) return 'phone';
  if (/Windows|Macintosh|X11|Linux|CrOS/u.test(ua)) return 'desktop';
  return 'other';
}

// The same family names the feedback form sends, so the two can be read side by side.
export function browserFamily(ua: string): string {
  if (/Edg(?:e|A|iOS)?\//u.test(ua)) return 'Edge';
  if (/OPR\/|OPT\/|Opera/u.test(ua)) return 'Opera';
  if (/SamsungBrowser\//u.test(ua)) return 'Samsung Internet';
  if (/Firefox\/|FxiOS\//u.test(ua)) return 'Firefox';
  if (/Chrome\/|CriOS\/|Chromium\//u.test(ua)) return 'Chrome';
  if (/Safari\//u.test(ua)) return 'Safari';
  return 'Other';
}

// Two letters from Cloudflare; its codes for "unknown" and for Tor are not countries and are left empty.
export function countryOf(request: Request, edge?: unknown): string {
  const direct = (request as Request & { cf?: { country?: unknown } }).cf?.country;
  for (const value of [direct, edge, request.headers.get('cf-ipcountry')]) {
    if (typeof value === 'string' && /^[A-Z]{2}$/u.test(value) && value !== 'XX') return value;
  }
  return '';
}

// One key per browser and network per UTC day: it counts unique visitors and cannot be followed into the next day.
// Without the secret there is no key at all, because a hash anyone could recompute would be an identifier.
export async function visitorKey(secret: string | undefined, now: number, ip: string, ua: string): Promise<string> {
  if (!secret) return '';
  const day = new Date(now).toISOString().slice(0, 10);
  const data = new TextEncoder().encode(`${day}|${secret}|${ip}|${ua}`);
  const hash = new Uint8Array(await crypto.subtle.digest('SHA-256', data));
  return [...hash.slice(0, 8)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function requestFacts(
  request: Request,
  env: IEnv,
  ip: string,
  now: number,
  edgeCountry?: unknown,
): Promise<IRequestFacts> {
  const ua = request.headers.get('user-agent') ?? '';
  return {
    country: countryOf(request, edgeCountry),
    device: deviceClass(ua),
    browser: browserFamily(ua),
    visitor: await visitorKey(env.RATE_LIMIT_SALT, now, ip, ua),
  };
}

export function mapEvent(row: IIncomingEvent, serverTs: number, facts: IRequestFacts = NO_FACTS): IAePoint | null {
  const event = str(row.event, 40);
  if (!EVENT_NAME_SET.has(event)) return null;
  const name = event as TEventName;
  const clientTs = num(row.ts);
  const source = str(row.source, 16);
  const site = SITE_SOURCES.has(source);
  const seen = site ? facts : NO_FACTS;
  const view = site && name === 'page_view';
  const start = name === 'session_start';
  const blobs: Record<TBlob, string> = {
    path: str(row.path, 200).split('?')[0] ?? '',
    locale: str(row.locale, 16),
    ua: str(row.ua, 40),
    source,
    sid: str(row.sid, 64),
    attr1: attr1(name, row),
    attr2: attr2(name, row),
    viewport: str(row.viewport, 8),
    ver: str(row.ver, 24),
    country: seen.country,
    device: seen.device,
    browser: seen.browser,
    referrer: view ? hostName(row.referrer) : '',
    ref: view ? refValue(row.ref) : '',
    visitor: seen.visitor,
    face: start ? token(row.face) : '',
    background: start ? token(row.background) : '',
  };
  return {
    indexes: [name],
    blobs: BLOB_COLUMNS.map((key) => blobs[key]),
    doubles: [numeric(name, row), clientTs ? clientTs - serverTs : 0],
  };
}

export async function readCappedText(request: Request, max: number): Promise<string | null> {
  const declared = Number(request.headers.get('content-length') ?? '');
  if (Number.isFinite(declared) && declared > max) return null;
  if (!request.body) return '';
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > max) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(bytes);
}

export async function parseBatch(
  request: Request,
): Promise<{ ok: true; events: IIncomingEvent[] } | { ok: false; status: number }> {
  const raw = await readCappedText(request, MAX_BODY_BYTES);
  if (raw === null) return { ok: false, status: 413 };
  try {
    const parsed = JSON.parse(raw) as { events?: unknown };
    if (!Array.isArray(parsed.events)) return { ok: false, status: 400 };
    if (parsed.events.length > MAX_BATCH) return { ok: false, status: 413 };
    return { ok: true, events: parsed.events as IIncomingEvent[] };
  } catch {
    return { ok: false, status: 400 };
  }
}

export function writePoints(env: IEnv, points: IAePoint[]): void {
  const ae = env.EVENTS;
  if (!ae) return;
  for (const point of points) ae.writeDataPoint(point);
}
