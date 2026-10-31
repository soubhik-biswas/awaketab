---
name: awaketab-design
description: Use for any AwakeTab UI or UX work (tool page, clock faces, states, settings, content pages, /pro, extension popup, embed). Applies the "Glance" design system from DESIGN.md and the product rules from PRODUCT.md.
---

# AwakeTab design skill

Glance (v3.1, 31 Oct 2026) replaced Volt and Solar Green. Read `docs/plan/glance/AGENT_PROMPT.md` (the brief; it wins over older docs and code), then `DESIGN.md` and the Glance section of `docs/redesign/DECISIONS.md`. The handoff zip and the clickable app are in `docs/plan/glance/`; store and share copy is `docs/plan/glance/LISTING_COPY.md`. Build in `apps/site` (Next.js 16, Tailwind 4, shadcn/ui, Motion; library-first). Pro and sign-in ship switched off (`NEXT_PUBLIC_PRO_ENABLED`, see `docs/plan/PREMIUM-LAUNCH.md`). Colour roles: volt green awake only, violet the button, amber paused, red blocked, sky focus and info. Bricolage Grotesque for display, Inter for UI and digits, Instrument Serif italic for one accent word, Geist Mono for labels. No email anywhere.

The notes below describe the older Clear Night rules; where they disagree with Glance, Glance wins.


Before designing or changing any user-facing UI in this repo:

0. Read `docs/redesign/DECISIONS.md`, open the canvas for the area you touch from `docs/redesign/CANVASES.md`, and take shared UI numbers (header, pill, footer, buttons, cards) from `docs/redesign/PRIMITIVES.md`. Never contradict a Decided item; raise open questions in DECISIONS.md.
1. Read `PRODUCT.md` (users, personality, anti-references, principles), then `DESIGN.md` (tokens, lamp colours, faces, motion, layout, time format). If you touch the tool island, also read the matching section of `docs/05-frontend-spec.md`.
2. Check the contracts in `CLAUDE.md`. Never change the seven pill strings: Ready · Starting… · Screen awake · Paused — tab hidden · Blocked — here's the fix · Tap to use the fallback · Awake via video fallback. Keep `at.v1.*` storage keys, routes, ad rules, budgets, zero hydration and system fonts on tool pages.
3. Design every screen for phone (360–599), tablet (600–1023) and desktop (≥ 1024). Give it both light and dark, with `auto` following `prefers-color-scheme` live.

## Non-negotiables

- **Strict system (DESIGN.md §11):** spacing only 4·8·12·16·20·24·32·40·48·64·96; borders always 1 px (dashed only for choose/add); radii only 8·12·16·20·28·999; control heights 44/48/52/60/64; type scale tokens only, weights 400/500/600; one primary action per screen; no nested cards. Anything else is a bug.

- **State:** pill text + glyph + ring pattern + logo bead together. Never colour alone.
- **Colour:** amber means paused and red means blocked, always. Lamp colours are only aqua, violet, mint or sky.
- **Phone layout:** the actions (+15 min · Stop, or the lamp CTA) sit at the very bottom. The length block sits above them with a 20 px gap.
- **Time:** 12-hour AM/PM in `en`, full date line ("Saturday, 26 September 2026"), "tomorrow" past midnight, and the end time shown before starting.
- **Motion:**
  - slow and ease-out, with no bounce;
  - animate transform, opacity, clip-path and stroke-dasharray only;
  - everything stops under `prefers-reduced-motion`;
  - done in CSS; the island only writes `--at-p` and `data-state`.
- **Interaction:**
  - inline panels over modals;
  - real `<button>`/`<a>` elements;
  - targets ≥ 44 px (60 px primary, 64 px in cook mode);
  - WCAG 2.2 AA contrast;
  - logical CSS properties (RTL).
- **Budgets:** tool JS ≤ 15 KB critical / 40 KB total gz, with about 1 KB of headroom. CSS ≤ 20 KB gz. CLS 0. LCP ≤ 1.2 s.
- **Copy:** plain and honest, no em dashes in new copy (the fixed pill strings are the exception), no marketing adjectives.

## Workflow

- **Prototype first** on the design canvas (`docs/redesign/CANVASES.md`); the `Main` board on the Tool canvas is the reference logic. Get owner approval before changing production UI.
- **Changing a contract?** Update the docs in the same change: `docs/00-conventions.md` first for identifiers, `docs/05` for tokens and components.
- **Before any push:** `pnpm test`, `pnpm test:e2e`, `pnpm build && pnpm test:seo` and the size gate must all be green. `main` auto-deploys.
