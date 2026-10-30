import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const here = (p: string) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  esbuild: { jsx: 'automatic' },
  resolve: {
    alias: {
      '@awaketab/wake/video': here('../../packages/wake/src/video.ts'),
      '@awaketab/wake': here('../../packages/wake/src/index.ts'),
      '@awaketab/core': here('../../packages/core/src/index.ts'),
      '@': here('.'),
    },
  },
  test: {
    root: here('.'),
    include: ['**/*.test.{ts,tsx}'],
    exclude: ['node_modules/**', '.next/**', '.open-next/**'],
    environment: 'happy-dom',
    environmentOptions: { happyDOM: { settings: { disableIframePageLoading: true } } },
  },
});
