import { Checkout } from '@polar-sh/nextjs';
import { NextRequest } from 'next/server';
import { api } from '@/lib/server/api';
import { normaliseEmail } from '@/lib/server/email-address';
import { jsonError, rateLimited } from '@/lib/server/http';
import { checkoutTarget, siteOrigin } from '@/lib/server/checkout';
import { polarServer } from '@/lib/server/polar';
import { clientIp, rateLimit } from '@/lib/server/ratelimit';

export const dynamic = 'force-dynamic';

// GET /api/checkout?plan=yearly|lifetime&email=… opens Polar checkout for one of the two Pro plans.
// Only the plan and a checked address travel on: the browser can never set Polar metadata, products or customer ids.
export const GET = api(async (request, { env }) => {
  if (!(await rateLimit(env, 'checkout', clientIp(request), 10))) return rateLimited();
  const url = new URL(request.url);
  const plan = url.searchParams.get('plan') === 'lifetime' ? 'pro_lifetime' : 'pro_yearly';
  const email = normaliseEmail(url.searchParams.get('email'));
  const target = checkoutTarget(env, plan);
  if (!target) {
    if (!request.headers.get('accept')?.includes('text/html')) return jsonError('checkout_unavailable', 503);
    const back = new URL('/pro/checkout', siteOrigin(env, request));
    back.searchParams.set('checkout', 'unavailable');
    back.hash = 'pay';
    return new Response(null, { status: 303, headers: { location: back.toString() } });
  }
  if (target.kind === 'link') {
    const link = new URL(target.url);
    if (email) link.searchParams.set('customer_email', email);
    return new Response(null, {
      status: 303,
      headers: { location: link.toString(), 'referrer-policy': 'no-referrer' },
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
  if (email) inner.searchParams.set('customer_email', email);
  return handler(new NextRequest(inner, { headers: { accept: 'text/html' } }));
});
