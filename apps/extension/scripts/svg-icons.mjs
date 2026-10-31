// Build-time inlining (MV3 loads no remote code): `<svg data-icon="settings" …></svg>` becomes the Lucide icon
// (lucide-static 0.460) and `<svg data-logo="chrome" …></svg>` the full-colour SVG Logos mark.
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';

const require = createRequire(import.meta.url);
const LUCIDE = path.join(path.dirname(require.resolve('lucide-static/package.json')), 'icons');
const PLACEHOLDER = /<svg data-(icon|logo)="([a-z0-9-]+)"([^>]*)><\/svg>/gu;
// The icon scale: 16 and 18 px draw at stroke 2, 20 px at 1.75, 24 px at 1.5; 14 px status glyphs at 2.25.
const STROKE = { 12: '2.25', 14: '2.25', 16: '2', 18: '2', 20: '1.75', 24: '1.5' };

let logos;

function attrsOf(name, attrs) {
  const width = /\swidth="(\d+)"/u.exec(attrs)?.[1];
  const height = /\sheight="(\d+)"/u.exec(attrs)?.[1];
  if (!width || !height) throw new Error(`icon ${name}: set width and height`);
  const cls = /\sclass="([^"]*)"/u.exec(attrs)?.[1];
  const rest = attrs.replace(/\s(?:width|height|class)="[^"]*"/gu, '');
  return { width: Number(width), height: Number(height), cls, rest };
}

function lucideSvg(name, attrs) {
  let svg;
  try {
    svg = readFileSync(path.join(LUCIDE, `${name}.svg`), 'utf8');
  } catch {
    throw new Error(`icon ${name}: not a Lucide icon`);
  }
  const body = /<svg[^>]*>([\s\S]*)<\/svg>/u.exec(svg)?.[1]?.replace(/\s*\n\s*/gu, '');
  if (!body) throw new Error(`icon ${name}: not a Lucide icon`);
  const { width, height, cls, rest } = attrsOf(name, attrs);
  const stroke = STROKE[width] ?? '2';
  const classes = cls ? `at-icon ${cls}` : 'at-icon';
  return `<svg class="${classes}" width="${String(width)}" height="${String(height)}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round"${rest} aria-hidden="true" focusable="false">${body}</svg>`;
}

function logoSvg(name, attrs) {
  logos ??= JSON.parse(readFileSync(require.resolve('@iconify-json/logos/icons.json'), 'utf8'));
  const icon = logos.icons[name];
  if (!icon) throw new Error(`logo ${name}: not in @iconify-json/logos`);
  const w = icon.width ?? logos.width ?? 256;
  const h = icon.height ?? logos.height ?? 256;
  const { height, cls, rest } = attrsOf(name, attrs);
  // Keep the mark's own aspect ratio: the height is the size, the width follows.
  const width = Math.round((height * w) / h);
  const classes = cls ? `at-logo-mark ${cls}` : 'at-logo-mark';
  return `<svg class="${classes}" width="${String(width)}" height="${String(height)}" viewBox="${String(icon.left ?? 0)} ${String(icon.top ?? 0)} ${String(w)} ${String(h)}"${rest} aria-hidden="true" focusable="false">${icon.body}</svg>`;
}

export function inlineIcons(html) {
  return html.replace(PLACEHOLDER, (_match, kind, name, attrs) =>
    kind === 'icon' ? lucideSvg(name, attrs) : logoSvg(name, attrs),
  );
}

export function awaketabIcons() {
  return {
    name: 'awaketab-icons',
    transformIndexHtml: { order: 'pre', handler: inlineIcons },
  };
}
