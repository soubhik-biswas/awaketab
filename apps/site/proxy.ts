import createMiddleware from 'next-intl/middleware';
import { NextResponse, type NextRequest } from 'next/server';
import { routing } from './i18n/routing';
import { ALIASES } from './lib/routes';

const intl = createMiddleware(routing);

// Retired and merged URLs (docs/00 §7, §13.20), answered before the locale routing.
const MOVED: Record<string, [string, 301 | 302]> = {
  '/support-matrix': ['/learn/browser-support-matrix', 301],
  '/how-we-tested': ['/learn/how-we-tested', 301],
  '/pro/buy': ['/pro', 302],
  '/for/second-monitor': ['/guides/second-monitor-turns-off', 301],
  '/on/windows-10': ['/on/windows-11', 301],
  '/guides/modern-standby': ['/guides/lock-screen-vs-sleep', 301],
  '/learn/nosleep-js-vs-wake-lock': ['/vs/nosleep-js', 301],
  ...Object.fromEntries(Object.entries(ALIASES).map(([from, to]) => [from, [to, 301] as [string, 301]])),
};

export default function proxy(request: NextRequest) {
  const moved = MOVED[request.nextUrl.pathname];
  if (moved) {
    const url = request.nextUrl.clone();
    url.pathname = moved[0];
    return NextResponse.redirect(url, moved[1]);
  }
  return intl(request);
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|dev|og|.*\\..*).*)'],
};
