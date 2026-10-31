import { test as base, chromium, expect, type BrowserContext, type Page, type Worker } from '@playwright/test';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const EXTENSION_DIR = path.resolve(HERE, '../.output-test/chrome-mv3');

export interface IPowerCall {
  call: 'request' | 'release';
  level?: 'display';
  at: number;
}

export const test = base.extend<{ context: BrowserContext; worker: Worker; extensionId: string }>({
  // eslint-disable-next-line no-empty-pattern -- Playwright fixtures take their dependencies by destructuring.
  context: async ({}, use) => {
    const profile = await mkdtemp(path.join(tmpdir(), 'awaketab-e2e-'));
    const context = await chromium.launchPersistentContext(profile, {
      channel: 'chromium',
      args: [`--disable-extensions-except=${EXTENSION_DIR}`, `--load-extension=${EXTENSION_DIR}`],
    });
    await use(context);
    await context.close();
    await rm(profile, { recursive: true, force: true });
  },
  worker: async ({ context }, use) => {
    const worker = context.serviceWorkers()[0] ?? (await context.waitForEvent('serviceworker'));
    await use(worker);
  },
  extensionId: async ({ worker }, use) => {
    await use(new URL(worker.url()).host);
  },
});

export { expect };

export async function openPopup(context: BrowserContext, extensionId: string): Promise<Page> {
  const page = await context.newPage();
  await page.setViewportSize({ width: 360, height: 600 });
  await page.goto(`chrome-extension://${extensionId}/popup.html`);
  await expect(page.locator('[data-root]')).toBeVisible();
  return page;
}

export async function openOptions(context: BrowserContext, extensionId: string): Promise<Page> {
  const page = await context.newPage();
  await page.goto(`chrome-extension://${extensionId}/options.html`);
  await expect(page.locator('[data-root]')).toBeVisible();
  return page;
}

export async function powerLog(page: Page): Promise<IPowerCall[]> {
  return page.evaluate(async () => {
    const raw = (await chrome.storage.session.get('at.test.power'))['at.test.power'];
    return Array.isArray(raw) ? (raw as IPowerCall[]) : [];
  });
}

export async function badge(page: Page): Promise<string> {
  return page.evaluate(() => chrome.action.getBadgeText({}));
}

export async function localStore(page: Page): Promise<Record<string, unknown>> {
  return page.evaluate(() => chrome.storage.local.get(null));
}

export async function syncStore(page: Page): Promise<Record<string, unknown>> {
  return page.evaluate(() => chrome.storage.sync.get(null));
}
