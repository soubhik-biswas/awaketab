// Moves public/ brand files to the Volt palette and Archivo wordmark (brand-wordmark.json: 112 % width, 800 + 500,
// −2 % tracking, 1000-unit em), then renders the PNG icons and favicon.ico. Run: node apps/site/scripts/brand-kit.mjs
import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PUB = path.join(ROOT, 'public');
const WORD = JSON.parse(await readFile(path.join(ROOT, 'scripts/brand-wordmark.json'), 'utf8'));

// Solar Green → Volt: lamp, act, the light grounds and lines, and the scene fills that moved with them.
const PALETTE = {
  '#3BE47F': '#3DF58E',
  '#FF6B2C': '#9F7BFF',
  '#B93D0B': '#6633F5',
  '#F6F4EF': '#F5F5FA',
  '#EFECE5': '#ECECF4',
  '#E6E2D9': '#E3E3EE',
  '#DCD7CC': '#D9D9E5',
  '#58DE8D': '#5CF59E',
  '#3A1A0C': '#241A4D',
  '#FDECE3': '#EFEAFF',
  '#FFC9B5': '#D9CCFF',
};
// Ended turns from violet to neutral pearl, but only where the lamp means "ended"; the scenes keep their violet.
const ENDED = { '#C1B1FE': '#C9D1E0', '#6D4AD0': '#4B5165' };
const ENDED_FILES = /(?:mark-ended-(?:dark|light)|tab-done)\.svg$/u;
const RGBA = [
  [/rgba\(59,\s*228,\s*127,/gu, 'rgba(61,245,142,'],
  [/rgba\(255,\s*107,\s*44,/gu, 'rgba(159,123,255,'],
];

const WORD_GROUP = /(<g transform="translate\(([\d.]+) ([\d.]+)\) scale\(([\d.]+)\)" fill="[^"]+">)<path d="M18 855 274 145[^"]*"\/><path d="[^"]*"\/><\/g>/u;

function recolour(svg, file) {
  let out = svg;
  const map = { ...PALETTE, ...(ENDED_FILES.test(file) ? ENDED : {}) };
  for (const [from, to] of Object.entries(map)) out = out.replace(new RegExp(from, 'giu'), to);
  for (const [re, to] of RGBA) out = out.replace(re, to);
  return out;
}

const n = (v) => String(+v.toFixed(2));

// Swaps the Geist wordmark for the Archivo one; lockups grow to the new width and the stacked mark re-centres.
function rewordmark(svg, file) {
  const m = WORD_GROUP.exec(svg);
  if (!m) return svg;
  const [whole, open, , , s] = m;
  let out = svg.replace(whole, `${open}<path d="${WORD.awake}"/><path d="${WORD.tab}"/></g>`);
  const width = WORD.width * Number(s);
  const base = path.basename(file);
  if (base.startsWith('lockup-horizontal')) {
    const total = Number(m[2]) + width;
    out = out.replace(/^<svg([^>]*) width="[\d.]+"([^>]*) viewBox="0 0 [\d.]+ /u, `<svg$1 width="${n(total)}"$2 viewBox="0 0 ${n(total)} `);
  } else if (base.startsWith('lockup-stacked')) {
    const total = Math.max(80, width);
    out = out
      .replace(/^<svg([^>]*) width="[\d.]+"([^>]*) viewBox="0 0 [\d.]+ /u, `<svg$1 width="${n(total)}"$2 viewBox="0 0 ${n(total)} `)
      .replace(/<g transform="translate\([\d.]+ 0\) scale\(1\.25\)">/u, `<g transform="translate(${n((total - 80) / 2)} 0) scale(1.25)">`);
  }
  return out;
}

async function svgFiles(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await svgFiles(p)));
    else if (entry.name.endsWith('.svg')) out.push(p);
  }
  return out;
}

const files = [path.join(PUB, 'favicon.svg'), ...(await svgFiles(path.join(PUB, 'icons'))), ...(await svgFiles(path.join(PUB, 'brand')))];
for (const file of files) {
  const before = await readFile(file, 'utf8');
  const after = rewordmark(recolour(before, file), file);
  if (after !== before) await writeFile(file, after);
}

const png = (svg, size) => sharp(Buffer.from(svg), { density: 384 }).resize(size, size).png({ compressionLevel: 9 }).toBuffer();
const appIcon = await readFile(path.join(PUB, 'brand/icons/app-icon.svg'), 'utf8');
const maskable = await readFile(path.join(PUB, 'brand/icons/app-icon-maskable.svg'), 'utf8');
// Apple rounds the corners itself, so its icon is the same art full bleed.
const fullBleed = appIcon.replace('rx="58"/>', 'rx="0"/>').replace(/<rect x="0\.5"[^>]*\/>/u, '');

await writeFile(path.join(PUB, 'icons/icon-192.png'), await png(appIcon, 192));
await writeFile(path.join(PUB, 'icons/icon-512.png'), await png(appIcon, 512));
await writeFile(path.join(PUB, 'icons/icon-512-maskable.png'), await png(maskable, 512));
await writeFile(path.join(PUB, 'icons/apple-touch-icon.png'), await png(fullBleed, 180));

// favicon.ico: the 16 px optical cut and the full mark at 32 and 48, as PNG entries.
const small = await readFile(path.join(PUB, 'brand/logo/mark-16-light.svg'), 'utf8');
const full = await readFile(path.join(PUB, 'brand/logo/mark-light.svg'), 'utf8');
const images = [
  [16, await png(small, 16)],
  [32, await png(full, 32)],
  [48, await png(full, 48)],
];
const header = Buffer.alloc(6 + 16 * images.length);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(images.length, 4);
let offset = header.length;
images.forEach(([size, data], i) => {
  const at = 6 + 16 * i;
  header.writeUInt8(size, at);
  header.writeUInt8(size, at + 1);
  header.writeUInt16LE(1, at + 4);
  header.writeUInt16LE(32, at + 6);
  header.writeUInt32LE(data.length, at + 8);
  header.writeUInt32LE(offset, at + 12);
  offset += data.length;
});
await writeFile(path.join(PUB, 'favicon.ico'), Buffer.concat([header, ...images.map(([, d]) => d)]));
console.log(`brand kit: ${String(files.length)} SVG files checked, 4 PNG icons and favicon.ico written`);
