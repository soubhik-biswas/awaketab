import {
  cooldownKey,
  newToken,
  normaliseEmail,
  SIGNIN_COOLDOWN_S,
  SIGNIN_TTL_S,
  storeToken,
  tokenKey,
} from '../../_lib/auth';
import { sendEmail } from '../../_lib/email/send';
import { signinEmail } from '../../_lib/email/templates';
import type { IEnv } from '../../_lib/env';
import { jsonError, jsonOk, rateLimited } from '../../_lib/http';
import { clientIp, rateLimit } from '../../_lib/ratelimit';

export const onRequestPost: PagesFunction<IEnv> = async (context) => {
  const { env, request } = context;
  if (!(await rateLimit(env, 'auth', await clientIp(request), 5))) return rateLimited();
  let email: string | null;
  try {
    email = normaliseEmail(((await request.json()) as { email?: unknown } | null)?.email);
  } catch {
    return jsonError('bad_request', 400);
  }
  if (!email) return jsonError('bad_email', 400);
  const kv = env.LICENSES;
  if (!kv) return jsonError('email_unavailable', 503);
  const cool = await cooldownKey(email);
  if (await kv.get(cool)) return rateLimited();

  const token = newToken();
  const site = (env.PUBLIC_SITE_URL ?? new URL(request.url).origin).replace(/\/$/u, '');
  await storeToken(kv, token, email);
  const sent = await sendEmail(env, signinEmail(email, `${site}/auth/${token}`));
  if (!sent.ok) {
    await kv.delete(await tokenKey(token));
    return jsonError(sent.reason === 'not_configured' ? 'email_unavailable' : 'email_failed', 503);
  }
  await kv.put(cool, '1', { expirationTtl: SIGNIN_COOLDOWN_S });
  return jsonOk({ sent: true, minutes: SIGNIN_TTL_S / 60 }, 202);
};
