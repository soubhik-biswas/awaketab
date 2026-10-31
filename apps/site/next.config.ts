import { withContentCollections } from '@content-collections/next';
import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';
import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare';
import { securityHeaders } from './lib/server/security-headers';

const config: NextConfig = {
  reactStrictMode: true,
  // Review screenshots must never show the dev badge.
  devIndicators: false,
  poweredByHeader: false,
  transpilePackages: ['@awaketab/wake', '@awaketab/core'],
  headers: () =>
    Promise.resolve([
      ...securityHeaders(),
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
