import { expect, openTool, test, tool } from './fixtures';

const PAGES = [
  '/about',
  '/help',
  '/learn',
  '/guides',
  '/for',
  '/on',
  '/vs',
  '/extension',
  '/embed',
  '/kiosk',
  '/library',
  '/privacy',
  '/terms',
  '/changelog',
];

for (const address of PAGES) {
  test(`${address} loads with one heading and no errors`, async ({ page, problems }) => {
    const response = await page.goto(address);
    expect(response?.status()).toBe(200);
    await expect(page.locator('h1')).toHaveCount(1);
    await page.waitForLoadState('networkidle');
    expect(problems).toEqual([]);
  });
}

test('an unknown address answers 404 with the sleeping-page title', async ({ page }) => {
  const response = await page.goto('/does-not-exist');
  expect(response?.status()).toBe(404);
  await expect(page).toHaveTitle('This page fell asleep · AwakeTab');
});

test('every header and footer link on /about leads to a page', async ({ page, request }) => {
  test.slow();
  await page.goto('/about');
  const links = await page.locator('header a[href], footer a[href]').evaluateAll((all) => {
    const own = all.map((a) => (a as HTMLAnchorElement).href).filter((href) => href.startsWith(location.origin));
    return [...new Set(own.map((href) => href.split('#')[0] ?? href))];
  });
  expect(links.length).toBeGreaterThan(5);
  const broken: string[] = [];
  for (const link of links) {
    const response = await request.get(link);
    if (response.status() !== 200) broken.push(`${response.status()} ${link}`);
  }
  expect(broken).toEqual([]);
});

test('/en moves permanently to /, and a trailing slash is removed', async ({ request }) => {
  const english = await request.get('/en', { maxRedirects: 0 });
  expect(english.status()).toBe(308);
  expect(new URL(english.headers().location ?? '', 'http://localhost').pathname).toBe('/');
  const slash = await request.get('/about/', { maxRedirects: 0 });
  expect(slash.status()).toBe(308);
  expect(new URL(slash.headers().location ?? '', 'http://localhost').pathname).toBe('/about');
});

// The paid plan is off: none of its words may show. Whole words only, so "Product" and "Process" pass.
const PAID = [
  /\bPro\b/u,
  /\bPRO\b/u,
  /\$[1-9]/u,
  /\bpricing\b/iu,
  /\bsign in\b/iu,
  /\bupgrade\b/iu,
  /\blicen[cs]e key\b/iu,
];

function paidWords(text: string): string[] {
  return PAID.flatMap((word) => {
    const at = text.search(word);
    return at < 0 ? [] : [`${String(word)}: …${text.slice(Math.max(0, at - 40), at + 40).replace(/\s+/gu, ' ')}…`];
  });
}

for (const address of ['/', '/about', '/help', '/learn/faq']) {
  test(`${address} has no paid-plan wording`, async ({ page }) => {
    await page.goto(address);
    await expect(page.locator('h1')).toHaveCount(1);
    const description = await page.locator('meta[name="description"]').getAttribute('content');
    const words = [await page.title(), description ?? '', await page.locator('body').innerText()].join('\n');
    expect(paidWords(words)).toEqual([]);
  });
}

test('Settings has no paid-plan wording', async ({ page }) => {
  await openTool(page);
  await tool(page).getByRole('button', { name: 'Settings' }).click();
  const settings = tool(page).getByRole('dialog', { name: 'Settings' });
  await expect(settings.getByText('Count my visits')).toBeVisible();
  expect(paidWords(await settings.innerText())).toEqual([]);
});

test('/pro and /signin do not exist', async ({ request }) => {
  expect((await request.get('/pro')).status()).toBe(404);
  expect((await request.get('/signin')).status()).toBe(404);
});
