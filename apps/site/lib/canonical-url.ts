const CANONICAL_HOST = 'awaketab.com';

// One address per page: www, plain http and the /en prefix all move to the canonical address.
export function canonicalUrl(current: URL, host: string, forwardedProto: string | null): URL | null {
  const { pathname } = current;
  const onSite = host === CANONICAL_HOST || host === `www.${CANONICAL_HOST}`;
  const english = pathname === '/en' || pathname.startsWith('/en/');
  if (!english && !(onSite && (forwardedProto === 'http' || host !== CANONICAL_HOST))) return null;
  const url = new URL(current);
  if (english) url.pathname = pathname.slice(3) || '/';
  if (onSite) {
    url.protocol = 'https:';
    url.host = CANONICAL_HOST;
    url.port = '';
  }
  return url;
}
