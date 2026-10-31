import { Checkout } from '@polar-sh/nextjs';
import { NextRequest } from 'next/server';
import { sessionUserId } from '@/lib/auth/server';
import { api } from '@/lib/server/api';
import { jsonError, rateLimited } from '@/lib/server/http';
import { checkoutPlan, checkoutTarget, siteOrigin } from '@/lib/server/checkout';
import { polarServer } from '@/lib/server/polar';
import { clientIp, rateLimit } from '@/lib/server/ratelimit';
import { PRO_ENABLED } from '@/lib/features';

export const dynamic = 'force-dynamic';

// GET /api/checkout?plan=yearly|monthly opens Polar checkout for a Pro plan. Only the plan travels from the browser;
// a signed-in person's account id goes along from the session, so the purchase belongs to the account that syncs it.
export const GET = api(async (request, { env }) => {
  if (!PRO_ENABLED) return new Response('Not found', { status: 404 });
  if (!(await rateLimit(env, 'checkout', clientIp(request), 10))) return rateLimited();
  const url = new URL(request.url);
  const plan = checkoutPlan(url.searchParams.get('plan'));
  const target = checkoutTarget(env, plan);
  if (!target) {
    if (!request.headers.get('accept')?.includes('text/html')) return jsonError('checkout_unavailable', 503);
    const back = new URL('/pro/checkout', siteOrigin(env, request));
    back.searchParams.set('checkout', 'unavailable');
    back.hash = 'pay';
    return new Response(null, { status: 303, headers: { location: back.toString() } });
  }
  if (target.kind === 'link') {
    return new Response(null, {
      status: 303,
      headers: { location: target.url, 'referrer-policy': 'no-referrer' },
    });
  }
  const origin = siteOrigin(env, request);
  const handler = Checkout({
    accessToken: target.token,
    environment: polarServer(env),
    successUrl: `${origin}/pro/activate`,
    returnUrl: `${origin}/pro/checkout#pay`,
    includeCheckoutId: true,
    customerIpAddress: false,
  });
  const inner = new URL('/api/checkout', origin);
  inner.searchParams.set('products', target.product);
  const userId = await sessionUserId(env, request);
  if (userId) inner.searchParams.set('external_customer_id', userId);
  return handler(new NextRequest(inner, { headers: { accept: 'text/html' } }));
});
