import { ImageResponse } from 'next/og';
import type { NextRequest } from 'next/server';
import { SCENES, type TSceneFill, type TSceneKey } from '@/components/scene/scene-data';

// The page templates of the marketing board: use case on porcelain, guide and shared link on graphite.
const CARD = {
  light: {
    base: '#F4F4F9',
    glow: 'radial-gradient(60% 70% at 12% 0%, rgba(17,160,80,0.16), transparent 60%), radial-gradient(60% 70% at 95% 100%, rgba(102,51,245,0.14), transparent 60%)',
    grid: 'rgba(11,16,32,.05)',
    ink: '#0B1020',
    sub: '#4B5165',
    kicker: '#117A3B',
    accent: 'linear-gradient(100deg, #117A3B, #0E8F6A 40%, #6633F5)',
    bead: '#117A3B',
    line: false,
  },
  dark: {
    base: '#05060A',
    glow: 'radial-gradient(60% 70% at 12% 0%, rgba(61,245,142,0.24), transparent 60%), radial-gradient(60% 70% at 95% 100%, rgba(124,92,255,0.30), transparent 60%)',
    grid: 'rgba(255,255,255,.05)',
    ink: '#F2F4FA',
    sub: '#A6AFC2',
    kicker: '#3DF58E',
    accent: 'linear-gradient(100deg, #3DF58E, #7CF0C8 40%, #9F7BFF)',
    bead: '#3DF58E',
    line: true,
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

// The board's scene, drawn with the same layers as the Scene component at the card's 1.5 scale.
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
    <svg width="480" height="360" viewBox="0 0 320 240">
      {def.blob ? <path d={def.blob} fill={c.blob} /> : null}
      {def.blob2 ? <path d={def.blob2} fill={c.blob2} /> : null}
      <path d={def.layers.map(([, d]) => d).join(' ')} fill={c.shadow} transform="translate(6 6)" />
      {def.layers.map(([key, d], i) => (
        <path key={i} d={d} fill={fill[key]} stroke={c.ink} strokeWidth={3} strokeLinejoin="round" />
      ))}
      {def.ring ? (
        <path d={def.ring} fill="none" stroke={SCENE_FIXED.ring} strokeWidth={8} strokeLinecap="round" />
      ) : null}
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

const clip = (value: string | null, max: number): string => (value ?? '').slice(0, max);

const isScene = (value: string | null): value is TSceneKey => value !== null && value in SCENES;

// The trailing phrase that carries the serif accent: the last two words of a longer headline, else the last one.
function splitAccent(title: string): [string, string] {
  const words = title.trim().split(/\s+/u);
  const n = words.length >= 4 ? 2 : words.length >= 2 ? 1 : 0;
  return [words.slice(0, words.length - n).join(' '), words.slice(words.length - n).join(' ')];
}

// The shared-link template's clock: two graphite flip cards with the length and their units.
function FlipClock({ minutes }: { minutes: number }) {
  const big = minutes >= 100;
  const left = minutes === 0 ? '∞' : big ? String(Math.floor(minutes / 60)) : String(minutes).padStart(2, '0');
  const right = minutes === 0 ? '' : big ? String(minutes % 60).padStart(2, '0') : '00';
  const card = (text: string, label: string) => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
      <div
        style={{
          width: 150,
          height: 186,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 16,
          backgroundImage: 'linear-gradient(180deg, #2E313C, #1B1E28 50%, #15171E 50%, #101218)',
          color: '#F2F4FA',
          fontSize: 116,
          fontWeight: 400,
          letterSpacing: -4,
        }}
      >
        {text}
      </div>
      <span style={{ fontFamily: 'Geist Mono', fontSize: 15, letterSpacing: 2.4, color: '#A6AFC2' }}>{label}</span>
    </div>
  );
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 22 }}>
      {card(left, big ? 'HR' : 'MIN')}
      {right ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 26, paddingTop: 70 }}>
          <div style={{ width: 12, height: 12, borderRadius: 6, background: '#A6AFC2' }} />
          <div style={{ width: 12, height: 12, borderRadius: 6, background: '#A6AFC2' }} />
        </div>
      ) : null}
      {right ? card(right, big ? 'MIN' : 'SEC') : null}
    </div>
  );
}

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams;
  const template = q.get('v') === 'use' ? 'use' : q.get('v') === 'shared' ? 'shared' : 'guide';
  const kicker = clip(q.get('k'), 48).toUpperCase();
  const title = clip(q.get('h'), 90) || 'Keep this screen awake.';
  const sub = clip(q.get('d'), 80);
  const c = CARD[template === 'use' ? 'light' : 'dark'];
  const sceneKey = q.get('s');
  const scene = isScene(sceneKey) ? sceneKey : null;
  const minutes = Math.max(0, Math.min(1440, Number(q.get('n') ?? '45') || 0));
  const script = SCRIPT[q.get('l') ?? ''];
  const [lead, accent] = script ? [title, ''] : splitAccent(title);
  const text = `AwakeTab${kicker}${title}${sub}awaketab.com0123456789:∞MINSECHR`;
  const loaded = await Promise.all([
    font('Bricolage Grotesque', 'opsz,wght@96,700', `AwakeTab${lead}`).then((data) =>
      data ? { name: 'Bricolage Grotesque', data, weight: 700 as const } : null,
    ),
    font('Bricolage Grotesque', 'opsz,wght@96,500', 'Tab').then((data) =>
      data ? { name: 'Bricolage Grotesque', data, weight: 500 as const } : null,
    ),
    accent
      ? font('Instrument Serif', 'ital@1', accent).then((data) =>
          data ? { name: 'Instrument Serif', data, weight: 400 as const, style: 'italic' as const } : null,
        )
      : null,
    font('Inter', 'wght@400', text).then((data) => (data ? { name: 'Inter', data, weight: 400 as const } : null)),
    font('Geist Mono', 'wght@400', `${kicker}awaketab.comMINSECHR`).then((data) =>
      data ? { name: 'Geist Mono', data, weight: 400 as const } : null,
    ),
    script
      ? font(script, 'wght@700', text).then((data) => (data ? { name: script, data, weight: 700 as const } : null))
      : null,
  ]);
  const fonts = loaded.filter((f) => f !== null).map((f) => ({ style: 'normal' as const, ...f }));
  const display = script ? `'Bricolage Grotesque', '${script}'` : "'Bricolage Grotesque', Inter";
  return new ImageResponse(
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        display: 'flex',
        backgroundColor: c.base,
        color: c.ink,
        fontFamily: script ? `Inter, '${script}'` : 'Inter',
      }}
    >
      <div style={{ position: 'absolute', inset: 0, display: 'flex', backgroundImage: c.glow }} />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          backgroundImage: `linear-gradient(${c.grid} 1px, transparent 1px), linear-gradient(90deg, ${c.grid} 1px, transparent 1px)`,
          backgroundSize: '56px 56px',
          maskImage: 'radial-gradient(ellipse at 50% 30%, #000, transparent 70%)',
        }}
      />
      {c.line ? (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 0,
            height: 1,
            display: 'flex',
            backgroundImage:
              'linear-gradient(90deg, transparent, rgba(61,245,142,.6), rgba(159,123,255,.6), transparent)',
          }}
        />
      ) : null}
      <div style={{ position: 'absolute', left: 72, top: 64, display: 'flex', alignItems: 'center', gap: 10 }}>
        <svg width="34" height="34" viewBox="0 0 32 32">
          <circle cx="16" cy="16" r="11" fill="none" stroke={c.ink} strokeOpacity="0.22" strokeWidth="4" />
          <path d="M16 5 A11 11 0 1 1 6.47 10.5" fill="none" stroke={c.ink} strokeWidth="4" strokeLinecap="round" />
          <circle cx="6.47" cy="10.5" r="4.6" fill={c.bead} />
        </svg>
        <span style={{ fontFamily: display, fontSize: 28, fontWeight: 700, letterSpacing: -0.84 }}>
          Awake<span style={{ fontWeight: 500 }}>Tab</span>
        </span>
      </div>
      <div
        style={{
          position: 'absolute',
          left: 72,
          top: 170,
          width: 560,
          display: 'flex',
          flexDirection: 'column',
          gap: 18,
        }}
      >
        {kicker ? (
          <span style={{ fontFamily: 'Geist Mono', fontSize: 15, letterSpacing: 2.4, color: c.kicker }}>{kicker}</span>
        ) : null}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            fontFamily: display,
            fontSize: title.length > 40 ? 58 : 64,
            lineHeight: 0.98,
            fontWeight: 700,
            letterSpacing: -2.8,
          }}
        >
          {lead}
          {accent ? (
            <span
              style={{
                marginLeft: 14,
                paddingRight: 4,
                fontFamily: 'Instrument Serif',
                fontStyle: 'italic',
                fontWeight: 400,
                letterSpacing: -0.6,
                backgroundImage: c.accent,
                backgroundClip: 'text',
                color: 'transparent',
              }}
            >
              {accent}
            </span>
          ) : null}
        </div>
      </div>
      <div
        style={{
          position: 'absolute',
          left: 72,
          bottom: 60,
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          fontSize: 20,
          color: c.sub,
        }}
      >
        {sub ? <span>{sub}</span> : null}
        {sub ? <span style={{ width: 4, height: 4, borderRadius: 9, background: c.sub }} /> : null}
        <span style={{ fontFamily: 'Geist Mono', fontSize: 17 }}>awaketab.com</span>
      </div>
      {template === 'shared' ? (
        <div style={{ position: 'absolute', right: 100, top: 168, display: 'flex' }}>
          <FlipClock minutes={minutes} />
        </div>
      ) : scene ? (
        <div
          style={{
            position: 'absolute',
            right: 60,
            top: 95,
            width: 480,
            height: 440,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <OgScene scene={scene} tone={template === 'use' ? 'light' : 'dark'} />
        </div>
      ) : null}
    </div>,
    {
      width: 1200,
      height: 630,
      ...(fonts.length > 0 ? { fonts } : {}),
      headers: { 'cache-control': 'public, max-age=86400, s-maxage=31536000, immutable' },
    },
  );
}
