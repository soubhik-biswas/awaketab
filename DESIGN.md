# AwakeTab design system — "Glance"

Status: **current design (v3.1, 31 October 2026).** The build brief is `docs/plan/glance/AGENT_PROMPT.md` (it wins over this file and over code where they disagree, except for the decisions listed below); store and share copy is `docs/plan/glance/LISTING_COPY.md`; reference tokens are `docs/plan/glance/reference-tokens.css`. The boards and prototypes the brief names are not kept in this repository, so the code is the reference for exact values. Product context lives in `PRODUCT.md`; every deliberate difference between the brief and the product is recorded, with its reason, in `docs/redesign/DECISIONS.md`.

People touch AwakeTab for three seconds and look at it for an hour. Every choice serves two jobs: start in one tap, and be calm, beautiful and readable from across the room.

Stack: Next.js 16 (App Router), Tailwind CSS 4, shadcn/ui and TypeScript in `apps/site`; `next-themes` with `light`, `dark`, `oled` and the system setting; fonts through `next/font/google`; Motion for transitions; `lucide-react` icons.

---

## 1. Brand

- **Mark:** a progress ring, read like the clock. The bold arc (300°, clockwise from 12 o'clock) is the time left; a faint full track at 22 % ink is the time used; a green bead on the end of the arc means now. On a 32 grid: ring radius 11, stroke 4, round caps, bead radius 4.6. Code: `apps/site/components/brand/mark.tsx`.
- **Wordmark:** Bricolage Grotesque, "Awake" 700 and "Tab" 500. Clear space is the bead's diameter.
- **Bead colour:** `#3DF58E` on dark, `#117A3B` on light.
- **Approved grounds:** graphite, porcelain, one-colour green and one-colour violet.

## 2. Colour roles (one job each)

| Role | Token | Light (porcelain) | Dark (graphite) | OLED |
|---|---|---|---|---|
| Page | `--background` | `#F4F4F9` | `#05060A` | `#000000` |
| Surface | `--card` | `#FFFFFF` | `#0E1016` | `#05060A` |
| Surface 2 · 3 | `--secondary`, `--surface-3` | `#ECECF4` · `#E3E3EE` | `#15171E` · `#1C1F29` | `#0E1016` · `#15171E` |
| Line · strong line | `--border`, `--border-hi` | ink at 9 % · 18 % | white at 9 % · 18 % | as dark |
| Text · 2 · 3 | `--foreground`, `--muted-foreground-strong`, `--muted-foreground` | `#0B1020` · `#4B5165` · `#5C6275` | `#F2F4FA` · `#A6AFC2` · `#99A1B5` | as dark |
| Green (`volt`) = awake, live only | `--lamp` | `#117A3B` | `#3DF58E` | as dark |
| Violet = the button, act | `--primary` | `#6633F5`, white text | `#9F7BFF`, `#0B0718` text | as dark |
| Amber = paused, needs a tap | `--warning` | `#8A5A00` | `#FFC53D` | as dark |
| Red = blocked, danger | `--destructive` | `#C21D3E` | `#FF6B81` | as dark |
| Sky = focus ring, info | `--info`, `--ring` | `#1C64B8` | `#7CBBFF` | as dark |
| Panel | `--panel` | white at 90 % | `rgba(13,16,30,.86)` | `rgba(6,7,12,.94)` |
| Glass fill | `--glass` | `#FFFFFF` | white at 4 % | white at 3.5 % |

Glass is the fill, a 1 px line and `backdrop-filter: blur(20px) saturate(1.4)`. OLED is a real theme: a pure black page, the living background at 30 % and faces in their OLED drawing. All values live in `apps/site/app/globals.css` (shadcn names, exposed to Tailwind through `@theme inline`); the tool's own palette is `--tg-*` in `apps/site/components/tool/glance.css`, and the faces draw with the face palette. Every text pair is at least 4.5:1, every border, icon and face fill at least 3:1.

Faces show one heat colour for the time left while awake (green, then lime, amber and ember); every other state uses its single status colour, which overrides any accent.

## 3. Type

Bricolage Grotesque 700 for display only (headlines, panel and card titles, the wordmark), tracking −3.5 % to −4.5 %. Inter for every word of UI and the clock digits (Inter Light, tabular figures). Instrument Serif italic for one accent word per headline, at 1.08em with the green → mint → violet gradient, in Latin scripts only. Geist Mono for eyebrows, labels, keys and counts. Japanese and Chinese use the device's own fonts, with no web font to download; Hindi falls back to Noto Sans Devanagari. Faces keep their own character type (Archivo, IBM Plex Serif), loaded only with those faces.

| Use | Spec | Smaller screens |
|---|---|---|
| Page hero | Bricolage 700, 96 / .96, −4.5 % | tablet 68–80, phone 46 |
| Tool headline | Bricolage 700, 64 / .98, −4 % | tablet 52–60, phone 36 |
| Section heads | 52 | tablet 46, phone 34 |
| Panel titles | 30 | phone 26 |
| Card titles | 24 | phone 21 |
| Body | 15–17 | |
| Meta | Geist Mono 12–13, uppercase, wide tracking | |

Nothing renders under 12 px, and weights stop at 700. Times are full 12-hour in English (`11:42 AM`). German, Spanish, French and Portuguese show a 24-hour clock until the person turns on the 12-hour clock in Settings, which every language follows; Japanese and Chinese write 午前 / 午後 and 上午 / 下午, and Hindi names four parts of the day (सुबह, दोपहर, शाम, रात). Dates are written in full.

## 4. Space, shape, size

- Space: a 4 px grid — 4, 8, 12, 16, 20, 24, 32, 48.
- Radius: 12 (controls, chips) · 18 (rows, dock, tiles) · 24–28 (panels, cards) · full (pills, the primary button).
- Focus ring: 2 px sky with a 3 px offset. Every target is at least 44 px.
- **Tool layout:** logo and status pill on the left of the top bar, one glass capsule on the right (Search, Vibe, Faces, Recents, Settings); the clock fills the stage; one glass dock at the bottom in Glance mode. Panels open as a right drawer on desktop and tablet landscape and as a bottom sheet on phone and tablet portrait. No sidebar and no menu.
- **Footer:** the same on every page and always dark (graphite), whatever the page theme. It carries the wordmark as an outline that a spotlight under the pointer lights up, a hand-drawn heart, and a status pill that says what this browser can really do: keep the screen awake itself, or through the video.
- Face sizes (the largest; the stage gives way to a short or narrow window): Set mode 380 · 340 · 480 · 296, Glance mode 560 · 470 · 640 · 340, for desktop, tablet landscape, tablet portrait and phone.
- **Tiers:** phone < 700, tablet portrait 700–1099, tablet landscape 1100–1299, desktop ≥ 1300.

## 5. Motion

| Name | Spec |
|---|---|
| arrive | 420 ms `cubic-bezier(.16,1,.3,1)`, fade plus a 14 px rise |
| drawer | 360 ms slide |
| segmented thumb | 350 ms |
| face size change | 500 ms |
| controls rest | after 5 s idle while awake, 450 ms fade; never while "Keep controls visible" is on |
| shine sweep · border beam | 3.6 s · 5–6 s |
| living backgrounds | 16–22 s |
| live dot pulse | 2 s |

Motion is slow, calm and purposeful. `prefers-reduced-motion` stops every decorative loop; digits still tick. Living backgrounds also stop on Still and when the battery is low and unplugged.

## 6. Icons

`lucide-react`. Every icon sits next to a word or has an `aria-label`.

## 7. States and copy

Nine session states, always words, a glyph of its own shape and a colour, never colour alone: Not keeping awake · Asking the browser… · Awake · until 11:42 AM · Awake via video · until 11:42 AM · Paused · 57 min left · Tap to resume · tab was hidden · Not awake · battery saver · No wake lock in this browser · Time’s up · it slept at 11:42 AM. The full table is `docs/00-conventions.md` §5.1.

Paused is only the person's own Pause. A hidden tab that lost the lock needs a tap; it is never called paused and its clock keeps running. A warning shows only while the browser is really refusing the lock.

## 8. Living backgrounds, faces, screens

Six vibes (Aurora, Night sky, Rain on glass, Sunset, Lava lamp, Calm) with Still, Calm and Lively motion; 46 clock faces, all free, each in light, dark and OLED. A face is not clipped to a rectangle, so its glow and hands are drawn whole, and a reading of ten hours or more uses smaller numerals so it stays inside its dial or card. Screens, panels and their copy are in the brief (§3–§9) and specified for code in `docs/05-frontend-spec.md`.
