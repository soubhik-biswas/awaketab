import {
  dock,
  expect,
  face,
  openTool,
  pill,
  secondsLeft,
  showControls,
  stage,
  startButton,
  startSession,
  test,
  tool,
  toolReady,
} from './fixtures';

const stop = 'Stop and let the screen sleep';

test.describe('first visit', () => {
  test.use({ firstVisit: true });

  test('home loads with one heading, the start button, a title, a description and one canonical address', async ({
    page,
    problems,
  }) => {
    const response = await page.goto('/');
    expect(response?.status()).toBe(200);
    await toolReady(page);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('h1')).toHaveText('Keep this screen awake.');
    await expect(startButton(page)).toBeVisible();
    await expect(page).toHaveTitle(/AwakeTab/u);
    const description = await page.locator('meta[name="description"]').getAttribute('content');
    expect(description?.length ?? 0).toBeGreaterThan(50);
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(1);
    await page.waitForLoadState('networkidle');
    expect(problems).toEqual([]);
  });
});

test('starting a session: the pill says awake until the end time, the dock offers Pause and Stop', async ({
  page,
  wakeLock,
}) => {
  await openTool(page);
  await expect(pill(page)).toHaveText('Not keeping awake');
  await tool(page).getByRole('radio', { name: '30 min', exact: true }).click();
  await expect(startButton(page)).toHaveText('Keep awake · 30 min');
  await startButton(page).click();
  await expect(pill(page)).toHaveText('Awake · until 11:53 AM');
  await expect(dock(page).getByRole('button', { name: 'Pause' })).toBeVisible();
  await expect(dock(page).getByRole('button', { name: stop })).toBeVisible();
  await expect(page).toHaveTitle(/^(?:30:00|29:\d\d) left · AwakeTab$/u);
  expect(await wakeLock.held()).toBe(1);
});

test('a hidden tab is never called paused: its clock keeps running, and the lock comes back with the tab', async ({
  page,
  wakeLock,
}) => {
  await openTool(page);
  await startSession(page);
  await wakeLock.hideTab();
  await expect(pill(page)).toHaveText('Tap to resume · tab was hidden');
  await expect(tool(page)).not.toContainText('Paused');
  expect(await wakeLock.held()).toBe(0);
  const hidden = await secondsLeft(page);
  await page.clock.fastForward(10_000);
  await expect.poll(() => secondsLeft(page)).toBeLessThanOrEqual(hidden - 10);
  await expect(pill(page)).toHaveText('Tap to resume · tab was hidden');

  const asked = await wakeLock.requests();
  await wakeLock.showTab();
  await expect(pill(page)).toHaveText('Awake · until 11:53 AM');
  expect(await wakeLock.requests()).toBeGreaterThan(asked);
  expect(await wakeLock.held()).toBe(1);

  await showControls(page);
  await dock(page).getByRole('button', { name: 'Pause' }).click();
  await expect(pill(page)).toHaveText(/^Paused · \d+ min left$/u);
  await expect.poll(() => wakeLock.held()).toBe(0);
  const paused = await secondsLeft(page);
  const words = await pill(page).innerText();
  await page.clock.fastForward(2_000);
  expect(await secondsLeft(page)).toBe(paused);
  await page.clock.fastForward(58_000);
  expect(await secondsLeft(page)).toBe(paused);
  await expect(pill(page)).toHaveText(words);

  await dock(page).getByRole('button', { name: 'Resume' }).click();
  await expect(pill(page)).toHaveText(/^Awake · until 11:5\d AM$/u);
  await expect.poll(() => wakeLock.held()).toBe(1);
  await page.clock.fastForward(5_000);
  await expect.poll(() => secondsLeft(page)).toBeLessThan(paused);
});

test('Stop lets go of the screen', async ({ page, wakeLock }) => {
  await openTool(page);
  await startSession(page);
  expect(await wakeLock.held()).toBe(1);
  await showControls(page);
  await dock(page).getByRole('button', { name: stop }).click();
  await expect(pill(page)).toHaveText('Not keeping awake');
  await expect(startButton(page)).toBeVisible();
  await expect.poll(() => wakeLock.held()).toBe(0);
});

test('Stop after going in and out of fullscreen twice leaves no lock behind', async ({ page, wakeLock }) => {
  await openTool(page);
  await startSession(page);
  const real = await page.evaluate(() => document.fullscreenEnabled);
  for (let round = 0; round < 2; round += 1) {
    if (real) {
      await showControls(page);
      await dock(page).getByRole('button', { name: 'Fullscreen', exact: true }).click();
      await expect.poll(() => page.evaluate(() => document.fullscreenElement !== null)).toBe(true);
      await showControls(page);
      await dock(page).getByRole('button', { name: 'Leave fullscreen' }).click();
      await expect.poll(() => page.evaluate(() => document.fullscreenElement !== null)).toBe(false);
    } else {
      await page.evaluate(() => {
        document.dispatchEvent(new Event('fullscreenchange'));
        document.dispatchEvent(new Event('fullscreenchange'));
      });
    }
    await expect(pill(page)).toHaveText('Awake · until 11:53 AM');
    expect(await wakeLock.held()).toBe(1);
  }
  await showControls(page);
  await dock(page).getByRole('button', { name: stop }).click();
  await expect(pill(page)).toHaveText('Not keeping awake');
  await expect.poll(() => wakeLock.held()).toBe(0);
});

test('a refused lock is never shown as awake, and the fix is one tap away', async ({ page, wakeLock }) => {
  await openTool(page);
  await wakeLock.refuse(true);
  await tool(page).getByRole('radio', { name: '30 min', exact: true }).click();
  await startButton(page).click();
  await expect(pill(page)).toHaveText(/^Not awake · \S/u);
  await expect(dock(page).getByRole('button', { name: 'See the fix' })).toBeVisible();
  expect(await wakeLock.held()).toBe(0);
  // The browser is asked again shortly after a refusal; the words must hold through that too.
  await page.clock.fastForward(5_000);
  await expect(pill(page)).toHaveText(/^Not awake · \S/u);
  expect(await tool(page).innerText()).not.toMatch(/\bAwake\b/u);
  expect(await page.title()).not.toMatch(/\bAwake\b/u);
});

test('+15 min moves the end time and says so', async ({ page }) => {
  await openTool(page);
  await startSession(page);
  await showControls(page);
  const add = dock(page).getByRole('button', { name: 'Add 15 minutes' });
  await expect(add).toHaveText('+15 min');
  await add.click();
  await expect(pill(page)).toHaveText('Awake · until 12:08 PM');
  await expect(tool(page).getByText('15 minutes added · now until 12:08 PM')).toBeVisible();
  await expect(tool(page).getByRole('button', { name: 'Undo' })).toBeVisible();
});

test('keyboard: Enter starts on the stage, Space pauses and resumes, F opens Faces, Ctrl or ⌘ K opens search', async ({
  page,
}) => {
  await openTool(page);
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to the timer' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(stage(page)).toBeFocused();
  await page.keyboard.press('ArrowLeft');
  await expect(startButton(page)).toHaveText('Keep awake · 30 min');
  await page.keyboard.press('Enter');
  await expect(pill(page)).toHaveText('Awake · until 11:53 AM');

  await page.keyboard.press('Space');
  await expect(pill(page)).toHaveText(/^Paused · \d+ min left$/u);
  await page.keyboard.press('Space');
  await expect(pill(page)).toHaveText('Awake · until 11:53 AM');

  await page.keyboard.press('f');
  const faces = tool(page).getByRole('dialog', { name: 'Faces' });
  await expect(faces.getByRole('radiogroup', { name: 'Clock face' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(faces).toBeHidden();

  await page.keyboard.press('ControlOrMeta+k');
  const search = tool(page).getByRole('dialog', { name: 'Search and commands' });
  await expect(search.getByPlaceholder('Type a command or search')).toBeFocused();
  await expect(search.getByRole('option', { name: /^Pause/u })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(search).toBeHidden();
});

test('Faces: search narrows the list, a new face shows in the dock and survives a reload', async ({ page }) => {
  await openTool(page);
  await startSession(page);
  await showControls(page);
  await dock(page).getByRole('button', { name: 'Clock face: Ring. Change face' }).click();
  const faces = tool(page).getByRole('dialog', { name: 'Faces' });
  const tiles = faces.getByRole('radiogroup', { name: 'Clock face' }).getByRole('radio');
  await expect(tiles.first()).toBeVisible();
  const all = await tiles.count();
  await faces.getByRole('searchbox').fill('ring');
  await expect(tiles).toHaveCount(2);
  expect(all).toBeGreaterThan(2);
  for (const name of await tiles.evaluateAll((els) => els.map((el) => el.getAttribute('aria-label') ?? ''))) {
    expect(name.toLowerCase()).toContain('ring');
  }
  await tiles.filter({ hasText: 'Rings' }).click();
  await expect(faces.getByRole('radio', { name: 'Rings', exact: true })).toBeChecked();
  await faces.getByRole('button', { name: 'Close faces' }).click();
  await expect(faces).toBeHidden();
  await expect(dock(page).getByRole('button', { name: 'Clock face: Rings. Change face' })).toBeVisible();
  await expect(face(page)).toHaveAccessibleName(/^Clock face: Rings, /u);

  await page.reload();
  await toolReady(page);
  await expect(pill(page)).toHaveText('Awake · until 11:53 AM');
  await expect(dock(page).getByRole('button', { name: 'Clock face: Rings. Change face' })).toBeVisible();
  await expect(face(page)).toHaveAccessibleName(/^Clock face: Rings, /u);
});

test('a reload keeps the session: same end time, awake again without a tap', async ({ page, wakeLock }) => {
  await openTool(page);
  await startSession(page);
  await page.clock.fastForward(60_000);
  const before = await secondsLeft(page);
  await page.reload();
  await toolReady(page);
  await expect(pill(page)).toHaveText('Awake · until 11:53 AM');
  const after = await secondsLeft(page);
  expect(before - after).toBeGreaterThanOrEqual(0);
  expect(before - after).toBeLessThanOrEqual(10);
  await expect(dock(page).getByRole('button', { name: 'Pause' })).toBeVisible();
  expect(await wakeLock.held()).toBe(1);
});

test('/30m is a 30-minute page whose start link starts 30 minutes', async ({ page }) => {
  const response = await page.goto('/30m');
  expect(response?.status()).toBe(200);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Keep your screen awake for 30 minutes');
  const start = page.getByRole('link', { name: 'Keep awake · 30 min', exact: true });
  await expect(start).toBeVisible();
  await start.click();
  await toolReady(page);
  await expect(pill(page)).toHaveText('Awake · until 11:53 AM');
  expect(new URL(page.url()).pathname).toBe('/');
});

test('/8h starts eight hours, not one', async ({ page }) => {
  await page.goto('/8h');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Keep your screen awake for 8 hours');
  await page.getByRole('link', { name: 'Keep awake · 8 hours', exact: true }).click();
  await toolReady(page);
  await expect(pill(page)).toHaveText('Awake · until 7:23 PM');
  await expect(page).toHaveTitle(/^7:59:\d\d left · AwakeTab$/u);
});

test('a share link starts once, cleans the address and a reload neither restarts nor resets it', async ({
  page,
  baseURL,
  wakeLock,
}) => {
  await openTool(page, '/?preset=p30&autostart=1');
  await expect(pill(page)).toHaveText('Awake · until 11:53 AM');
  await expect(page).toHaveURL(`${baseURL ?? ''}/`);
  expect(await wakeLock.requests()).toBe(1);
  await page.clock.fastForward(120_000);
  await expect(page).toHaveTitle(/^27:\d\d left · AwakeTab$/u);

  await page.reload();
  await toolReady(page);
  await expect(pill(page)).toHaveText('Awake · until 11:53 AM');
  await expect(page).toHaveTitle(/^27:\d\d left · AwakeTab$/u);
  await expect(page).toHaveURL(`${baseURL ?? ''}/`);
  expect(await wakeLock.held()).toBe(1);
});
