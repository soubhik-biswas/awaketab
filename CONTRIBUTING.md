# Contributing to AwakeTab

Thanks for helping. AwakeTab is a browser tab that keeps your screen awake and tells you honestly when it can't. The one promise behind every change: **the status pill never lies.**

This guide covers setup, how to send a change, the house rules and where the docs live. By taking part you agree to the [Code of Conduct](CODE_OF_CONDUCT.md).

## Set up

You need Node.js 22 and pnpm 12.17.0. The setup script checks both and does the rest:

```bash
git clone https://github.com/soubhik-biswas/awaketab.git
cd awaketab
node scripts/setup.mjs            # or, once pnpm is installed: pnpm run setup
pnpm dev                          # http://localhost:3000
```

The script checks for Node.js 22 and tells you how to switch with nvm or fnm if needed. It enables pnpm 12.17.0 through Corepack, runs `pnpm install` and creates `apps/site/.dev.vars` from `apps/site/.env.example` (an existing file is never overwritten). Add `--with-browsers` to also install Playwright Chromium for the extension's end-to-end tests, or `--dry-run` to see what it would do.

The website is `apps/site`; its service settings are in [`apps/site/.env.example`](apps/site/.env.example). See [Next.js deployment](docs/DEPLOYMENT.md) for hosting and branch settings.

Use `pnpm run setup`, not `pnpm setup`. `pnpm setup` is a built-in pnpm command that configures `PNPM_HOME`, and it wins over the package script.

Useful commands:

| Command                 | What it does                                                          |
| ----------------------- | --------------------------------------------------------------------- |
| `pnpm dev`              | Next.js dev server for the website and tool                           |
| `pnpm -F extension dev` | The Chrome extension in development mode (WXT)                        |
| `pnpm format`           | Prettier over the repository                                          |
| `pnpm lint`             | Comment rule, Prettier check, Knip, ESLint and Stylelint              |
| `pnpm knip`             | Unused files, exports and dependencies (Knip, `knip.json`)            |
| `pnpm typecheck`        | TypeScript in every workspace                                         |
| `pnpm test`             | Shared-package, extension and Next.js site tests (Vitest)             |
| `pnpm build`            | Builds every package, the site and the extension                      |
| `pnpm size`             | Bundle size budgets                                                   |
| `pnpm test:e2e:ext`     | Playwright tests for the extension                                    |

## Branches and pull requests

- Contributions target `main`, which is production. Use descriptive branches in your fork. When a change needs checking on a live deployment first, the owner deploys its branch to the preview at play.awaketab.com.
- `main` deploys the website automatically, so it only takes changes through pull requests.
- Only `soubhik-biswas` may approve an issue by applying `approved`. Link approved work in your PR using `Closes #123` or `Tracks: #123`.
- Keep a pull request to one topic. Fill in the template: what changed, why, and how you checked it. See the [task lifecycle guide](.github/COMMUNITY_WORKFLOW.md).
- For anything people can see, add screenshots in light and dark.
- User-visible changes get a short changelog fragment in `changelog/` (copy the front matter of an existing one).

## House rules

**Commits.** Use [Conventional Commits](https://www.conventionalcommits.org/) in plain English that a new teammate understands: `fix: keep the pill paused while the tab is hidden`, `docs: explain the embed credit line`. Describe the change itself. Do not use internal ticket or decision codes in commit messages, branch names, code or docs you add. Do not add AI attribution lines (no "Co-Authored-By" for tools, no "Generated with" footers).

**Formatting.** Run `pnpm format` before every commit. Prettier uses 120 columns.

**Comments.** Only a short `//` line where the reason is not obvious. No block comments, JSDoc, or HTML and CSS comments (tool directives such as `eslint-disable` are fine). `pnpm lint` runs `scripts/comments.mjs` to check this, and `node scripts/comments.mjs --fix` strips them.

**Unused code.** `pnpm knip` (also part of `pnpm lint`) fails on files, exports and dependencies nothing uses. Delete them rather than silence them. If something is used in a way Knip cannot see (a file read by path, a script run by hand), add the narrowest entry or ignore to `knip.json` and say why in the pull request.

**Tests.**

- Before every commit: `pnpm lint`, `pnpm typecheck` and `pnpm test`.
- Before pushing: `pnpm build` and `pnpm size`.
- Extension Chromium end-to-end tests (`pnpm test:e2e:ext`) run in CI on every pull request; nightly runs dependency auditing. The website has no browser end-to-end suite yet, so check visible changes by hand.

**Design.** AwakeTab has one design system, Clear Night. Read [PRODUCT.md](PRODUCT.md) and [DESIGN.md](DESIGN.md) before touching anything visible.

- Use the design tokens in `apps/site/app/globals.css` (through their Tailwind names) for colour, type, spacing, radius and size; the extension uses the `--at-*` tokens in `apps/extension/src/styles/tokens.css`. Never add raw values.
- Reuse the shared components in `apps/site/components/site/` (header, footer, page shell) and `apps/site/components/ui/` (shadcn/ui primitives such as buttons).
- Every screen works in light and dark, from 320 px phones to large desktops, and every animation stops under `prefers-reduced-motion`.
- Amber always means paused and red always means blocked.

**Contracts.** Some things may not change without updating the docs in the same pull request:

- the seven lock states and their exact pill copy;
- storage keys;
- routes and slugs;
- ad placement rules;
- performance budgets;
- the `--at-*` tokens.

`CLAUDE.md` lists where each one is specified. Update `docs/00-conventions.md` first for any identifier.

## Where the docs live

| Path                                                                              | What is there                                                           |
| --------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)                                         | Current Next.js Worker deployment and isolated preview setup            |
| [docs/00-conventions.md](docs/00-conventions.md)                                  | Canonical names, routes, storage keys, budgets and gates. Read it first |
| [docs/02-prd.md](docs/02-prd.md)                                                  | Requirements with acceptance criteria                                   |
| [docs/03-architecture.md](docs/03-architecture.md)                                | Monorepo, runtime, build and security                                   |
| [docs/04-engine-spec.md](docs/04-engine-spec.md)                                  | The seven lock states and every transition                              |
| [docs/05-frontend-spec.md](docs/05-frontend-spec.md)                              | Components, state to UI mapping, keyboard, accessibility                |
| [docs/10-extension-spec.md](docs/10-extension-spec.md)                            | The Chrome extension                                                    |
| [docs/11-embed-spec.md](docs/11-embed-spec.md)                                    | The Cook Mode embed widget                                              |
| [docs/12-library-spec.md](docs/12-library-spec.md)                                | The `@awaketab/wake` library                                            |
| [docs/13-testing-strategy.md](docs/13-testing-strategy.md)                        | What each test suite proves                                             |
| [docs/redesign/DECISIONS.md](docs/redesign/DECISIONS.md)                          | Design decisions of the Clear Night redesign                            |
| [DESIGN.md](DESIGN.md) and [docs/redesign/CANVASES.md](docs/redesign/CANVASES.md) | The Clear Night design system and links to its 12 design canvases       |

## Reporting bugs

Open an issue with the **Bug report** form. The most useful details are:

- the browser and version, and the operating system;
- the exact text the status pill showed (for example "Paused — tab hidden");
- the steps that led there, and what you expected instead.

Please do not report security problems in public issues. See [SECURITY.md](SECURITY.md).

## Licence

By contributing you agree that your contributions are licensed under the [MIT License](LICENSE).
