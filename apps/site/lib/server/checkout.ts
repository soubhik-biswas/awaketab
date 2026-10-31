import type { IEnv } from './env';
import { polarServer } from './polar';

export type TProPlanId = 'pro_yearly' | 'pro_monthly' | 'pro_lifetime';

// Polar sandbox org `awaketab`; each link's success URL is /pro/activate?checkout_id={CHECKOUT_ID}. Monthly has no
// sandbox link yet, so it needs its product id.
const SANDBOX_LINKS: Partial<Record<TProPlanId, string>> = {
  pro_yearly:
    'https://sandbox-api.polar.sh/v1/checkout-links/polar_cl_hl19dM6c6AmehBiuzDYFRg5lurRsDwJkxbQAU0liBMl/redirect',
  pro_lifetime:
    'https://sandbox-api.polar.sh/v1/checkout-links/polar_cl_BxpdJ71IEheYkbOuqrdrKVDLi4wNhhjEyhmTo23rT1R/redirect',
};

export type TCheckoutTarget = { kind: 'sdk'; token: string; product: string } | { kind: 'link'; url: string } | null;

export function checkoutPlan(raw: string | null): TProPlanId {
  if (raw === 'monthly') return 'pro_monthly';
  return raw === 'lifetime' ? 'pro_lifetime' : 'pro_yearly';
}

function productFor(env: IEnv, plan: TProPlanId): string | undefined {
  if (plan === 'pro_monthly') return env.POLAR_PRODUCT_PRO_MONTHLY;
  return plan === 'pro_lifetime' ? env.POLAR_PRODUCT_PRO_LIFETIME : env.POLAR_PRODUCT_PRO_YEARLY;
}

// Products configured with an access token use Polar's checkout API (any host, tied to the signed-in account).
// Without them the sandbox keeps its checkout links; anything else reports itself unavailable.
export function checkoutTarget(env: IEnv, plan: TProPlanId): TCheckoutTarget {
  const product = productFor(env, plan);
  if (env.POLAR_ACCESS_TOKEN && product) return { kind: 'sdk', token: env.POLAR_ACCESS_TOKEN, product };
  const link = SANDBOX_LINKS[plan];
  if (polarServer(env) === 'sandbox' && link) return { kind: 'link', url: link };
  return null;
}

export function siteOrigin(env: IEnv, request: Request): string {
  try {
    return new URL(request.url).origin;
  } catch {
    return (env.PUBLIC_SITE_URL ?? 'https://awaketab.com').replace(/\/$/u, '');
  }
}
