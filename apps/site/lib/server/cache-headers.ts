interface IHeaderRule {
  source: string;
  headers: Array<{ key: string; value: string }>;
}

// Lower case, so it replaces the cache-control the adapter computes instead of sitting beside it.
const REVALIDATE = [{ key: 'cache-control', value: 'public, max-age=0, must-revalidate' }];

// Pages change only with a deploy, so a browser may keep a copy but must ask before reusing it. API routes, /og
// and /embed.js set their own policy; public/_headers covers the hashed files, which never reach the Worker.
export function cacheHeaders(): IHeaderRule[] {
  return [
    { source: '/((?!api(?:/|$)|og(?:/|$)|_next(?:/|$)|.*\\..*).*)', headers: REVALIDATE },
    { source: '/:file(robots\\.txt|sitemap\\.xml|rss\\.xml|manifest\\.webmanifest)', headers: REVALIDATE },
  ];
}
