import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const here = (p) => fileURLToPath(new URL(p, import.meta.url));

// The service worker is a static file, so the Worker build never bundles a compiler; a new revision per build
// renews the offline pages and widget templates it precaches.
await build({
  entryPoints: [here('../worker/sw.ts')],
  outfile: here('../public/serwist/sw.js'),
  bundle: true,
  minify: true,
  format: 'iife',
  platform: 'browser',
  target: ['chrome111', 'edge111', 'firefox111', 'safari16.4'],
  define: { __AT_SW_REVISION__: JSON.stringify(randomUUID()), 'self.__SW_MANIFEST': '[]' },
  logLevel: 'warning',
});
