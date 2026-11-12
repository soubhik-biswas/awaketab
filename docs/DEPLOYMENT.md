# Deployment

The website is `apps/site` (Next.js 16), built with OpenNext and served by Cloudflare Workers. Both Workers are deployed by **Cloudflare Workers Builds**, Cloudflare's own GitHub connection: every push to `main` is built and deployed to production, and every push to `play` is built and deployed to the preview. No Cloudflare token or deploy secret is stored in GitHub, and no GitHub workflow deploys.

## Branches and flow

The repository has two long-lived branches. `main` is production. `play` is the internal testing branch; its site, `play.awaketab.com`, is for the maintainer's checks only and is kept out of search.

1. Cut a feature branch from the latest `main`.
2. Merge the feature branch into `play`. Cloudflare builds and deploys it to `play.awaketab.com`.
3. Test the change there.
4. When it passes, merge the same feature branch into `main`. Cloudflare builds and deploys it to `awaketab.com`.

`play` is never merged into `main`; each feature reaches `main` on its own branch, so an unfinished change on `play` cannot ride along. When `play` drifts, reset it to `main`.

## Workers and domains

| Worker | Domains | Deployed by | Wrangler env | Data and payments |
| --- | --- | --- | --- | --- |
| `awaketab-site` | `awaketab.com`, plus `www.awaketab.com`, which the Worker redirects to `awaketab.com` | Workers Builds, on every push to `main` | (top level) | D1 `awaketab-auth`, KV `LICENSES`, Analytics Engine `awaketab_events`, Polar production |
| `awaketab-site-preview` | `play.awaketab.com` | Workers Builds, on every push to `play` | `preview` | D1 `awaketab-auth-preview`, KV `LICENSES_PREVIEW`, `awaketab_events_preview`, Polar sandbox |

Both are defined in `apps/site/wrangler.jsonc`. Each Worker also has three rate limiters of its own (`RL_EVENTS`, `RL_FEEDBACK`, `RL_LICENSE`, under `ratelimits`); Cloudflare creates them on deploy, so there is nothing to set up. The preview never shares a database, namespace, dataset or limiter with production. It is built with `NEXT_PUBLIC_DEPLOY_ENV=play`, which makes `robots.txt` disallow every crawler, marks every page `noindex` and sends `X-Robots-Tag: noindex, nofollow`. Canonical links still point at `awaketab.com`.

## How a production deploy happens

1. A commit lands on `main`: a merged pull request, or a push by the owner.
2. GitHub runs the **CI** workflow, and at the same time Cloudflare starts a Workers Build for `awaketab-site`. Cloudflare does not wait for GitHub CI, so its build command runs the same gates itself: lint, typecheck, unit and site tests, the build and the size budgets. Any failure stops the build and nothing is deployed.
3. The build command then builds the Worker with `opennextjs-cloudflare build` and `NEXT_PUBLIC_DEPLOY_ENV=production`. Workers Builds sets `WORKERS_CI_COMMIT_SHA` for every build; `apps/site/next.config.ts` writes it into the bundle, and `/api/health` reports its first 12 characters as `version`.
4. The deploy command applies the D1 migrations (`wrangler d1 migrations apply AUTH_DB --remote`), deploys (`opennextjs-cloudflare deploy`), then pings IndexNow (`node scripts/indexnow.mjs`). The ping is wrapped in `|| true`, so it can never fail a deploy. `opennextjs-cloudflare deploy` first copies the prerendered pages into the Worker's static assets (see [How pages are served](#how-pages-are-served)), so always deploy through it.
5. The build shows as the **Workers Builds: awaketab-site** check on the commit in GitHub, with a link to the build log.

Because the build runs from the commit Cloudflare received, a pull request never builds or deploys production. Branch builds for other branches are switched off: they would upload versions that share production's database and KV.

After a deploy, check by hand when it matters: `https://awaketab.com/` and `/robots.txt` answer 200, `robots.txt` does not block every crawler, and `/api/health` answers `"ok":true` with `"polar":"production"` and a `"version"` equal to the first 12 characters of the deployed commit.

## How pages are served

Every page is prerendered at build time and nothing revalidates between deploys, so the Worker does not render pages. `apps/site/open-next.config.ts` uses OpenNext's static-assets cache with cache interception: the build's copy of each page (HTML and the data the client router asks for) is uploaded with the Worker's static assets under `cdn-cgi/_next_cache/`, a folder only the Worker can read, and a request for a prerendered page is answered from it before the Next server is loaded. Only these still run the Next server: `/api/*`, `/og`, `/s/<setup>`, and any address that is not a page (a 404, which includes `/pro` and `/signin` while Pro is off).

| Response | Answered by | `Cache-Control` |
| --- | --- | --- |
| A prerendered page, and the same page's data for in-app navigation | the Worker, from the build's copy (`x-opennext-cache: HIT`) | `public, max-age=0, must-revalidate` |
| `/robots.txt`, `/sitemap.xml`, `/rss.xml`, `/manifest.webmanifest` | the Worker, from the build's copy | `public, max-age=0, must-revalidate` |
| `/embed.js` | the Worker, from the build's copy | `public, max-age=3600` (set by the route) |
| A page that is rendered on request (`/s/<setup>`) | the Next server | `public, max-age=0, must-revalidate` |
| A 404 or 500 page | the Next server | `private, no-cache, no-store, max-age=0, must-revalidate` |
| `/api/*` | the Next server | `no-store`; `/api/embed/config` sets `public, max-age=300` |
| `/og` | the Next server | `public, max-age=86400, s-maxage=31536000, immutable` (set by the route) |
| `/_next/static/*` (file names carry a content hash) | Cloudflare's static assets, without the Worker | `public, max-age=31536000, immutable` |
| Other files from `public/` (icons, widget templates) | static assets, without the Worker | `public, max-age=0, must-revalidate` with an `ETag` (Cloudflare's default) |
| `/serwist/sw.js` | static assets, without the Worker | `no-cache` |

So a browser or Cloudflare may keep a page but must ask the site before reusing it, and a deploy is visible on the next request; only the hashed files are kept for a year. The page rule lives in `apps/site/lib/server/cache-headers.ts` (applied through `next.config.ts`); the two static-asset rules live in `apps/site/public/_headers`. A page that reads cookies or request headers on the server must not get the page rule, because it marks the response `public`; no page does today, and `cache-headers.test.ts` fails if one starts to.

## One-time owner setup

1. **GitHub access.** The Cloudflare GitHub App (Cloudflare Workers and Pages) must have access to the repository `soubhik-biswas/awaketab`: GitHub → Settings → Applications → Cloudflare Workers and Pages → Configure → Repository access. A newly created or transferred repository is not covered by an earlier "only select repositories" choice.
2. **Connect the Worker.** Cloudflare dashboard → Workers & Pages → `awaketab-site` → Settings → Build → Connect, choose `soubhik-biswas/awaketab`, then paste these settings:

   | Setting | Value |
   | --- | --- |
   | Production branch | `main` |
   | Builds for non-production branches | **off** |
   | Root directory | `/apps/site` |
   | Build command | see below |
   | Deploy command | see below |
   | Build variable `NODE_VERSION` | `22` |
   | Build variable `PNPM_VERSION` | `12.17.0` |

   Build command:

   ```sh
   export NODE_OPTIONS=--max-old-space-size=4096 NEXT_PUBLIC_DEPLOY_ENV=production NEXT_PUBLIC_POLAR_SERVER=production && unset CLOUDFLARE_ENV && cd ../.. && pnpm install --frozen-lockfile && pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm size && pnpm -F site exec opennextjs-cloudflare build
   ```

   Deploy command:

   ```sh
   pnpm exec wrangler d1 migrations apply AUTH_DB --remote && pnpm exec opennextjs-cloudflare deploy && (node ../../scripts/indexnow.mjs || true)
   ```

   The build image can also pick the versions up from the repository (`.nvmrc` says 22; `packageManager` in `package.json` says `pnpm@12.17.0`), but whether it honours `packageManager` for a pnpm major this new is not confirmed, so set both variables explicitly. If the first build log shows another pnpm version, `pnpm install --frozen-lockfile` fails; fix the variable before anything else.

   The build command starts in `apps/site` and steps up to the repository root (`cd ../..`) for the install and the gates; the deploy command runs in `apps/site`, where `wrangler.jsonc` lives.

   Workers Builds gives the build its own short-lived Cloudflare credentials, so no API token is created for it. The Worker name in `apps/site/wrangler.jsonc` (`awaketab-site`) must match the connected Worker, or the deploy refuses.
3. **Connect the preview Worker.** Cloudflare dashboard → Workers & Pages → `awaketab-site-preview` → Settings → Build → Connect, choose `soubhik-biswas/awaketab`, then paste these settings:

   | Setting | Value |
   | --- | --- |
   | Production branch | `play` |
   | Builds for non-production branches | **off** |
   | Root directory | `/apps/site` |
   | Build command | see below |
   | Deploy command | see below |
   | Build variable `NODE_VERSION` | `22` |
   | Build variable `PNPM_VERSION` | `12.17.0` |

   Build command:

   ```sh
   export NODE_OPTIONS=--max-old-space-size=4096 && cd ../.. && pnpm install --frozen-lockfile && pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm size && NEXT_PUBLIC_DEPLOY_ENV=play NEXT_PUBLIC_POLAR_SERVER=sandbox CLOUDFLARE_ENV=preview pnpm -F site exec opennextjs-cloudflare build --env preview
   ```

   Deploy command:

   ```sh
   pnpm exec wrangler d1 migrations apply AUTH_DB --remote --env preview && pnpm exec opennextjs-cloudflare deploy --env preview
   ```

   The preview never pings IndexNow. Its build shows as the **Workers Builds: awaketab-site-preview** check on the `play` commit.
4. **Domains.** The custom domains are declared in `wrangler.jsonc`, so a deploy attaches them. If a domain is still attached to another Cloudflare project, remove it there and delete only its conflicting DNS record, then deploy.
5. **GitHub repository settings.** These are already applied to `soubhik-biswas/awaketab`. Repeat them if the repository is ever created again:
   - **Labels** match `.github/labels.yml`. The issue forms, Dependabot and the stale workflow rely on them, and GitHub drops a label that does not exist without a warning. No workflow reads the file, so after changing it, change the label on GitHub too: `gh label create <name> --color <hex> --description "<text>" --force`.
   - **Private vulnerability reporting** is on (Settings → Code security). `SECURITY.md` and the issue chooser send every security report there.
   - **Discussions** are on, with the Q&A category that the issue chooser and `SUPPORT.md` link to.
   - **Dependabot alerts** are on. Automatic update pull requests are off: the maintainer applies updates, so the repository keeps only the `main` and `play` branches.
   - **Secret scanning with push protection** is on.
   - The ruleset **Protect main** applies to `main` (Settings → Rules → Rulesets shows what it requires).
   - **Still to do:** Settings → Actions → General → Workflow permissions → tick "Allow GitHub Actions to create and approve pull requests". Without it the `version` job in `release.yml` cannot open the "version packages" pull request, and fails as soon as a changeset is pending.

   The repository variables and secrets the workflows read are listed in [14-devops.md](14-devops.md) §2. All of them are optional: a workflow whose variable or secret is missing skips that part.

## Deploying the preview

Pushing to `play` deploys the preview. To deploy it by hand instead, for example to try a branch without merging it, use a machine signed in with `pnpm -F site exec wrangler login`. Check out the branch, tag or commit to preview, then:

```sh
pnpm install --frozen-lockfile
pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm size
pnpm -F site run deploy:preview
```

`pnpm build` also builds `@awaketab/wake` and `@awaketab/core`, which the site needs. A build by hand takes the commit for `/api/health` from `git rev-parse HEAD`, so deploy from a clean checkout. `deploy:preview` builds with `CLOUDFLARE_ENV=preview`, `NEXT_PUBLIC_DEPLOY_ENV=play` and `NEXT_PUBLIC_POLAR_SERVER=sandbox` (`opennextjs-cloudflare build --env preview`), applies the migrations to the preview database (`--env preview`) and deploys the preview Worker (`opennextjs-cloudflare deploy --env preview`). Then check that `https://play.awaketab.com/robots.txt` contains `Disallow: /` and that the home page sends `X-Robots-Tag: noindex`. The preview is never pinged to IndexNow. It stays until the next preview deploy replaces it.

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

## Launch-day capacity

The Cloudflare account is on the **Workers Free** plan. Switch it to **Workers Paid** ($5 a month: Workers & Pages → Plans) before a public launch, and switch back afterwards if the traffic does not need it. The reasons are below.

**What one page view costs.** These figures follow from the code; the measured ones are in the dashboard (see the three graphs).

| Request | Worker invocations | CPU | KV | D1 | Analytics Engine |
| --- | --- | --- | --- | --- | --- |
| The page itself | 1 | expected to be a few milliseconds: it reads and parses the build's copy (about 0.5 to 1 MB), the Next server is not loaded | 0 | 0 | 0 |
| Its scripts, styles, fonts and images | 0 (static assets are free and are not counted) | 0 | 0 | 0 | 0 |
| Analytics, when the visitor allowed it: about 2 to 4 batches to `/api/e` in a session | 1 each | loads the Next server, the most expensive request the site answers | 0 (the limiter is a Workers binding) | 0 | 1 data point per event |
| First visit only: the service worker stores the offline page of all 8 languages | 8 | as a page | 0 | 0 | 0 |
| In-app navigation to another page | 1 or 2 | as a page | 0 | 0 | 0 |
| Sending feedback | 1 | loads the Next server | 1 write | 0 | 0 |

A first visit is therefore about 10 to 13 invocations and a later page view about 2 to 4. No page view reads or writes KV or D1; D1 is used only by sign-in, KV only by feedback, ratings, licences and Polar webhooks.

**Free-plan ceilings and what visitors see when one is hit.**

| Limit (Free) | Reached at about | What visitors see | Workers Paid |
| --- | --- | --- | --- |
| 100,000 Worker requests a day, reset at 00:00 UTC | 8,000 first visits, or 30,000 later page views | Cloudflare's error page 1027 instead of every page and API answer until midnight UTC | 10 million a month included, then $0.30 per million; no daily cap |
| 10 ms CPU per request | any request that needs more: likely the first `/api/*` call or 404 in a fresh isolate, because those load the Next server | that one request fails with error 1102. For a page it is an error page; for `/api/e` an event is lost unseen; for feedback the form says it could not send | 30 s per request by default |
| KV: 1,000 writes a day, 1 write a second per key | 1,000 feedback notes, ratings, licence activations and webhook writes together | pages are unaffected. Feedback and ratings answer 503 "could not be saved, try again"; a Polar webhook answers 503 and Polar sends it again | 1 million writes a month included |
| KV: 100,000 reads a day | licence and embed lookups only | licence checks fail and the client keeps its offline grace period | 10 million a month included |
| D1: 5 million rows read and 100,000 written a day | sign-in traffic only | sign-in fails; the tool itself is unaffected | 25 billion read and 50 million written a month included |
| Analytics Engine: 100,000 data points a day | about 25,000 sessions with analytics allowed | nothing; the numbers undercount | 10 million a month included |
| Rate limiters | no quota on either plan | a caller over a limit gets 429 with `Retry-After: 60` | the same |

**The three graphs to watch** (Cloudflare dashboard):

1. Workers & Pages → `awaketab-site` → Metrics → **Requests**: the day's total against 100,000, and the share that are errors.
2. The same page → **CPU time** (median and 99th percentile against 10 ms) with **Errors by invocation status**: "Exceeded CPU Time Limits" means the plan is too small.
3. Storage & Databases → KV → `LICENSES` → Metrics → **Operations**: writes against 1,000 a day.

If the first graph climbs faster than expected, the plan switch takes effect at once and needs no deploy.

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

`BETTER_AUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `LICENSE_SIGNING_KEY`, `LICENSE_SIGNING_VER`, `LICENSE_KEY_ENC_KEY`, `RATE_LIMIT_SALT`, `POLAR_ACCESS_TOKEN`, `POLAR_WEBHOOK_SECRET`, `POLAR_ORGANIZATION_ID`, `POLAR_BENEFIT_MAP`, `POLAR_PRODUCT_PRO_YEARLY`, `POLAR_PRODUCT_PRO_MONTHLY`.

Optional: `POLAR_PRODUCT_PRO_LIFETIME` (the pay-once product, kept only for licences bought before monthly replaced it) and `BETTER_AUTH_URL` (sign-in uses `PUBLIC_SITE_URL` without it). `apps/site/.env.example` lists every setting the site reads.

What each one is, where it comes from and the rest of the launch steps: [plan/PREMIUM-LAUNCH.md](plan/PREMIUM-LAUNCH.md). `pnpm -F site exec wrangler secret list` shows which are set.

## IndexNow

The key is public by design and committed as `apps/site/public/71379037c3c61495ea3797f6e5a97a32.txt`; `scripts/indexnow.mjs` holds the same value. After each production deploy the script reads `https://awaketab.com/sitemap.xml` (following sitemap index files), keeps only `https://awaketab.com` URLs, checks that the key file is live and posts the list to `https://api.indexnow.org/indexnow` in batches of 10,000. It uses Node built-ins only. To change the key, replace both and deploy.

## GitHub workflows

None of them deploys or holds a deploy credential.

- `ci.yml`: every pull request and every push to `main`.
- `e2e.yml`: the extension's browser tests, on every pull request.
- `lighthouse.yml`: every pull request (builds and audits locally); run it by hand with `base_url` set to audit a deployed origin such as `https://play.awaketab.com`.
- `release.yml`: npm releases of `@awaketab/wake` and the launch guard (`pnpm keys:check`).
- `kv-backup.yml`: weekly encrypted KV export with its own read-only secrets ([14-devops.md](14-devops.md) §7).
- `nightly.yml`: `pnpm audit --audit-level high`.
- `codeql.yml`, `dependency-review.yml` and `scorecard.yml`: code scanning, a check of the dependencies a pull request adds, and the OpenSSF Scorecard.
- `stale.yml`: closes issues that waited three weeks for information nobody sent.
