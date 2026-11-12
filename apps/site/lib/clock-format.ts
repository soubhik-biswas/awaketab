export type TClockDial = 12 | 24;

// German, Spanish, French and Portuguese read a 24-hour clock until the person picks the 12-hour one.
const DIAL_24: readonly string[] = ['de', 'es', 'fr', 'pt-br'];

export function localeDial(lang: string): TClockDial {
  return DIAL_24.includes(lang) ? 24 : 12;
}

// A stored choice wins; with none (null) the clock follows the language.
export function clockDial(lang: string, clock24h: boolean | null): TClockDial {
  if (clock24h === null) return localeDial(lang);
  return clock24h ? 24 : 12;
}

// Hindi names four parts of the day: सुबह from 4:00, दोपहर from 12:00, शाम from 16:00, रात from 20:00.
export function hindiDayPeriod(hour: number): string {
  if (hour >= 4 && hour < 12) return 'सुबह';
  if (hour >= 12 && hour < 16) return 'दोपहर';
  if (hour >= 16 && hour < 20) return 'शाम';
  return 'रात';
}

const pad = (n: number) => String(n).padStart(2, '0');

// The clock as each language writes it: 11:42 AM · 11:42 · 午前11:42 · 上午11:42 · सुबह 11:42.
export function clockText(hour: number, minute: number, lang: string, dial: TClockDial): string {
  const m = pad(minute);
  if (dial === 24) return lang === 'en' ? `${pad(hour)}:${m}` : `${String(hour)}:${m}`;
  const h12 = String(hour % 12 || 12);
  if (lang === 'ja') return `${hour < 12 ? '午前' : '午後'}${h12}:${m}`;
  if (lang === 'zh') return `${hour < 12 ? '上午' : '下午'}${h12}:${m}`;
  if (lang === 'hi') return `${hindiDayPeriod(hour)} ${h12}:${m}`;
  return `${h12}:${m} ${hour < 12 ? 'AM' : 'PM'}`;
}
