export type TToolLang = 'en' | 'de' | 'ja' | 'zh' | 'hi';

export const TOOL_LANGS: readonly TToolLang[] = ['en', 'de', 'ja', 'zh', 'hi'];

export const isToolLang = (v: string): v is TToolLang => (TOOL_LANGS as readonly string[]).includes(v);

// The serif accent word is for Latin scripts only; Japanese, Chinese and Hindi keep just the gradient.
export const isLatin = (lang: TToolLang): boolean => lang === 'en' || lang === 'de';
