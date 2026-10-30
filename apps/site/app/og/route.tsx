import { ImageResponse } from 'next/og';
import type { NextRequest } from 'next/server';

// Fixed card colours from the social-cards board: one paper and one midnight template.
const CARD = {
  dark: {
    base: '#070B16',
    lamp: 'rgba(59,228,127,.28)',
    act: 'rgba(255,107,44,.30)',
    ink: '#EEF2FA',
    sub: '#C9D1E0',
    kicker: '#7CF0AE',
    mark: '#3BE47F',
  },
  light: {
    base: '#F6F4EF',
    lamp: 'rgba(59,228,127,.30)',
    act: 'rgba(255,107,44,.22)',
    ink: '#0B1020',
    sub: '#4B5165',
    kicker: '#117A3B',
    mark: '#117A3B',
  },
} as const;

const SCRIPT: Record<string, string> = { ja: 'Noto Sans JP', zh: 'Noto Sans SC', hi: 'Noto Sans Devanagari' };

// A subset of one Google font with just the card's glyphs; without a user agent Google serves TrueType.
async function font(family: string, weight: number, text: string): Promise<ArrayBuffer | null> {
  try {
    const q = `family=${encodeURIComponent(family)}:wght@${String(weight)}&text=${encodeURIComponent(text)}`;
    const css = await (await fetch(`https://fonts.googleapis.com/css2?${q}`)).text();
    const url = /src: url\((.+?)\) format\('(?:opentype|truetype)'\)/u.exec(css)?.[1];
    return url ? await (await fetch(url)).arrayBuffer() : null;
  } catch {
    return null;
  }
}

const clip = (value: string | null, max: number): string => (value ?? '').slice(0, max);

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams;
  const kicker = clip(q.get('k'), 48).toUpperCase();
  const title = clip(q.get('t'), 90) || 'Keep the screen on. Know when it is.';
  const sub = clip(q.get('d'), 120);
  const c = q.get('m') === 'light' ? CARD.light : CARD.dark;
  const script = SCRIPT[q.get('l') ?? ''];
  const text = `AwakeTab${kicker}${title}${sub}`;
  const loaded = await Promise.all([
    font('Geist', 800, text).then((data) => (data ? { name: 'Geist', data, weight: 800 as const } : null)),
    font('Geist', 500, text).then((data) => (data ? { name: 'Geist', data, weight: 500 as const } : null)),
    font('Geist Mono', 500, kicker).then((data) => (data ? { name: 'Geist Mono', data, weight: 500 as const } : null)),
    script
      ? font(script, 700, text).then((data) => (data ? { name: script, data, weight: 700 as const } : null))
      : null,
  ]);
  const fonts = loaded.filter((f) => f !== null).map((f) => ({ ...f, style: 'normal' as const }));
  const family = script ? `Geist, '${script}'` : 'Geist';
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '62px 69px',
        backgroundColor: c.base,
        backgroundImage: `radial-gradient(circle at 85% 30%, ${c.lamp}, transparent 42%), radial-gradient(circle at 95% 100%, ${c.act}, transparent 40%)`,
        color: c.ink,
        fontFamily: family,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
        <svg width="58" height="58" viewBox="0 0 64 64">
          <path d="M32 11 A21 21 0 1 1 12.27 24.82" fill="none" stroke={c.ink} strokeWidth="9" strokeLinecap="round" />
          <circle cx="19.95" cy="14.8" r="5.6" fill={c.mark} />
        </svg>
        <span style={{ fontSize: 36, fontWeight: 800, letterSpacing: -1.2 }}>
          Awake<span style={{ fontWeight: 500 }}>Tab</span>
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 17, maxWidth: 640 }}>
        {kicker && (
          <span
            style={{ fontFamily: 'Geist Mono', fontSize: 24, letterSpacing: 2.4, color: c.kicker, fontWeight: 500 }}
          >
            {kicker}
          </span>
        )}
        <span style={{ fontSize: 69, fontWeight: 800, lineHeight: 1.02, letterSpacing: -2 }}>{title}</span>
        {sub && <span style={{ fontSize: 28, lineHeight: 1.45, color: c.sub, fontWeight: 500 }}>{sub}</span>}
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
      ...(fonts.length > 0 ? { fonts } : {}),
      headers: { 'cache-control': 'public, max-age=86400, s-maxage=31536000, immutable' },
    },
  );
}
