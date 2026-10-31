import rainSvg from 'lucide-static/icons/cloud-rain.svg?raw';
import cafeSvg from 'lucide-static/icons/coffee.svg?raw';
import fireSvg from 'lucide-static/icons/flame.svg?raw';
import brownSvg from 'lucide-static/icons/audio-waveform.svg?raw';
import playSvg from 'lucide-static/icons/play.svg?raw';
import type { IToolCtx } from '../../ctx.js';
import { t } from '../../i18n.js';
import { soundMixer } from '../sound/index.js';
import { icon, tr, upsell } from './ui.js';

const ROWS = [
  ['rain', rainSvg],
  ['cafe', cafeSvg],
  ['fire', fireSvg],
  ['brown', brownSvg],
] as const;
const CHIMES = [
  ['chime', 'two'],
  ['bell', 'bell'],
  ['none', 'off'],
] as const;
const PREVIEW_MS = 5000;

export function mountSound(ctx: IToolCtx, host: HTMLElement): () => void {
  const mixer = soundMixer(ctx);
  const rows = ROWS.map(
    ([g, svg]) =>
      `<div class="at-pv-mix" data-mix-row="${g}"><span class="at-pv-mix-tile">${icon(svg, 18, 1.75)}</span>` +
      `<label class="at-pv-mix-body"><span class="at-pv-mix-head"><span>${tr(`sound.${g}`)}</span><span class="at-pv-mix-val" data-mix-val></span></span>` +
      `<input class="at-pv-range" type="range" min="0" max="100" step="5" aria-label="${tr('sound.volume', { name: t(`pro.view.sound.${g}`) })}" data-mix="${g}"></label></div>`,
  ).join('');
  const chimes = CHIMES.map(
    ([id, key]) =>
      `<button type="button" class="at-pv-seg-btn" role="radio" aria-checked="false" data-chime="${id}">${tr(`sound.chime.${key}`)}</button>`,
  ).join('');

  host.innerHTML =
    `<div class="at-pv at-pv-sound">` +
    `<span class="at-pv-lead">${tr('sound.lead')}</span>` +
    `<div data-sound-upsell></div>` +
    `<div class="at-pv-mixer">${rows}</div>` +
    `<div class="at-pv-grp"><span class="at-pv-sec" id="pv-chime">${tr('sound.chime')}</span>` +
    `<div class="at-pv-seg" role="radiogroup" aria-labelledby="pv-chime">${chimes}</div></div>` +
    `<button type="button" class="at-button at-button-outline at-pv-wide" data-sound-preview>${icon(playSvg, 18)}<span>${tr('sound.preview')}</span></button>` +
    `<span class="at-pv-help">${tr('sound.help')}</span>` +
    `</div>`;

  const upsellBox = host.querySelector<HTMLElement>('[data-sound-upsell]');
  const paint = () => {
    const pro = mixer.pro();
    if (upsellBox) upsellBox.innerHTML = pro ? '' : upsell('sound');
    for (const row of host.querySelectorAll<HTMLElement>('[data-mix-row]')) {
      const g = row.dataset.mixRow as (typeof ROWS)[number][0];
      const v = Math.round(mixer.level(g) * 100);
      row.toggleAttribute('data-on', v > 0);
      const input = row.querySelector<HTMLInputElement>('input');
      if (input) {
        if (document.activeElement !== input) input.value = String(v);
        input.disabled = !pro;
      }
      const out = row.querySelector('[data-mix-val]');
      if (out) out.textContent = v === 0 ? t('pro.view.sound.off') : `${String(v)}%`;
    }
    const chime = mixer.chime();
    for (const b of host.querySelectorAll<HTMLElement>('[data-chime]')) {
      const on = b.dataset.chime === (chime === 'bell' || chime === 'none' ? chime : 'chime');
      b.setAttribute('aria-checked', String(on));
      b.tabIndex = on ? 0 : -1;
    }
  };

  host.addEventListener('input', (e) => {
    const n = e.target;
    if (!(n instanceof HTMLInputElement) || !n.dataset.mix) return;
    mixer.set(n.dataset.mix as (typeof ROWS)[number][0], Number(n.value) / 100);
  });
  host.addEventListener('click', (e) => {
    const el = e.target instanceof Element ? e.target.closest<HTMLElement>('[data-chime],[data-sound-preview]') : null;
    if (!el) return;
    if (el.dataset.chime) mixer.setChime(el.dataset.chime as 'chime' | 'bell' | 'none');
    else mixer.preview(PREVIEW_MS);
    paint();
  });
  host.querySelector('[role="radiogroup"]')?.addEventListener('keydown', (event) => {
    const e = event as KeyboardEvent;
    const step =
      e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const cur = CHIMES.findIndex(([id]) => host.querySelector(`[data-chime="${id}"][aria-checked="true"]`));
    const next = CHIMES[(cur + step + CHIMES.length) % CHIMES.length];
    if (!next) return;
    mixer.setChime(next[0]);
    paint();
    host.querySelector<HTMLElement>(`[data-chime="${next[0]}"]`)?.focus();
  });
  const stop = mixer.watch(paint);
  const unsub = ctx.store.subscribe(paint);
  paint();
  return () => {
    stop();
    unsub();
  };
}
