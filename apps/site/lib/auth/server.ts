import { betterAuth } from 'better-auth';
import { APIError } from 'better-auth/api';
import { magicLink } from 'better-auth/plugins/magic-link';
import { signinEmail } from '@/emails';
import type { IEnv } from '@/lib/server/env';
import { emailConfigured, sendEmail } from '@/lib/server/email/send';
import { AUTH_BASE_PATH, SIGNIN_MINUTES, type IAuthStatus } from './shared';

export function authStatus(env: IEnv): IAuthStatus {
  const ready = Boolean(env.AUTH_DB && env.BETTER_AUTH_SECRET);
  return {
    ready,
    google: ready && Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET),
    github: ready && Boolean(env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET),
    email: ready && emailConfigured(env),
    minutes: SIGNIN_MINUTES,
  };
}

function siteUrl(env: IEnv, origin: string): string {
  return (env.BETTER_AUTH_URL ?? env.PUBLIC_SITE_URL ?? origin).replace(/\/$/u, '');
}

function createAuth(env: IEnv, origin: string) {
  const base = siteUrl(env, origin);
  const social: Record<string, { clientId: string; clientSecret: string }> = {};
  if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET)
    social.google = { clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET };
  if (env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET)
    social.github = { clientId: env.GITHUB_CLIENT_ID, clientSecret: env.GITHUB_CLIENT_SECRET };
  return betterAuth({
    appName: 'AwakeTab',
    baseURL: base,
    basePath: AUTH_BASE_PATH,
    secret: env.BETTER_AUTH_SECRET ?? '',
    ...(env.AUTH_DB ? { database: env.AUTH_DB } : {}),
    trustedOrigins: [base, origin],
    emailAndPassword: { enabled: false },
    user: { deleteUser: { enabled: true } },
    socialProviders: social,
    session: { expiresIn: 30 * 86_400, updateAge: 86_400, cookieCache: { enabled: true, maxAge: 300 } },
    rateLimit: { enabled: true, window: 60, max: 30 },
    telemetry: { enabled: false },
    advanced: { ipAddress: { ipAddressHeaders: ['cf-connecting-ip', 'x-forwarded-for'] } },
    plugins: [
      magicLink({
        expiresIn: SIGNIN_MINUTES * 60,
        storeToken: 'hashed',
        // The emailed link only hands the token to /signin in the URL fragment (see app/auth/[token]), so a mail
        // scanner that opens the link cannot spend it.
        sendMagicLink: async ({ email, token }) => {
          const mail = await signinEmail(email, `${base}/auth/${encodeURIComponent(token)}`);
          const sent = await sendEmail(env, mail);
          if (!sent.ok)
            throw new APIError('SERVICE_UNAVAILABLE', {
              message: sent.reason === 'not_configured' ? 'email_unavailable' : 'email_failed',
              code: sent.reason === 'not_configured' ? 'EMAIL_UNAVAILABLE' : 'EMAIL_FAILED',
            });
        },
      }),
    ],
  });
}

export type TAuth = ReturnType<typeof createAuth>;

const instances = new WeakMap<object, TAuth>();

// One instance per D1 binding: a Worker isolate reuses it across requests, and tests get a fresh one per fake.
export function getAuth(env: IEnv, origin: string): TAuth | null {
  if (!env.AUTH_DB || !env.BETTER_AUTH_SECRET) return null;
  const key = env.AUTH_DB as unknown as object;
  let auth = instances.get(key);
  if (!auth) {
    auth = createAuth(env, origin);
    instances.set(key, auth);
  }
  return auth;
}
