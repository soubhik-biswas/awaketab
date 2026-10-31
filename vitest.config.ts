import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Tests sign tokens with the dev pair (apps/web/.dev.vars.example), so they build like a sandbox bundle.
  define: {
    __AT_POLAR_SERVER__: JSON.stringify('sandbox'),
    __AT_LICENSE_DEV_KEY__: 'true',
    __AT_THEMES__: JSON.stringify('/assets/themes.css'),
  },
  resolve: {
    alias: {
      '@awaketab/wake/video': fileURLToPath(new URL('./packages/wake/src/video.ts', import.meta.url)),
      '@awaketab/wake': fileURLToPath(new URL('./packages/wake/src/index.ts', import.meta.url)),
      '@awaketab/core': fileURLToPath(new URL('./packages/core/src/index.ts', import.meta.url)),
    },
  },
  test: {
    include: ['packages/*/test/**/*.test.ts', 'apps/extension/test/**/*.test.ts'],
    environment: 'happy-dom',
    setupFiles: ['./vitest.setup.ts'],
    environmentMatchGlobs: [['packages/wake/test/ssr.test.ts', 'node']],
  },
});
