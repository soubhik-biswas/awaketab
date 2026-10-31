# Next.js deployment

The active website is `apps/site`, deployed through OpenNext to Cloudflare Workers. `apps/web` and the Pages project `awaketab` are the previous site; their deployments do not publish the Next.js site.

| Branch | Worker | Domains | Data and payments |
| --- | --- | --- | --- |
| `main` | `awaketab-site` | `awaketab.com`, `www.awaketab.com` | Production D1, KV, analytics dataset and Polar |
| `play` | `awaketab-site-preview` | `play.awaketab.com` | Separate preview D1, KV and analytics dataset; Polar sandbox |

Both Git connections use `soubhik-biswas/awaketab`, Node 22, pnpm 9.15.9 and root directory `/apps/site`. Disable automatic branch previews on each Worker: `play` deploys to its own Worker, rather than uploading versions that share production bindings.

Production build command:

```sh
export NODE_OPTIONS=--max-old-space-size=4096 NEXT_PUBLIC_DEPLOY_ENV=production NEXT_PUBLIC_POLAR_SERVER=production && unset CLOUDFLARE_ENV && cd ../.. && pnpm install --frozen-lockfile && pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm size && pnpm -F site exec opennextjs-cloudflare build
```

Production deploy command:

```sh
pnpm exec wrangler d1 migrations apply AUTH_DB --remote && pnpm exec opennextjs-cloudflare deploy
```

The build process receives a 4 GB Node heap inside Cloudflare's 8 GB build container. The preview build uses the same memory setting and checks. Its final OpenNext command is:

```sh
NEXT_PUBLIC_DEPLOY_ENV=play NEXT_PUBLIC_POLAR_SERVER=sandbox CLOUDFLARE_ENV=preview pnpm -F site exec opennextjs-cloudflare build --env preview
```

Preview deploy command:

```sh
pnpm exec wrangler d1 migrations apply AUTH_DB --remote --env preview && pnpm exec opennextjs-cloudflare deploy --env preview
```

Preview runtime bindings and `PUBLIC_SITE_URL=https://play.awaketab.com` come from `env.preview` in `apps/site/wrangler.jsonc`. Its database, KV and analytics IDs must remain different from production. The build variables exclude preview pages through robots.txt, metadata and an HTTP `X-Robots-Tag` header. Canonical links still point to the production domain. Keep payment and sign-in secrets separate; purchases remain disabled until the premium launch checks pass.

Custom domains are declared in Wrangler so later deployments retain the mapping. When moving a domain from Pages, detach that domain from Pages and remove only its conflicting DNS record before attaching it to the correct Worker. Preserve other DNS records and the Pages deployment history.

Verify a deployment using the successful Cloudflare build for the pushed commit, then check the public URL, a Next.js script, `/robots.txt`, `/api/health`, and preview indexing headers. A successful GitHub test run alone does not prove deployment. Workflows must never bypass failing checks to publish.

Test on `play`, then promote through a reviewed pull request into `main`. Keep the previous Pages deployment available for rollback; disable its Git builds after both Worker environments are verified.
