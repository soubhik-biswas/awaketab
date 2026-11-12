# Security policy

AwakeTab is maintained by one person. Reports are welcome and read carefully, and this page says honestly what to expect.

## Reporting a vulnerability

Please report security problems privately, not in a public issue.

Use GitHub's [private vulnerability reporting](https://github.com/soubhik-biswas/awaketab/security/advisories/new) ("Report a vulnerability" under the Security tab). The report and any draft fix stay private until an advisory is published.

Useful things to include:

- what is affected (a URL, an endpoint, a file in this repository, or an extension version);
- the steps to reproduce it, and what an attacker gains;
- the browser and operating system, if it matters;
- whether you would like to be credited, and under which name.

Please do not access other people's data, run denial-of-service tests, or use automated scanners at a volume that could affect the live site.

## What to expect

These are aims, not guarantees:

- an acknowledgement within **3 days**;
- an assessment (confirmed or not, and how severe) within **7 days** of the acknowledgement;
- a fix for a critical or high-severity problem within **30 days**, and for others within **90 days**;
- public disclosure through a GitHub security advisory and a changelog note once the fix is released, with credit for your report if you want it.

There is no paid bug bounty.

## In scope

| Area | Where it lives |
| --- | --- |
| The website and the tool at awaketab.com (and the internal test site at play.awaketab.com) | `apps/site` |
| The site's API routes: sign-in, the licence API (`/api/license/activate`, `/validate`, `/deactivate`), checkout and its webhook, embed configuration (`/api/embed/config`), and the event, rating, feedback and CSP report endpoints | `apps/site/app/api`, `apps/site/lib/server` |
| The AwakeTab for Chrome extension | `apps/extension` |
| The `@awaketab/wake` library and the `@awaketab/core` session engine, including licence token verification | `packages/wake`, `packages/core` |
| The embeddable Cook Mode widget (`/embed.js` and `/embed/cook`) | `apps/site/lib/embed`, `apps/site/components/embed` |

Examples of what matters most: a way to unlock Pro features without a valid licence token, reading or changing another person's licence activations, script injection through URL parameters or the embed, the extension gaining access it did not ask for, or the status pill claiming the screen is awake when it is not.

## Out of scope

- Services AwakeTab relies on but does not run, such as Cloudflare, Polar (checkout) and the Chrome Web Store. Please report those to their owners.
- The development licence signing key in `scripts/dev-license-key.json`. It is public on purpose and is only trusted by sandbox builds.
- Purchases in the Polar sandbox. Checkout currently runs in test mode.
- Missing security headers or best-practice findings without a way to exploit them.
- Self-XSS, clickjacking on pages without sensitive actions, and attacks that need a compromised device or browser.
- Denial-of-service and volumetric attacks.
- Operating system or browser limits that AwakeTab already reports, for example a wake lock refused by a site setting.

## If an incident happens

1. **Contain:** turn off the affected feature or endpoint, or roll back the deployment.
2. **Rotate:** replace any exposed secret or signing key, and revoke tokens that may be affected.
3. **Fix:** try the fix on the internal test site (the `play` branch), then merge the same branch into `main` and verify it on the live site, with a test that would have caught it.
4. **Tell people:** publish an advisory and a changelog entry saying what happened, who was affected and what to do.
5. **Learn:** write down the cause and what changes to stop it happening again.

## Supported versions

Only the current `main` branch, the live website and the latest extension build receive security fixes.
