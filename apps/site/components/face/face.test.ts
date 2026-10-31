import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { Face } from './face';
import { FaceGrid } from './face-grid';
import { FACE_IDS, faceModel, type IFaceProps } from './model';
import { FACE_LOADERS, FACES } from './registry';
import { bauhausPie } from './faces/bauhaus';
import { digitHands } from './faces/clocks';
import { gridWords } from './faces/wordgrid';
import { moonPath } from './faces/moon';
import { sentence } from './faces/words';

vi.mock('./fonts', () => ({ SERIF: 'serif', DOT: 'monospace' }));

const ring = (p: Partial<IFaceProps> = {}) => faceModel({ face: 'ring', ...p });

describe('face list', () => {
  it('matches the core ids, the board list and the lazy loaders', async () => {
    // A runtime import, so this check does not need the core package built for types.
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion -- widening the specifier keeps TypeScript from resolving the package's built types
    const core = (await import('@awaketab/core' as string)) as { FACE_IDS: readonly string[] };
    expect([...FACE_IDS]).toEqual([...core.FACE_IDS]);
    expect(FACES.map((f) => f.id)).toEqual([...FACE_IDS]);
    expect(Object.keys(FACE_LOADERS).sort()).toEqual(FACE_IDS.filter((id) => id !== 'ring').sort());
    expect(FACE_IDS).toHaveLength(49);
  });

  it('gives every face its own drawing, not Ring', async () => {
    const ring = (await import('./faces/ring')).default;
    const drawings = await Promise.all(Object.values(FACE_LOADERS).map((load) => load()));
    for (const d of drawings) expect(d.default).not.toBe(ring);
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

  it('scales labels to 12 px on screen from 240 px and goes compact below 200 px', () => {
    expect(ring({ size: 250 }).LMIN).toBeCloseTo(17.28, 2);
    expect(ring({ size: 240 }).LMIN).toBe(18);
    expect(ring({ size: 360 }).LMIN).toBe(0);
    expect(ring({ size: 200 }).LMIN).toBe(0);
  });

  it('uses the heat scale and the layer colours only while awake or starting', () => {
    const m = ring();
    expect(m.heat(0.6)).toBe('var(--fl)');
    expect(m.heat(0.4)).toBe('var(--face-fill-lime)');
    expect(m.heat(0.2)).toBe('var(--face-fill-amber)');
    expect(m.heat(0.05)).toBe('var(--face-fill-ember)');
    expect(m.heatT(0.05)).toBe('var(--face-ember)');
    expect(m.mc2).toBe('var(--face-sky)');
    expect(m.mc3).toBe('var(--face-violet)');
    const paused = ring({ state: 'paused' });
    expect(paused.heat(0.05)).toBe('var(--fa)');
    expect(paused.mc2).toBe('var(--fa)');
    expect(paused.accentValue).toBe('var(--warning)');
    expect(ring({ state: 'starting' }).multi).toBe(true);
  });

  it('picks the status colour per state and honours a Face studio accent', () => {
    expect(ring({ state: 'blocked' }).accentValue).toBe('var(--destructive)');
    expect(ring({ state: 'unsupported' }).accentValue).toBe('var(--info)');
    expect(ring({ state: 'up' }).accentValue).toBe('var(--ended)');
    expect(ring({ state: 'idle' }).accentValue).toBe('var(--muted-foreground-strong)');
    expect(ring({ lamp: '#FF6B2C' }).lampValue).toBe('#FF6B2C');
    expect(ring({ lamp: 'red' }).lampValue).toBe('var(--lamp)');
  });

  it('stops motion when motion is off or reduced, but keeps the awake colours', () => {
    const off = ring({ motion: 'off' });
    expect(off.live).toBe(false);
    expect(off.still).toBe(true);
    expect(off.multi).toBe(true);
    expect(faceModel({ face: 'ring' }, { reduced: true }).live).toBe(false);
    expect(ring({ state: 'paused' }).live).toBe(false);
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
  const html = (p: Partial<IFaceProps> = {}) => renderToStaticMarkup(createElement(Face, { face: 'ring', ...p }));

  it('is a timer named in whole minutes, with its drawing hidden from assistive tech', () => {
    const out = html();
    expect(out).toContain('role="timer"');
    expect(out).toContain('aria-label="Screen awake, 43 min remaining, until 11:30 AM"');
    expect(out).toContain('aria-hidden="true"');
    expect(out).toContain('af-live');
  });

  it('carries its theme, stills motion and goes compact', () => {
    expect(html({ theme: 'light' })).toMatch(/class="af light/u);
    expect(html({ motion: 'off' })).toContain('af-still');
    expect(html({ motion: 'off' })).not.toContain('af-live');
    expect(html({ state: 'paused' })).not.toContain('af-live');
    expect(html({ size: 120 })).toContain('af-compact');
    expect(html({ size: 250 })).not.toContain('af-compact');
  });

  it('sits in the watch-glass case when framed, except faces with their own card', () => {
    const framed = (face: IFaceProps['face']) => html({ face, framed: true }).includes('border-radius:72px');
    expect(framed('ring')).toBe(true);
    expect(html({ face: 'ring' })).not.toContain('border-radius:72px');
    expect(framed('tide')).toBe(false);
    expect(html({ face: 'ring', framed: true, bare: true })).toContain('height:348px');
  });

  it('shows the status caption unless bare', () => {
    expect(html()).toContain('Screen awake</span>');
    expect(html({ bare: true })).not.toContain('Screen awake</span>');
  });
});

describe('<FaceGrid>', () => {
  it('is a radio group with the selected face checked', () => {
    const out = renderToStaticMarkup(
      createElement(FaceGrid, { selected: 'flip', onSelect: () => undefined, theme: 'dark' }),
    );
    expect(out).toContain('role="radiogroup"');
    expect(out.match(/role="radio"/gu)).toHaveLength(49);
    expect(out).toMatch(/aria-checked="true"[^>]*data-face="flip"|data-face="flip"[^>]*aria-checked="true"/u);
    expect(out).toContain('Departure board');
  });
});
