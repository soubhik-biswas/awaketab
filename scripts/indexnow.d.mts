export type TFetch = (url: string, init?: RequestInit) => Promise<Response>;

export interface IIndexNowPayload {
  host: string;
  key: string;
  keyLocation: string;
  urlList: string[];
}

export const SITE: string;
export const INDEXNOW_KEY: string;
export const INDEXNOW_ENDPOINT: string;
export const MAX_URLS: number;
export function sitemapLocs(xml: string): string[];
export function isSitemapIndex(xml: string): boolean;
export function selectUrls(urls: readonly string[], site?: string): string[];
export function payloads(urls: readonly string[], key?: string, site?: string, size?: number): IIndexNowPayload[];
export function readSitemap(fetchFn: TFetch, root?: string, site?: string): Promise<string[]>;
export function checkKey(fetchFn: TFetch, key?: string, site?: string): Promise<void>;
export function submit(options: {
  fetchFn?: TFetch;
  key?: string;
  site?: string;
  dryRun?: boolean;
  log?: (line: string) => void;
}): Promise<{ found: number; sent: number }>;
