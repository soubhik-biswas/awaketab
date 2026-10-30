import type { IEnv } from './env';
import { polarServer } from './polar';

export type TProPlanId = 'pro_yearly' | 'pro_lifetime';

// Polar sandbox org `awaketab`; each link's success URL is /pro/activate?checkout_id={CHECKOUT_ID}.
const SANDBOX_LINKS: Record<TProPlanId, string> = {
  pro_yearly:
    'https://sandbox-api.polar.sh/v1/checkout-links/polar_cl_hl19dM6c6AmehBiuzDYFRg5lurRsDwJkxbQAU0liBMl/redirect',
  pro_lifetime:
    'https://sandbox-api.polar.sh/v1/checkout-links/polar_cl_BxpdJ71IEheYkbOuqrdrKVDLi4wNhhjEyhmTo23rT1R/redirect',
};

export type TCheckoutTarget = { kind: 'sdk'; token: string; product: string } | { kind: 'link'; url: string } | null;

// Products configured with an access token use Polar's checkout API (any host, address prefilled). Without them
// the sandbox keeps its checkout links; production has no links, so checkout reports itself unavailable.
export function checkoutTarget(env: IEnv, plan: TProPlanId): TCheckoutTarget {
  const product = plan === 'pro_lifetime' ? env.POLAR_PRODUCT_PRO_LIFETIME : env.POLAR_PRODUCT_PRO_YEARLY;
  if (env.POLAR_ACCESS_TOKEN && product) return { kind: 'sdk', token: env.POLAR_ACCESS_TOKEN, product };
  if (polarServer(env) === 'sandbox') return { kind: 'link', url: SANDBOX_LINKS[plan] };
  return null;
}

export function siteOrigin(env: IEnv, request: Request): string {
  try {
    return new URL(request.url).origin;
  } catch {
    return (env.PUBLIC_SITE_URL ?? 'https://awaketab.com').replace(/\/$/u, '');
  }
}
