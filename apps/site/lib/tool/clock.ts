import { clockText, type TClockDial } from '@/lib/clock-format';
import type { TToolLang } from '@/lib/tool/strings';

export type TClockFmt = TClockDial;

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

// The clock in the tool's language, on the dial the person chose.
export function clockTime(ms: number, lang: TToolLang = 'en', fmt: TClockFmt = 12): string {
  const d = new Date(ms);
  return clockText(d.getHours(), d.getMinutes(), lang, fmt);
}

const part = (ms: number, lang: TToolLang, o: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat(LOCALE[lang], o).format(new Date(ms));

// "Saturday, 31 October" in each language's own order, as the eyebrow and the history headings show it; with the
// year ("Saturday, 31 October 2026") for a day in another year.
export function dayDate(ms: number, lang: TToolLang = 'en', year = false): string {
  const d = new Date(ms);
  const day = d.getDate();
  const month = d.getMonth() + 1;
  const y = d.getFullYear();
  if (lang === 'ja') return `${year ? `${y}年` : ''}${month}月${day}日(${part(ms, lang, { weekday: 'short' })})`;
  if (lang === 'zh') return `${year ? `${y}年` : ''}${month}月${day}日 ${part(ms, lang, { weekday: 'long' })}`;
  if (lang === 'es' || lang === 'fr' || lang === 'pt-br') {
    const o: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long' };
    if (year) o.year = 'numeric';
    return part(ms, lang, o);
  }
  const weekday = part(ms, lang, { weekday: 'long' });
  const name = part(ms, lang, { month: 'long' });
  const date = lang === 'de' ? `${weekday}, ${day}. ${name}` : `${weekday}, ${day} ${name}`;
  return year ? `${date} ${y}` : date;
}

const MONDAY = new Date(2026, 9, 26).getTime();

const weekNames = (lang: TToolLang, weekday: 'narrow' | 'long'): string[] =>
  Array.from({ length: 7 }, (_, i) => part(MONDAY + i * 86_400_000, lang, { weekday }));

// The one-letter day names under the weekly chart, Monday first.
export function weekLetters(lang: TToolLang): string[] {
  return weekNames(lang, 'narrow');
}

// The same days in full, for the chart's spoken summary.
export function weekDays(lang: TToolLang): string[] {
  return weekNames(lang, 'long');
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

// An end time as the tool writes it: the clock alone today, "12:30 AM tomorrow" past midnight, the full date after.
export function clockUntil(
  end: number,
  now: number,
  lang: TToolLang,
  fmt: TClockFmt,
  tomorrow: (time: string) => string,
): string {
  const time = clockTime(end, lang, fmt);
  const days = dayDiff(now, end);
  if (days <= 0) return time;
  if (days === 1) return tomorrow(time);
  return `${dayDate(end, lang, new Date(end).getFullYear() !== new Date(now).getFullYear())} · ${time}`;
}

// Dim at night runs from 10 PM to 6 AM, the hours the wall mode dims too.
export function isLate(nowSec: number): boolean {
  return nowSec >= 22 * 3600 || nowSec < 6 * 3600;
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
