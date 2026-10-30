import { FACE_IDS } from '@awaketab/core';
import { describe, expect, it, vi } from 'vitest';
import { vals } from '../../src/tool/face/base.js';
import { FACES, faceSvg } from '../../src/tool/face/all.js';
import { type FaceProps, loadFace, mountFace } from '../../src/tool/face/index.js';
import { renderFaceGrid } from '../../src/tool/face/sheet.js';
import { stepFace } from '../../src/tool/face/stage.js';

const base: FaceProps = {
  face: 'ring',
  theme: 'dark',
  state: 'running',
  remain: 2538,
  total: 3600,
  nowSec: 38_862,
  size: 360,
};

const flush = async () => {
  for (let i = 0; i < 8; i += 1) await new Promise((r) => setTimeout(r, 0));
};

const root = (html: string) => {
  const d = document.createElement('div');
  d.innerHTML = html;
  return d.firstElementChild as HTMLElement;
};

describe('Face catalogue', () => {
  it('lists the 33 faces of the faces board in sheet order, each with a name and a description', () => {
    expect(FACES.map((f) => f.id)).toEqual([...FACE_IDS]);
    expect(new Set(FACES.map((f) => f.name)).size).toBe(33);
    for (const f of FACES) expect(f.blurb.length).toBeGreaterThan(20);
    expect(FACES.find((f) => f.id === 'board')?.name).toBe('Departure board');
  });

  it('steps through the faces with wrap-around (C and Shift+C)', () => {
    expect(stepFace('ring', 1)).toBe('bold');
    expect(stepFace('ring', -1)).toBe('moon');
    expect(stepFace('moon', 1)).toBe('ring');
  });
});

describe('Face values', () => {
  it('formats the time left, the end time and the words around it', () => {
    const v = vals(base, base.nowSec);
    expect(v.digits).toBe('42:18');
    expect(v.endShort).toBe('11:30 AM');
    expect(v.endLine).toBe('until 11:30 AM');
    expect(v.topWord).toBe('left');
    expect(vals({ ...base, remain: 5400, total: 7200 }, 0).digits).toBe('1:30:00');
    expect(vals({ ...base, fmt: 24 }, 0).endShort).toBe('11:30');
  });

  it('shows the full length at rest, zero when time is up, and ∞ for a no-end session at rest', () => {
    const idle = vals({ ...base, state: 'idle' }, 0);
    expect(idle.digits).toBe('60:00');
    expect(idle.endLine).toBe('60 min · ends 11:47 AM');
    expect(idle.topWord).toBe('ready');
    expect(vals({ ...base, state: 'up' }, 0).digits).toBe('00:00');
    expect(vals({ ...base, state: 'idle', indef: true }, 0).digits).toBe('∞');
    expect(vals({ ...base, indef: true }, 0).topWord).toBe('awake for');
  });

  it('takes localised labels and escapes them', () => {
    const v = vals({ ...base, lblTop: 'übrig', lblEnd: 'bis <11:30>' }, 0);
    expect(v.topWord).toBe('übrig');
    expect(v.endLine).toBe('bis &lt;11:30&gt;');
  });

  it('uses the lamp only while awake and the status colour otherwise', () => {
    expect(vals(base, 0).accentVal).toBe('var(--fl)');
    expect(vals({ ...base, state: 'paused' }, 0).accentVal).toBe('var(--at-warn)');
    expect(vals({ ...base, state: 'blocked' }, 0).accentVal).toBe('var(--at-bad)');
    expect(vals({ ...base, state: 'unsupported' }, 0).accentVal).toBe('var(--at-info)');
    expect(vals({ ...base, state: 'up' }, 0).accentVal).toBe('var(--at-ended)');
    expect(vals({ ...base, state: 'idle' }, 0).accentVal).toBe('var(--at-ink-2)');
    expect(vals({ ...base, lamp: '#FFC53D' }, 0).lampVal).toBe('#FFC53D');
    expect(vals({ ...base, lamp: 'red; x: y' }, 0).lampVal).toBe('var(--at-accent)');
  });

  it('heats from green through lime and amber to ember, and only while awake', () => {
    const v = vals(base, 0);
    expect(v.heat(0.8)).toBe('var(--fl)');
    expect(v.heat(0.4)).toBe('var(--at-face-fill-lime)');
    expect(v.heat(0.2)).toBe('var(--at-face-fill-amber)');
    expect(v.heat(0.05)).toBe('var(--at-face-fill-ember)');
    expect(v.mc2).toBe('var(--at-face-sky)');
    expect(v.mc3).toBe('var(--at-face-violet)');
    const paused = vals({ ...base, state: 'paused' }, 0);
    expect(paused.heat(0.05)).toBe('var(--fa)');
    expect(paused.mc2).toBe('var(--fa)');
  });

  it('keeps labels at 12 px on screen from 240 px and goes compact below 170 px', () => {
    expect(vals({ ...base, size: 240 }, 0).LMIN).toBe(18);
    expect(vals({ ...base, size: 440 }, 0).LMIN).toBe(0);
    expect(root(faceSvg({ ...base, size: 120 })).classList.contains('af-compact')).toBe(true);
    expect(root(faceSvg({ ...base, size: 200 })).classList.contains('af-compact')).toBe(false);
  });
});

describe('Face markup', () => {
  it('is a timer with a once-a-minute label and hides the drawing (and its seconds) from screen readers', () => {
    const el = root(faceSvg(base));
    expect(el.getAttribute('role')).toBe('timer');
    expect(el.getAttribute('aria-label')).toBe('Screen awake, 43 min remaining, until 11:30 AM');
    expect(el.querySelector('.af-a')?.getAttribute('aria-hidden')).toBe('true');
    expect(el.style.width).toBe('360px');
  });

  it('moves only while awake, and never with motion off', () => {
    for (const state of ['running', 'fallback'] as const)
      expect(root(faceSvg({ ...base, state })).classList.contains('af-live')).toBe(true);
    for (const state of ['idle', 'starting', 'paused', 'blocked', 'unsupported', 'up'] as const)
      expect(root(faceSvg({ ...base, state })).classList.contains('af-live')).toBe(false);
    const still = root(faceSvg({ ...base, motion: 'off' }));
    expect(still.classList.contains('af-live')).toBe(false);
    expect(still.classList.contains('af-still')).toBe(true);
  });

  it('draws every face in every state and theme from tokens only', () => {
    for (const face of FACE_IDS)
      for (const theme of ['light', 'dark', 'oled'] as const)
        for (const state of ['idle', 'running', 'paused', 'up'] as const) {
          const html = faceSvg({ ...base, face, theme, state, size: 250, bare: false });
          expect(html, face).not.toMatch(/NaN|undefined/u);
          // Masks may name #000 (they read alpha only); every colour comes from a CSS variable.
          expect(html.replaceAll('#000', '').replaceAll('url(#af-moon-lit)', ''), `${face} ${theme}`).not.toMatch(
            /#[0-9a-f]{3,8}\b|rgba?\(/iu,
          );
          expect(html, face).not.toMatch(/(?:fill|stroke|stop-color)="(?:var|color-mix)\(/u);
          expect(root(html).querySelector('.af-a')?.children.length, face).toBeGreaterThan(0);
        }
  });

  it('puts the caption under the face unless it is bare', () => {
    expect(faceSvg({ ...base, state: 'paused' })).toContain('Paused — tab hidden');
    expect(faceSvg({ ...base, state: 'paused', bare: true })).not.toContain('Paused — tab hidden');
  });

  it('draws ∞ alone on Bold for a no-end session at rest', () => {
    const html = faceSvg({ ...base, face: 'bold', state: 'idle', indef: true });
    expect(html).toContain('∞');
    expect(html).not.toContain('afx-blink');
  });

  it('pins every face drawing to its artboard size', () => {
    const el = root(faceSvg({ ...base, face: 'ring' }));
    expect(el.querySelector('svg')?.getAttribute('style')).toContain('width: 360px; height: 310px');
  });
});

describe('mountFace', () => {
  it('patches the same nodes each second so running motion carries on', () => {
    const host = document.createElement('div');
    const f = mountFace(host, base);
    const sweep = host.querySelector('.afx-s');
    f.update({ remain: 2537, nowSec: 38_863 });
    expect(host.querySelector('.afx-s')).toBe(sweep);
    expect(host.textContent).toContain('42:17');
    f.destroy();
    expect(host.childElementCount).toBe(0);
  });

  it('keeps the label steady within a minute', () => {
    const host = document.createElement('div');
    const f = mountFace(host, base);
    const label = () => host.firstElementChild?.getAttribute('aria-label');
    const first = label();
    f.update({ remain: 2530 });
    expect(label()).toBe(first);
    f.update({ remain: 2500 });
    expect(label()).not.toBe(first);
  });

  it('loads any other face lazily and holds an empty box of the right size meanwhile', async () => {
    const host = document.createElement('div');
    const f = mountFace(host, { ...base, face: 'nixie', size: 200 });
    expect((host.firstElementChild as HTMLElement).style.width).toBe('200px');
    await loadFace('nixie');
    await flush();
    expect(host.querySelector('.afx-flick')).not.toBeNull();
    f.destroy();
  });
});

describe('renderFaceGrid', () => {
  it('is a radio group of every face with the selected one checked, and picks by click and arrow key', async () => {
    const box = document.createElement('div');
    document.body.append(box);
    const onPick = vi.fn();
    const grid = renderFaceGrid(box, { selected: 'flip', theme: 'dark', onPick });
    const group = box.querySelector('[role="radiogroup"]');
    const cells = [...box.querySelectorAll<HTMLButtonElement>('[role="radio"]')];
    expect(group?.getAttribute('aria-label')).toBe('Clock face');
    expect(cells).toHaveLength(33);
    expect(cells.filter((c) => c.getAttribute('aria-checked') === 'true').map((c) => c.dataset.face)).toEqual(['flip']);
    expect(cells.filter((c) => c.tabIndex === 0)).toHaveLength(1);
    expect(box.querySelector('.af-cell[data-face="board"] .af-name')?.textContent).toBe('Departure board');
    cells[2]?.click();
    expect(onPick).toHaveBeenLastCalledWith('horizon');
    cells[2]?.focus();
    cells[2]?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    expect(onPick).toHaveBeenLastCalledWith('rolling');
    expect(document.activeElement).toBe(cells[5]);
    grid.select('moon');
    expect(cells[32]?.getAttribute('aria-checked')).toBe('true');
    await flush();
    expect(cells[0]?.querySelector('.af-thumb .af-compact')).not.toBeNull();
    box.remove();
  });
});
