import { RATE_WINDOW_S } from './env';
import { readCappedText } from './events';

export function jsonOk(data: unknown, status = 200, extra: Record<string, string> = {}): Response {
  return Response.json(data, { status, headers: { 'cache-control': 'no-store', ...extra } });
}

export function jsonError(error: string, status: number, extra: Record<string, unknown> = {}): Response {
  return Response.json({ error, ...extra }, { status, headers: { 'cache-control': 'no-store' } });
}

// The limiter does not say when its window ends, so the answer names a full window: always long enough.
export function rateLimited(): Response {
  return Response.json(
    { error: 'rate_limited' },
    { status: 429, headers: { 'cache-control': 'no-store', 'retry-after': String(RATE_WINDOW_S) } },
  );
}

const UNAVAILABLE_RETRY_S = 60;

// Nothing was saved or changed; the caller, a person or a webhook sender, should try again.
export function unavailable(error: string, message: string): Response {
  return Response.json(
    { error, message },
    { status: 503, headers: { 'cache-control': 'no-store', 'retry-after': String(UNAVAILABLE_RETRY_S) } },
  );
}

export const LICENSE_BODY_BYTES = 2 * 1024;

const JSON_TYPE = /^application\/(?:[\w.-]+\+)?json$/u;

export function isJsonRequest(request: Request, also: readonly string[] = []): boolean {
  const type = (request.headers.get('content-type') ?? '').split(';')[0]?.trim().toLowerCase() ?? '';
  return JSON_TYPE.test(type) || also.includes(type);
}

type TJsonBody = { ok: true; value: unknown } | { ok: false; response: Response };

// Reads at most `maxBytes` of a JSON body: 415 for another content type, 413 past the limit, 400 if unparseable.
export async function readJsonBody(request: Request, maxBytes: number): Promise<TJsonBody> {
  if (!isJsonRequest(request)) return { ok: false, response: jsonError('unsupported_media_type', 415) };
  const raw = await readCappedText(request, maxBytes);
  if (raw === null) return { ok: false, response: jsonError('too_large', 413) };
  try {
    return { ok: true, value: JSON.parse(raw) as unknown };
  } catch {
    return { ok: false, response: jsonError('bad_request', 400) };
  }
}

export function stringField(body: unknown, name: string): string {
  if (!body || typeof body !== 'object') return '';
  const value = (body as Record<string, unknown>)[name];
  return typeof value === 'string' ? value : '';
}

const SYNCING_RETRY_S = 5;

export function syncing(): Response {
  return Response.json(
    { error: 'polar_unavailable' },
    { status: 503, headers: { 'cache-control': 'no-store', 'retry-after': String(SYNCING_RETRY_S) } },
  );
}

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;
export const KEY_RE = /^[A-Z0-9-]{20,80}$/u;
// Polar checkout IDs are UUIDs; the looser shape still refuses anything that could reshape the upstream path.
const CHECKOUT_RE = /^[A-Za-z0-9_-]{1,80}$/u;

export function parseActivateBody(
  body: unknown,
): { key: string; deviceId: string; deviceLabel: string; checkoutId?: string } | null {
  if (!body || typeof body !== 'object') return null;
  const row = body as Record<string, unknown>;
  const deviceId = typeof row.deviceId === 'string' ? row.deviceId : '';
  const deviceLabel =
    typeof row.deviceLabel === 'string'
      ? Array.from(row.deviceLabel)
          .filter((ch) => (ch.codePointAt(0) ?? 0) >= 32)
          .join('')
          .slice(0, 40)
      : '';
  const checkoutId = typeof row.checkoutId === 'string' ? row.checkoutId : undefined;
  const key = typeof row.key === 'string' ? row.key.trim().toUpperCase() : '';
  if (!UUID_V4.test(deviceId) || !deviceLabel) return null;
  if (checkoutId) return CHECKOUT_RE.test(checkoutId) ? { key, deviceId, deviceLabel, checkoutId } : null;
  if (!KEY_RE.test(key)) return null;
  return { key, deviceId, deviceLabel };
}

export function parseLookupBody(body: unknown): { checkoutId: string } | null {
  if (!body || typeof body !== 'object') return null;
  const row = body as Record<string, unknown>;
  if (row.lookup !== true) return null;
  const checkoutId = typeof row.checkoutId === 'string' ? row.checkoutId : '';
  return CHECKOUT_RE.test(checkoutId) ? { checkoutId } : null;
}

export function isLookupBody(body: unknown): boolean {
  return !!body && typeof body === 'object' && 'lookup' in body;
}
