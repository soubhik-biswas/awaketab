import { TOKEN_RE } from '../_lib/auth';
import type { IEnv } from '../_lib/env';

// The email link only hands the token to /signin in the fragment, which never reaches a server or a referrer.
// Nothing is spent on GET, so mail scanners that open links cannot use up a sign-in.
export const onRequestGet: PagesFunction<IEnv> = (context) => {
  const raw = context.params.token;
  const token = typeof raw === 'string' ? raw : '';
  const target = TOKEN_RE.test(token) ? `/signin#token=${token}` : '/signin?link=expired';
  return new Response(null, {
    status: 303,
    headers: {
      location: target,
      'cache-control': 'no-store',
      'referrer-policy': 'no-referrer',
      'x-robots-tag': 'noindex',
    },
  });
};
