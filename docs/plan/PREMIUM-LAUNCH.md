# Turning on AwakeTab Pro

AwakeTab launches with everything free and no account. Pro (sync across screens, sign-in, checkout) is built and kept in the code, switched off by one flag. This is the list of everything to do when Pro starts. Keep it up to date whenever Pro code changes.

## What the switch hides today

`NEXT_PUBLIC_PRO_ENABLED` is off unless it equals `1` (`apps/site/lib/features.ts`). While it is off:

- `/pro`, `/pro/checkout`, `/pro/activate`, `/pro/manage`, `/signin` and `/signin/expired` answer 404 (their `layout.tsx` checks the flag), and `/api/checkout` answers 404.
- The header has no Pro link and no Sign in button, the footer has no Pro link, the sitemap leaves out `/pro`, and the help centre leaves out billing help.
- In the tool, Settings shows no Account section and no Pro card, the "You've made it yours" nudge never appears, and `/?open=pro` does not open the Pro panel.
- The extension's store listing and the launch copy say nothing about a paid plan (`apps/extension/store/listing.md`).
- Nothing is removed: the Pro panels, licence API, Polar webhook, Better Auth, passkeys and the D1 tables stay deployed and tested.

## 1. Accounts and secrets (Cloudflare Worker `awaketab-site`)

Set with `pnpm -F site exec wrangler secret put <NAME>` (and `--env preview` for the preview Worker):

- `BETTER_AUTH_SECRET` — `openssl rand -base64 32`.
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` — a Google OAuth web client with redirect `https://awaketab.com/api/auth/callback/google` (add the preview host too).
- `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` — a GitHub OAuth app with callback `https://awaketab.com/api/auth/callback/github`.
- Passkeys need no keys, but they only work on the real host, so the site must be served from `awaketab.com` first. The passkey table already exists in both D1 databases (migration `0002_passkey.sql`).
- Licence keys: `LICENSE_SIGNING_KEY`, `LICENSE_SIGNING_VER`, `LICENSE_KEY_ENC_KEY` (how to make and rotate them: `../14-devops.md` §6) and `RATE_LIMIT_SALT`. The licence routes and checkout are limited to 10 requests a minute per caller by the `RL_LICENSE` rate limit binding, which is already in `wrangler.jsonc` and needs no setup.

## 2. Payments (Polar)

- `POLAR_ACCESS_TOKEN`, `POLAR_WEBHOOK_SECRET`, `POLAR_ORGANIZATION_ID`, `POLAR_BENEFIT_MAP`.
- Products: `POLAR_PRODUCT_PRO_YEARLY` (exists) and a new monthly product, `POLAR_PRODUCT_PRO_MONTHLY`; map its benefit to `pro_monthly` in `POLAR_BENEFIT_MAP`.
- Turn on the 14-day free trial on both products.
- Webhook endpoint `https://awaketab.com/api/webhooks/polar` with the licence events (order.created, order.refunded, subscription.canceled / uncanceled / revoked, refund.created / updated, benefit_grant.created / updated / revoked).
- Success URL `/pro/activate?checkout_id={CHECKOUT_ID}`.

## 3. Copy and prices

- Set the monthly price in `apps/site/lib/pro/plans.ts`. Until it exists the monthly price and the yearly saving show a dash; the saving computes itself from the two prices.
- Review the Pro page copy (Free: "Everything AwakeTab does, on this screen, for good"; Pro: sync up to 5 screens, start or stop every screen from one, cross-device history, priority help, early faces).

## 4. Product decisions still open

- **Delete account.** No board draws it, but the privacy page promises it under Settings → Account. Decide where it goes (a row in Manage plan or under the account card when signed in) before Pro starts.
- **Passkey package.** `@better-auth/passkey@1.7.14` was five days old when added; check for a newer patch release matching the installed Better Auth before launch.

## 5. Switch it on

1. Set `NEXT_PUBLIC_PRO_ENABLED=1` where the site is built, because it is read at build time: as a build variable of `awaketab-site` in Workers Builds (Cloudflare dashboard → the Worker → Settings → Build) for production, and in `apps/site/.env.local` for local work.
2. Run the full gates (`pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm size`).
3. Try it on the preview first: set the same build variable on `awaketab-site-preview` and merge the feature branch into `play`, which deploys it to `play.awaketab.com` (or deploy by hand with `NEXT_PUBLIC_PRO_ENABLED=1 pnpm -F site run deploy:preview`). Then check `/pro`, checkout with a Polar sandbox card, sign-in with Google, GitHub and a passkey, the Settings account card signed out and signed in, Manage plan and Your screens on `play.awaketab.com`.
4. Merge the same feature branch into `main`; `play` itself is never merged into `main`. Workers Builds builds and deploys production with the new variable (`../DEPLOYMENT.md`); repeat the checks on `awaketab.com`.
5. Add a changelog fragment announcing Pro.
