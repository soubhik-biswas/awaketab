---
name: awaketab-design
description: Use for any AwakeTab UI or UX work (tool page, clock faces, states, settings, content pages, /pro, extension popup, embed). Applies the "Glance" design system from DESIGN.md and the product rules from PRODUCT.md.
---

# AwakeTab design skill

Before designing or changing any user-facing UI in this repo:

1. Read `docs/plan/glance/AGENT_PROMPT.md` (the Glance brief; it wins over other docs and over code), then `PRODUCT.md`, `DESIGN.md` and the Glance section of `docs/redesign/DECISIONS.md`. The handoff bundle and the clickable app are in `docs/plan/glance/`; store and share copy is `docs/plan/glance/LISTING_COPY.md`.
2. Build in `apps/site` (Next.js 16, Tailwind 4, shadcn/ui, Motion; library-first); the extension is `apps/extension`. Pro and sign-in ship switched off (`NEXT_PUBLIC_PRO_ENABLED`, see `docs/plan/PREMIUM-LAUNCH.md`).
3. Check the contracts in `CLAUDE.md`. Never change the seven pill strings: Ready · Starting… · Screen awake · Paused — tab hidden · Blocked — here's the fix · Tap to use the fallback · Awake via video fallback. Keep the `at.v1.*` storage keys, the routes and the ad rules.
4. Design every screen for phone, tablet and desktop, in light and dark, with the system setting followed live.

## Non-negotiables

- **Colour roles:** volt green means awake only, violet is the button, amber means paused, red means blocked, sky is focus and information. State is never colour alone: the pill text, the glyph and the ring pattern say it too.
- **Type:** Bricolage Grotesque for display, Inter for UI and digits, Instrument Serif italic for one accent word, Geist Mono for labels.
- **Tokens:** take colour, type, spacing and radius from `apps/site/app/globals.css` through their Tailwind names; the extension uses the `--at-*` tokens in `apps/extension/src/styles/tokens.css`. Never add raw values.
- **Time:** 12-hour AM/PM in `en`, a full date line ("Saturday, 26 September 2026"), "tomorrow" past midnight, and the end time shown before starting.
- **Motion:** slow and ease-out, with no bounce; everything stops under `prefers-reduced-motion`.
- **Interaction:** inline panels over modals; real `<button>` and `<a>` elements; targets at least 44 px; WCAG 2.2 AA contrast; logical CSS properties.
- **Copy:** plain and honest, no em dashes in new copy (the fixed pill strings are the exception), no marketing adjectives. No email address anywhere.

## Workflow

- **Changing a contract?** Update the docs in the same change: `docs/00-conventions.md` first for identifiers.
- **Before any push:** `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` and `pnpm size` must all be green. `main` deploys production.
