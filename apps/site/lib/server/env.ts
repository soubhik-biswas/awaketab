import { getCloudflareContext } from '@opennextjs/cloudflare';
import type { D1Database } from 'better-auth';

interface IKvPutOptions {
  expirationTtl?: number;
}

// The slice of a Workers KV namespace the server uses, so tests can pass an in-memory map.
export interface IKv {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: IKvPutOptions): Promise<void>;
  delete(key: string): Promise<void>;
}

interface IAePointInput {
  indexes?: string[];
  blobs?: string[];
  doubles?: number[];
}

interface IAnalytics {
  writeDataPoint(point: IAePointInput): void;
}

export interface IEnv {
  LICENSES?: IKv;
  EVENTS?: IAnalytics;
  AUTH_DB?: D1Database;
  CF_PAGES_COMMIT_SHA?: string;
  COMMIT_SHA?: string;
  RATE_LIMIT_SALT?: string;
  LICENSE_SIGNING_KEY?: string;
  LICENSE_SIGNING_VER?: string;
  LICENSE_KEY_ENC_KEY?: string;
  POLAR_ACCESS_TOKEN?: string;
  POLAR_WEBHOOK_SECRET?: string;
  POLAR_ORGANIZATION_ID?: string;
  POLAR_BENEFIT_MAP?: string;
  POLAR_PRODUCT_PRO_YEARLY?: string;
  POLAR_PRODUCT_PRO_LIFETIME?: string;
  PUBLIC_SITE_URL?: string;
  PUBLIC_POLAR_SERVER?: string;
  BETTER_AUTH_SECRET?: string;
  BETTER_AUTH_URL?: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  GITHUB_CLIENT_ID?: string;
  GITHUB_CLIENT_SECRET?: string;
}

export interface IServerContext {
  env: IEnv;
  waitUntil: (promise: Promise<unknown>) => void;
}

const ENV_KEYS = [
  'CF_PAGES_COMMIT_SHA',
  'COMMIT_SHA',
  'RATE_LIMIT_SALT',
  'LICENSE_SIGNING_KEY',
  'LICENSE_SIGNING_VER',
  'LICENSE_KEY_ENC_KEY',
  'POLAR_ACCESS_TOKEN',
  'POLAR_WEBHOOK_SECRET',
  'POLAR_ORGANIZATION_ID',
  'POLAR_BENEFIT_MAP',
  'POLAR_PRODUCT_PRO_YEARLY',
  'POLAR_PRODUCT_PRO_LIFETIME',
  'PUBLIC_SITE_URL',
  'PUBLIC_POLAR_SERVER',
  'BETTER_AUTH_SECRET',
  'BETTER_AUTH_URL',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'GITHUB_CLIENT_ID',
  'GITHUB_CLIENT_SECRET',
] as const;

interface ICloudflare {
  env: Record<string, unknown>;
  ctx: { waitUntil(promise: Promise<unknown>): void };
}

// Bindings come from the Worker; plain values fall back to process.env so `next dev` with a .env file works.
export async function serverContext(): Promise<IServerContext> {
  let cf: ICloudflare | null;
  try {
    cf = (await getCloudflareContext({ async: true })) as unknown as ICloudflare;
  } catch {
    cf = null;
  }
  const raw = cf?.env ?? {};
  const env: IEnv = {};
  for (const key of ENV_KEYS) {
    const value = raw[key] ?? process.env[key];
    if (typeof value === 'string' && value.length > 0) env[key] = value;
  }
  if (raw.LICENSES) env.LICENSES = raw.LICENSES as IKv;
  if (raw.EVENTS) env.EVENTS = raw.EVENTS as IAnalytics;
  if (raw.AUTH_DB) env.AUTH_DB = raw.AUTH_DB as D1Database;
  const ctx = cf?.ctx;
  return {
    env,
    waitUntil: (promise) => {
      if (ctx) ctx.waitUntil(promise);
      else void promise.catch(() => undefined);
    },
  };
}

const EVENT_NAMES = [
  'page_view',
  'session_start',
  'session_end',
  'lock_state',
  'lock_denied',
  'fallback_used',
  'resume_shown',
  'resume_accepted',
  'pwa_install',
  'pip_open',
  'share_click',
  'pro_view',
  'pro_checkout_click',
  'pro_activated',
  'rating_prompt',
  'extension_click',
  'ad_slot_loaded',
  'sponsor_view',
  'sponsor_click',
  'client_error',
  'session_extend',
  'affiliate_click',
  'rating_submitted',
] as const;

export type TEventName = (typeof EVENT_NAMES)[number];
export const EVENT_NAME_SET = new Set<string>(EVENT_NAMES);

export const MAX_BATCH = 20;
export const MAX_BODY_BYTES = 8 * 1024;
export const RATE_WINDOW_S = 120;
export const RATE_MAX = 30;
