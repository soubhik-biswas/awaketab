import { execFileSync } from 'node:child_process';
import { withContentCollections } from '@content-collections/next';
import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';
import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare';
import { cacheHeaders } from './lib/server/cache-headers';
import { securityHeaders } from './lib/server/security-headers';

// Workers Builds names the commit it builds; a build by hand asks git; `next dev` says dev.
function commitSha(): string {
  const named = process.env.WORKERS_CI_COMMIT_SHA || process.env.COMMIT_SHA;
  if (named) return named;
  if (process.env.NODE_ENV !== 'production') return 'dev';
  try {
    return execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return 'dev';
  }
}

const config: NextConfig = {
  reactStrictMode: true,
  // Review screenshots must never show the dev badge.
  devIndicators: false,
  poweredByHeader: false,
  transpilePackages: ['@awaketab/wake', '@awaketab/core'],
  // Inlined at build time; /api/health reports it.
  env: { COMMIT_SHA: commitSha() },
  headers: () =>
    Promise.resolve([
      ...securityHeaders(),
      ...cacheHeaders(),
      // The worker lives under /serwist/ but controls the whole site; public/_headers says the same on Cloudflare.
      {
        source: '/serwist/sw.js',
        headers: [
          { key: 'Service-Worker-Allowed', value: '/' },
          { key: 'Cache-Control', value: 'no-cache' },
        ],
      },
    ]),
};

// Gives `next dev` the Worker's bindings (KV, D1, Analytics Engine) from wrangler.jsonc.
void initOpenNextCloudflareForDev();

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

export default withContentCollections(withNextIntl(config));
