# 14 · DevOps, hosting and operations

Status: v2.0 · 2026-11-13 · Owner: Soubhik

**Purpose.** How AwakeTab is hosted, deployed, secured, monitored and recovered: the Next.js site in `apps/site` on Cloudflare Workers (through OpenNext) with D1, KV and Workers Analytics Engine, from a GitHub monorepo. Written for one operator who also writes the code.

Related docs: [DEPLOYMENT.md](DEPLOYMENT.md) (Workers, domains, deploys, rollback) · `03-architecture.md` (config, security model) · `08-data-storage.md` §4–§5 · `09-monetization-impl.md` (secrets in use) · `13-testing-strategy.md` (what CI runs) · `00-conventions.md` §13.3 (canonical secret names) · [plan/PREMIUM-LAUNCH.md](plan/PREMIUM-LAUNCH.md) (Worker secrets for Pro).

---

## 1. Hosting and deploys

| Env | URL | Source | Data |
|---|---|---|---|
| Local | `http://localhost:3000` (`pnpm dev`) | working tree | local D1, KV and Analytics Engine through Wrangler's platform proxy, Polar sandbox |
| Preview | `https://play.awaketab.com` (Worker `awaketab-site-preview`) | any ref, deployed by hand | D1 `awaketab-auth-preview`, KV `LICENSES_PREVIEW`, AE `awaketab_events_preview`, Polar sandbox, `noindex` |
| Production | `https://awaketab.com`, `https://www.awaketab.com` (Worker `awaketab-site`) | `main`, through Cloudflare Workers Builds | D1 `awaketab-auth`, KV `LICENSES`, AE `awaketab_events`, Polar production |

Production deploys on every push to `main`: Cloudflare Workers Builds runs the full gates, builds with OpenNext, applies D1 migrations, deploys and pings IndexNow. The preview is deployed with `pnpm -F site run deploy:preview`. Dashboard settings, the by-hand paths, rollback and the Worker secrets are in [DEPLOYMENT.md](DEPLOYMENT.md). No GitHub workflow deploys or holds a Cloudflare deploy credential.

Response headers (CSP, framing, `X-Robots-Tag`) come from `apps/site/lib/server/security-headers.ts` through `next.config.ts`; retired URLs redirect in `apps/site/proxy.ts`. The redirect domains `awaketab.app`, `awaketab.page` and `awaketab.dev` stay zone-level Bulk Redirects to `https://awaketab.com/$1` (301, path and query kept). Cloudflare Web Analytics is not enabled (no third-party script by design); zone analytics and Workers observability cover traffic and errors.

---

## 2. Repository and GitHub Actions

Trunk-based: short-lived branches → pull request → merge to `main`. There is no `play` branch. Commit messages follow Conventional Commits (`feat(site): …`, `fix(seo): …`); changesets for `packages/*`; changelog fragments in `changelog/*.md` for user-visible site changes.

| Workflow | When | What |
|---|---|---|
| `ci.yml` | pull requests, pushes to `main` | lint, typecheck, unit and site tests, build, size budgets |
| `e2e.yml` | pull requests | extension end-to-end tests (Chromium) and the extension zip check |
| `lighthouse.yml` | pull requests, manual | LHCI with `lighthouserc.cjs`: builds and audits the Next server on `localhost:4173`, or audits `base_url` (e.g. `https://play.awaketab.com`, asserted as `noindex`) |
| `release.yml` | pushes to `main`, manual | changesets version PR, `@awaketab/wake` npm publish behind `NPM_PUBLISH_ENABLED`, and the launch guard `pnpm keys:check` once `LAUNCH_READY=true` |
| `kv-backup.yml` | Mondays 03:17 UTC, manual | weekly encrypted KV export (§7) |
| `nightly.yml` | 02:00 UTC, manual | `pnpm audit --audit-level high` |

Actions are pinned by major tag on the Node 24 runtime (`actions/checkout@v7`, `actions/setup-node@v7`, `pnpm/action-setup@v6` with `version: 12.17.0`, equal to `packageManager`). Dependabot (`.github/dependabot.yml`) opens weekly grouped minor and patch updates for the workspace and the actions; security updates are enabled in the repository settings. Check `actionlint` locally before changing a workflow.

---

## 3. Local development

Prerequisites: Node 22 (`.nvmrc`), pnpm 12, Playwright browsers for the extension tests (`pnpm exec playwright install chromium`).

```
pnpm install
cp apps/site/.env.example apps/site/.env.local   # or .dev.vars for wrangler; sandbox values only
pnpm -F site run db:migrate:local
pnpm dev                  # the Next site on :3000 with the Worker bindings
pnpm test                 # unit + site
pnpm build && pnpm size
pnpm -F site preview      # the OpenNext Worker build, served locally by wrangler
pnpm -F extension dev     # WXT dev with a temporary Chromium profile
```

`pnpm keys:dev` makes a throwaway licence signing pair and `pnpm keys:prod` the production one (§6). `isSecureContext` is true on `localhost`, so the native wake lock works locally.

---

## 4. Versioning

- Site: no version numbers in URLs; `/changelog` renders fragments newest first with month headings. `/api/health` reports `version` from `COMMIT_SHA` when the Worker has it, else `dev`.
- `@awaketab/wake`, `@awaketab/core`: semver via changesets; `core` is private to the monorepo (not published).
- Extension: semver in the manifest; store release notes from the fragments tagged `ext`.

---

## 5. Monitoring and alerting

| Signal | Source | Threshold → action |
|---|---|---|
| 5xx rate on `/api/*` | Cloudflare zone analytics, Workers observability (logs enabled in `wrangler.jsonc`) | > 1% over 15 min → email + Slack webhook |
| `/api/health` and `/` availability | External uptime check every 5 min (Cloudflare Health Checks or UptimeRobot free) | 2 failures → alert |
| Failed production build | Workers Builds check on the commit, Cloudflare build notifications | any failure → read the build log; nothing was deployed |
| Autostart success (`held` ≤ 300 ms / `session_start`) | Analytics Engine SQL | < 90% for 3 h → alert (likely browser change) |
| `lock_denied` share | AE | > 5% of starts → investigate advice mapping |
| CWV p75 (LCP, INP, CLS) | CrUX API; PageSpeed Insights for lab | INP > 200 ms or CLS > 0.1 on any route class → open issue; ads kill switch per `09-monetization-impl.md` §3 |
| Licence activation errors | AE `client_error {code:'license_verify_failed'}` + Worker logs | > 2% of activations → check Polar status |
| Search Console coverage/indexing | weekly manual review | drops → content backlog |
| Budget regressions | LHCI + size budgets in CI and in the production build command | fail the PR or the build |

Alerts go to a single email and an optional Slack webhook (secret `ALERT_WEBHOOK_URL`). No paid APM.

---

## 6. Security operations

- Deploy credentials: none in GitHub. Workers Builds uses Cloudflare's own build credentials; by-hand deploys use `wrangler login` on the owner's machine. The only Cloudflare token in GitHub is the KV backup's read-only one (§7).
- Runtime secrets are Worker secrets (`pnpm -F site exec wrangler secret put <NAME>`, plus `--env preview`), separate per Worker. The list is in [DEPLOYMENT.md](DEPLOYMENT.md).
- Secret rotation: `RATE_LIMIT_SALT` quarterly; `LICENSE_KEY_ENC_KEY` never without re-encrypting KV (runbook below); ES256 signing key yearly (runbook below).
- Dependencies: Dependabot weekly grouped PRs; `pnpm audit` nightly; lockfile committed and installed with `--frozen-lockfile`.
- CSP report-only for two weeks after any header change, then enforce.
- Webhook endpoint verifies HMAC and rejects timestamps older than 5 minutes; idempotency keys 30 days.
- Access: GitHub 2FA; Cloudflare account 2FA; the Cloudflare GitHub App limited to this repository; Polar org owner only.
- Data requests: "delete my licence data" handled manually from KV by `keyHash` within 7 days (documented on `/privacy`).

**ES256 licence signing key.** The dev pair (`ver` 1) has its private half committed (`scripts/dev-license-key.json`), so production must never trust it. `@awaketab/core` adds it to `LICENSE_PUBLIC_KEYS` only when the bundler defines `__AT_LICENSE_DEV_KEY__` as true; production bundles contain `PRODUCTION_LICENSE_PUBLIC_KEYS` only. `scripts/check-keys.mts` (`pnpm keys:check`) enforces it.

1. On a trusted machine: `pnpm keys:prod`. It prints the next `ver` (2 for the first production key), the public JWK as a ready line, and the private JWK. Nothing is written to disk; do not redirect it into the repository.
2. **(code change, PR)** Paste the public line into `PRODUCTION_LICENSE_PUBLIC_KEYS` in `packages/core/src/license.ts`. `PUBLIC_POLAR_SERVER=production pnpm keys:check` must now report only placeholder checkout links, if any. Merge (production deploys itself) and rebuild the extension zip (`pnpm -F extension zip`) before a store upload.
3. Worker secrets: `printf '%s' '<line>' | pnpm -F site exec wrangler secret put LICENSE_SIGNING_KEY`, then `LICENSE_SIGNING_VER` = the printed `ver`. A secret change takes effect immediately as a new Worker version. Store the private line in the password manager and clear the terminal scrollback.
4. Check: activate a test licence on production; the token header's `ver` is the new one and the app shows Pro offline.
5. Next rotation: the same steps with `ver + 1`, keeping the previous public key for 90 days. Known gap: `/api/license/validate` verifies only against the current signing key, so tokens of the old `ver` get `401 bad_token` and the client re-activates (same device, no extra activation).

**`LICENSE_KEY_ENC_KEY` rotation.** `pnpm kv:reencrypt` (`scripts/kv/`) re-encrypts `keyEnc` on every `lic:*` record from the old key to the new one over the Cloudflare REST API. It changes nothing else in the record (same key, value fields, `expiration` and metadata). Keys come from the environment, never from arguments, so they stay out of shell history.

1. Take a backup first: GitHub → Actions → KV backup → Run workflow, and download the artifact.
2. `openssl rand -base64 32` → the new key; save it in the password manager next to the old one.
3. `pnpm -F site exec wrangler secret put LICENSE_KEY_ENC_KEY` with the new key; it is live at once. From here the Worker writes new-key records; until step 5 finishes, `/api/license/deactivate` cannot open old-key records (Polar deactivation fails and the client retries), so keep steps 3–5 together.
4. Dry run: `OLD_LICENSE_KEY_ENC_KEY=… NEW_LICENSE_KEY_ENC_KEY=… CLOUDFLARE_API_TOKEN=… CLOUDFLARE_ACCOUNT_ID=… pnpm kv:reencrypt --namespace-id <LICENSES id>`. Progress per listing page goes to stderr, a JSON summary to stdout (`scanned`, `rotated`, `alreadyNew`, `noKeyEnc`, `expiring`, `changed`, `failed`). `failed` must be empty.
5. Apply: the same command with `--apply --yes-production`. The API token needs Workers KV Storage **Edit**; use a short-lived personal token, not the backup job's read-only one, and delete it afterwards.
6. Run step 5 again. It must report `rotated: 0` and every record `alreadyNew`. Then delete the old key.

Behaviour: **dry run by default**; `--apply` on a namespace whose title does not contain "preview" (or whose id equals `KV_LICENSES_ID`) also needs `--yes-production`. **Idempotent and resumable** without a state file: each record is tried with the new key first and skipped if it opens, so a re-run after an interruption touches only what is left. **Never guesses:** a record neither key opens is listed in `failed` and not written (exit 1). **Lost-update guard:** each batch is re-read just before the write; a record that changed in between is skipped, listed in `changed`, and the command exits 1 so you run it again. Records expiring within 60 s are skipped (`expiring`). Exit codes: 0 ok, 1 failures or work left, 2 usage or configuration.

---

## 7. Backups and recovery

- **Weekly KV backup.** `.github/workflows/kv-backup.yml` runs Mondays 03:17 UTC and on demand. It runs `pnpm kv:backup` (`scripts/kv/backup.ts`), which lists `lic:*`, `cus:*`, `embed:*`, `ord:*`, the Polar id indexes `lk:*`, `grant:*`, `sub:*`, and `rating:*` (not `wh:*` or `rl:*`: 30-day and 120-second keys) through the Cloudflare REST API, writes one JSONL snapshot per namespace, encrypts it, checks that it decrypts back to the same records, and uploads `LICENSES-YYYY-MM-DD.jsonl.enc` (plus `LICENSES_PREVIEW-…` when configured) as the artifact `kv-backup-<run id>`, kept 84 days. Any API error fails the run, and GitHub emails the owner about failed scheduled runs. The copy lives with a second provider (GitHub), which is what a backup is for.
  - **Format.** Line 1 is a header `{ format: 'awaketab-kv-backup', version: 1, namespace, namespaceId, createdAt, prefixes, count }`, then one `{ key, value, expiration?, metadata? }` per line. A parse rejects truncated files, duplicate keys and malformed lines.
  - **Encryption at rest.** AES-256-GCM with `BACKUP_ENCRYPTION_KEY` (32 bytes, base64): the file is `ATKVBK01` ‖ 12-byte IV ‖ ciphertext + tag, with the magic bytes as AAD. No plaintext licence data reaches the runner's disk or the artifact. The job logs only file name, size and SHA-256, never record counts, because logs of a public repository are public. **Keep `BACKUP_ENCRYPTION_KEY` in the password manager**: without it no backup can be restored.
  - **Secrets** (repository secrets): `CLOUDFLARE_API_TOKEN` (Account → Workers KV Storage → **Read** only), `CLOUDFLARE_ACCOUNT_ID`, `KV_LICENSES_ID`, optional `KV_LICENSES_PREVIEW_ID`, `BACKUP_ENCRYPTION_KEY`. With none set the job logs "KV backup skipped" and succeeds; with only some set it fails and names the missing ones.
  - **Retention.** Artifacts expire after 84 days. For a copy that outlives that, download an artifact monthly into the password manager or an offline drive.
- **Restore: `pnpm kv:restore <file>`** (download and unzip the artifact first):
  - `BACKUP_ENCRYPTION_KEY=… pnpm kv:restore LICENSES-2026-09-28.jsonl.enc` decrypts and validates the file and prints the header and counts per key family. It needs no Cloudflare credentials.
  - Add `--namespace-id <id>` (plus `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`) for a **dry run** against a namespace: `create`, `same`, `conflict`, `expired` and `willWrite`, with up to 20 conflict keys.
  - `--apply` writes missing keys with their original `expiration` and metadata. Conflicts are kept unless you add `--overwrite`. A restore never deletes. `--prefix lic:` (repeatable) limits it to some key families. A production target refuses `--apply` without `--yes-production`.
  - **Drill:** run the workflow once, download the artifact, run `pnpm kv:restore <file>`, then `pnpm kv:restore <file> --namespace-id <LICENSES_PREVIEW id>`.
- Code and tests: `scripts/kv/{backup,restore,reencrypt}.ts` over `scripts/kv/lib/`; the tests in `scripts/kv/test/` run against an in-memory KV store and a fake of the Cloudflare REST API (no network), including a check that the script's `keyEnc` format matches the site's.
- **D1 (sign-in data).** D1 Time Travel keeps point-in-time history of `awaketab-auth` (30 days on the Workers paid plan, 7 on free): `pnpm -F site exec wrangler d1 time-travel info awaketab-auth`, then `wrangler d1 time-travel restore awaketab-auth --timestamp <ISO time>`. For an offline copy: `pnpm -F site exec wrangler d1 export awaketab-auth --remote --output auth.sql`, kept with the KV backups.
- **Site rollback:** Workers dashboard → Deployments, or `wrangler rollback` ([DEPLOYMENT.md](DEPLOYMENT.md#rollback)). Instant, code only; data and secrets stay.
- Analytics Engine has 90-day retention; monthly KPI snapshots in `docs/metrics/` are the long-term record.
- Domains: auto-renew on, registrar 2FA, expiry alerts 60 days ahead; DNS in Cloudflare with change history.

---

## 8. Incident playbook (short)

| Incident | First 15 minutes | Then |
|---|---|---|
| AdSense policy notice | Turn ads off (`NEXT_PUBLIC_ADS_ENABLED` unset in the Workers Builds variables) and redeploy; screenshot the notice | Fix placement, request review, note in `docs/metrics/` |
| `/api/license/*` down or Polar outage | Nothing user-facing breaks (offline verification + grace); post status on `/changelog` if > 1 h | Replay failed webhooks from the Polar dashboard; verify KV consistency |
| Bad deploy (blank page, broken route) | Roll back to the previous Worker version | Add the missing test; postmortem in `docs/incidents/YYYY-MM-DD.md` |
| Production build failing | Nothing was deployed; the previous version keeps serving | Read the Workers Builds log, fix on `main` |
| Browser update breaks the lock | Update advice mapping + support matrix; ship | Update `/learn/browser-support-matrix`, changelog, library patch release |
| Spike of `denied` from one OS | Check advice mapping; add guidance | Device-matrix re-test |
| Domain/TLS issue | Cloudflare dashboard → SSL/TLS and the Worker's custom domains | Registrar lock status |

---

## 9. Cost table (monthly, estimates)

| Item | Free tier covers | Expected cost |
|---|---|---|
| Workers (requests, CPU) | 100k requests/day | $0–5 (Workers paid plan $5 for 10M requests) |
| Workers Builds | build minutes included with the plan | $0 |
| KV | 100k reads/day | $0 (paid plan bundles more) |
| D1 | 5M rows read/day, 5 GB | $0 |
| Analytics Engine | included with Workers paid | $5 (Workers paid) once traffic needs it |
| Domains | — | ≈ $4/mo (four TLDs) |
| GitHub Actions | unlimited for a public repository | $0 |
| Polar | 5% + 50¢ per sale | variable |
| Total infra | | ≈ $5–15/mo before traffic scales |

---

## 10. Launch day

The timed launch runbook (DNS cutover, cache purge, sitemap submission, monitoring watch) is kept with the internal planning records. IndexNow is pinged by every production deploy; run `node scripts/indexnow.mjs` by hand to ping again.
