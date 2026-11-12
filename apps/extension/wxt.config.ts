import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'wxt';
import { polarDefines } from '../../scripts/polar-server.mjs';
import { awaketabExtension, localeMessages } from './scripts/i18n.mjs';

const TEST_BUILD = process.env.AT_EXT_TEST === '1';
const here = (relative: string) => fileURLToPath(new URL(relative, import.meta.url));
const { version } = JSON.parse(readFileSync(here('package.json'), 'utf8')) as { version: string };

// The minimum version comes from the one support data file.
const matrix = JSON.parse(readFileSync(here('data/support-matrix.json'), 'utf8')) as {
  extension: { minimumChromeVersion: string };
};

const TOOLBAR_ICONS = { 16: 'icons/extension-16.png', 32: 'icons/extension-32.png' };

export default defineConfig({
  manifestVersion: 3,
  // Explicit imports only: every module says where `browser`/`defineBackground` come from.
  imports: false,
  // The Playwright suite builds into its own folder so it never overwrites the release build.
  outDir: process.env.AT_EXT_OUT ?? (TEST_BUILD ? '.output-test' : '.output'),
  manifest: {
    name: '__MSG_ext_name__',
    short_name: 'AwakeTab',
    description: '__MSG_ext_description__',
    default_locale: 'en',
    version,
    minimum_chrome_version: matrix.extension.minimumChromeVersion,
    // Exactly these, each justified in the store listing; site access is asked for one site at a time, only for
    // the sites the user adds to auto-wake.
    permissions: ['power', 'alarms', 'storage', 'offscreen', 'activeTab'],
    optional_host_permissions: ['https://*/*'],
    action: {
      default_popup: 'popup.html',
      default_title: 'AwakeTab',
      default_icon: TOOLBAR_ICONS,
    },
    options_page: 'options.html',
    background: {
      service_worker: 'background.js',
      type: 'module',
    },
    commands: {
      toggle: {
        suggested_key: { default: 'Alt+Shift+A' },
        description: '__MSG_ext_command_toggle__',
      },
    },
    icons: {
      ...TOOLBAR_ICONS,
      48: 'icons/extension-48.png',
      128: 'icons/extension-128.png',
    },
  },
  vite: () => ({
    plugins: [awaketabExtension()],
    define: { __AT_TEST__: JSON.stringify(TEST_BUILD), ...polarDefines() },
    esbuild: { jsx: 'automatic' },
    resolve: {
      // Build from source like the unit tests do: the extension never depends on a stale package dist.
      alias: {
        '@awaketab/core': here('../../packages/core/src/index.ts'),
        '@awaketab/wake': here('../../packages/wake/src/index.ts'),
        // The shared clock faces load IBM Plex Serif through next/font; here it is self-hosted (src/styles/fonts.css).
        'next/font/google': here('src/next-font.ts'),
      },
      dedupe: ['react', 'react-dom'],
    },
    build: {
      // Extension pages load from disk; the modulepreload polyfill is dead weight there.
      modulePreload: { polyfill: false },
    },
  }),
  hooks: {
    'build:manifestGenerated': (_wxt, manifest) => {
      const background = manifest.background as { type?: string } | undefined;
      if (background) background.type = 'module';
      delete manifest.options_ui;
    },
    'build:publicAssets': (_wxt, files) => {
      for (const file of localeMessages()) files.push(file);
    },
  },
});
