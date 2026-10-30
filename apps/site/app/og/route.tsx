import { ImageResponse } from 'next/og';
import type { NextRequest } from 'next/server';
import { SCENES, type TSceneFill, type TSceneKey } from '@/components/scene/scene-data';

// Fixed card colours from the social-cards board: one porcelain and one midnight template.
const CARD = {
  dark: {
    base: '#070B16',
    lamp: 'rgba(61,245,142,.28)',
    act: 'rgba(159,123,255,.30)',
    ink: '#EEF2FA',
    sub: '#C9D1E0',
    kicker: '#7CF0AE',
    mark: '#3DF58E',
  },
  light: {
    base: '#F5F5FA',
    lamp: 'rgba(61,245,142,.30)',
    act: 'rgba(159,123,255,.22)',
    ink: '#0B1020',
    sub: '#4B5165',
    kicker: '#117A3B',
    mark: '#117A3B',
  },
} as const;

// The scene palette of globals.css, resolved, because the image renderer cannot read CSS variables.
const SCENE_INK = {
  light: {
    ink: '#0b1020',
    shadow: '#0b1020',
    blob: '#e2f6e8',
    blob2: '#efeaff',
    spark: '#9f7bff',
    w: '#ffffff',
    w2: '#ececf4',
    p: '#e3e3ee',
    m: '#1d273f',
    s: '#b4d8fe',
    v: '#d8cffe',
    k: '#0b1020',
    g: '#5cf59e',
  },
  dark: {
    ink: '#04060c',
    shadow: '#000000',
    blob: '#151d31',
    blob2: '#241a4d',
    spark: '#ffc53d',
    w: '#e7eaf0',
    w2: '#c9d4ec',
    p: '#b0bcd3',
    m: '#151d31',
    s: '#7cbbff',
    v: '#c1b1fe',
    k: '#0b0f1a',
    g: '#3df58e',
  },
} as const;
const SCENE_FIXED = {
  ring: '#eef2fa',
  lamp: '#3df58e',
  act: '#9f7bff',
  amber: '#ffc53d',
  red: '#ff6b81',
  highlight: '#ffffff',
};

const SCRIPT: Record<string, string> = { ja: 'Noto Sans JP', zh: 'Noto Sans SC', hi: 'Noto Sans Devanagari' };

// A subset of one Google font with just the card's glyphs; without a user agent Google serves TrueType.
async function font(family: string, axes: string, text: string): Promise<ArrayBuffer | null> {
  try {
    const q = `family=${encodeURIComponent(family)}:${axes}&text=${encodeURIComponent(text)}`;
    const css = await (await fetch(`https://fonts.googleapis.com/css2?${q}`)).text();
    const url = /src: url\((.+?)\) format\('(?:opentype|truetype)'\)/u.exec(css)?.[1];
    return url ? await (await fetch(url)).arrayBuffer() : null;
  } catch {
    return null;
  }
}

const clip = (value: string | null, max: number): string => (value ?? '').slice(0, max);

const isScene = (value: string | null): value is TSceneKey => value !== null && value in SCENES;

// The board's scene, drawn with the same layers as the Scene component at the card's 514 px.
function OgScene({ scene, tone }: { scene: TSceneKey; tone: 'light' | 'dark' }) {
  const def = SCENES[scene];
  const c = SCENE_INK[tone];
  const fill: Record<TSceneFill, string> = {
    w: c.w,
    w2: c.w2,
    p: c.p,
    m: c.m,
    t: SCENE_FIXED.lamp,
    o: SCENE_FIXED.act,
    a: SCENE_FIXED.amber,
    a2: SCENE_FIXED.amber,
    s: c.s,
    v: c.v,
    k: c.k,
    r: SCENE_FIXED.red,
    g: c.g,
  };
  const [lx, ly, lr] = def.lamp;
  const line = { fill: 'none', strokeWidth: 3, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;
  return (
    <svg width="514" height="386" viewBox="0 0 320 240">
      {def.blob ? <path d={def.blob} fill={c.blob} /> : null}
      {def.blob2 ? <path d={def.blob2} fill={c.blob2} /> : null}
      <path d={def.layers.map(([, d]) => d).join(' ')} fill={c.shadow} transform="translate(6 6)" />
      {def.layers.map(([key, d], i) => (
        <path key={i} d={d} fill={fill[key]} stroke={c.ink} strokeWidth={3} strokeLinejoin="round" />
      ))}
      {def.ring ? <path d={def.ring} fill="none" stroke={SCENE_FIXED.ring} strokeWidth={8} strokeLinecap="round" /> : null}
      {def.ln ? <path d={def.ln} stroke={c.ink} {...line} /> : null}
      {def.lnLight ? <path d={def.lnLight} stroke={SCENE_FIXED.lamp} {...line} /> : null}
      {def.sp ? <path d={def.sp} fill="none" stroke={c.spark} strokeWidth={3.5} strokeLinecap="round" /> : null}
      <circle cx={lx} cy={ly} r={lr * 2.3} fill={SCENE_FIXED.lamp} opacity={0.35} />
      <circle cx={lx} cy={ly} r={lr} fill={SCENE_FIXED.lamp} stroke={c.ink} strokeWidth={3} />
      <circle
        cx={lx - lr * 0.3}
        cy={ly - lr * 0.3}
        r={Math.max(1.5, lr * 0.28)}
        fill={SCENE_FIXED.highlight}
        opacity={0.85}
      />
    </svg>
  );
}

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams;
  const kicker = clip(q.get('k'), 48).toUpperCase();
  const title = clip(q.get('t'), 90) || 'Keep the screen on. Know when it is.';
  const sub = clip(q.get('d'), 120);
  const tone = q.get('m') === 'light' ? 'light' : 'dark';
  const c = CARD[tone];
  const sceneKey = q.get('s');
  const scene = isScene(sceneKey) ? sceneKey : null;
  const script = SCRIPT[q.get('l') ?? ''];
  const text = `AwakeTab${kicker}${title}${sub}`;
  const loaded = await Promise.all([
    font('Archivo', 'wdth,wght@112,800', 'Awake').then((data) =>
      data ? { name: 'Archivo', data, weight: 800 as const } : null,
    ),
    font('Archivo', 'wdth,wght@112,500', 'Tab').then((data) =>
      data ? { name: 'Archivo', data, weight: 500 as const } : null,
    ),
    font('Geist', 'wght@800', text).then((data) => (data ? { name: 'Geist', data, weight: 800 as const } : null)),
    font('Geist', 'wght@500', text).then((data) => (data ? { name: 'Geist', data, weight: 500 as const } : null)),
    font('Geist Mono', 'wght@500', kicker).then((data) =>
      data ? { name: 'Geist Mono', data, weight: 500 as const } : null,
    ),
    script
      ? font(script, 'wght@700', text).then((data) => (data ? { name: script, data, weight: 700 as const } : null))
      : null,
  ]);
  const fonts = loaded.filter((f) => f !== null).map((f) => ({ ...f, style: 'normal' as const }));
  const family = script ? `Geist, '${script}'` : 'Geist';
  return new ImageResponse(
    <div
      style={{
        position: 'relative',
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
        <span style={{ fontFamily: 'Archivo, Geist', fontSize: 36, fontWeight: 800, letterSpacing: -0.72 }}>
          Awake<span style={{ fontWeight: 500 }}>Tab</span>
        </span>
      </div>
      {scene && (
        <div style={{ position: 'absolute', right: 31, bottom: 45, display: 'flex' }}>
          <OgScene scene={scene} tone={tone} />
        </div>
      )}
      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 17, maxWidth: 566 }}>
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
