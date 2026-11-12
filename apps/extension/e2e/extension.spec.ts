import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import { badge, expect, localStore, openOptions, openPopup, powerLog, syncStore, test } from './fixtures';

test.beforeEach(({ context }) => {
  context.on('dialog', () => {
    throw new Error('A dialog opened');
  });
});

const pill = (page: Page) => page.locator('[data-pill]');
const primary = (page: Page) => page.locator('[data-primary]');

test('the built manifest asks for exactly power, alarms, storage, offscreen and activeTab', async ({
  context,
  extensionId,
}) => {
  const page = await context.newPage();
  const manifest = (await (await page.goto(`chrome-extension://${extensionId}/manifest.json`))?.json()) as Record<
    string,
    unknown
  >;
  expect(manifest.permissions).toEqual(['power', 'alarms', 'storage', 'offscreen', 'activeTab']);
  expect(manifest.optional_host_permissions).toEqual(['https://*/*']);
  expect(manifest.optional_permissions).toBeUndefined();
  expect(manifest.host_permissions ?? []).toEqual([]);
  expect(manifest.content_scripts).toBeUndefined();
  expect(manifest.name).toBe('__MSG_ext_name__');
});

test('popup opens Ready: the face, four lengths with 1h picked, and "Keep this tab awake"', async ({
  context,
  extensionId,
}) => {
  const page = await openPopup(context, extensionId);
  await expect(pill(page)).toHaveText('Ready');
  await expect(pill(page)).toHaveAttribute('data-view', 'ready');
  await expect(page.locator('[data-chips] [data-preset]')).toHaveCount(4);
  await expect(page.getByRole('radio')).toHaveCount(4);
  await expect(page.locator('[data-preset="p60"]')).toHaveAttribute('aria-checked', 'true');
  await expect(primary(page)).toHaveText('Keep this tab awake');
  await expect(page.locator('[role="timer"]')).toBeVisible();
  await expect(page.getByText('Works in any tab')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Open the full AwakeTab app in a new tab' })).toHaveAttribute(
    'href',
    'https://awaketab.com/?source=ext',
  );
  expect(await badge(page)).toBe('');
});

test('awake: the badge counts the minutes; Pause shows II and releases; Resume and Stop', async ({
  context,
  extensionId,
}) => {
  const page = await openPopup(context, extensionId);
  await page.locator('[data-preset="p30"]').click();
  await expect(page.locator('[data-preset="p30"]')).toHaveAttribute('aria-checked', 'true');
  await expect(page.locator('[data-preset="p60"]')).toHaveAttribute('aria-checked', 'false');
  await primary(page).click();
  await expect(pill(page)).toHaveText(/^Awake · (30|29) min$/u);
  await expect(primary(page)).toHaveText('Pause');
  await expect.poll(() => badge(page)).toMatch(/^(30|29)$/u);
  await expect.poll(async () => (await powerLog(page)).at(-1)).toMatchObject({ call: 'request', level: 'display' });
  await primary(page).click();
  await expect(pill(page)).toHaveText(/^Paused · (30|29) min left$/u);
  await expect.poll(() => badge(page)).toBe('II');
  await expect.poll(async () => (await powerLog(page)).at(-1)?.call).toBe('release');
  await expect(primary(page)).toHaveText('Resume');
  await primary(page).click();
  await expect(pill(page)).toHaveAttribute('data-view', 'awake');
  await primary(page).click();
  await page.locator('[data-stop]').click();
  await expect(pill(page)).toHaveText('Ready');
  await expect.poll(() => badge(page)).toBe('');
});

test('blocked: a refused request says so, shows the red badge and links to the fix', async ({
  context,
  extensionId,
}) => {
  const page = await openPopup(context, extensionId);
  await page.evaluate(() => chrome.storage.session.set({ 'at.test.deny': true }));
  await primary(page).click();
  await expect(pill(page)).toHaveText('Blocked');
  await expect(pill(page)).toHaveAttribute('data-view', 'blocked');
  await expect.poll(() => badge(page)).toBe('!');
  await expect(page.getByRole('link', { name: 'See the fix on awaketab.com, in a new tab' })).toHaveAttribute(
    'href',
    'https://awaketab.com/help?source=ext',
  );
  await page.emulateMedia({ reducedMotion: 'reduce' });
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  // A length tap asks again once the browser allows it.
  await page.evaluate(() => chrome.storage.session.set({ 'at.test.deny': false }));
  await page.locator('[data-preset="p15"]').click();
  await expect(pill(page)).toHaveAttribute('data-view', 'awake');
});

test('the popup fits Chrome’s 600 px frame in every state', async ({ context, extensionId }) => {
  const page = await openPopup(context, extensionId);
  const height = () => page.evaluate(() => document.documentElement.scrollHeight);
  expect(await height()).toBeLessThanOrEqual(600);
  await primary(page).click();
  await expect(pill(page)).toHaveAttribute('data-view', 'awake');
  expect(await height()).toBeLessThanOrEqual(600);
  await primary(page).click();
  await expect(pill(page)).toHaveAttribute('data-view', 'paused');
  expect(await height()).toBeLessThanOrEqual(600);
});

test('the session survives a forced service-worker restart and the keep-awake is re-issued', async ({
  context,
  extensionId,
}) => {
  const page = await openPopup(context, extensionId);
  await primary(page).click();
  await expect(pill(page)).toHaveAttribute('data-view', 'awake');
  const before = (await localStore(page))['at.v1.session'] as { id: string };
  const requestsBefore = (await powerLog(page)).filter((c) => c.call === 'request').length;
  const cdp = await context.newCDPSession(page);
  await cdp.send('ServiceWorker.enable');
  await cdp.send('ServiceWorker.stopAllWorkers');
  const next = context.waitForEvent('serviceworker', { timeout: 3_000 }).catch(() => null);
  const reopened = await openPopup(context, extensionId);
  await next;
  await expect(pill(reopened)).toHaveAttribute('data-view', 'awake');
  await expect
    .poll(async () => (await powerLog(reopened)).filter((c) => c.call === 'request').length)
    .toBeGreaterThan(requestsBefore);
  const after = (await localStore(reopened))['at.v1.session'] as { id: string; status: string };
  expect(after.id).toBe(before.id);
  expect(after.status).toBe('active');
  await expect.poll(() => badge(reopened)).toMatch(/^(60|59)$/u);
});

test('options: three switches that save and sync, and an honest note when no site can be read', async ({
  context,
  extensionId,
}) => {
  const page = await openOptions(context, extensionId);
  const badgeSwitch = page.getByRole('switch', { name: /Show time left on the icon/u });
  await expect(badgeSwitch).toHaveAttribute('aria-checked', 'true');
  await expect(page.getByRole('switch', { name: /Wake automatically on chosen sites/u })).toHaveAttribute(
    'aria-checked',
    'true',
  );
  await expect(page.getByRole('switch', { name: /Release when the tab is hidden/u })).toHaveAttribute(
    'aria-checked',
    'false',
  );
  await badgeSwitch.click();
  await expect(badgeSwitch).toHaveAttribute('aria-checked', 'false');
  await expect.poll(async () => (await localStore(page))['at.v1.ext']).toMatchObject({ badge: false });
  await expect
    .poll(async () => (await syncStore(page))['at.v1.ext'], { timeout: 6_000 })
    .toMatchObject({
      badge: false,
    });
  await page.locator('[data-add]').click();
  await expect(page.getByRole('status')).toHaveText(
    'Click the AwakeTab icon while you are on the site, then add it here.',
  );
});

test('options skip entry motion when reduced motion is requested', async ({ context, extensionId }) => {
  const page = await context.newPage();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(() => {
    const hiddenEntries: string[] = [];
    Object.defineProperty(window, 'hiddenEntries', { value: hiddenEntries });
    new MutationObserver(() => {
      document.querySelectorAll<HTMLElement>('.xo-card, .xo-note').forEach((entry) => {
        if (entry.style.opacity === '0' || entry.style.transform.includes('translate')) {
          hiddenEntries.push(entry.className);
        }
      });
    }).observe(document, { childList: true, subtree: true, attributes: true, attributeFilter: ['style'] });
  });
  await page.goto(`chrome-extension://${extensionId}/options.html`);
  await expect(page.locator('.xo-card')).toBeVisible();
  await expect(page.locator('.xo-card')).not.toHaveAttribute('style', /opacity: 0|translate/u);
  await page.locator('[data-add]').click();
  await expect(page.getByRole('status')).toHaveText(
    'Click the AwakeTab icon while you are on the site, then add it here.',
  );
  await expect(page.getByRole('status')).not.toHaveAttribute('style', /opacity: 0|translate/u);
  expect(await page.evaluate(() => Reflect.get(window, 'hiddenEntries') as string[])).toEqual([]);
});

for (const theme of ['light', 'dark', 'oled'] as const) {
  test(`axe: popup and options have no violations (${theme})`, async ({ context, extensionId }) => {
    const popup = await openPopup(context, extensionId);
    await popup.emulateMedia({ reducedMotion: 'reduce' });
    await popup.evaluate((value) => {
      document.documentElement.dataset.theme = value;
    }, theme);
    expect((await new AxeBuilder({ page: popup }).analyze()).violations).toEqual([]);
    await primary(popup).click();
    await expect(pill(popup)).toHaveAttribute('data-view', 'awake');
    expect((await new AxeBuilder({ page: popup }).analyze()).violations).toEqual([]);
    await primary(popup).click();
    await expect(pill(popup)).toHaveAttribute('data-view', 'paused');
    expect((await new AxeBuilder({ page: popup }).analyze()).violations).toEqual([]);
    const options = await openOptions(context, extensionId);
    await options.emulateMedia({ reducedMotion: 'reduce' });
    await options.evaluate((value) => {
      document.documentElement.dataset.theme = value;
    }, theme);
    await expect(options.locator('.xo-card')).toHaveCSS('opacity', '1');
    expect((await new AxeBuilder({ page: options }).analyze()).violations).toEqual([]);
  });
}
