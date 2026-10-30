import { withContentCollections } from '@content-collections/next';
import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const config: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  transpilePackages: ['@awaketab/wake', '@awaketab/core'],
};

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

export default withContentCollections(withNextIntl(config));
