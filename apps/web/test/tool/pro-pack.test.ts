import { afterEach, describe, expect, it, vi } from 'vitest';
import { applyStudio, glowScale, readStudio, STUDIO_EVENT } from '../../src/tool/studio.js';
import { deviceKind, exportMyData, IDENTITIES } from '../../src/tool/packs/pro/account.js';
import { icon } from '../../src/tool/packs/pro/ui.js';

afterEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute('style');
  delete document.documentElement.dataset.studioLamp;
  vi.restoreAllMocks();
});

describe('Face studio storage', () => {
  it('reads defaults and refuses anything that is not a hex colour or a 5 % step', () => {
    expect(readStudio(null)).toEqual({ v: 1, lamp: '', glow: 70 });
    expect(readStudio('{"lamp":"red","glow":"x"}')).toEqual({ v: 1, lamp: '', glow: 70 });
    expect(readStudio('{"lamp":"#3BE47F","glow":143}')).toEqual({ v: 1, lamp: '#3BE47F', glow: 100 });
    expect(readStudio('{"lamp":"#3BE47F","glow":33}').glow).toBe(35);
  });

  it('70 % room glow is the designed strength', () => {
    expect(glowScale(70)).toBe(1);
    expect(glowScale(0)).toBe(0);
  });

  it('only Pro changes the face and the glow; the stage hears about it', () => {
    const seen: string[] = [];
    document.addEventListener(STUDIO_EVENT, (e) => seen.push((e as CustomEvent<{ lamp: string }>).detail.lamp));
    applyStudio({ v: 1, lamp: '#FF7DB8', glow: 35 }, false);
    expect(document.documentElement.dataset.studioLamp).toBeUndefined();
    expect(document.documentElement.style.getPropertyValue('--at-room-glow')).toBe('1.00');
    applyStudio({ v: 1, lamp: '#FF7DB8', glow: 35 }, true);
    expect(document.documentElement.dataset.studioLamp).toBe('#FF7DB8');
    expect(document.documentElement.style.getPropertyValue('--at-room-glow')).toBe('0.50');
    expect(seen).toEqual(['', '#FF7DB8']);
  });
});

describe('devices', () => {
  it('never uses a status colour as an identity', () => {
    for (const id of IDENTITIES) expect(['green', 'amber', 'red', 'lime', 'ember']).not.toContain(id);
  });

  it('guesses the device kind from the readable label', () => {
    expect(deviceKind('Safari · iPadOS')).toBe('tablet');
    expect(deviceKind('Chrome · Android')).toBe('phone');
    expect(deviceKind('Firefox · Windows')).toBe('laptop');
  });
});

describe('export my data', () => {
  it('keeps the licence token out of the file', async () => {
    localStorage.setItem('at.v1.settings', '{"theme":"dark"}');
    localStorage.setItem('at.v1.license', '{"token":"secret"}');
    localStorage.setItem('other', '1');
    let body = '';
    vi.stubGlobal('URL', {
      ...URL,
      createObjectURL: (blob: Blob) => {
        void blob.text().then((text) => {
          body = text;
        });
        return 'blob:x';
      },
      revokeObjectURL: () => undefined,
    });
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
    exportMyData();
    await new Promise((resolve) => setTimeout(resolve, 0));
    vi.unstubAllGlobals();
    const data = JSON.parse(body) as Record<string, unknown>;
    expect(data['at.v1.settings']).toEqual({ theme: 'dark' });
    expect(data).not.toHaveProperty('at.v1.license');
    expect(data).not.toHaveProperty('other');
  });
});

describe('icons', () => {
  it('sizes a Lucide SVG and hides it from screen readers', () => {
    const out = icon('<!-- x --><svg class="lucide" width="24" height="24" stroke-width="2"><path/></svg>', 16, 2);
    expect(out).toBe('<svg aria-hidden="true" focusable="false" width="16" height="16" stroke-width="2"><path/></svg>');
  });
});
