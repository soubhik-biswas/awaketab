// Picks the `ext.*` strings each page ships and writes the `_locales/<lang>/messages.json` files Chrome needs.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const EXT_I18N = path.resolve(HERE, '../locales');

export const LOCALES = ['en', 'es', 'pt-br', 'de', 'fr', 'ja', 'zh', 'hi'];

export const CHROME_LOCALES = {
  en: 'en',
  es: 'es',
  'pt-br': 'pt_BR',
  de: 'de',
  fr: 'fr',
  ja: 'ja',
  zh: 'zh_CN',
  hi: 'hi',
};

// The worker only writes the toolbar title, which reads the popup's status words.
export const BG_PREFIX = 'ext.pill.';

export const MANIFEST_MESSAGES = {
  ext_name: 'ext.name',
  ext_description: 'ext.description',
  ext_command_toggle: 'ext.command.toggle',
};

export function readCatalog(locale) {
  return JSON.parse(readFileSync(path.join(EXT_I18N, `${locale}.json`), 'utf8'));
}

export function pageCatalog(locale) {
  return readCatalog(locale);
}

export function bgCatalogs() {
  return Object.fromEntries(
    LOCALES.map((locale) => [
      locale,
      Object.fromEntries(Object.entries(readCatalog(locale)).filter(([key]) => key.startsWith(BG_PREFIX))),
    ]),
  );
}

export function localeMessages() {
  const english = readCatalog('en');
  return LOCALES.map((locale) => {
    const catalog = readCatalog(locale);
    const messages = {};
    for (const [name, key] of Object.entries(MANIFEST_MESSAGES)) {
      const message = catalog[key] ?? english[key];
      if (typeof message !== 'string') throw new Error(`Missing i18n key ${key} for ${locale}`);
      // Chrome treats `$` as a placeholder marker; our copy never uses one, and must not start to.
      if (message.includes('$')) throw new Error(`"$" in ${locale}:${key} would be read as a placeholder`);
      messages[name] = { message };
    }
    return {
      relativeDest: `_locales/${CHROME_LOCALES[locale]}/messages.json`,
      contents: `${JSON.stringify(messages, null, 2)}\n`,
    };
  });
}

export function awaketabExtension() {
  const CATALOG = 'virtual:at-catalog/';
  const BG = 'virtual:at-catalogs-bg';
  return {
    name: 'awaketab-extension',
    resolveId(id) {
      if (id.startsWith(CATALOG) || id === BG) return `\0${id}`;
      return null;
    },
    load(id) {
      if (id.startsWith(`\0${CATALOG}`)) {
        const locale = id.slice(CATALOG.length + 1);
        if (!LOCALES.includes(locale)) throw new Error(`Unknown locale ${locale}`);
        this.addWatchFile(path.join(EXT_I18N, `${locale}.json`));
        return `export default ${JSON.stringify(pageCatalog(locale))};`;
      }
      if (id === `\0${BG}`) {
        for (const locale of LOCALES) this.addWatchFile(path.join(EXT_I18N, `${locale}.json`));
        return `export default ${JSON.stringify(bgCatalogs())};`;
      }
      return null;
    },
  };
}
