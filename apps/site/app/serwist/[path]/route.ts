import { randomUUID } from 'node:crypto';
import { createSerwistRoute } from '@serwist/turbopack';

// Built once per deploy: the revision renews the offline pages and widget templates the worker keeps.
const revision = randomUUID();

// Only the offline pages and widget templates are precached; pages and scripts are cached as they are visited.
export const { dynamic, dynamicParams, revalidate, generateStaticParams, GET } = createSerwistRoute({
  swSrc: 'worker/sw.ts',
  useNativeEsbuild: true,
  globPatterns: [],
  esbuildOptions: { format: 'iife', define: { __AT_SW_REVISION__: JSON.stringify(revision) } },
});
