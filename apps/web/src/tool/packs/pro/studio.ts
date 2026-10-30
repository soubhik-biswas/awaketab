import checkSvg from 'lucide-static/icons/check.svg?raw';
import { hasFeature, type IToolCtx } from '../../ctx.js';
import { t } from '../../i18n.js';
import { applyStudio, readStudio, saveStudio, type IStudio } from '../../studio.js';
import { icon, tr, upsell } from './ui.js';

interface IFaceHandle {
  update(p: Record<string, unknown>): void;
  destroy(): void;
}
interface IFaceModule {
  mountFace(el: HTMLElement, p: Record<string, unknown>): IFaceHandle;
}

// The shared Face component; looked up softly so this pack builds on its own and loads the face lazily.
const faceModules = import.meta.glob<IFaceModule>('../../face/index.ts');

export const SWATCHES: ReadonlyArray<readonly [string, string]> = [
  ['', 'auto'],
  ['#3BE47F', 'signal'],
  ['#B8F25A', 'lime'],
  ['#FFB547', 'amber'],
  ['#7CBBFF', 'sky'],
  ['#C1B1FE', 'violet'],
  ['#FF7DB8', 'rose'],
  ['#FF6B2C', 'ember'],
];

function theme(): 'light' | 'dark' | 'oled' {
  const v = document.documentElement.dataset.theme;
  return v === 'dark' || v === 'oled' ? v : 'light';
}

export function mountStudio(ctx: IToolCtx, host: HTMLElement): () => void {
  const pro = () => hasFeature(ctx, 'ambient.packs');
  const saved = readStudio();
  const draft: IStudio = { ...saved };
  const swatches = SWATCHES.map(([hex, id]) => {
    const name = tr(`studio.sw.${id}`);
    const style = hex ? ` style="--at-pv-swatch: ${hex}"` : '';
    return `<button type="button" class="at-pv-swatch${hex ? '' : ' at-pv-swatch-auto'}" role="radio" aria-checked="false" aria-label="${name}" title="${name}" data-hue="${hex}"${style}>${hex ? icon(checkSvg, 18, 3) : `<span>${tr('studio.auto')}</span>`}</button>`;
  }).join('');

  host.innerHTML =
    `<div class="at-pv at-pv-studio">` +
    (pro() ? '' : upsell('studio')) +
    `<div class="at-pv-preview" data-studio-face aria-hidden="true"></div>` +
    `<div class="at-pv-grp"><span class="at-pv-sec" id="pv-accent">${tr('studio.accent')}</span>` +
    `<div class="at-pv-swatches" role="radiogroup" aria-labelledby="pv-accent">${swatches}</div>` +
    `<span class="at-pv-help" data-studio-name aria-live="polite"></span></div>` +
    `<label class="at-pv-grp"><span class="at-pv-row-head"><span class="at-pv-sec">${tr('studio.glow')}</span><span class="at-pv-mono" data-studio-glow-out></span></span>` +
    `<input class="at-pv-range" type="range" min="0" max="100" step="5" aria-label="${tr('studio.glowLabel')}" data-studio-glow></label>` +
    `<button type="button" class="at-button at-button-primary at-pv-wide" data-studio-save>${icon(checkSvg, 18)}<span>${tr(pro() ? 'studio.save' : 'studio.saveLocked')}</span></button>` +
    `<span class="at-pv-help" data-studio-status role="status"></span>` +
    `<span class="at-pv-help">${tr('studio.help')}</span>` +
    `</div>`;

  const faceEl = host.querySelector<HTMLElement>('[data-studio-face]');
  const range = host.querySelector<HTMLInputElement>('[data-studio-glow]');
  const glowOut = host.querySelector<HTMLElement>('[data-studio-glow-out]');
  const nameOut = host.querySelector<HTMLElement>('[data-studio-name]');
  const status = host.querySelector<HTMLElement>('[data-studio-status]');
  let face: IFaceHandle | null = null;
  let gone = false;

  const props = () => {
    const now = new Date();
    return {
      face: ctx.store.get().settings.face,
      theme: theme(),
      state: 'running',
      remain: 2292,
      total: 3600,
      nowSec: now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds(),
      size: 240,
      bare: true,
      lamp: draft.lamp || undefined,
      motion: 'off',
    };
  };

  const load = Object.values(faceModules)[0];
  if (faceEl && load)
    void load().then((m) => {
      if (!gone) face = m.mountFace(faceEl, props());
    });

  const paint = () => {
    for (const b of host.querySelectorAll<HTMLElement>('[data-hue]')) {
      const on = (b.dataset.hue ?? '') === draft.lamp;
      b.setAttribute('aria-checked', String(on));
      b.tabIndex = on ? 0 : -1;
    }
    const hit = SWATCHES.find(([hex]) => hex === draft.lamp) ?? SWATCHES[0];
    if (nameOut) nameOut.textContent = `${hit ? plain(`studio.sw.${hit[1]}`) : ''}. ${plain('studio.statusNote')}`;
    if (range && document.activeElement !== range) range.value = String(draft.glow);
    if (glowOut) glowOut.textContent = `${String(draft.glow)}%`;
    face?.update({ lamp: draft.lamp || undefined, theme: theme() });
    // Pro sees the stage follow along; without Pro only the preview changes.
    if (pro()) applyStudio(draft, true);
  };

  const pick = (hex: string) => {
    draft.lamp = hex;
    if (status) status.textContent = '';
    paint();
  };

  host.querySelector('[role="radiogroup"]')?.addEventListener('click', (e) => {
    const b = e.target instanceof Element ? e.target.closest<HTMLElement>('[data-hue]') : null;
    if (b) pick(b.dataset.hue ?? '');
  });
  host.querySelector('[role="radiogroup"]')?.addEventListener('keydown', (event) => {
    const e = event as KeyboardEvent;
    const step =
      e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const i = SWATCHES.findIndex(([hex]) => hex === draft.lamp);
    const next = SWATCHES[(i + step + SWATCHES.length) % SWATCHES.length];
    if (!next) return;
    pick(next[0]);
    host.querySelector<HTMLElement>(`[data-hue="${next[0]}"]`)?.focus();
  });
  range?.addEventListener('input', () => {
    draft.glow = Number(range.value);
    paint();
  });
  host.querySelector('[data-studio-save]')?.addEventListener('click', () => {
    if (!pro()) {
      location.assign('/pro?ref=sheet-studio');
      return;
    }
    saveStudio(draft);
    Object.assign(saved, draft);
    if (status) status.textContent = plain('studio.saved');
  });
  const onTheme = new MutationObserver(paint);
  onTheme.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  paint();

  return () => {
    gone = true;
    onTheme.disconnect();
    face?.destroy();
    // Leaving without saving puts the stage back the way it was.
    applyStudio(saved, pro());
  };
}

const plain = (key: string): string => t(`pro.view.${key}`);
