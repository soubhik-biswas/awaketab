import type { TToolLang } from '@/lib/tool/strings';

export type TClockFmt = 12 | 24;

const LOCALE: Record<TToolLang, string> = {
  en: 'en-GB',
  de: 'de-DE',
  ja: 'ja-JP',
  zh: 'zh-CN',
  hi: 'hi-IN',
  es: 'es-ES',
  fr: 'fr-FR',
  'pt-br': 'pt-BR',
};

// German, Spanish, French and Portuguese write the clock on a 24-hour dial even when 12-hour is chosen.
const DIAL_24: readonly TToolLang[] = ['de', 'es', 'fr', 'pt-br'];

const pad = (n: number) => String(n).padStart(2, '0');

// The clock as each language writes it: 11:42 AM · 11:42 · 午前11:42 · 上午11:42 · सुबह 11:42.
export function clockTime(ms: number, lang: TToolLang = 'en', fmt: TClockFmt = 12): string {
  const d = new Date(ms);
  const h = d.getHours();
  const m = pad(d.getMinutes());
  if (fmt === 24) return lang === 'en' ? `${pad(h)}:${m}` : `${h}:${m}`;
  const h12 = h % 12 || 12;
  if (DIAL_24.includes(lang)) return `${h}:${m}`;
  if (lang === 'ja') return `${h < 12 ? '午前' : '午後'}${h12}:${m}`;
  if (lang === 'zh') return `${h < 12 ? '上午' : '下午'}${h12}:${m}`;
  if (lang === 'hi') return `${h < 12 ? 'सुबह' : 'दोपहर'} ${h12}:${m}`;
  return `${h12}:${m} ${h < 12 ? 'AM' : 'PM'}`;
}

const part = (ms: number, lang: TToolLang, o: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat(LOCALE[lang], o).format(new Date(ms));

// "Saturday, 31 October" in each language's own order, as the eyebrow and the history headings show it.
export function dayDate(ms: number, lang: TToolLang = 'en'): string {
  const d = new Date(ms);
  const day = d.getDate();
  const month = d.getMonth() + 1;
  if (lang === 'ja') return `${month}月${day}日(${part(ms, lang, { weekday: 'short' })})`;
  if (lang === 'zh') return `${month}月${day}日 ${part(ms, lang, { weekday: 'long' })}`;
  if (lang === 'es' || lang === 'fr' || lang === 'pt-br') return part(ms, lang, { weekday: 'long', day: 'numeric', month: 'long' });
  const weekday = part(ms, lang, { weekday: 'long' });
  const name = part(ms, lang, { month: 'long' });
  return lang === 'de' ? `${weekday}, ${day}. ${name}` : `${weekday}, ${day} ${name}`;
}

// The one-letter day names under the weekly chart, Monday first.
export function weekLetters(lang: TToolLang): string[] {
  const monday = new Date(2026, 9, 26).getTime();
  return Array.from({ length: 7 }, (_, i) => part(monday + i * 86_400_000, lang, { weekday: 'narrow' }));
}

const DAY_MS = 86_400_000;

export function dayStart(ms: number): number {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function dayDiff(from: number, to: number): number {
  return Math.round((dayStart(to) - dayStart(from)) / DAY_MS);
}

// Monday 00:00 of the week that holds ms.
export function weekStart(ms: number): number {
  const d = new Date(dayStart(ms));
  const back = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - back);
  return d.getTime();
}

export function secondsOfDay(ms: number): number {
  const d = new Date(ms);
  return d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds();
}
