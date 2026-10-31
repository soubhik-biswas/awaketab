const SW_LOCALES = ['es', 'pt-br', 'de', 'fr', 'ja', 'zh', 'hi'];

const PIP = new RegExp(`^/(?:(?:${SW_LOCALES.join('|')})/)?pip$`, 'u');
// The tool's own addresses: a cached home runs them, reading the preset or end time from the URL.
const TOOL = new RegExp(`^/(?:(?:${SW_LOCALES.join('|')})/?)?(?:(?:15m|30m|45m|1h|2h|4h|8h)|until/[^/]*)?/?$`, 'u');
const NO_FALLBACK = [/^\/api\//u, /^\/embed\//u];
const OFFLINE = '/offline';

export function langOf(pathname: string): string {
  const first = pathname.split('/')[1] ?? '';
  return SW_LOCALES.includes(first) ? first : 'en';
}

const homeOf = (lang: string) => (lang === 'en' ? '/' : `/${lang}/`);
const pipOf = (lang: string) => (lang === 'en' ? '/pip' : `/${lang}/pip`);

// The cached shell pages an offline navigation may open instead, best first. The floating timer only ever falls back
// to a floating timer in another language (a tool page inside the small popup would start a second session); a tool
// address opens a cached home, which reads its preset or until-time from the URL; any other page first shows the
// offline page (the system page that says the timer still works), then a home.
export function offlinePages(pathname: string): string[] {
  if (NO_FALLBACK.some((re) => re.test(pathname))) return [];
  const own = langOf(pathname);
  const pick = PIP.test(pathname) ? pipOf : homeOf;
  const pages = [...new Set([own, 'en', ...SW_LOCALES].map(pick))];
  return PIP.test(pathname) || TOOL.test(pathname) ? pages : [OFFLINE, ...pages];
}
