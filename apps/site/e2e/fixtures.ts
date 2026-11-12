import { test as base, expect, type Locator, type Page } from '@playwright/test';

// The design boards' moment (Saturday, 31 October 2026 at 11:23 AM), so every run reads the same times.
const NOW = new Date('2026-10-31T11:23:00Z');

interface IFakeControls {
  held: () => number;
  requests: () => number;
  refuse: (on: boolean) => void;
  releaseAll: () => void;
}

interface IFakeWindow {
  fakeWakeLock: IFakeControls;
}

// Runs in the page before any of its code: a wake lock the test controls, in place of the browser's own.
function installFakeWakeLock(): void {
  const held = new Set<EventTarget>();
  const state = { requests: 0, refuse: false };
  class Sentinel extends EventTarget {
    released = false;
    readonly type = 'screen';
    onrelease: ((event: Event) => void) | null = null;
    release(): Promise<void> {
      this.end();
      return Promise.resolve();
    }
    end(): void {
      if (this.released) return;
      this.released = true;
      held.delete(this);
      const event = new Event('release');
      this.dispatchEvent(event);
      this.onrelease?.(event);
    }
  }
  const wakeLock = {
    request(): Promise<Sentinel> {
      state.requests += 1;
      // Browsers refuse a hidden page the same way.
      if (state.refuse || document.visibilityState === 'hidden') {
        return Promise.reject(new DOMException('The wake lock request was refused.', 'NotAllowedError'));
      }
      const sentinel = new Sentinel();
      held.add(sentinel);
      return Promise.resolve(sentinel);
    },
  };
  const controls: IFakeControls = {
    held: () => held.size,
    requests: () => state.requests,
    refuse: (on) => {
      state.refuse = on;
    },
    releaseAll: () => {
      for (const sentinel of [...held]) (sentinel as Sentinel).end();
    },
  };
  Object.defineProperty(navigator, 'wakeLock', { configurable: true, value: wakeLock });
  Object.defineProperty(window, 'fakeWakeLock', { configurable: true, value: controls });
}

// A returning visitor who already answered "Count this visit?". An answer given during the test is never replaced.
function answerConsent(): void {
  if (!location.protocol.startsWith('http')) return;
  if (localStorage.getItem('at.v1.onboarding') === null) {
    localStorage.setItem('at.v1.onboarding', JSON.stringify({ v: 1, dismissedTips: ['analytics'] }));
  }
}

function setVisibility(state: 'visible' | 'hidden'): void {
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => state });
  Object.defineProperty(document, 'hidden', { configurable: true, get: () => state === 'hidden' });
  document.dispatchEvent(new Event('visibilitychange'));
}

interface IWakeLock {
  // Sentinels the page still holds.
  held: () => Promise<number>;
  requests: () => Promise<number>;
  // While on, every request is refused with a NotAllowedError.
  refuse: (on: boolean) => Promise<void>;
  // The browser lets go of the lock by itself.
  releaseAll: () => Promise<void>;
  // The tab goes to the background: the page is hidden and the browser releases the lock.
  hideTab: () => Promise<void>;
  showTab: () => Promise<void>;
}

function wakeLockOf(page: Page): IWakeLock {
  return {
    held: () => page.evaluate(() => (window as unknown as IFakeWindow).fakeWakeLock.held()),
    requests: () => page.evaluate(() => (window as unknown as IFakeWindow).fakeWakeLock.requests()),
    refuse: (on) =>
      page.evaluate((value) => {
        (window as unknown as IFakeWindow).fakeWakeLock.refuse(value);
      }, on),
    releaseAll: () =>
      page.evaluate(() => {
        (window as unknown as IFakeWindow).fakeWakeLock.releaseAll();
      }),
    hideTab: async () => {
      await page.evaluate(setVisibility, 'hidden' as const);
      await page.evaluate(() => {
        (window as unknown as IFakeWindow).fakeWakeLock.releaseAll();
      });
    },
    showTab: () => page.evaluate(setVisibility, 'visible' as const),
  };
}

interface IOptions {
  // True shows the page as a first-time visitor sees it, with the "Count this visit?" card.
  firstVisit: boolean;
}

interface IFixtures {
  wakeLock: IWakeLock;
  // Console errors, uncaught errors and failed requests seen so far.
  problems: string[];
  // Every request the page made to the visit counter.
  counted: string[];
}

export const test = base.extend<IOptions & IFixtures>({
  firstVisit: [false, { option: true }],
  page: async ({ page, firstVisit }, use) => {
    await page.clock.install({ time: NOW });
    await page.addInitScript(installFakeWakeLock);
    if (!firstVisit) await page.addInitScript(answerConsent);
    await use(page);
  },
  wakeLock: async ({ page }, use) => {
    await use(wakeLockOf(page));
  },
  problems: async ({ page }, use) => {
    const problems: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') problems.push(`console: ${message.text()}`);
    });
    page.on('pageerror', (error) => problems.push(`uncaught: ${error.message}`));
    page.on('requestfailed', (request) => {
      problems.push(`failed: ${request.method()} ${request.url()} ${request.failure()?.errorText ?? ''}`);
    });
    await use(problems);
  },
  // The counter is answered here, so no test ever reaches a real server with it.
  counted: [
    async ({ page }, use) => {
      const counted: string[] = [];
      await page.route('**/api/e', async (route) => {
        counted.push(route.request().method());
        await route.fulfill({ status: 200, json: { ok: true, n: 1 } });
      });
      await use(counted);
    },
    { auto: true },
  ],
});

export { expect };

export const tool = (page: Page): Locator => page.locator('[data-slot="tool"]');
export const stage = (page: Page): Locator => tool(page).getByRole('main');
export const face = (page: Page): Locator => stage(page).getByRole('timer');
export const pill = (page: Page): Locator => tool(page).locator('[role="status"][aria-live="off"]');
export const dock = (page: Page): Locator => tool(page).getByRole('toolbar');
export const startButton = (page: Page): Locator => tool(page).getByRole('button', { name: /^Keep awake · / });

// The working tool has replaced the first paint once its length control or its dock is there, in any language.
export async function toolReady(page: Page): Promise<void> {
  await expect(tool(page).locator('[role="radiogroup"], [role="toolbar"]').first()).toBeVisible();
}

export async function openTool(page: Page, address = '/'): Promise<void> {
  await page.goto(address);
  await toolReady(page);
}

export async function startSession(page: Page, length = '30 min'): Promise<void> {
  await tool(page).getByRole('radio', { name: length, exact: true }).click();
  await startButton(page).click();
  await expect(pill(page)).toHaveText(/^Awake · until /u);
}

// The controls rest after five quiet seconds; a pointer move brings them back, as it does for a visitor.
export async function showControls(page: Page): Promise<void> {
  await page.mouse.move(48, 132);
  await page.mouse.move(64, 148);
  await expect(dock(page)).not.toHaveAttribute('inert');
}

// The time left as the clock face draws it, in seconds.
export async function secondsLeft(page: Page): Promise<number> {
  const text = await face(page).innerText();
  const found = /(?:(\d+):)?(\d{1,2}):(\d{2})/u.exec(text);
  if (!found) throw new Error(`No time on the face: ${text}`);
  return Number(found[1] ?? 0) * 3600 + Number(found[2]) * 60 + Number(found[3]);
}
