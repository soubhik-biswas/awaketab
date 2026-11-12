// @vitest-environment node
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { bgCatalogs, LOCALES, localeMessages, pageCatalog, readCatalog } from '../../scripts/i18n.mjs';
import config from '../../wxt.config';

const EXT = path.resolve('apps/extension');

async function sources(dir: string): Promise<string[]> {
  const out: string[] = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await sources(full)));
    else if (/\.(ts|tsx|html)$/u.test(entry.name) && !entry.name.endsWith('.d.ts')) out.push(full);
  }
  return out;
}

describe('manifest (the store listing permissions)', () => {
  const manifest = config.manifest as Record<string, unknown>;

  it('asks for exactly power, alarms, storage, offscreen and activeTab, and sites one at a time', () => {
    expect(manifest.permissions).toEqual(['power', 'alarms', 'storage', 'offscreen', 'activeTab']);
    expect(manifest.optional_host_permissions).toEqual(['https://*/*']);
    expect(manifest).not.toHaveProperty('optional_permissions');
    expect(manifest).not.toHaveProperty('host_permissions');
    expect(manifest).not.toHaveProperty('content_scripts');
    expect(manifest).not.toHaveProperty('externally_connectable');
    expect(manifest).not.toHaveProperty('content_security_policy');
    expect(manifest.manifest_version ?? config.manifestVersion).toBe(3);
  });

  it('uses the dark-tile toolbar icons from the marketing kit', async () => {
    const icons = { 16: 'icons/extension-16.png', 32: 'icons/extension-32.png' };
    expect((manifest.action as { default_icon: unknown }).default_icon).toEqual(icons);
    expect(manifest.icons).toEqual({ ...icons, 48: 'icons/extension-48.png', 128: 'icons/extension-128.png' });
    for (const size of [16, 32, 48, 128]) {
      const png = await readFile(path.join(EXT, `public/icons/extension-${String(size)}.png`));
      expect(png.subarray(1, 4).toString()).toBe('PNG');
      expect(png.readUInt32BE(16)).toBe(size);
    }
  });

  it('binds Alt+Shift+A to toggle and localises name, description and command', () => {
    expect(manifest.commands).toEqual({
      toggle: { suggested_key: { default: 'Alt+Shift+A' }, description: '__MSG_ext_command_toggle__' },
    });
    expect(manifest.name).toBe('__MSG_ext_name__');
    expect(manifest.default_locale).toBe('en');
  });

  it('takes the minimum Chrome version from support-matrix.json', async () => {
    const matrix = JSON.parse(await readFile(path.resolve('apps/extension/data/support-matrix.json'), 'utf8')) as {
      extension: { minimumChromeVersion: string };
    };
    expect(manifest.minimum_chrome_version).toBe(matrix.extension.minimumChromeVersion);
  });
});

describe('i18n', () => {
  it('every key the extension uses exists in all eight catalogs', async () => {
    const used = new Set<string>();
    for (const file of [...(await sources(path.join(EXT, 'entrypoints'))), ...(await sources(path.join(EXT, 'src')))]) {
      const text = await readFile(file, 'utf8');
      for (const m of text.matchAll(/\bt\(\s*'(ext\.[\w.-]+)'/gu)) used.add(m[1] ?? '');
      for (const m of text.matchAll(/key: '(ext\.[\w.-]+)'/gu)) used.add(m[1] ?? '');
    }
    expect(used.size).toBeGreaterThan(20);
    for (const locale of LOCALES) {
      const page = pageCatalog(locale);
      const missing = [...used].filter((key) => !(key in page));
      expect(missing, locale).toEqual([]);
    }
  });

  it('only ext.* keys, the same keys and placeholders in every locale, and nothing empty', () => {
    const en = readCatalog('en');
    const placeholders = (v: string) => [...v.matchAll(/\{(\w+)/gu)].map((m) => m[1]).sort();
    for (const key of Object.keys(en)) expect(key.startsWith('ext.'), key).toBe(true);
    for (const locale of LOCALES) {
      const cat = readCatalog(locale);
      expect(Object.keys(cat).sort(), locale).toEqual(Object.keys(en).sort());
      for (const [key, value] of Object.entries(en)) {
        expect(placeholders(cat[key] ?? ''), `${locale}:${key}`).toEqual(placeholders(value));
        expect((cat[key] ?? '').trim(), `${locale}:${key}`).not.toBe('');
      }
      expect(Object.keys(bgCatalogs()[locale] ?? {}).every((k) => k.startsWith('ext.pill.'))).toBe(true);
    }
  });

  it('ships no English copy in its sources: no user-facing string literal of the catalog', async () => {
    const english = Object.values(readCatalog('en')).filter((v) => v.length > 12);
    for (const file of [...(await sources(path.join(EXT, 'entrypoints'))), ...(await sources(path.join(EXT, 'src')))]) {
      const text = await readFile(file, 'utf8');
      for (const copy of english) {
        const literal = [`'${copy}'`, `"${copy}"`, `\`${copy}\``, `>${copy}<`].some((form) => text.includes(form));
        expect(literal, `${path.relative(EXT, file)} duplicates "${copy}"`).toBe(false);
      }
    }
  });

  it('writes _locales messages within Chrome limits, with the store name in every locale', () => {
    const files = localeMessages();
    expect(files.map((f) => f.relativeDest)).toEqual([
      '_locales/en/messages.json',
      '_locales/es/messages.json',
      '_locales/pt_BR/messages.json',
      '_locales/de/messages.json',
      '_locales/fr/messages.json',
      '_locales/ja/messages.json',
      '_locales/zh_CN/messages.json',
      '_locales/hi/messages.json',
    ]);
    for (const file of files) {
      const messages = JSON.parse(file.contents) as Record<string, { message: string }>;
      expect(messages.ext_name?.message).toBe('AwakeTab — Keep your screen awake');
      expect(messages.ext_description?.message.length).toBeLessThanOrEqual(132);
      expect(messages.ext_command_toggle?.message).toBeTruthy();
    }
    const en = JSON.parse(files[0]?.contents ?? '{}') as Record<string, { message: string }>;
    expect(en.ext_description?.message).toBe(
      'Keep your screen on with one click. A calm clock shows the time left. 46 faces, all free — no account, no tracking.',
    );
  });
});

describe('Glance tokens and fonts', () => {
  it('carries the Glance colours in dark, light and OLED with no Tailwind layer', async () => {
    const css = await readFile(path.join(EXT, 'src/styles/tokens.css'), 'utf8');
    expect(css.startsWith(':root,\n[data-theme="dark"]')).toBe(true);
    for (const token of ['--at-volt: #3df58e;', '--at-violet: #9f7bff;', '--at-text-2: #a6afc2;', '--at-red: #ff6b81;'])
      expect(css).toContain(token);
    expect(css).toContain('[data-theme="light"]');
    expect(css).toContain('--at-violet: #6633f5;');
    expect(css).toContain('[data-theme="oled"]');
    expect(css).not.toMatch(/@import|@theme|@apply|@layer/u);
  });

  it('self-hosts every font and requests none from the network', async () => {
    const files = await readdir(path.join(EXT, 'public/fonts'));
    expect(files.sort()).toEqual([
      'OFL-Archivo.txt',
      'OFL-Geist.txt',
      'archivo-latin-wdth-wght-normal.woff2',
      'geist-mono-latin-wght-normal.woff2',
    ]);
    const ui = await readFile(path.join(EXT, 'src/ui.tsx'), 'utf8');
    expect(ui).toContain("import '@fontsource-variable/inter/opsz.css';");
    expect(ui).toContain("import '@fontsource-variable/bricolage-grotesque/opsz.css';");
    for (const file of await sources(path.join(EXT, 'entrypoints'))) {
      expect(await readFile(file, 'utf8'), file).not.toMatch(/fonts\.(googleapis|gstatic)\.com/u);
    }
    const base = await readFile(path.join(EXT, 'src/styles/base.css'), 'utf8');
    expect(base).not.toMatch(/https?:\/\//u);
  });
});
