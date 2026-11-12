import { api } from '@/lib/server/api';
import { MAX_BODY_BYTES } from '@/lib/server/env';
import { mapEvent, readCappedText, writePoints, type IIncomingEvent } from '@/lib/server/events';
import { isJsonRequest, jsonError, jsonOk, rateLimited } from '@/lib/server/http';
import { clientIp, rateLimit } from '@/lib/server/ratelimit';

interface ICspReport {
  'csp-report'?: { 'document-uri'?: unknown };
  url?: unknown;
  body?: { documentURL?: unknown };
}

function reportPath(parsed: unknown): string {
  const first: unknown = Array.isArray(parsed) ? parsed[0] : parsed;
  if (!first || typeof first !== 'object') return '';
  const row = first as ICspReport;
  const raw = row['csp-report']?.['document-uri'] ?? row.body?.documentURL ?? row.url;
  if (typeof raw !== 'string') return '';
  try {
    return new URL(raw, 'https://awaketab.com').pathname;
  } catch {
    return '';
  }
}

export const dynamic = 'force-dynamic';

// The Reporting API posts application/reports+json; the older report-uri posts application/csp-report.
const LEGACY_REPORT_TYPE = ['application/csp-report'];

export const POST = api(async (request, { env }) => {
  const ip = clientIp(request);
  if (!(await rateLimit(env, 'csp', ip))) return rateLimited();
  if (!isJsonRequest(request, LEGACY_REPORT_TYPE)) return jsonError('unsupported_media_type', 415);
  const raw = await readCappedText(request, MAX_BODY_BYTES);
  if (raw === null) return jsonError('too_large', 413);
  let path: string;
  try {
    path = reportPath(JSON.parse(raw));
  } catch {
    path = '';
  }
  const row: IIncomingEvent = { event: 'client_error', code: 'csp', path, ts: Date.now() };
  const point = mapEvent(row, Date.now());
  if (point) writePoints(env, [point]);
  return jsonOk({ ok: true });
});
