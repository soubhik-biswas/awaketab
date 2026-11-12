import { defineConfig } from '@playwright/test';

const ci = Boolean(process.env.CI);
// A server that is already running is used as it is; nothing is started or stopped.
const external = process.env.PLAYWRIGHT_BASE_URL;
const baseURL = external ?? 'http://localhost:3210';

export default defineConfig({
  testDir: './e2e',
  outputDir: './test-results',
  fullyParallel: true,
  workers: ci ? 2 : 4,
  forbidOnly: ci,
  retries: ci ? 1 : 0,
  reporter: ci ? 'html' : 'list',
  // `next dev` compiles a page the first time it is asked for.
  timeout: ci ? 45_000 : 90_000,
  expect: { timeout: ci ? 10_000 : 20_000 },
  use: {
    baseURL,
    trace: 'on-first-retry',
    viewport: { width: 1440, height: 900 },
    locale: 'en-US',
    timezoneId: 'UTC',
    colorScheme: 'light',
    serviceWorkers: 'block',
    navigationTimeout: ci ? 30_000 : 60_000,
  },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
  webServer: external
    ? undefined
    : {
        command: ci ? 'pnpm -F site start --port 3210' : 'pnpm -F site exec next dev --port 3210',
        url: baseURL,
        reuseExistingServer: true,
        timeout: 180_000,
        // The paid plan stays off, whatever the shell has set.
        env: { NEXT_PUBLIC_PRO_ENABLED: '' },
      },
});
