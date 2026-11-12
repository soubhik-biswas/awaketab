// Next's App Router writes its own inline boot scripts without a nonce, so script-src allows inline scripts.
// React's development build needs eval to rebuild server call stacks; production never gets it.
const SCRIPT = `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === 'development' ? " 'unsafe-eval'" : ''}`;
const ADS_SCRIPT = `${SCRIPT} https://pagead2.googlesyndication.com https://fundingchoicesmessages.google.com https://*.googletagservices.com`;

const BASE_CSP = [
  "default-src 'self'",
  SCRIPT,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https:",
  "media-src 'self' data:",
  "connect-src 'self'",
  "font-src 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self' https://polar.sh https://*.polar.sh",
  'upgrade-insecure-requests',
  'report-to csp',
].join('; ');

const ADS_CSP = [
  "default-src 'self'",
  ADS_SCRIPT,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https:",
  "media-src 'self' data:",
  "connect-src 'self' https://*.google.com https://*.doubleclick.net",
  'frame-src https://googleads.g.doubleclick.net https://tpc.googlesyndication.com https://fundingchoicesmessages.google.com',
  "object-src 'none'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  'report-to csp',
].join('; ');

const EMBED_CSP = [
  "default-src 'self'",
  SCRIPT,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "media-src 'self' data:",
  "connect-src 'self'",
  "object-src 'none'",
  'frame-ancestors *',
].join('; ');

const COMMON = [
  {
    key: 'Permissions-Policy',
    value:
      'screen-wake-lock=(self), picture-in-picture=(self), camera=(), microphone=(self), geolocation=(), payment=()',
  },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin-allow-popups' },
  { key: 'Reporting-Endpoints', value: 'csp="/api/csp"' },
];

interface IHeaderRule {
  source: string;
  headers: Array<{ key: string; value: string }>;
}

const LOCALES = '(es|pt-br|de|fr|ja|zh|hi)';
const AD_FAMILIES = ['for', 'on', 'vs', 'guides', 'learn'];

export function securityHeaders(): IHeaderRule[] {
  const page = [...COMMON, { key: 'X-Frame-Options', value: 'DENY' }];
  const rules: IHeaderRule[] = [
    {
      source: `/((?!embed/|(?:${LOCALES.slice(1, -1)})/embed/).*)`,
      headers: [...page, { key: 'Content-Security-Policy', value: BASE_CSP }],
    },
  ];
  for (const family of AD_FAMILIES) {
    for (const source of [`/${family}/:path*`, `/:locale${LOCALES}/${family}/:path*`])
      rules.push({ source, headers: [{ key: 'Content-Security-Policy', value: ADS_CSP }] });
  }
  for (const source of ['/embed/:path+', `/:locale${LOCALES}/embed/:path+`]) {
    rules.push({
      source,
      headers: [
        ...COMMON,
        { key: 'Content-Security-Policy', value: EMBED_CSP },
        { key: 'X-Robots-Tag', value: 'noindex' },
      ],
    });
  }
  rules.push({ source: '/api/:path*', headers: [{ key: 'X-Robots-Tag', value: 'noindex' }] });
  rules.push({ source: '/auth/:path*', headers: [{ key: 'X-Robots-Tag', value: 'noindex' }] });
  if (process.env.NEXT_PUBLIC_DEPLOY_ENV === 'play')
    rules.push({ source: '/:path*', headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }] });
  return rules;
}
