#!/usr/bin/env node
// Sends every URL in the live sitemap to IndexNow (Bing, Yandex and others): node scripts/indexnow.mjs [--dry-run]
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const SITE = 'https://awaketab.com';
// Public by design: the engines fetch it from apps/site/public/<key>.txt to prove we own the host.
export const INDEXNOW_KEY = '71379037c3c61495ea3797f6e5a97a32';
export const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow';
export const MAX_URLS = 10_000;
const MAX_SITEMAPS = 50;

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };

function decode(text) {
  return text
    .replace(/^<!\[CDATA\[([\s\S]*)\]\]>$/u, '$1')
    .replace(/&(amp|lt|gt|quot|apos);/gu, (_, name) => ENTITIES[name])
    .trim();
}

export function sitemapLocs(xml) {
  return [...xml.matchAll(/<loc>\s*([\s\S]*?)\s*<\/loc>/gu)].map((m) => decode(m[1] ?? '')).filter(Boolean);
}

export function isSitemapIndex(xml) {
  return /<sitemapindex[\s>]/u.test(xml);
}

export function selectUrls(urls, site = SITE) {
  const { host } = new URL(site);
  const out = new Set();
  for (const raw of urls) {
    let url;
    try {
      url = new URL(raw);
    } catch {
      continue;
    }
    if (url.protocol !== 'https:' || url.host !== host || url.username || url.password || url.hash) continue;
    out.add(url.href);
  }
  return [...out].sort();
}

export function payloads(urls, key = INDEXNOW_KEY, site = SITE, size = MAX_URLS) {
  const { host, origin } = new URL(site);
  const out = [];
  for (let i = 0; i < urls.length; i += size) {
    out.push({ host, key, keyLocation: `${origin}/${key}.txt`, urlList: urls.slice(i, i + size) });
  }
  return out;
}

async function fetchText(fetchFn, url) {
  const res = await fetchFn(url, { headers: { accept: 'application/xml, text/xml, text/plain' } });
  if (!res.ok) throw new Error(`indexnow: ${url} answered HTTP ${String(res.status)}`);
  return res.text();
}

export async function readSitemap(fetchFn, root = `${SITE}/sitemap.xml`, site = SITE) {
  const { origin } = new URL(site);
  const queue = [root];
  const seen = new Set();
  const pages = [];
  while (queue.length > 0) {
    const next = queue.shift();
    if (next === undefined || seen.has(next)) continue;
    // A sitemap index may only point at sitemaps on our own origin, and the walk is bounded.
    if (!URL.canParse(next) || new URL(next).origin !== origin) continue;
    if (seen.size >= MAX_SITEMAPS)
      throw new Error(`indexnow: more than ${String(MAX_SITEMAPS)} sitemaps under ${root}`);
    seen.add(next);
    const xml = await fetchText(fetchFn, next);
    if (isSitemapIndex(xml)) queue.push(...sitemapLocs(xml));
    else pages.push(...sitemapLocs(xml));
  }
  return pages;
}

export async function checkKey(fetchFn, key = INDEXNOW_KEY, site = SITE) {
  const url = `${new URL(site).origin}/${key}.txt`;
  const res = await fetchFn(url);
  const served = res.ok ? (await res.text()).trim() : '';
  if (served !== key) throw new Error(`indexnow: ${url} does not serve the key (HTTP ${String(res.status)})`);
}

export async function submit({
  fetchFn = fetch,
  key = INDEXNOW_KEY,
  site = SITE,
  dryRun = false,
  log = () => undefined,
}) {
  const urls = selectUrls(await readSitemap(fetchFn, `${site}/sitemap.xml`, site), site);
  if (urls.length === 0) throw new Error(`indexnow: ${site}/sitemap.xml lists no ${site} URLs`);
  await checkKey(fetchFn, key, site);
  let sent = 0;
  for (const body of payloads(urls, key, site)) {
    if (dryRun) {
      log(`indexnow: dry run, would POST ${String(body.urlList.length)} URLs to ${INDEXNOW_ENDPOINT}`);
      continue;
    }
    const res = await fetchFn(INDEXNOW_ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json; charset=utf-8' },
      body: JSON.stringify(body),
    });
    // 202 means the engines accepted the batch and will check the key later.
    if (res.status !== 200 && res.status !== 202)
      throw new Error(`indexnow: ${INDEXNOW_ENDPOINT} answered HTTP ${String(res.status)}`);
    sent += body.urlList.length;
    log(`indexnow: submitted ${String(body.urlList.length)} URLs (HTTP ${String(res.status)})`);
  }
  return { found: urls.length, sent };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const log = (line) => process.stdout.write(`${line}\n`);
  submit({ dryRun: process.argv.includes('--dry-run'), log })
    .then(({ found, sent }) => log(`indexnow: ${String(found)} URLs in the sitemap, ${String(sent)} submitted`))
    .catch((error) => {
      process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
      process.exitCode = 1;
    });
}
