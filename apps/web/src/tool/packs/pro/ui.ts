import { t } from '../../i18n.js';

export const esc = (s: string): string =>
  s.replace(/&/gu, '&amp;').replace(/</gu, '&lt;').replace(/>/gu, '&gt;').replace(/"/gu, '&quot;');

const STROKE: Record<number, number> = { 14: 2.25, 16: 2, 18: 2, 20: 1.75, 22: 1.75, 24: 1.5 };

// Lucide SVGs arrive as raw strings; this sets the board's size and stroke and hides them from screen readers.
export function icon(raw: string, size = 18, stroke = STROKE[size] ?? 2): string {
  return raw
    .replace(/<!--[\s\S]*?-->/gu, '')
    .replace(/\swidth="[^"]*"/u, ` width="${String(size)}"`)
    .replace(/\sheight="[^"]*"/u, ` height="${String(size)}"`)
    .replace(/\sstroke-width="[^"]*"/u, ` stroke-width="${String(stroke)}"`)
    .replace(/\sclass="[^"]*"/u, '')
    .replace('<svg', '<svg aria-hidden="true" focusable="false"');
}

export const tr = (key: string, vars?: Record<string, string | number>): string => esc(t(`pro.view.${key}`, vars));

export function longDate(ms: number): string {
  const d = new Date(ms);
  return `${d.toLocaleDateString('en-GB', { weekday: 'long' })}, ${d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`;
}

export function time12(ms: number): string {
  return new Date(ms).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

export function upsell(feature: string): string {
  return (
    `<div class="at-pv-upsell" role="note">` +
    `<span class="at-pv-chip">Pro</span>` +
    `<span class="at-pv-upsell-text">${tr(`upsell.${feature}`)}</span>` +
    `<span class="at-pv-upsell-actions"><a class="at-button at-button-primary at-button-sm" href="/pro?ref=sheet-${feature}">${tr('upsell.get')}</a>` +
    `<a class="at-pv-link" href="/pro/activate">${tr('upsell.key')}</a></span></div>`
  );
}
