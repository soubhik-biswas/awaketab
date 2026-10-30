import { withContentCollections } from '@content-collections/next';
import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';
import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare';
import { withSerwist } from '@serwist/turbopack';
import { securityHeaders } from './lib/server/security-headers';

const config: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  transpilePackages: ['@awaketab/wake', '@awaketab/core'],
  headers: () => Promise.resolve(securityHeaders()),
};

// Gives `next dev` the Worker's bindings (KV, D1, Analytics Engine) from wrangler.jsonc.
void initOpenNextCloudflareForDev();

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

export default withContentCollections(withNextIntl(withSerwist(config)));
