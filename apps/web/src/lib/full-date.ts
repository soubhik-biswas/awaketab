// Full dates everywhere ("Saturday, 26 September 2026"); other locales use their own full style.
export function fullDate(date: Date, lang = 'en'): string {
  if (lang !== 'en')
    return new Intl.DateTimeFormat(lang, { dateStyle: 'full', timeZone: 'UTC', numberingSystem: 'latn' }).format(date);
  const part = Object.fromEntries(
    new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
      .formatToParts(date)
      .map((p) => [p.type, p.value]),
  );
  return `${part.weekday ?? ''}, ${part.day ?? ''} ${part.month ?? ''} ${part.year ?? ''}`;
}

// The build date the footer prints ("2026.10.30 · abc1234"), as a date, or null in a dev build.
export function buildDate(version: string): Date | null {
  const m = /^(\d{4})\.(\d{2})\.(\d{2})/u.exec(version);
  return m ? new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]))) : null;
}
