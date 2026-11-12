import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { deviceFor, FACE_FLOOR, setFit, setSteps, shellCss } from './fit';

const fit = (w: number, h: number, pad = 0) => setFit(w, h, deviceFor(w), pad);

// The space Set mode has under the top bar and above the stage's bottom inset.
const room = (w: number, h: number) => h - (w < 700 ? 64 : 76) - 24;

// What the parts kept at a size add up to, in the same numbers the stage draws them with.
function stack(w: number, h: number): number {
  const f = fit(w, h);
  const phone = w < 700;
  const gap = phone ? 14 : 20;
  const core = phone ? 131 : 141;
  const note = f.note ? (phone ? 14 : 18) + 20 : 0;
  const face = f.face ? Math.round(f.px * 0.875) + gap : 0;
  return f.above + face + core + note;
}

describe('Set mode on a full-height screen', () => {
  it.each([
    [1440, 900, 380],
    [1920, 1080, 380],
    [1200, 800, 340],
    [768, 1024, 480],
    [390, 844, 296],
  ])('%i×%i keeps the board size of %i', (w, h, px) => {
    expect(fit(w, h)).toMatchObject({ level: 0, px, eyebrow: true, headline: true, face: true, note: true });
  });

  it('keeps the status pill in the stage on narrow screens only', () => {
    expect(fit(390, 844).pill).toBe(true);
    expect(fit(768, 1024).pill).toBe(true);
    expect(fit(1200, 800).pill).toBe(false);
    expect(fit(1440, 900).pill).toBe(false);
  });
});

describe('Set mode on a short screen', () => {
  it.each([
    [1366, 625],
    [1280, 580],
    [1536, 730],
    [375, 553],
  ])('%i×%i shrinks the face and keeps every part', (w, h) => {
    const f = fit(w, h);
    expect(f).toMatchObject({ level: 0, eyebrow: true, headline: true, face: true, note: true, scroll: false });
    expect(f.px).toBeGreaterThanOrEqual(FACE_FLOOR);
    expect(stack(w, h)).toBeLessThanOrEqual(room(w, h));
  });

  it('a phone on its side keeps the face, the length control, the button and the note', () => {
    expect(fit(844, 390)).toMatchObject({ level: 3, px: 104, headline: false, pill: false, face: true, note: true });
    expect(fit(667, 375)).toMatchObject({ level: 3, px: 123, headline: false, pill: false, face: true, note: true });
  });

  it('at 400% zoom the length control, the button and the note fit without scrolling', () => {
    expect(fit(320, 256)).toMatchObject({ level: 4, face: false, note: true, scroll: false });
    expect(stack(320, 256)).toBeLessThanOrEqual(room(320, 256));
  });

  it('gives parts up in order: eyebrow, headline, status pill, face, note, then scrolls', () => {
    const seen = new Set<number>();
    for (let h = 900; h >= 150; h--) {
      const f = fit(390, h);
      seen.add(f.level);
      expect(f.eyebrow).toBe(f.level < 1);
      expect(f.headline).toBe(f.level < 2);
      expect(f.pill).toBe(f.level < 3);
      expect(f.face).toBe(f.level < 4);
      expect(f.note).toBe(f.level < 5);
      expect(f.scroll).toBe(f.level === 6);
    }
    expect([...seen]).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });

  it.each([320, 390, 667, 700, 844, 1024, 1100, 1280, 1300, 1366, 1920])(
    'never plans past the frame at %i px wide',
    (w) => {
      for (let h = 1200; h >= 120; h--) {
        const f = fit(w, h);
        if (!f.scroll) expect(stack(w, h)).toBeLessThanOrEqual(room(w, h));
        if (f.face) expect(f.px).toBeGreaterThanOrEqual(FACE_FLOOR);
      }
    },
  );

  it('a banner takes its height out of the room', () => {
    expect(fit(1366, 625, 72).px).toBeLessThan(fit(1366, 625).px);
    expect(fit(390, 600, 96).level).toBeGreaterThan(fit(390, 600).level);
  });
});

describe('the server shell', () => {
  const css = readFileSync(`${import.meta.dirname}/glance.css`, 'utf8').replace(/\s+/gu, '');

  it('is laid out by the same steps as the working tool', () => {
    for (const rule of shellCss().split('\n')) expect(css).toContain(rule.replace(/\s+/gu, ''));
  });

  it('changes step at the heights setFit does', () => {
    for (const w of [390, 844, 1200, 1440]) {
      const device = deviceFor(w);
      setSteps(device).forEach((h, i) => {
        expect(setFit(w, h, device).level).toBeLessThanOrEqual(i);
        expect(setFit(w, h - 1, device).level).toBeGreaterThan(i);
      });
    }
  });
});
