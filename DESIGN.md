# AwakeTab design system — "Solar Green"

Status: **approved final design (30 October 2026), being implemented.** It replaces Clear Night. The full spec is `docs/redesign/solar-green/HANDOFF.md`; the build brief is `docs/redesign/solar-green/BRIEF.md`; the reference tokens are `docs/redesign/solar-green/reference-tokens.css`. The visual source of truth is the handoff bundle (`awaketab-handoff.zip`: `prototype/*.dc.html` with their `renderVals()` logic, and `html/*.html`, a static snapshot of every board). Product context lives in `PRODUCT.md`; decisions in `docs/redesign/DECISIONS.md` (Solar Green section).

**Match the boards pixel for pixel.** Every size, gap, radius, weight, colour and string comes from the board source. When the board and this file disagree, the board wins and this file is fixed.

The stack stays Astro 5 with zero hydration (owner decision, 30 Oct 2026). The handoff names Next.js, shadcn components and `lucide-react`; here they become Astro components and vanilla-TS islands that render the same markup, shadcn styling through the tokens at build time, and Lucide icons inlined as SVG.

---

## 1. Brand

- **Mark:** a progress ring with a lit lamp at its tip. Grid 64 × 64, ring radius 21, stroke 9, round caps, a 70° gap from 12 o'clock back to 10:40. Lamp Ø 11.2 at −125°, highlight Ø 3.2, halo Ø 22 at 28 % on dark grounds only. 16 px optical cut: gap 84°, stroke 10, lamp Ø 12.4. Source: `prototype/Mark.dc.html`; code: `apps/web/src/lib/logo-svg.ts`.
- **Wordmark:** Geist 800 "Awake" + 500 "Tab", tracking −3.5 %, minimum lockup height 24 px.
- **Rules:** the lamp is never removed, never orange, never rotated away from 11 o'clock. Its colour follows the session state.

## 2. Colour roles (one job each)

| Role | Token | Light | Dark |
|---|---|---|---|
| Stage / page | `--at-ground` | `#F6F4EF` paper | `#070B16` midnight (OLED `#000`) |
| Card | `--at-surface` | `#FFFFFF` | `#0E1424` (OLED `#05070C`) |
| Surface 2 · 3 | `--at-surface-2`, `--at-surface-3` | `#EFECE5` · `#E6E2D9` | `#151D31` · `#1D273F` |
| Line · input line | `--at-line`, `--at-input-border` | `#DCD7CC` · `#8F887A` | `#26314A` · `#6B7894` |
| Text · 2 · 3 | `--at-ink`, `--at-ink-2`, `--at-muted` | `#0B1020` · `#4B5165` · `#626777` | `#EEF2FA` · `#A9B3C7` · `#8E99AE` |
| Green = awake / live | `--at-accent` (= `--lamp`), `--at-good` | `#117A3B` | `#3BE47F` |
| Orange = act (Start, Pro, share, extend) | `--at-primary` (= shadcn `--primary`) | `#B93D0B` | `#FF6B2C` |
| Amber = paused | `--at-warn` | `#8A5A00` | `#FFC53D` |
| Red = blocked | `--at-bad` | `#C21D3E` | `#FF6B81` |
| Sky = needs you, info, focus ring | `--at-info`, `--at-focus` | `#1C64B8` | `#7CBBFF` |
| Violet = ended | `--at-ended` | `#6D4AD0` | `#C1B1FE` |
| Link | `--at-link` | `#117A3B` | `#7CF0AE` |

Soft fills: `--at-primary-soft`, `--at-lamp-soft`, `--at-warn-soft`, `--at-bad-soft`, `--at-info-soft`, `--at-ended-soft`. Elevation: `--at-elev` (e1), `--at-elev-2` (popover, sheet), `--at-elev-3` (dialog, palette). Glows: `--at-halo`, `--at-primary-glow`; scrim `--at-scrim`. Surfaces for popovers and sheets: `--at-pop`, `--at-sheet`, fields `--at-field`.

Face spectrum (clock faces only, only while awake): `--at-face-{sky,violet,lime,amber,ember}` for text and `--at-face-fill-*` for fills. Heat scale for time left: > 50 % green, 25–50 % lime, 8–25 % amber, last 8 % ember. Every other state uses its single status colour.

Glow and the green → orange aurora appear only behind display type, the mark, hero scenes and the clock. Once a session runs, the chrome goes quiet.

All values live in `apps/web/src/styles/tokens.css`; shadcn aliases (`--primary`, `--lamp`, `--info`, `--ended`, `--link`, the soft fills) map onto them, and `@theme inline` exposes them to Tailwind. Every text pair ≥ 4.5:1, every border, icon and face fill ≥ 3:1.

## 3. Type

Geist for everything, Geist Mono for labels, keys and code, self-hosted (no third-party font request). JA / ZH / HI fall back to Noto Sans JP / SC / Devanagari. Faces also use IBM Plex Serif (Luxe, Words) and DotGothic16 (LED), self-hosted and loaded only with those faces.

| Token | Spec |
|---|---|
| `--at-type-display-2xl` | 104 / .92 / −4 % / 800 |
| `--at-type-display-xl` | 72 / 1.0 / −3.5 % / 800 |
| `--at-type-display-lg` | 56 / 1.05 / −3 % / 700 |
| `--at-type-h1` | 40 / 1.1 / −2 % / 700 (32 under 600 px) |
| `--at-type-count-xl` | 96 / 1 / −3 % / 300, tabular figures |
| `--at-type-h2` · `--at-type-h3` | 28 / 1.2 / 600 · 20 / 1.3 / 600 |
| `--at-type-lead` · `--at-type-body` · `--at-type-small` | 18 / 1.6 · 16 / 1.55 · 14 / 1.5 |
| `--at-type-meta` | Geist Mono 12 / 1.4 / +8 % / 500 |
| `--at-type-code` | Geist Mono 14 / 1.6 |

Tracking tokens: `--at-trk-*`. Nothing renders under 12 px. Times are full 12-hour in English (`11:42 AM`); other locales use their own clock.

## 4. Space, shape, size

- Space: 4 px grid — 4, 8, 12, 16, 20, 24, 32, 40, 48, 72 (`--at-s-*`).
- Radius: xs 6 (kbd, tags) · sm 10 (inputs, tabs) · md 14 (buttons, menus) · lg 20 (cards, sheets) · xl 28 (stage, dialogs) · pill 999.
- Buttons: sm 36 · default 44 · lg 52 · xl 64 · icon 44. Variants primary (orange), lamp (green), secondary, outline, ghost, destructive, link.
- Focus ring: 2 px `--at-focus` with a 2 px offset. Every target is 44 px or has a 44 px hit area.
- Layout: desktop 1440 side nav 232 + tool panel 380; tablet landscape 1194 icon rail 84 + panel 352; tablet portrait 834 bottom tab bar 76 with inset sheets (60 px side margins); phone 390 header 56 + 5-item tab bar 76 with 60 px targets, tools as bottom sheets.
- Face sizes: desktop 440 · tablet landscape 380 · tablet portrait 420 · phone 296 · fullscreen 72 % of the short side (86 % on phone).

## 5. Motion

| Token | Value | Use |
|---|---|---|
| instant | 0 ms | theme switch, reduced motion |
| `--at-d-glide` + `--at-ease-glide` | 80 ms `cubic-bezier(.2,0,0,1)` | hover, press |
| `--at-d-fast` | 120 ms, same curve | toggles, chips, tab underline |
| `--at-d-base` + `--at-ease-base` | 180 ms `cubic-bezier(.2,.8,.2,1)` | status pill, toasts |
| `--at-d-panel` + `--at-ease-panel` | 240 ms spring(1, 260, 26) | sheets, drawer, palette |
| `--at-d-arrive` + `--at-ease` | 520 ms `cubic-bezier(.16,1,.3,1)` | lamp lights, success, face swap |
| `--at-d-ambient` | 4 s loop, ease-in-out | lamp halo, hero float |
| face-live | 1 s steps / 60 s linear | faces while awake |

On the work path only the clock moves. `prefers-reduced-motion` stops every decorative loop and makes state changes instant; digits still tick.

## 6. Icons

Lucide (ISC), inlined SVG: 16 / 2 inline, 18 / 2 chips and menus, 20 / 1.75 buttons, 24 / 1.5 toolbar and empty states. Every icon sits next to a word or has an `aria-label`. The board 09 set is the list.

## 7. States and copy

Nine session states, always icon + words + a solid or hollow dot, never colour alone: Not keeping awake · Starting… · Awake · until 11:42 AM · Needs you · tap to resume · Awake · video fallback (dashed) · Paused · tab hidden · Blocked · battery saver · Ended at 11:42 AM · Not supported here. A hidden tab never says "Awake". The end time appears wherever a duration does (`38:12 left · until 11:42 AM`).

## 8. Components, faces, screens, accessibility

See `docs/redesign/solar-green/HANDOFF.md` §6 (components), §7 (the 33 faces and the `Face` props), §8 (screens, states and boards), §9 (emails), §10 (keyboard map, screen readers, zoom, focus) and §11 (copy rules).
