import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Tests sign tokens with the dev pair (scripts/dev-license-key.json), so they build like a sandbox bundle.
  define: {
    __AT_POLAR_SERVER__: JSON.stringify('sandbox'),
    __AT_LICENSE_DEV_KEY__: 'true',
  },
  resolve: {
    alias: {
      '@awaketab/wake/video': fileURLToPath(new URL('./packages/wake/src/video.ts', import.meta.url)),
      '@awaketab/wake': fileURLToPath(new URL('./packages/wake/src/index.ts', import.meta.url)),
      '@awaketab/core': fileURLToPath(new URL('./packages/core/src/index.ts', import.meta.url)),
    },
  },
  test: {
    include: ['packages/*/test/**/*.test.ts', 'apps/extension/test/**/*.test.ts', 'scripts/**/*.test.ts'],
    environment: 'happy-dom',
    setupFiles: ['./vitest.setup.ts'],
  },
});
