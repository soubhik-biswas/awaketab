import type { Metadata } from 'next';
import { describe, expect, it, vi } from 'vitest';
import { articleMetadata } from '@/components/site/article/article-page';
import { articles } from '@/lib/content';
import { SITE_ICONS, SITE_VIEWPORT } from '@/lib/seo';

// The real English messages behind getTranslations, so each page builds its head exactly as the server does.
vi.mock('next-intl/server', async () => {
  const { createTranslator } = await import('next-intl');
  const en = (await import('@/messages/en.json')).default as Record<string, unknown>;
  const translator = (opts?: string | { namespace?: string }) => {
    const namespace = typeof opts === 'string' ? opts : opts?.namespace;
    return createTranslator({
      locale: 'en',
      messages: en,
      namespace,
      onError: (error: unknown) => {
        throw error;
      },
    } as never) as (key: string, values?: Record<string, unknown>) => string;
  };
  return {
    getTranslations: (opts?: string | { namespace?: string }) => Promise.resolve(translator(opts)),
    getLocale: () => Promise.resolve('en'),
    getMessages: () => Promise.resolve(en),
    setRequestLocale: () => undefined,
  };
});
vi.mock('@/components/face/fonts', () => ({ SERIF: 'serif' }));

type TModule = { generateMetadata: (props: { params: Promise<Record<string, string>> }) => Promise<Metadata> };

const en = (extra: Record<string, string> = {}) => ({ params: Promise.resolve({ locale: 'en', ...extra }) });

const ROUTES: ReadonlyArray<readonly [string, () => Promise<TModule>, Record<string, string>?]> = [
  ['/', () => import('./[locale]/(home)/page')],
  ['/pro', () => import('./[locale]/(site)/pro/page')],
  ['/pro/checkout', () => import('./[locale]/(site)/pro/checkout/page')],
  ['/pro/manage', () => import('./[locale]/(site)/pro/manage/page')],
  ['/pro/activate', () => import('./[locale]/(site)/pro/activate/page')],
  ['/signin', () => import('./[locale]/(site)/signin/page')],
  ['/signin/expired', () => import('./[locale]/(site)/signin/expired/page')],
  ['/about', () => import('./[locale]/(site)/about/page')],
  ['/help', () => import('./[locale]/(site)/help/page')],
  ['/status', () => import('./[locale]/(site)/status/page')],
  ['/changelog', () => import('./[locale]/(site)/changelog/page')],
  ['/privacy', () => import('./[locale]/(site)/privacy/page')],
  ['/terms', () => import('./[locale]/(site)/terms/page')],
  ['/extension', () => import('./[locale]/(site)/extension/page')],
  ['/embed', () => import('./[locale]/(site)/embed/page')],
  ['/kiosk', () => import('./[locale]/(site)/kiosk/page')],
  ['/library', () => import('./[locale]/(site)/library/page')],
  ['/offline', () => import('./[locale]/(site)/offline/page')],
  ['/s/removed', () => import('./[locale]/(site)/s/removed/page')],
  ['/for', () => import('./[locale]/(site)/for/page')],
  ['/on', () => import('./[locale]/(site)/on/page')],
  ['/vs', () => import('./[locale]/(site)/vs/page')],
  ['/guides', () => import('./[locale]/(site)/guides/page')],
  ['/learn', () => import('./[locale]/(site)/learn/page')],
  ['/1h', () => import('./[locale]/(site)/[preset]/page'), { preset: '1h' }],
  ['/until/17-00', () => import('./[locale]/(site)/until/[time]/page'), { time: '17-00' }],
];

const HOME_TITLE = 'AwakeTab — Keep this screen awake';
const HOME_DESCRIPTION =
  'Keep your screen on with one click. A calm clock shows the time left. 46 faces, six living backgrounds, free — no install, no account.';
const EMAIL = /[\w.+-]+@[\w-]+\.[\w.]+/u;

const titleOf = (m: Metadata): string => {
  const t = m.title;
  if (typeof t === 'string') return t;
  if (t && typeof t === 'object' && 'absolute' in t) return t.absolute;
  return '';
};

// Title, description, share image and card rules every page head follows (brief §9h).
function expectHead(path: string, m: Metadata) {
  const title = titleOf(m);
  const description = m.description ?? '';
  expect(title.length, `${path} title "${title}"`).toBeLessThan(60);
  if (path === '/') {
    expect(title).toBe(HOME_TITLE);
    expect(description).toBe(HOME_DESCRIPTION);
  } else {
    expect(title, path).toMatch(/ · AwakeTab$/u);
    expect(description.length, `${path} description "${description}"`).toBeGreaterThanOrEqual(140);
    expect(description.length, `${path} description "${description}"`).toBeLessThanOrEqual(155);
  }
  expect(description, path).not.toMatch(EMAIL);
  const og = m.openGraph as { title?: string; description?: string; images?: unknown[] } | undefined;
  expect(og?.title, path).toBe(title);
  expect(og?.description, path).toBe(description);
  const image = og?.images?.[0] as { url: string; width: number; height: number; alt: string } | undefined;
  expect(image, path).toBeDefined();
  expect(image?.width, path).toBe(1200);
  expect(image?.height, path).toBe(630);
  expect(image?.alt.length ?? 0, path).toBeGreaterThan(0);
  expect(image?.url, path).toMatch(/^\/og(\/og-0[1-8]\.png|\?)/u);
  const twitter = m.twitter as { card?: string; images?: unknown[] } | undefined;
  expect(twitter?.card, path).toBe('summary_large_image');
  expect(twitter?.images?.length, path).toBe(1);
}

describe('page heads', () => {
  it.each(ROUTES)('%s has its own title, description and share image', async (path, load, extra) => {
    const page = await load();
    expectHead(path, await page.generateMetadata(en(extra)));
  });

  it.each(['for', 'on', 'vs', 'guides', 'learn'] as const)('every English %s article follows the same rules', async (kind) => {
    for (const a of articles(kind).filter((x) => x.locale === 'en')) {
      expectHead(`/${kind}/${a.enSlug}`, await articleMetadata(kind, 'en', a.enSlug));
    }
  });

  it('sets the theme colour for both schemes and the marketing icons', () => {
    expect(SITE_VIEWPORT.themeColor).toEqual([
      { media: '(prefers-color-scheme: dark)', color: '#05060A' },
      { media: '(prefers-color-scheme: light)', color: '#F4F4F9' },
    ]);
    const icons = JSON.stringify(SITE_ICONS);
    for (const file of ['/favicon.svg', '/icons/favicon-32.png', '/icons/apple-touch-icon-180.png']) {
      expect(icons).toContain(file);
    }
  });
});
