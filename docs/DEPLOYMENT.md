# Deployment

The website is `apps/site` (Next.js 16), built with OpenNext and served by Cloudflare Workers. Production is deployed by **Cloudflare Workers Builds**, Cloudflare's own GitHub connection: every push to `main` is built and deployed by Cloudflare. The preview is deployed by hand. No Cloudflare token or deploy secret is stored in GitHub, and no GitHub workflow deploys. There is no `play` branch.

## Workers and domains

| Worker | Domains | Deployed by | Wrangler env | Data and payments |
| --- | --- | --- | --- | --- |
| `awaketab-site` | `awaketab.com`, `www.awaketab.com` | Workers Builds, on every push to `main` | (top level) | D1 `awaketab-auth`, KV `LICENSES`, Analytics Engine `awaketab_events`, Polar production |
| `awaketab-site-preview` | `play.awaketab.com` | by hand: `pnpm -F site run deploy:preview` | `preview` | D1 `awaketab-auth-preview`, KV `LICENSES_PREVIEW`, `awaketab_events_preview`, Polar sandbox |

Both are defined in `apps/site/wrangler.jsonc`. The preview never shares a database, namespace or dataset with production. It is built with `NEXT_PUBLIC_DEPLOY_ENV=play`, which makes `robots.txt` disallow every crawler, marks every page `noindex` and sends `X-Robots-Tag: noindex, nofollow`. Canonical links still point at `awaketab.com`.

## How a production deploy happens

1. A commit lands on `main` (a merged pull request or a direct push).
2. GitHub runs the **CI** workflow, and at the same time Cloudflare starts a Workers Build for `awaketab-site`. Cloudflare does not wait for GitHub CI, so its build command runs the same gates itself: lint, typecheck, unit and site tests, the build and the size budgets. Any failure stops the build and nothing is deployed.
3. The build command then builds the Worker with `opennextjs-cloudflare build` and `NEXT_PUBLIC_DEPLOY_ENV=production`.
4. The deploy command applies the D1 migrations (`wrangler d1 migrations apply AUTH_DB --remote`), deploys (`opennextjs-cloudflare deploy`), then pings IndexNow (`node scripts/indexnow.mjs`). The ping is wrapped in `|| true`, so it can never fail a deploy.
5. The build shows as the **Workers Builds: awaketab-site** check on the commit in GitHub, with a link to the build log.

Because the build runs from the commit Cloudflare received, a pull request never builds or deploys production. Branch builds for other branches are switched off: they would upload versions that share production's database and KV.

After a deploy, check by hand when it matters: `https://awaketab.com/` and `/robots.txt` answer 200, `robots.txt` does not block every crawler, and `/api/health` answers `"ok":true` with `"polar":"production"`.

## One-time owner setup

1. **GitHub access.** The Cloudflare GitHub App (Cloudflare Workers and Pages) must have access to the repository `soubhik-biswas/awaketab`: GitHub → Settings → Applications → Cloudflare Workers and Pages → Configure → Repository access. A newly created or transferred repository is not covered by an earlier "only select repositories" choice.
2. **Connect the Worker.** Cloudflare dashboard → Workers & Pages → `awaketab-site` → Settings → Build → Connect, choose `soubhik-biswas/awaketab`, then paste these settings:

   | Setting | Value |
   | --- | --- |
   | Production branch | `main` |
   | Builds for non-production branches | **off** |
   | Root directory | `/` |
   | Build command | see below |
   | Deploy command | see below |
   | Build variable `NODE_VERSION` | `22` |
   | Build variable `PNPM_VERSION` | `12.17.0` |

   Build command:

   ```sh
   export NODE_OPTIONS=--max-old-space-size=4096 NEXT_PUBLIC_DEPLOY_ENV=production && pnpm install --frozen-lockfile && pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm size && pnpm -F site exec opennextjs-cloudflare build
   ```

   Deploy command:

   ```sh
   pnpm -F site exec wrangler d1 migrations apply AUTH_DB --remote && pnpm -F site exec opennextjs-cloudflare deploy && (node scripts/indexnow.mjs || true)
   ```

   The build image can also pick the versions up from the repository (`.nvmrc` says 22; `packageManager` in `package.json` says `pnpm@12.17.0`), but whether it honours `packageManager` for a pnpm major this new is not confirmed, so set both variables explicitly. If the first build log shows another pnpm version, `pnpm install --frozen-lockfile` fails; fix the variable before anything else.

   Workers Builds gives the build its own short-lived Cloudflare credentials, so no API token is created for it. The Worker name in `apps/site/wrangler.jsonc` (`awaketab-site`) must match the connected Worker, or the deploy refuses.
3. **Leave the preview Worker unconnected.** `awaketab-site-preview` has no Git connection; it is deployed by hand (below). If it was connected earlier, disconnect it.
4. **Domains.** The custom domains are declared in `wrangler.jsonc`, so a deploy attaches them. When moving `awaketab.com` or `www.awaketab.com` from the old Pages project, first remove the domain from Pages and delete only its conflicting DNS record, then deploy.
5. **GitHub repository settings.** Branch protection on `main`: require the CI check, so `main` only receives commits that passed it. Settings → Code security: turn on Dependabot alerts and security updates; weekly version updates are configured in `.github/dependabot.yml`.

## Deploying the preview

The preview at `play.awaketab.com` is deployed from a machine signed in with `pnpm -F site exec wrangler login`. Check out the branch, tag or commit to preview, then:

```sh
pnpm install --frozen-lockfile
pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm size
pnpm -F site run deploy:preview
```

`pnpm build` also builds `@awaketab/wake` and `@awaketab/core`, which the site needs. `deploy:preview` builds with `CLOUDFLARE_ENV=preview`, `NEXT_PUBLIC_DEPLOY_ENV=play` and `NEXT_PUBLIC_POLAR_SERVER=sandbox` (`opennextjs-cloudflare build --env preview`), applies the migrations to the preview database (`--env preview`) and deploys the preview Worker (`opennextjs-cloudflare deploy --env preview`). Then check that `https://play.awaketab.com/robots.txt` contains `Disallow: /` and that the home page sends `X-Robots-Tag: noindex`. The preview is never pinged to IndexNow. It stays until the next preview deploy replaces it.

## Deploying production by hand

Only when Workers Builds is unavailable. From a signed-in machine, on an up-to-date `main`:

```sh
pnpm install --frozen-lockfile
pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm size
pnpm -F site run db:migrate
NEXT_PUBLIC_DEPLOY_ENV=production pnpm -F site run deploy
node scripts/indexnow.mjs
```

`node scripts/indexnow.mjs --dry-run` shows what the ping would send without sending it.

## Rollback

Every deploy is a Worker version, and rolling back is instant. In the dashboard: Workers & Pages → `awaketab-site` → Deployments → pick the last good version → Rollback. From a signed-in machine:

```sh
pnpm -F site exec wrangler deployments list
pnpm -F site exec wrangler versions list
pnpm -F site exec wrangler rollback <version-id> --message "Roll back: <reason>"
```

Add `--env preview` for the preview Worker. A rollback swaps code only: D1 migrations, KV data and secrets stay as they are, so migrations must be additive (new tables and columns that the previous version ignores). Then fix forward with a new commit on `main`; the next build replaces the rolled-back version.

## Worker secrets for the Pro launch

Runtime secrets live on the Workers, never in GitHub. Set each with `pnpm -F site exec wrangler secret put <NAME>`, and again with `--env preview` (sandbox values) for the preview:

`BETTER_AUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `LICENSE_SIGNING_KEY`, `LICENSE_SIGNING_VER`, `LICENSE_KEY_ENC_KEY`, `RATE_LIMIT_SALT`, `POLAR_ACCESS_TOKEN`, `POLAR_WEBHOOK_SECRET`, `POLAR_ORGANIZATION_ID`, `POLAR_BENEFIT_MAP`.

What each one is, where it comes from and the rest of the launch steps: [plan/PREMIUM-LAUNCH.md](plan/PREMIUM-LAUNCH.md). `pnpm -F site exec wrangler secret list` shows which are set.

## IndexNow

The key is public by design and committed as `apps/site/public/71379037c3c61495ea3797f6e5a97a32.txt`; `scripts/indexnow.mjs` holds the same value. After each production deploy the script reads `https://awaketab.com/sitemap.xml` (following sitemap index files), keeps only `https://awaketab.com` URLs, checks that the key file is live and posts the list to `https://api.indexnow.org/indexnow` in batches of 10,000. It uses Node built-ins only. To change the key, replace both and deploy.

## GitHub workflows

None of them deploys or holds a deploy credential.

- `ci.yml`: every pull request and every push to `main`.
- `lighthouse.yml`: every pull request (builds and audits locally); run it by hand with `base_url` set to audit a deployed origin such as `https://play.awaketab.com`.
- `release.yml`: npm releases of `@awaketab/wake` and the launch guard (`pnpm keys:check`).
- `kv-backup.yml`: weekly encrypted KV export with its own read-only secrets ([14-devops.md](14-devops.md) §7).
- `nightly.yml`: `pnpm audit --audit-level high`.
