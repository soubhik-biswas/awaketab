# AwakeTab design system — "Glance"

Status: **current design (v3.1, 31 October 2026), being implemented.** It replaces Volt and Solar Green. The build brief is `docs/plan/glance/AGENT_PROMPT.md` (it wins over every older doc and over old code); store and share copy is `docs/plan/glance/LISTING_COPY.md`; reference tokens are `docs/plan/glance/reference-tokens.css`. The visual source of truth is the handoff bundle (`awaketab-glance-handoff.zip`: `prototype/Tool.dc.html`, `Site.dc.html`, `Page.dc.html`, `Face.dc.html`, `Scene.dc.html` and boards G00–G15, plus `assets/marketing/`).

Decisions that differ from the brief are recorded in `docs/redesign/DECISIONS.md` under "Glance (31 Oct 2026)".

---

The sections below describe Volt and are kept for history until the Glance build replaces them.

# AwakeTab design system — "Volt"

Status: **approved final design (31 October 2026), being implemented.** It replaces Solar Green (30 October), which replaced Clear Night. The full spec is `docs/redesign/volt/HANDOFF.md`; the build brief is `docs/redesign/volt/BRIEF.md`; the reference tokens are `docs/redesign/volt/reference-tokens.css`. The visual source of truth is the handoff bundle (`awaketab-volt-handoff.zip`: `prototype/*.dc.html` with their `renderVals()` logic, and `html/*.html`, a static snapshot of every board). Product context lives in `PRODUCT.md`; decisions in `docs/redesign/DECISIONS.md` (Volt section, then Solar Green and Next.js build).

**Match the boards pixel for pixel.** Every size, gap, radius, weight, colour and string comes from the board source. When the board and this file disagree, the board wins and this file is fixed.

Stack: **Next.js 16 (App Router) + Tailwind CSS 4 + shadcn/ui + TypeScript** in `apps/site`, `next-themes` with `light`, `dark`, `oled` and system, fonts via `next/font/google`, `lucide-react` 0.460.

---

## 1. Brand

- **Mark:** a progress ring with a lit lamp at its tip. Grid 64 × 64, ring radius 21, stroke 9, round caps, a 70° gap from 12 o'clock back to 10:40. Lamp Ø 11.2 at −125°, highlight Ø 3.2, halo Ø 22 at 28 % on dark grounds only. 16 px optical cut: gap 84°, stroke 10, lamp Ø 12.4. Source: `prototype/Mark.dc.html`; code: `apps/site/components/brand/mark.tsx`.
- **Wordmark:** Archivo 800 "Awake" + 500 "Tab", width 112 %, tracking −2 %, minimum lockup height 24 px.
- **Rules:** the lamp is never removed, never violet, never rotated away from 11 o'clock. Its colour follows the session state.
- **Loud vs quiet:** glow and the volt → violet aurora appear only behind display type, the mark, hero scenes and the clock. Once a session runs, the chrome goes quiet.

## 2. Colour roles (one job each)

| Role | Token | Light (porcelain) | Dark (midnight) |
|---|---|---|---|
| Stage / page | `--background` | `#F5F5FA` | `#070B16` (OLED `#000`) |
| Card | `--card` | `#FFFFFF` | `#0E1424` (OLED `#05070C`) |
| Surface 2 · 3 | `--secondary`, `--surface-3` | `#ECECF4` · `#E3E3EE` | `#151D31` · `#1D273F` |
| Line · input line | `--border`, `--input` | `#D9D9E5` · `#878AA0` | `#26314A` · `#6B7894` |
| Text · 2 · 3 | `--foreground`, `--muted-foreground-strong`, `--muted-foreground` | `#0B1020` · `#4B5165` · `#626777` | `#EEF2FA` · `#A9B3C7` · `#8E99AE` |
| Green = awake / live | `--lamp` | `#117A3B` | `#3DF58E` (volt) |
| Electric violet = act (Keep awake, extend, share, Pro) | `--primary` | `#6633F5` | `#9F7BFF` |
| Amber = paused | `--warning` | `#8A5A00` | `#FFC53D` |
| Red = blocked | `--destructive` | `#C21D3E` | `#FF6B81` |
| Sky = needs you, info, focus ring | `--info`, `--ring` | `#1C64B8` | `#7CBBFF` |
| Neutral pearl = ended (calm, never a warning) | `--ended` | `#4B5165` | `#C9D1E0` |
| Link | `--link` | `#117A3B` | `#7CF0AE` |

Soft fills: `--primary-soft`, `--accent` (lamp soft), `--warning-soft`, `--destructive-soft`, `--info-soft`, `--ended-soft`. Hover and press ramps: `--primary-hover/-press`, `--lamp-hover/-press`, `--destructive-hover/-press`. Elevation: `--shadow-e1/e2/e3`; in dark mode height means a lighter surface plus a stronger line. Glows `--halo`, `--primary-glow`; scrim `--scrim`; surfaces `--pop`, `--sheet`, `--field`.

Face spectrum (clock faces only, only while awake): `--face-{sky,violet,lime,amber,ember}` for text and `--face-fill-*` for fills; layered information uses volt · sky · lilac. Heat scale for time left: > 50 % green, 25–50 % lime, 8–25 % amber, last 8 % ember. Every other state uses its single status colour.

All values live in `apps/site/app/globals.css` (shadcn names, exposed to Tailwind through `@theme inline`). Every text pair ≥ 4.5:1, every border, icon and face fill ≥ 3:1.

## 3. Type

Archivo (variable width, set at 112–118 %) for display only: headings, the wordmark, arrival moments (`font-display` + `font-stretch: 112%`). Geist for every word of UI and the clock digits, Geist Mono for labels, keys and code. JA / ZH / HI fall back to Noto Sans JP / SC / Devanagari. Faces also use IBM Plex Serif (Luxe, Words) and DotGothic16 (LED), loaded only with those faces.

| Token | Spec |
|---|---|
| display-2xl | Archivo 112 % · 96 / .96 / −4 % / 800, page hero (tablet 68–80, phone 46) |
| display-xl | Archivo 112 % · 68 / .98 / −3.5 % / 800, the tool hero (tablet 56–60, phone 34) |
| display-lg | Archivo 112 % · 52 / 1.04 / −3.5 % / 800, section heads (tablet 42, phone 32) |
| display-md | Archivo 112 % · 28 / 1.1 / −2.5 % / 800, sheet and dialog titles (phone 24) |
| count-xl | Geist 96 / 1 / −3 % / 300, tabular figures (inside faces) |
| lead | Geist 22 / 1.5 (phone 18); tool subline 19 / 16 |
| h3 | Archivo 112 % · 24 / 1.15 / −2 % / 800, card titles (phone 21) |
| body-lg · body · small | 18 / 1.6 · 17 / 1.55 (phone 16) · 14 / 1.5; controls and chips 16 |
| meta | Geist Mono 12 / 1.4 / +8 % / 500 |
| code | Geist Mono 14 / 1.6 |

Nothing renders under 12 px. Times are full 12-hour in English (`11:42 AM`); other locales use their own clock.

## 4. Space, shape, size

- Space: 4 px grid — 4, 8, 12, 16, 20, 24, 32, 40, 48, 72.
- Radius: xs 6 (kbd, tags) · sm 10 (inputs, tabs) · md 14 (buttons, menus) · lg 20 (cards, sheets) · xl 28 (stage, dialogs) · full (pills, status, presets).
- Buttons: sm 36 · default 44 · lg 52 · xl 64 · icon 44. Variants primary (violet), lamp (green), secondary, outline, ghost, destructive, link.
- Focus ring: 2 px `--ring` with a 2 px offset. Every target is 44 px or has a 44 px hit area.
- **Tool layout (every device):** header (logo · status pill · Menu), the clock fills the stage, ONE floating control bar at the bottom (Length, or Extend while running · main action · Face · Fullscreen). Tools rise as one floating sheet above the bar (600 wide; faces 860); Menu opens as a 400-wide list under the header. No sidebar, tab bar or header dock. Desktop 1440 × 900 and tablet landscape 1194 × 834 share the layout (header 64); tablet portrait 834 × 1194 uses compact chips (15m · 30m · 1h · 2h · ∞) and a face thumbnail; phone 390 × 844 has a 56 header, the pill above the clock, a two-row bar in the thumb zone and classic bottom sheets.
- Face sizes: desktop 480 · tablet landscape 440 · tablet portrait 600 · phone 336 · fullscreen 72 % of the short side (86 % on phone).
- **Website tiers:** phone < 700 (one column, 20 px margins), tablet portrait 700–1099 (40 px, two-column grids, stacked hero), tablet landscape 1100–1299 (64 px), desktop ≥ 1300 (96 px).

## 5. Motion

| Token | Value | Use |
|---|---|---|
| instant | 0 ms | theme switch, reduced motion |
| glide | 80 ms `cubic-bezier(.2,0,0,1)` | hover, press |
| fast | 120 ms, same curve | toggles, chips, tab underline |
| base | 180 ms `cubic-bezier(.2,.8,.2,1)` | status pill, toasts |
| panel | 240 ms spring(1, 260, 26) | sheets, drawer, palette |
| arrive | 520 ms `cubic-bezier(.16,1,.3,1)` | lamp lights, success, face swap |
| ambient | 4 s loop, ease-in-out | lamp halo, hero float |
| face-live | 1 s steps / 60 s linear | faces while awake |

On the work path only the clock moves. `prefers-reduced-motion` stops every decorative loop and makes state changes instant; digits still tick.

## 6. Icons

Lucide 0.460 (ISC): 16 / 2 inline, 18 / 2 chips and menus, 20 / 1.75 buttons, 24 / 1.5 toolbar and empty states. Every icon sits next to a word or has an `aria-label`. Board 09 lists the 95 icons.

## 7. States and copy

Nine session states, always icon + words + a solid or hollow dot, never colour alone: Not keeping awake · Starting… · Awake · until 11:42 AM · Needs you · tap to resume · Awake · video fallback (dashed) · Paused · tab hidden · Blocked · battery saver · Ended at 11:42 AM · Not supported here. A hidden tab never says "Awake". The end time appears wherever a duration does (`38:12 left · until 11:42 AM`).

## 8. Components, faces, screens, accessibility

See `docs/redesign/volt/HANDOFF.md` §6 (components), §7 (the 49 faces and the `Face` props), §8 (screens, states and boards), §9 (emails), §10 (keyboard map, screen readers, zoom, focus) and §11 (copy rules).
