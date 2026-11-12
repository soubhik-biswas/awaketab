# 11 · Embed widget specification — AwakeTab Embed (Cook Mode)

Status: v2.0 · 2026-11-13 (the widget as it is in `apps/site`) · Owner: Soubhik

**Purpose.** Recipe blogs, dashboards and documentation sites can drop one script tag on a page and give their readers a "keep my screen on" control. The widget is a sandboxed iframe of our own app, so it brings the wake lock, the honest status and the eight languages with it. Free embeds carry a credit link in the host page; a Business licence will remove it and add a brand colour.

Related docs: `00-conventions.md` §7, §8, §9 · `04-engine-spec.md` (the lock layer the widget runs on) · `09-monetization-impl.md` §7 (Embed licence).

Where it lives: `apps/site/lib/embed` (`protocol.ts`, the contract the loader and the iframe app share; `loader.ts`; `engine.ts`; `bridge.ts`; `policy.ts`; `config.ts`; `timers.ts`; `clock.ts`; `snippet.ts`), `apps/site/components/embed` (`embed-app.tsx`, `embed-widget.tsx`, `embed-page.tsx`), `apps/site/app/[locale]/(bare)/embed/cook/page.tsx`, `apps/site/app/embed.js/route.ts` and `apps/site/app/api/embed/config/route.ts`.

---

## 1. Integration

What a site pastes, exactly as `/embed` shows it:

```html
<script async src="https://awaketab.com/embed.js" data-mode="cook" data-theme="auto" data-size="compact"></script>
```

| Attribute | Values | Default |
|---|---|---|
| `data-mode` | `cook` · `standard` · `clock` · `minimal` | `cook` |
| `data-theme` | `auto` · `light` · `dark` · `oled` | `auto` |
| `data-size` | `compact` (320 × 104) · `full` (100 % × 240) | `compact` |
| `data-lang` | one of the eight locales | the host page's `<html lang>` (`pt-BR` → `pt-br`, `zh-CN` or `zh-Hans` → `zh`, anything unknown → `en`) |
| `data-preset` | `p15` · `p30` · `p45` · `p60` · `p120` · `p240` · `pinf` · `until` | `pinf` |
| `data-until` | `HH:MM`, with `data-preset="until"` | none |

Unknown values fall back to the defaults. There is no licence attribute: licensing is decided by the verified embedding domain (§4), and a licence key never travels in a URL.

The loader replaces its own tag with the iframe (a tag in `<head>` is moved to `<body>`) and, directly after it in the host page's own HTML, the credit line:

```html
<iframe src="https://awaketab.com/embed/cook?mode=cook&theme=auto&lang=en&size=compact&preset=pinf&host=example.com"
        title="Keep screen awake"
        allow="screen-wake-lock"
        loading="lazy"
        referrerpolicy="strict-origin"
        sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
        style="width:320px;max-width:100%;height:104px;border:0;border-radius:18px;color-scheme:light dark;display:block"></iframe>
<div class="awaketab-credit" style="display:block;margin:16px 0 0;height:24px;font-size:13px;line-height:24px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis"><a
  href="https://awaketab.com/?ref=embed&source=embed" rel="nofollow" style="color:inherit;font:inherit;text-decoration:underline;text-underline-offset:3px">Keep awake by AwakeTab</a></div>
```

- **The iframe.** Its origin is the loader's own origin, so a preview deployment embeds itself. English lives at `/embed/cook`, every other language under its prefix (`/de/embed/cook`). `host` is the embedding page's hostname (`location.hostname`); the full address is never sent. `full` uses `width:100%`, `height:240px` and `border-radius:28px`; the corner matches the widget's (`EMBED_BOX`).
- **The reserved box.** 320 × 104 or 100 % × 240. After inserting the iframe the loader reads the container's width once and reserves the taller layout up front where it applies (`reservedHeight()`: a compact frame under 300 px → 116, a full cook frame under 600 px → 420), so a sidebar or a phone column does not jump after load.
- **The credit.** A plain link in the page's own font and colour, 13 px, underlined, on one reserved 24 px line 16 px below the widget, with the text in the widget's language (`embed.attribution`). Hosts may restyle it through the class. A licensed domain (`{ licensed: true, attribution: false }` from the config endpoint, §2) gets no credit: the loader asks `GET {origin}/api/embed/config?domain=<location.hostname>` once per origin and removes the line when that is the answer. An error, a blocked request or any other answer keeps the line.
- **Why `allow` matters.** A cross-origin iframe may use the Screen Wake Lock API only when the embedding page delegates it with `allow="screen-wake-lock"`. The loader always sets it. For platforms that strip `<script>`, `/embed#allow` gives the bare iframe followed by the credit line as plain HTML (`iframeSnippet()`); a site that drops the attribute gets the "Ask the site owner" notice (§2).
- **The loader itself.** `/embed.js` is a route that serves one self-contained function (`embedLoader` in `loader.ts`) with its settings and the eight frame titles and credit texts inlined, so it needs no separate build and cannot drift from the protocol. It has no dependencies and no `import`, and is cached for one hour (`Cache-Control: public, max-age=3600`), because host sites paste its address.

---

## 2. Widget UI (`/embed/cook`)

The status pill, big digits and Start / Stop (Retry after a refusal). In `cook` mode a tap on the timer pauses it, and the full size adds up to three kitchen timers. There is no credit inside the frame: the loader puts it in the host page (§1). Themes follow `data-theme`; `auto` follows the reader's colour scheme inside the iframe, live.

**Pill.** 30 px tall, 13 px text, a dot that is solid while something is happening and hollow at rest, in the state's colour. It says what the tool's own pill says for the same state (`tool.glance.pill.*`):

| Lock state | Pill |
|---|---|
| `idle` | "Not keeping awake" |
| `requesting` | "Asking the browser…" |
| `held` | "Awake · until 12:26 PM", or "Awake · until you stop" with no end |
| `fallback` | "Awake via video · until 12:26 PM", or "Awake via video · until you stop" |
| `lost` | "Tap to resume · tab was hidden" |
| `denied` | "Not awake · {reason}": the browser said no · needs a secure page · not allowed here |
| `unsupported` | "No wake lock in this browser" |

**Sizes.** `compact` 320 × 104: the pill over the digits, Start / Stop 96 × 44 beside them, radius 18, padding 16. Words that do not fit beside the button, or a frame under 300 px, put the pill on its own row (`fitPill()` in `embed-app.tsx` measures them), and the frame grows to fit. `full` 100 % × 240: the mark, the title "Keep screen awake" and the pill; digits at 28, 48 or 64 px by frame width, with one line under them ("Tap Start to keep the screen awake." · "Asking your browser…" · "Tap the timer to pause" · "until 9:40 PM" · "Since 9:04 PM"); Start / Stop 112 × 52, 128 wide from 600 px and 56 tall in cook mode; a footer line ("Works while this page is visible", or the date in clock mode); radius 28. In cook mode the kitchen timers sit in a 264 px column, or under the main control in a frame under 600 px (420 tall). The iframe never grows on its own: the widget posts its height (§3) and the loader applies it, never below the reserved box.

**Modes.** `cook`: Start / Stop; a tap on the timer pauses and resumes it while the lock stays held; in the full size up to three kitchen timers, with quick-add chips for 5, 10, 15, 30 and 60 minutes, a remove button per row, a bell and a spoken line when one finishes. `standard`: time left, or time awake with no end. `clock`: the time of day. `minimal`: the pill, one line and Start only. A timed session that ends plays the two-tone chime.

**Refusals.** When the frame's permissions policy does not allow `screen-wake-lock`, the notice "Ask the site owner to allow screen wake lock for this widget." with "How to fix" (`https://awaketab.com/embed#allow`) shows at load, as a band along the bottom edge; the widget asks the loader for the extra height. Any other refusal shows the browser's reason where one is known, and the button reads Retry. A browser with no wake lock offers the video fallback, which needs a tap.

**Licensed rendering.** `GET /api/embed/config?domain=<host>` (cached five minutes, `access-control-allow-origin: *`) answers `{ licensed, attribution, theme: { accent, scheme } | null, expiresAt }`. The iframe asks with its **verified** parent hostname (`location.ancestorOrigins[0]`, else the referrer), never the `host=` parameter; a failed or slow lookup (4 seconds) renders the free widget. A licensed accent colours the Start button only, with a black or white label picked for contrast; the pill, the mark and the focus ring keep their state colours, so a state never changes meaning.

---

## 3. postMessage API

Every message is `{ type: 'awaketab:<name>', ...payload }`; anything else is dropped on both sides.

| Direction | Message | Payload |
|---|---|---|
| widget → page | `awaketab:ready` | `{ version: '1' }`, once booted |
| widget → page | `awaketab:state` | `{ lock, status, endsAt, mode }` when the lock or the session changes; `status` is `inactive`, `active` or `paused` |
| widget → page | `awaketab:resize` | `{ height }`, from a `ResizeObserver` on the widget; the loader clamps it to 64–640 and never goes below the reserved box |
| page → widget | `awaketab:start` | `{ preset?: 'p15'…'pinf', ms?: integer 60,000–604,800,000, until?: 'HH:MM' }`; `ms` wins, then `until`, then `preset`, then the tag's own `data-preset` |
| page → widget | `awaketab:stop` | none |
| page → widget | `awaketab:theme` | `{ theme: 'auto' \| 'light' \| 'dark' \| 'oled' }` |

The loader exposes a page-side helper, `window.AwakeTabEmbed`: `{ version, on('ready' | 'state', cb) → off, start(opts), stop(), setTheme(theme) }`, one registry for every tag on the page. Commands sent before a widget is ready are queued. Call `start()` from a click: the native lock needs no gesture, but the video fallback does, and without one the widget says "Tap Start to keep the screen awake."

**Origin checks, both ways.** The loader counts a message only when `event.source` is an iframe it created and `event.origin` is the loader's own origin; it re-validates every command and posts with that origin as the target. The widget accepts a command only from `window.parent`, only when `event.origin` equals its verified parent origin and, when the loader declared `host=`, only when that hostname matches. It posts to that exact origin, never `*`; opened directly, it posts nothing.

---

## 4. Licence and domain binding

- Plan `biz_embed_site_yearly`, per site. Activation binds the key to one registered domain; the config endpoint looks up the host and each parent domain down to two labels, so `www.` and `staging.` resolve to the same record (`embed:{domain}`).
- Removing the credit and colouring Start are the only differences. The wake lock and every mode are the same for free embeds: we never make the reader's experience worse to sell a licence.
- An expired record, or one whose licence is no longer active, answers as unlicensed, so the credit line returns by itself within the five-minute cache.
- Sales are not open yet: `/embed` says "Licences open soon".

---

## 5. WordPress plugin (not built)

`awaketab-cook-mode` on wordpress.org: a shortcode `[awaketab mode="cook" size="compact"]`, a block "AwakeTab — Keep screen on", a settings page for the default theme, and automatic placement under the recipe card for the common recipe plugins when their own cook mode is off. The plugin would only output the loader tag.

---

## 6. Performance

The loader is `async` and blocks nothing, with a budget of 3 KB gzipped; the iframe is `loading="lazy"`, so an embed below the fold costs nothing until it is scrolled to. The widget makes no third-party request and never shows an ad (`00-conventions.md` §8.3); its fonts are the site's own, served from the same origin. The iframe reserves its box before it loads and the credit its 24 px line, so neither shifts the host page. The one exception: on a licensed domain the credit line is removed when the lookup answers.

---

## 7. Security

- **Headers** (`apps/site/lib/server/security-headers.ts`): `/embed/…` and `/{locale}/embed/…` answer with `Content-Security-Policy: … frame-ancestors *`, no `X-Frame-Options` and `X-Robots-Tag: noindex`; the page also carries a `noindex` robots tag. Everything else, the `/embed` landing page included, answers `X-Frame-Options: DENY` and `frame-ancestors 'none'`.
- **Sandbox:** `allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox`. Same-origin is needed for the widget's own storage; popups for "How to fix"; the fourth token lets that link open awaketab.com as a normal tab instead of a sandboxed one. None of them widens anything for the host page.
- **Input:** every query parameter is checked against an allow-list (`mode`, `theme`, `lang`, `size`, `preset`), a time pattern (`until`) or a hostname pattern (`host`). The widget never renders text supplied by the host.
- **Storage:** no cookies. The widget's only stored key is `at.v1.embed.settings` (`{ v: 1, cookTimers }`, at most three) in its own origin's localStorage. Its session lives in memory and it opens no `BroadcastChannel`, so a widget on one site never talks to AwakeTab tabs or to widgets elsewhere.

---

## 8. Analytics

The widget sends no events today. The events endpoint still accepts them (`source: 'embed'`, with the embedding hostname only, never a path or query), for when counting embeds per domain is built. Credit clicks happen in the host page, where we run nothing: they arrive on awaketab.com with `?ref=embed&source=embed`.

---

## 9. Testing

Unit tests: `apps/site/lib/embed/embed.test.ts` (the query allow-lists, language prefixes, malformed commands, the reserved boxes, the snippets with the credit line, the order of `ms`, `until` and `preset`, the kitchen timers, and that the loader is self-contained and replaces its tag).

By hand, on real hosts (not done yet; it needs accounts and devices):

| Host | Check |
|---|---|
| Plain HTML page over HTTPS | loader → iframe → awake within 300 ms of the tap |
| WordPress, Squarespace, Webflow, Ghost | the code block accepts the tag; the host's CSS does not leak in |
| HTTP page | the widget says wake locks need a secure page |
| Iframe without `allow` | the "Ask the site owner" notice with the fix |
| Mobile Safari | the native lock works in the iframe with `allow` |

---

## 10. Sales page `/embed`

One page, no ads: the builder (Mode, Theme and Size as segmented controls; Language and Start length as selects), a live demo of the real widget with the credit line under it, "Install: one line" with the tag and a Copy button, `#allow` ("Why the allow attribute matters", with the iframe fallback to copy), the JavaScript API, and "Licences open soon". The demo and the snippet change together as the builder changes.
