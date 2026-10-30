import { TOKEN_RE } from '@/lib/auth/shared';

export const dynamic = 'force-dynamic';

// The email link only hands the token to /signin in the fragment, which never reaches a server or a referrer.
// Nothing is spent on GET, so mail scanners that open links cannot use up a sign-in.
export function GET(_request: Request, { params }: { params: Promise<{ token: string }> }): Promise<Response> {
  return params.then(({ token }) => {
    const target = TOKEN_RE.test(token) ? `/signin#token=${encodeURIComponent(token)}` : '/signin/expired';
    return new Response(null, {
      status: 303,
      headers: {
        location: target,
        'cache-control': 'no-store',
        'referrer-policy': 'no-referrer',
        'x-robots-tag': 'noindex',
      },
    });
  });
}
