# Governance

AwakeTab is a small open-source project with one maintainer. This page says plainly who decides what, how those decisions are made and recorded, and what happens if the maintainer steps away.

## Who runs the project

AwakeTab follows a solo-maintainer model, sometimes called "benevolent dictator for life". The lead maintainer has the final say on the code, the roadmap, releases and the hosted product at awaketab.com.

| Role | Who | What they can do |
| --- | --- | --- |
| Lead maintainer | Soubhik Biswas ([@soubhik-biswas](https://github.com/soubhik-biswas)) | Approves issues, reviews and merges pull requests, publishes releases, runs the hosted site, owns the domains and package names, and enforces the [Code of Conduct](CODE_OF_CONDUCT.md). |
| Maintainers | None yet | See [Becoming a maintainer](#becoming-a-maintainer). |
| Contributors | Anyone who opens an issue, starts a discussion, reviews or sends a pull request | Propose changes, give feedback and help other people. |

## Time and response windows

The maintainer spends a few hours a week on AwakeTab, usually in batches. Please expect:

- a first response to issues and pull requests within **7 days**;
- an acknowledgement of a security report within **3 days** (see [SECURITY.md](SECURITY.md));
- a first response to Code of Conduct reports within **3 days**.

A first response may simply be "thanks, I need more time" or a label. Holidays and busy weeks happen; if something has waited longer than this, a polite reminder on the thread is welcome.

## How decisions are made

Most decisions happen in the open, on the issue or pull request where they come up.

1. **Proposal.** Someone opens an issue (bug, feature or documentation form) or a discussion. Larger ideas start as an issue before any code is written.
2. **Discussion.** Anyone can comment. The maintainer asks questions, may label the issue `needs-information`, and tries to explain the trade-offs.
3. **Decision.** The maintainer decides. Accepted work gets the `approved` label; work that does not fit gets `not-planned` with a short reason. Only the lead maintainer applies `approved`.
4. **Record.** The reasoning stays on the issue or pull request. Product and design decisions that later work depends on are also written down in the design decisions record ([docs/redesign/DECISIONS.md](docs/redesign/DECISIONS.md)) and the specifications under [docs/](docs/). User-visible changes get a [changelog](https://awaketab.com/changelog) entry.

Decisions can be revisited. If new information turns up, open an issue that links the earlier decision and explains what changed.

### From a branch to the live site

The repository has two long-lived branches, and only the lead maintainer merges into them.

1. A feature branch is cut from `main`.
2. The maintainer merges it into `play`. Cloudflare deploys `play` to play.awaketab.com, a site for internal testing only that is kept out of search.
3. The change is tested there.
4. The same feature branch is merged into `main`, and Cloudflare deploys awaketab.com.

`play` is never merged into `main`, so an unfinished change cannot ride along with a finished one. The automated checks run on every pull request and on every push to `main` and `play`.

### How input is weighed

Every proposal is measured against the same questions, roughly in this order:

1. **Does it keep the status honest?** The status pill must only show what the browser actually confirmed. Nothing that weakens this is accepted.
2. **Is it in scope?** See the vision and scope in [ROADMAP.md](ROADMAP.md). Some things are deliberately left out, such as faking mouse activity or keeping chat presence green.
3. **Who does it help, and how many?** A clear problem from real use counts for more than a hypothetical one.
4. **What does it cost to keep?** Every feature has to be maintained by one person. Small, well-tested changes are much easier to accept than large ones.
5. **Does it respect the contracts?** Lock states, storage keys, routes, performance budgets and privacy rules change only with a documentation update and a good reason.

Reactions and "+1" comments are a useful signal of interest, not a vote.

## Becoming a maintainer

There are no other maintainers today, and the project would welcome them. The usual path:

1. Contribute regularly over a few months: pull requests, reviews, helping people in Discussions, or triaging issues.
2. Show good judgement about scope and the honesty principle, and follow the Code of Conduct.
3. The lead maintainer invites you. You start with the **Triage** role (labels, closing duplicates), and may later get **Write** access when you need it to merge.

New maintainers are added to the table above in a pull request. A maintainer can step down at any time by saying so; access is then removed and their name moves to an "Emeritus" list with thanks.

## Access and least privilege

- **Admin** access to the repository, the domains, the hosting account, the payment account and the npm package is held by the lead maintainer only.
- **Write** or **Triage** access is given only to people who need it for the work they are doing, and removed when they no longer do.
- Everyone with write access or higher must use **multi-factor authentication** on their GitHub account (and on npm, if they can publish).
- Access is **reviewed every six months**, and after anyone leaves. Accounts with no activity for six months lose elevated access; it can be given back on request.
- No deploy credential is stored in GitHub: Cloudflare builds and deploys both sites from its own connection to the repository. The site's runtime secrets live only in the hosting provider's secret store, and the few GitHub Actions secrets (the read-only token for the weekly backup, the token for publishing the library) are scoped to what each job needs. None is ever in the repository, and all are rotated when someone with access leaves or a leak is suspected.
- Workflows run with read-only tokens by default and ask for extra permissions per job.

## If the maintainer steps away

People should not be left guessing if AwakeTab stops being maintained.

- **Planned break** (longer than a month): the maintainer pins an issue saying when they expect to be back. Security reports are still checked.
- **Stepping down:** the maintainer announces it in a pinned issue and the README, and either hands the project to a trusted contributor (transferring the repository, package names and, if they want them, the domains) or archives the repository.
- **Unplanned absence:** if there has been no maintainer activity for six months and no notice, contributors may assume the project is unmaintained and open an issue asking for a handover. The maintainer keeps the account recovery details and a short handover note (accounts, domains, secrets to rotate) somewhere a trusted person can reach.
- **Hosted product:** if the hosted site is going to close, the maintainer gives at least 30 days' notice on the site and in the repository. The free tool stores everything in the visitor's own browser, so nobody loses an account.

AwakeTab is open source: the website (`apps/site`), the extension (`apps/extension`) and the session engine (`packages/core`) under the [GNU AGPL 3.0 only](LICENSE) (`AGPL-3.0-only`), and the `@awaketab/wake` library (`packages/wake`) under the [MIT License](packages/wake/LICENSE). Whatever happens, anyone may fork it and carry it on under those terms. The AwakeTab name and logo are not part of either licence; [TRADEMARKS.md](TRADEMARKS.md) says what a fork may and may not do with them.

## Changing this document

Changes to governance are proposed in a pull request and stay open for at least seven days so people can comment before the maintainer merges them.
