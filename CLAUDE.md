# AwakeTab — agent guide
Purpose: a browser tab that keeps the screen awake, honestly. Monorepo: apps/site (Next.js 16 + Tailwind 4 + shadcn/ui, the Volt site, deployed as the Cloudflare Worker `awaketab-site` through OpenNext), apps/extension (WXT MV3), packages/wake (@awaketab/wake), packages/core (@awaketab/core), scripts/ (licence keys, KV backups, lint helpers), docs/.
Start here: docs/00-conventions.md (identifiers, budgets, gates) → docs/02-prd.md (requirements) → the spec for the area you touch.
Design: PRODUCT.md → DESIGN.md (Glance design system) → docs/plan/glance/AGENT_PROMPT.md (full spec; boards in the handoff bundle) → docs/redesign/DECISIONS.md → skill `.claude/skills/awaketab-design` (Cursor: `.cursor/rules/awaketab-design.mdc`). Internal planning, research and process records live in the private repo SoubhikBiswas-gitHub/awaketab-internal.
Commands: pnpm install · pnpm dev (the Next site on :3000) · pnpm format · pnpm lint (includes pnpm knip: unused files, exports, dependencies) · pnpm typecheck · pnpm test (unit + site) · pnpm build · pnpm -F site preview / deploy (OpenNext on Cloudflare) · pnpm -F extension dev.
Contracts you may not change without a docs update: the seven lock states and pill copy (docs/04, docs/05), storage keys (docs/08), routes and slugs (docs/00 §7), ad placement rules (docs/00 §8.3, docs/09), performance budgets (docs/00 §11), `--at-*` tokens and their shadcn aliases (docs/05 §1.1, §1.5).
Definition of done: acceptance criteria met, tests green, docs updated (00-conventions.md first for identifiers), changelog fragment when user-visible.
Formatting: Prettier (`.prettierrc.json`, 120 columns). Run `pnpm format` before committing; `pnpm lint` checks it.
Code comments: only a short `//` line where the reason is not obvious; no block, JSDoc, HTML or CSS comments (tool directives excepted). `pnpm lint` runs `scripts/comments.mjs`; `--fix` strips them.
Commits and PRs: plain English, no internal codes, no AI attribution; author is the owner.
Testing cadence: every change runs lint, typecheck, unit tests, build and size. The extension has its own Playwright suite (`pnpm test:e2e:ext`); the Next site has no browser e2e suite yet, so check UI changes by hand against the boards. GitHub runs CI on every push to main and on every pull request; hosting and deploys are in docs/DEPLOYMENT.md.

## gstack (REQUIRED — global install)

**Before doing ANY work, verify gstack is installed:**

```bash
_GS=""
for _D in "${GSTACK_ROOT:-}" "$HOME/.claude/skills/gstack" "$HOME/.codex/skills/gstack" "$HOME/.factory/skills/gstack" "$HOME/.kiro/skills/gstack" "$HOME/.config/opencode/skills/gstack" "$HOME/.slate/skills/gstack" "$HOME/.cursor/skills/gstack" "$HOME/.openclaw/skills/gstack" "$HOME/.hermes/skills/gstack" "$HOME/.gbrain/skills/gstack" "$HOME/.copilot/skills/gstack" "$HOME/.gemini/antigravity-cli/skills/gstack" "$HOME/.gemini/skills/gstack" "$HOME/.gstack/repos/gstack"; do
  [ -z "$_GS" ] && [ -n "$_D" ] && [ -d "$_D/bin" ] && _GS="$_D"
done
[ -n "$_GS" ] && echo "GSTACK_OK: $_GS" || echo "GSTACK_MISSING"
```

If GSTACK_MISSING: STOP. Do not proceed. Tell the user:

> gstack is required for all AI-assisted work in this repo.
> Install it:
> ```bash
> git clone --depth 1 https://github.com/garrytan/gstack.git ~/.claude/skills/gstack
> cd ~/.claude/skills/gstack && ./setup --team
> ```
> Then restart your AI coding tool.

Do not skip skills, ignore gstack errors, or work around missing gstack.

Using gstack skills: After install, skills like /qa, /ship, /review
and /browse are available. Use /browse for all web browsing (Aside first, the bundled gstack browser as fallback).
Use the resolved install path above for gstack file paths
(default: ~/.claude/skills/gstack).

The Skill gate in .claude/settings.json runs .claude/hooks/check-gstack.cjs with
Node.js and blocks when it cannot run. If a skill is blocked with "node: not
found", tell the user to install Node.js (https://nodejs.org); if it is blocked
with "Cannot find module ... check-gstack.cjs", the hook file is missing from
this checkout. Do not work around either block.
