import { passkey } from '@better-auth/passkey';
import { betterAuth, generateId } from 'better-auth';
import { lastLoginMethod } from 'better-auth/plugins';
import type { IEnv } from '@/lib/server/env';
import { AUTH_BASE_PATH, PASSKEY_USER_DOMAIN, type IAuthStatus } from './shared';

export function authStatus(env: IEnv): IAuthStatus {
  const ready = Boolean(env.AUTH_DB && env.BETTER_AUTH_SECRET);
  return {
    ready,
    google: ready && Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET),
    github: ready && Boolean(env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET),
    passkey: ready,
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
      passkey({
        rpID: new URL(base).hostname,
        rpName: 'AwakeTab',
        origin: base,
        // A passkey can start an account on its own, so nobody has to sign in somewhere else first.
        registration: {
          requireSession: false,
          resolveUser: () => ({ id: generateId(), name: 'AwakeTab' }),
          afterVerification: async ({ ctx, user }) => {
            if (ctx.context.session?.user.id) return;
            const created = await ctx.context.internalAdapter.createUser(
              { name: '', email: `${user.id.toLowerCase()}@${PASSKEY_USER_DOMAIN}`, emailVerified: false },
              { method: 'passkey' },
            );
            return { userId: created.id, name: 'AwakeTab' };
          },
        },
      }),
      lastLoginMethod({
        customResolveMethod: (ctx) => (ctx.path === '/passkey/verify-registration' ? 'passkey' : null),
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

// The signed-in user's id, if any, so checkout can tie a purchase to the account that syncs it.
export async function sessionUserId(env: IEnv, request: Request): Promise<string | null> {
  const auth = getAuth(env, new URL(request.url).origin);
  if (!auth) return null;
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    return session?.user.id ?? null;
  } catch {
    return null;
  }
}
