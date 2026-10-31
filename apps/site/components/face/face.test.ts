import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { Face } from './face';
import { FaceGrid } from './face-grid';
import {
  ART_H,
  ART_W,
  FACE_IDS,
  faceModel,
  type IFaceProps,
  RETIRED_FACES,
  type TFaceId,
  type TFaceTheme,
  toFaceId,
} from './model';
import { FACE_COLLECTIONS, FACE_LOADERS, FACES, preloadFaces } from './registry';
import { bauhausPie } from './faces/bauhaus';
import { clockHands, digitHands } from './faces/clocks';
import { gridWords } from './faces/wordgrid';
import { moonPath } from './faces/moon';
import { sentence } from './faces/words';

vi.mock('./fonts', () => ({ SERIF: 'serif' }));

// A runtime import, so these checks do not need the core package built for types.
const core = async () =>
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion -- widening the specifier keeps TypeScript from resolving the package's built types
  (await import('@awaketab/core' as string)) as {
    FACE_IDS: readonly string[];
    DEFAULT_SETTINGS: { face: string };
    migrateFace: (face: unknown) => string;
  };

const ring = (p: Partial<IFaceProps> = {}) => faceModel({ face: 'ring', ...p });
const html = (p: Partial<IFaceProps> = {}) => renderToStaticMarkup(createElement(Face, { face: 'ring', ...p }));
const THEMES: readonly TFaceTheme[] = ['light', 'dark', 'oled'];

beforeAll(async () => {
  await preloadFaces();
});

describe('face list', () => {
  it('is the 46 Glance faces, the same as the core ids, the board list and the lazy loaders', async () => {
    const c = await core();
    expect(FACE_IDS).toHaveLength(46);
    expect([...FACE_IDS]).toEqual([...c.FACE_IDS]);
    expect(FACES.map((f) => f.id)).toEqual([...FACE_IDS]);
    expect(FACES.map((f) => f.num)).toEqual(FACE_IDS.map((_, i) => String(i + 1).padStart(2, '0')));
    expect(Object.keys(FACE_LOADERS).sort()).toEqual(FACE_IDS.filter((id) => id !== 'ring').sort());
  });

  it('retires LED, Pulse and Terminal everywhere', () => {
    for (const id of ['led', 'pulse', 'terminal']) {
      expect(FACE_IDS as readonly string[]).not.toContain(id);
      expect(Object.keys(FACE_LOADERS)).not.toContain(id);
      for (const ids of Object.values(FACE_COLLECTIONS)) expect(ids as readonly string[]).not.toContain(id);
    }
  });

  it('moves stored retired ids to the same face as core storage, and starts on Ring', async () => {
    const c = await core();
    expect(RETIRED_FACES).toEqual({ led: 'lcd', terminal: 'lcd', pulse: 'waveform' });
    for (const [old, now] of Object.entries(RETIRED_FACES)) {
      expect(toFaceId(old)).toBe(now);
      expect(c.migrateFace(old)).toBe(now);
    }
    expect(toFaceId('sundial')).toBe('ring');
    expect(toFaceId(undefined)).toBe('ring');
    expect(c.DEFAULT_SETTINGS.face).toBe('ring');
    expect(html({ face: 'led' as TFaceId })).toContain('data-face="lcd"');
  });

  it('gives every face its own drawing, not Ring', async () => {
    const ringDraw = (await import('./faces/ring')).default;
    const drawings = await Promise.all(Object.values(FACE_LOADERS).map((load) => load()));
    for (const d of drawings) expect(d.default).not.toBe(ringDraw);
  });
});

describe('collections', () => {
  it('has the Featured 18 in the board order', () => {
    expect(FACE_COLLECTIONS.featured).toEqual([
      'ring',
      'aurora',
      'liquid',
      'halo',
      'eclipse',
      'skeleton',
      'neon',
      'dive',
      'flip',
      'bold',
      'glass',
      'chrono',
      'pilot',
      'orbit',
      'nixie',
      'poster',
      'moon',
      'constellation',
    ]);
    expect(FACES.filter((f) => f.featured).map((f) => f.id)).toEqual(
      FACE_IDS.filter((id) => FACE_COLLECTIONS.featured.includes(id)),
    );
  });

  it('splits all 46 into Digital, Analog and Ambient, each matching the face kind', () => {
    const { digital, analog, ambient, all } = FACE_COLLECTIONS;
    expect([digital.length, analog.length, ambient.length]).toEqual([15, 14, 17]);
    expect([...digital, ...analog, ...ambient].sort()).toEqual([...FACE_IDS].sort());
    expect(all).toEqual([...FACE_IDS]);
    for (const f of FACES) expect(FACE_COLLECTIONS[f.kind]).toContain(f.id);
  });
});

describe('faceModel', () => {
  it('draws the board session by default: 42:18 left, until 11:30 AM', () => {
    const m = ring();
    expect(m.digits).toBe('42:18');
    expect(m.endLine).toBe('until 11:30 AM');
    expect(m.topWord).toBe('left');
    expect(m.capText).toBe('Screen awake');
  });

  it('shows the full length at rest and nothing left once time is up', () => {
    expect(ring({ state: 'idle' }).digits).toBe('1:00:00');
    expect(ring({ state: 'idle' }).endLine).toBe('60 min · ends 11:47 AM');
    const up = ring({ state: 'up' });
    expect(up.digits).toBe('00:00');
    expect(up.endLine).toBe('Ended 10:47 AM');
    expect(up.topWord).toBe("time's up");
  });

  it('writes hours, a 24-hour clock and a no-end session', () => {
    expect(ring({ remain: 5400, total: 7200 }).digits).toBe('1:30:00');
    expect(ring({ fmt: 24 }).endShort).toBe('11:30');
    expect(ring({ state: 'idle', indef: true }).digits).toBe('∞');
    expect(ring({ indef: true }).topWord).toBe('awake for');
  });

  it('takes localised labels', () => {
    const m = ring({ lblTop: 'übrig', lblEnd: 'bis 11:30' });
    expect(m.topWord).toBe('übrig');
    expect(m.endLine).toBe('bis 11:30');
  });

  it('keeps the aria label to whole minutes, so it changes at most once a minute', () => {
    expect(ring().aria).toBe('Screen awake, 43 min remaining, until 11:30 AM');
    expect(ring({ remain: 2521 }).aria).toContain('43 min remaining');
    expect(ring({ remain: 2520 }).aria).toContain('42 min remaining');
    expect(ring({ remain: 3900, total: 7200 }).aria).toContain('1 h 5 min remaining');
    expect(ring({ state: 'up' }).aria).toBe("Time's up, Ended 10:47 AM");
  });

  it('scales labels to 12 px on screen from 240 px, goes compact below 200 px and thumbnail at 64 px', () => {
    expect(ring({ size: 250 }).LMIN).toBeCloseTo(17.28, 2);
    expect(ring({ size: 240 }).LMIN).toBe(18);
    expect(ring({ size: 360 }).LMIN).toBe(0);
    expect(ring({ size: 200 }).LMIN).toBe(0);
    expect(ring({ size: 199 }).compact).toBe(true);
    expect(ring({ size: 200 }).compact).toBe(false);
    expect(ring({ size: 64 }).thumb).toBe(true);
    expect(ring({ size: 96 }).thumb).toBe(false);
  });

  it('sizes the box to the 360 × 315 artboard when bare, square with the caption or the case', () => {
    expect([ART_W, ART_H]).toEqual([360, 315]);
    expect(ring({ size: 300, bare: true }).boxH).toBe(263);
    expect(ring({ size: 44, bare: true }).boxH).toBe(39);
    expect(ring({ size: 300 }).boxH).toBe(300);
    expect(ring({ size: 300, bare: true, framed: true }).boxH).toBe(300);
  });

  it('uses one heat colour for time left and the layer colours only while awake or starting', () => {
    const m = ring();
    expect(m.heat(0.6)).toBe('var(--fl)');
    expect(m.heat(0.4)).toBe('#B8F25A');
    expect(m.heat(0.2)).toBe('#FFB547');
    expect(m.heat(0.05)).toBe('#FF6A3D');
    expect(m.mc2).toBe('#7CBBFF');
    expect(m.mc3).toBe('#C1B1FE');
    const day = ring({ theme: 'light' });
    expect(day.heat(0.4)).toBe('#4F9A1F');
    expect(day.heatT(0.05)).toBe('#C2410C');
    const paused = ring({ state: 'paused' });
    expect(paused.heat(0.05)).toBe('var(--fa)');
    expect(paused.mc2).toBe('var(--fa)');
    expect(ring({ state: 'starting' }).multi).toBe(true);
  });

  it('lets the state colours override the accent, per theme', () => {
    expect(ring().accentValue).toBe('#3DF58E');
    expect(ring({ theme: 'light' }).accentValue).toBe('#117A3B');
    expect(ring({ state: 'paused' }).accentValue).toBe('#FFC53D');
    expect(ring({ state: 'paused', theme: 'light' }).accentValue).toBe('#8A5A00');
    expect(ring({ state: 'blocked' }).accentValue).toBe('#FF6B81');
    expect(ring({ state: 'unsupported' }).accentValue).toBe('#7CBBFF');
    expect(ring({ state: 'up' }).accentValue).toBe('#C9D1E0');
    expect(ring({ state: 'idle', theme: 'light' }).accentValue).toBe('#4B5165');
    expect(ring({ lamp: '#FF6B2C' }).accentValue).toBe('#FF6B2C');
    expect(ring({ lamp: '#FF6B2C', state: 'paused' }).accentValue).toBe('#FFC53D');
    expect(ring({ lamp: 'red' }).lampValue).toBe('#3DF58E');
  });

  it('draws in the graphite palette at night', () => {
    expect(ring().t).toMatchObject({ line: '#2A2D38', track: '#1C1F29', panel: '#0F1117' });
    expect(ring({ theme: 'oled' }).t).toMatchObject({ panel: '#000000', ground: '#000000' });
    expect(ring({ theme: 'light' }).t).toMatchObject({ ink: '#0B1020', card: '#FFFFFF' });
  });

  it('runs motion only while awake with motion on, but keeps the awake colours when still', () => {
    const off = ring({ motion: 'off' });
    expect(off.live).toBe(false);
    expect(off.still).toBe(true);
    expect(off.multi).toBe(true);
    expect(faceModel({ face: 'ring' }, { reduced: true }).live).toBe(false);
    expect(ring({ state: 'paused' }).live).toBe(false);
    expect(ring({ state: 'idle' }).live).toBe(false);
    expect(ring({ state: 'fallback' }).live).toBe(true);
  });
});

describe('face words', () => {
  it('writes the Words sentence', () => {
    expect(sentence(ring({ face: 'words' }))).toEqual(['Forty-two minutes', 'left,', 'until half past eleven.']);
    expect(sentence(ring({ face: 'words', state: 'idle' }))[0]).toBe('One hour,');
  });

  it('lights the Word grid words', () => {
    expect(gridWords(ring({ face: 'wordgrid' }))).toEqual(['ABOUT', 'FORTY', 'MINUTES', 'LEFT']);
    expect(gridWords(ring({ face: 'wordgrid', remain: 30 }))).toEqual(['UNDER', 'ONE', 'MINUTE', 'LEFT']);
    expect(gridWords(ring({ face: 'wordgrid', state: 'idle' }))).toEqual(['ONE', 'HOUR', 'LEFT']);
    expect(gridWords(ring({ face: 'wordgrid', state: 'up' }))).toEqual([]);
  });

  it('spells the Clock of clocks digits with blank clocks where no segment runs', () => {
    expect(digitHands(1)[0]).toEqual([225, 225]);
    expect(digitHands(8)[2]).toEqual([0, 180, 90]);
    expect(digitHands(0)[0]).toEqual([90, 180]);
  });

  it('drops the Clock of clocks leading zero, so one hour reads 1:00', () => {
    const blank = digitHands(0).map(() => [225, 225]);
    const oneHour = ring({ face: 'clocks', remain: 3600, total: 7200 });
    expect(oneHour.four).toEqual([0, 1, 0, 0]);
    const hands = clockHands(oneHour.four);
    expect(hands[0]).toEqual(blank);
    expect(hands[1]).toEqual(digitHands(1));
    expect(hands[2]).toEqual(digitHands(0));
    expect(clockHands([4, 2, 1, 8])[0]).toEqual(digitHands(4));
  });

  it('cuts the Bauhaus pie from 12 o’clock', () => {
    expect(bauhausPie(0)).toBe('');
    expect(bauhausPie(360)).toBe('M112 44 A88 88 0 1 1 111.9 44 Z');
    expect(bauhausPie(90)).toBe('M112 132 L112 44 A88 88 0 0 1 200.0 132.0 Z');
  });

  it('draws a full moon at the start and none at the end', () => {
    expect(moonPath(1)).toContain('A56 56 0 1 1');
    expect(moonPath(0)).toBe('');
  });
});

describe('<Face>', () => {
  it('is a timer named in whole minutes, with its drawing hidden from assistive tech', () => {
    const out = html();
    expect(out).toContain('role="timer"');
    expect(out).toContain('aria-label="Screen awake, 43 min remaining, until 11:30 AM"');
    expect(out).toContain('aria-hidden="true"');
    expect(out).toContain('af-live');
  });

  it('carries its theme, stills motion and goes compact, then thumbnail', () => {
    expect(html({ theme: 'light' })).toMatch(/class="af light/u);
    expect(html({ motion: 'off' })).toContain('af-still');
    expect(html({ motion: 'off' })).not.toContain('af-live');
    expect(html({ state: 'paused' })).not.toContain('af-live');
    expect(html({ size: 120 })).toContain('af-compact');
    expect(html({ size: 250 })).not.toContain('af-compact');
    expect(html({ size: 44 })).toContain('af-thumb');
    expect(html({ size: 120 })).not.toContain('af-thumb');
  });

  it('draws Inter digits with tabular figures on one scaled artboard', () => {
    const out = html({ size: 300, bare: true });
    expect(out).toContain('width:300px;height:263px');
    expect(out).toContain('transform:scale(0.8333333333333334)');
  });

  it('sits on the graphite dial at night and on a pure black dial with a 1 px outline in OLED', () => {
    const dark = html();
    expect(dark).toContain('#1B1E28 0%, #0E1016 60%, #08090D 100%');
    expect(dark).toContain('0 0 0 1px #262A35');
    expect(dark).toContain('radial-gradient(70% 42% at 50% 104%');
    const oled = html({ theme: 'oled' });
    expect(oled).toContain('background:#000000;box-shadow:0 0 0 1px #1A2236');
    expect(oled).not.toContain('#1B1E28');
  });

  it('sits in the watch-glass case when framed, except faces with their own card', () => {
    const framed = (face: TFaceId) => html({ face, framed: true }).includes('border-radius:72px');
    expect(framed('ring')).toBe(true);
    expect(html({ face: 'ring' })).not.toContain('border-radius:72px');
    expect(framed('tide')).toBe(false);
    expect(html({ face: 'ring', framed: true, bare: true })).toContain('height:348px');
  });

  it('shows the status caption unless bare', () => {
    expect(html()).toContain('Screen awake</span>');
    expect(html({ bare: true })).not.toContain('Screen awake</span>');
  });

  it('gives every face a true light version instead of a dark slab', () => {
    const night: Partial<Record<TFaceId, string>> = {
      flip: '#252935',
      nixie: '#0A0D12',
      board: '#0B0F18',
      neon: '#0C080E',
      liquid: '#18213D',
      hud: '#0D1222',
      constellation: '#02030A',
      eclipse: '#0B0D1C',
      moon: '#161C30',
      aurora: '#05060F',
    };
    for (const [face, ground] of Object.entries(night) as [TFaceId, string][]) {
      expect(html({ face, theme: 'dark' }), face).toContain(ground);
      expect(html({ face, theme: 'light' }), face).not.toContain(ground);
    }
    expect(html({ face: 'eink', theme: 'dark' })).toContain('invert(.93)');
    expect(html({ face: 'eink', theme: 'light' })).not.toContain('invert(');
    // LCD and Diver keep their dark bezel, like the real objects.
    expect(html({ face: 'lcd', theme: 'light' })).toContain('#2A3550');
    expect(html({ face: 'dive', theme: 'light' })).toContain('#1C1F29');
  });

  it('raises the Diver readout into a pill above the hands', () => {
    const out = html({ face: 'dive' });
    const pill = out.indexOf('42:18 LEFT');
    expect(pill).toBeGreaterThan(out.lastIndexOf('afx-s'));
    expect(out.slice(out.lastIndexOf('<span', pill), pill)).toContain('z-index:3');
  });
});

// Artboard px of a style value, or null when it is not a plain px length.
const px = (v: string): number | null => (/^-?\d+(\.\d+)?px$/u.test(v.trim()) ? parseFloat(v) : null);

// Text boxes whose place on the artboard follows from px offsets alone and that fall outside it. Boxes laid out by
// flex, percentages or right/bottom offsets are left to the visual review.
function strayText(markup: string, maxY: number): string[] {
  const host = document.createElement('div');
  host.innerHTML = markup;
  const art = host.querySelector('.af-a');
  const bad: string[] = [];
  const walk = (el: Element, x: number, y: number) => {
    for (const child of Array.from(el.children)) {
      if (!(child instanceof HTMLElement) || child.style.position !== 'absolute') continue;
      const left = px(child.style.left);
      const top = px(child.style.top);
      if (left === null || top === null) continue;
      const ax = x + left;
      const ay = y + top;
      const w = px(child.style.width);
      const h = px(child.style.height);
      const text = child.textContent.trim();
      if (text) {
        const out =
          ax < -0.5 || ay < -0.5 || (w !== null && ax + w > ART_W + 0.5) || (h !== null && ay + h > maxY + 0.5);
        if (out) bad.push(`"${text.slice(0, 24)}" at ${ax},${ay} ${w ?? '?'}×${h ?? '?'}`);
      }
      walk(child, ax, ay);
    }
  };
  if (art) walk(art, 0, 0);
  return bad;
}

describe('every face at every size', () => {
  const SIZES = [44, 64, 96, 160, 300, 360, 640];
  // Rolling's drums and Tape's ruler scroll past masked edges on purpose.
  const MASKED: readonly TFaceId[] = ['rolling', 'tape'];

  it('keeps its text inside the 360 × 315 artboard in light, dark and OLED', () => {
    const bad: string[] = [];
    for (const face of FACE_IDS) {
      if (MASKED.includes(face)) continue;
      for (const theme of THEMES)
        for (const size of SIZES) {
          const out = html({ face, theme, size, bare: true, motion: 'off' });
          expect(out, `${face} ${theme} ${String(size)}`).toContain(`data-face="${face}"`);
          for (const b of strayText(out, ART_H)) bad.push(`${face} ${theme} ${String(size)}: ${b}`);
        }
    }
    expect(bad).toEqual([]);
  });

  it('keeps the caption inside the square box', () => {
    for (const theme of THEMES) expect(strayText(html({ theme, size: 300 }), ART_W)).toEqual([]);
  });

  it('scales with one transform and never grows past its box', () => {
    for (const size of SIZES) {
      const out = html({ face: 'flip', size, bare: true });
      expect(out).toContain(`width:${String(size)}px;height:${String(Math.round((size * ART_H) / ART_W))}px`);
      expect(out).toContain(`transform:scale(${String(size / ART_W)})`);
      expect(out.match(/transform:scale\(/gu)).toHaveLength(1);
    }
  });
});

describe('<FaceGrid>', () => {
  it('is a radio group of all 46 tiles with the selected face checked', () => {
    const out = renderToStaticMarkup(
      createElement(FaceGrid, { selected: 'flip', onSelect: () => undefined, theme: 'dark' }),
    );
    expect(out).toContain('role="radiogroup"');
    expect(out.match(/role="radio"/gu)).toHaveLength(46);
    expect(out).toMatch(/aria-checked="true"[^>]*data-face="flip"|data-face="flip"[^>]*aria-checked="true"/u);
    expect(out).toContain('Departure board');
    expect(out).toContain('2px solid #3DF58E');
  });
});
