import { formatFullDate, formatTime } from '@/lib/format';
import type { TToolLang } from '@/lib/tool/strings';

export type TClockFmt = 12 | 24;

const LOCALE: Record<TToolLang, string> = { en: 'en', de: 'de-DE', ja: 'ja-JP', zh: 'zh-CN', hi: 'hi-IN' };

const pad = (n: number) => String(n).padStart(2, '0');

// The tool's clock as each drawn locale writes it: English 11:42 AM, German 11:42 Uhr, 午前11:42, 上午11:42, 11:42 पूर्वाह्न.
export function clockTime(ms: number, lang: TToolLang = 'en', fmt: TClockFmt = 12): string {
  const d = new Date(ms);
  const h = d.getHours();
  const m = d.getMinutes();
  if (lang === 'en') return formatTime(d, 'en', fmt);
  if (lang === 'de' || fmt === 24) return `${pad(h)}:${pad(m)}${lang === 'de' ? ' Uhr' : ''}`;
  const h12 = h % 12 || 12;
  if (lang === 'ja') return `${h < 12 ? '午前' : '午後'}${h12}:${pad(m)}`;
  if (lang === 'zh') return `${h < 12 ? '上午' : '下午'}${h12}:${pad(m)}`;
  return `${h12}:${pad(m)} ${h < 12 ? 'पूर्वाह्न' : 'अपराह्न'}`;
}

function fullDate(ms: number, lang: TToolLang = 'en'): string {
  const d = new Date(ms);
  if (lang === 'en') return formatFullDate(d, 'en');
  if (lang === 'de') {
    const p = new Intl.DateTimeFormat('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    return p.format(d);
  }
  if (lang === 'hi') {
    const wd = new Intl.DateTimeFormat('hi-IN', { weekday: 'long' }).format(d);
    const month = new Intl.DateTimeFormat('hi-IN', { month: 'long' }).format(d);
    return `${wd}, ${d.getDate()} ${month} ${d.getFullYear()}`;
  }
  const wd = new Intl.DateTimeFormat(LOCALE[lang], { weekday: lang === 'ja' ? 'short' : 'long' }).format(d);
  const ymd = `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
  return lang === 'ja' ? `${ymd}（${wd}）` : `${ymd} ${wd}`;
}

// "Thursday, 29 October 2026 · 11:03 AM" in each locale's own order.
export function dateLine(ms: number, lang: TToolLang = 'en', fmt: TClockFmt = 12): string {
  const time = clockTime(ms, lang, fmt);
  return lang === 'ja' ? `${fullDate(ms, lang)}${time}` : `${fullDate(ms, lang)} · ${time}`;
}

const DAY_MS = 86_400_000;

function dayStart(ms: number): number {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function dayDiff(from: number, to: number): number {
  return Math.round((dayStart(to) - dayStart(from)) / DAY_MS);
}

// History group heading: "Today · Thursday, 29 October 2026", "Yesterday · …", or the full date.
export function dayHeading(ms: number, now: number): string {
  const diff = dayDiff(ms, now);
  const date = fullDate(ms);
  if (diff === 0) return `Today · ${date}`;
  if (diff === 1) return `Yesterday · ${date}`;
  return date;
}

// An end time, with "tomorrow" when it falls after midnight.
export function endTime(endsAt: number, now: number, lang: TToolLang = 'en', fmt: TClockFmt = 12): string {
  const t = clockTime(endsAt, lang, fmt);
  return lang === 'en' && dayDiff(now, endsAt) === 1 ? `${t} tomorrow` : t;
}

// "45 min", "1 h 30 min", "2 h" for history badges.
export function lengthBadge(sec: number): string {
  const min = Math.max(1, Math.round(sec / 60));
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

// "1 hour", "45 min", "2 hours" for idle notes and preset rows.
export function lengthWords(sec: number): string {
  if (sec === 3600) return '1 hour';
  if (sec > 0 && sec % 3600 === 0) return `${sec / 3600} hours`;
  return `${Math.round(sec / 60)} min`;
}

export function secondsOfDay(ms: number): number {
  const d = new Date(ms);
  return d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds();
}
