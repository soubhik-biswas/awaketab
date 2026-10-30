export type TClockFormat = 12 | 24;

export interface IEndsLineOptions {
  locale?: string;
  fmt?: TClockFormat;
  left?: string;
  until?: string;
  tomorrow?: string;
}

const SPACES = /[  ]/g;
const DAY_MS = 86_400_000;

function toDate(value: Date | number): Date {
  return value instanceof Date ? value : new Date(value);
}

function isEnglish(locale: string): boolean {
  return locale.toLowerCase().split('-')[0] === 'en';
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

export function formatTime(value: Date | number, locale = 'en', fmt?: TClockFormat): string {
  const english = isEnglish(locale);
  const cycle = fmt ?? (english ? 12 : undefined);
  const options: Intl.DateTimeFormatOptions = { timeStyle: 'short' };
  if (cycle) options.hourCycle = cycle === 12 ? 'h12' : 'h23';
  // English always reads "11:42 AM"; en-GB would print "11:42 am".
  const tag = english ? 'en-US' : locale;
  return new Intl.DateTimeFormat(tag, options).format(toDate(value)).replace(SPACES, ' ');
}

export function formatDuration(seconds: number): string {
  const total = Math.max(0, Math.ceil(seconds));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

export function formatDurationWords(seconds: number): string {
  const total = Math.max(0, Math.ceil(seconds / 60));
  const h = Math.floor(total / 60);
  const m = total % 60;
  const hours = h === 1 ? '1 hour' : `${h} hours`;
  const minutes = m === 1 ? '1 minute' : `${m} minutes`;
  if (h === 0) return minutes;
  return m === 0 ? hours : `${hours} ${minutes}`;
}

export function formatFullDate(value: Date | number, locale = 'en'): string {
  const date = toDate(value);
  if (!isEnglish(locale)) {
    return new Intl.DateTimeFormat(locale, { dateStyle: 'full' }).format(date).replace(SPACES, ' ');
  }
  const parts = new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? '';
  return `${part('weekday')}, ${part('day')} ${part('month')} ${part('year')}`;
}

export function formatFullDateTime(value: Date | number, locale = 'en', fmt?: TClockFormat): string {
  return `${formatFullDate(value, locale)} · ${formatTime(value, locale, fmt)}`;
}

export function daysBetween(from: Date | number, to: Date | number): number {
  const a = toDate(from);
  const b = toDate(to);
  const start = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const end = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((end - start) / DAY_MS);
}

export function formatUntil(end: Date | number, now: Date | number, options: IEndsLineOptions = {}): string {
  const { locale = 'en', fmt, tomorrow = 'tomorrow' } = options;
  const days = daysBetween(now, end);
  const time = formatTime(end, locale, fmt);
  if (days <= 0) return time;
  if (days === 1) return `${time} ${tomorrow}`;
  return formatFullDateTime(end, locale, fmt);
}

export function endsLine(remain: number, now: Date | number, options: IEndsLineOptions = {}): string {
  const { left = 'left', until = 'until' } = options;
  const end = toDate(now).getTime() + Math.max(0, remain) * 1000;
  return `${formatDuration(remain)} ${left} · ${until} ${formatUntil(end, now, options)}`;
}

export function secondsSinceMidnight(value: Date | number): number {
  const date = toDate(value);
  return date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds();
}
