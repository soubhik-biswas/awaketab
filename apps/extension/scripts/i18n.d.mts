export interface IAwaketabVitePlugin {
  name: string;
  resolveId(id: string): string | null;
  load(this: { addWatchFile(file: string): void }, id: string): string | null;
}

export interface ILocaleFile {
  relativeDest: string;
  contents: string;
}

export const EXT_I18N: string;
export const LOCALES: readonly string[];
export const CHROME_LOCALES: Readonly<Record<string, string>>;
export const BG_PREFIX: string;
export const MANIFEST_MESSAGES: Readonly<Record<string, string>>;
export function readCatalog(locale: string): Record<string, string>;
export function pageCatalog(locale: string): Record<string, string>;
export function bgCatalogs(): Record<string, Record<string, string>>;
export function localeMessages(): ILocaleFile[];
export function awaketabExtension(): IAwaketabVitePlugin;
