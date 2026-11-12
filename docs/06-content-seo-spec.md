# 06 · Content and SEO specification

Status: v2.0 · 2026-11-13 · Owner: Soubhik

**Purpose.** The build rules for everything a search engine or a shared link sees: the information architecture, the page template of every route family, the article frontmatter, titles, descriptions, canonicals, hreflang, the sitemap and robots, JSON-LD, share images, internal linking, the content quality bar, the slug lists with the intent, preset and honest limit of every page, the editorial workflow, freshness and measurement. Identifiers follow `00-conventions.md`.

**Where it lives.** Articles are Markdown files in `apps/site/content/{collection}/{locale}/{slug}.md`, validated by `apps/site/content-collections.ts`. Metadata and JSON-LD come from `apps/site/lib/seo.ts`, indexing and alternates from `apps/site/lib/content.ts`, the sitemap from `apps/site/app/sitemap.ts`, robots from `apps/site/app/robots.ts` and share images from `apps/site/app/og/route.tsx` and `apps/site/public/og`. Page copy that is not an article lives in `apps/site/messages/en.json` (`page.*`, `site.*`).

**Related docs.** `00-conventions.md` §7 (routes, slugs, locales) · `05-frontend-spec.md` (the tool and the page shell) · `07-i18n.md` (translated slugs, string files, translation workflow) · `09-monetization-impl.md` (ad slots, the Pro switch) · `13-testing-strategy.md` · `14-devops.md` (deploys, IndexNow) · `docs/plan/glance/AGENT_PROMPT.md` and `LISTING_COPY.md` (the design brief and the listing copy, which win where they differ).

---

## 1. Information architecture

Hub-and-spoke with one hub (`/`), five spoke families, one product family and one trust family. Every spoke links up to its family hub, sideways to 3–6 siblings, and down to the tool with the length it recommends.

| Family | Route | Count (EN) | Indexable |
|---|---|---|---|
| Home | `/` | 1 | yes |
| Preset pages | `/15m` `/30m` `/45m` `/1h` `/2h` `/4h` `/8h` | 7 | yes (self-canonical) |
| Until deep links | `/until/HH-MM` | 288 | no (`noindex`, canonical `/`) |
| Scenarios | `/for` and `/for/{slug}` | 14 | launch set yes; drafts `noindex` (§3.2) |
| Devices and browsers | `/on` and `/on/{slug}` | 11 | launch set yes; drafts `noindex` |
| Comparisons | `/vs` and `/vs/{slug}` | 7 | launch set yes; drafts `noindex` |
| OS how-tos | `/guides` and `/guides/{slug}` | 7 | launch set yes; drafts `noindex` |
| Docs | `/learn` and `/learn/{slug}` | 8 | launch set yes; drafts `noindex` |
| Product | `/extension` `/embed` `/kiosk` `/library` | 4 | yes |
| Pro (only while `NEXT_PUBLIC_PRO_ENABLED=1`) | `/pro` and its flow pages, `/signin` | | `/pro` yes; the rest `noindex`. While the switch is off they answer 404 and nothing links to them |
| Trust | `/about` `/privacy` `/terms` `/changelog` `/help` | 5 | yes |
| System and apps | `/status` `/offline` `/s/*` `/pip` `/embed/cook` and the not-found page | | no |

`/support-matrix` and `/how-we-tested` answer 301 to `/learn/browser-support-matrix` and `/learn/how-we-tested`, so each topic has one indexable URL.

The English content total is 47 articles (14 + 11 + 7 + 7 + 8): 28 are indexable and 19 are `noindex` drafts until rewritten (§3.2). Each locale has the ten top pages of `07-i18n.md` §5; the tool routes and product pages are English only.

---

## 2. Page templates

Every article shares: one `<h1>` matching the target intent; the answer in the first 100 words; the tool card with the page's preset; a 3–5 item FAQ; breadcrumbs; related links; the author line; a "Sources checked {date}" line where facts depend on software versions; and at most one ad slot, below the tool, drawn only while ads are enabled (`09-monetization-impl.md`).

Whatever a page says about the tool must match the tool: the lengths (15 min, 30 min, 1 hour, 2 hours, No end), the button (Keep awake), the pill wording (`tool.glance.pill.*` in the message files, which the pills and lifecycle blocks read directly), the 46 faces and the shortcuts in `apps/site/components/tool/keys.ts`. A page never names a control the tool does not have.

### 2.1 One article order

Hero (breadcrumbs, family eyebrow, h1, lead, meta row with the full date and reading time, the scene on `/for`, `/on` and `/guides`) → on `/for` the tool card and the ad slot → body sections → honest limit → on `/on`, `/vs`, `/guides` and `/learn` the tool card and the ad slot → questions → related cards → author line. A family may leave a block out; it never moves or restyles one. The body starts at `h2` and never skips a level.

### 2.2 `/` — home

The tool fills the first screen; the story follows it in the home board's order: faces marquee, living backgrounds, the bento, how it works, made for, questions, the closing card, the footer. `<title>` and description are the listing copy's, word for word. While Pro is off, the bento and the questions use their no-Pro wording (`dFree`, `aFree`).

### 2.3 Preset pages `/15m` … `/8h`

Indexable landing pages for "keep screen on for 30 minutes"-type queries and share targets. Sections: hero → tool card with the length → what happens at the end and how to change the length → the honest limit → the other lengths → four guides. `<h1>` "Keep your screen awake for 30 minutes". Self-canonical, English only, no FAQ, no ads.

### 2.4 `/for/{slug}` — scenarios

Tool card first, then the answer paragraph, "Set it up in 30 seconds" (three steps, one phone and one desktop figure), what to expect (the pill states you will see), the honest limit (required, from §12), a checklist, questions and related devices and guides. Word bar 600–1,000.

### 2.5 `/on/{slug}` — devices and browsers

Support statement in the first sentence ("Safari 16.4 and later supports the Wake Lock API; on iPhone the tab must stay in the foreground."), fact chips, steps with menu paths, the support matrix, known blockers linking `/guides/*`, the honest limit, questions. `lastVerified` is required. Word bar 600–900.

### 2.6 `/vs/{slug}` — comparisons

Verdict in the first 100 words, a side-by-side table (mechanism, works with the tab hidden, install needed, platforms, price, last updated), "When the alternative is the better choice" (required, at least two cases), "When AwakeTab is", the honest limit, questions. Competitor names in the `<h1>` as "AwakeTab vs Caffeine"; never disparaging, facts dated. `lastVerified` is required. Word bar 700–1,000.

### 2.7 `/guides/{slug}` — OS how-tos

The how-to is the answer; the tool is the shortcut. Cause in one sentence, numbered steps per OS version, "If the setting is greyed out", the honest limit, then the tool card under "Or skip the settings: open AwakeTab", questions. `lastVerified` is required. Word bar 700–1,100.

### 2.8 `/learn/{slug}` — docs

Abstract in the first 100 words, an `h2` per question, code blocks on API pages, limits, the tool card under "Try it", related. Code samples use `@awaketab/wake`. Word bar 1,000–2,000.

### 2.9 Trust and system pages

`/about`: who makes AwakeTab, how it is checked, what it will not claim, the keyboard map (rebuilt from `keys.ts` whenever a shortcut changes), credits (rebuilt from `apps/site/package.json` and `apps/site/app/fonts.ts`) and how to reach us. `/privacy` and `/terms`: plain language, an "In short" line per section, and dates that change with the text. The privacy policy lists every storage key the site writes and every record the API keeps; it changes in the same commit as the code. `/changelog`: release notes, newest first, each dated, with an RSS feed at `/rss.xml`; notes about Pro stay out while Pro is off. `/help`: search over its topics and every English article. The not-found page offers the timer, the home page, three guides and the help centre.

No page, feed or share image carries an email address: support is Settings → Send feedback.

---

## 3. Article frontmatter

`apps/site/content-collections.ts` defines one Zod schema shared by the five collections; the build fails on a file that breaks it.

| Field | Rule |
|---|---|
| `title` | ≤ 60 characters, ends with " — AwakeTab". The hand-written search title: used for `<title>` when the `h1` is too long (§4) |
| `description` | 70–155 characters, unique per URL and locale |
| `h1` | ≤ 70 characters |
| `intent`, `secondaryQueries` | the target query and up to eight others |
| `preset`, `mode` | the length the page's start button carries (`p15` `p30` `p45` `p60` `p120` `p240` `pinf`) |
| `locale`, `translationOf`, `reviewed` | the folder's locale; the English slug on a translation; `reviewed: false` keeps a translation out of search |
| `lastVerified` | the date the sources were checked; required on `/on`, `/vs` and `/guides` |
| `browsers`, `os` | what the page covers |
| `faq` | 3–5 items, answers 40–600 characters |
| `honestLimit` | 60–400 characters, from §12 |
| `related` | 3–6 English route paths; a translation shows the same-locale page when one exists |
| `noindex` | `true` marks a draft |
| `ogTitle` | ≤ 48 characters, for the share image |
| `published`, `updated` | dates; `updated` (else `published`) is the sitemap `lastmod` and the `dateModified` |
| `lead`, `crumb`, `toc`, `facts`, `toolNote` | the answer paragraph under the h1, the short breadcrumb label, short contents labels by heading id, up to four fact chips, the line above the tool card |

### 3.1 Blocks

Structured parts live in the frontmatter and the body places each one on a line of its own: `::steps`, `::figures`, `::pills`, `::checklist`, `::matrix`, `::rows <key>`, `::compare`, `::picks <key>`, `::code <file>`, `::note <key>`, `::lifecycle`, `::ad`. An unknown name, or a block without its data, fails the build. Strings inside blocks take inline Markdown only. The honest limit is not a block: the template always draws it after the body.

### 3.2 The draft gate

`noindex: true` marks a draft: live, `noindex, follow`, no hreflang, absent from the sitemap and IndexNow. A draft becomes indexable only after a rewrite to its template and a check against the sources.

- **Indexable (28):** `/for/cooking`, `/for/ai-agents`, `/for/presentations`, `/for/work-laptop`, `/for/dashboards`, `/for/classroom`, `/on/iphone-safari`, `/on/macos`, `/on/android-chrome`, `/on/windows-11`, `/on/chromebook`, `/on/ipad`, `/guides/iphone-auto-lock-never-greyed-out`, `/guides/windows-11-screen-turns-off-after-1-minute`, `/guides/mac-prevent-sleep-lid-closed`, `/guides/lock-screen-vs-sleep`, `/guides/second-monitor-turns-off`, `/vs/nosleep-page`, `/vs/caffeine`, `/vs/powertoys-awake`, `/vs/mouse-jigglers`, `/vs/nosleep-js`, `/learn/how-awaketab-works`, `/learn/honest-limits`, `/learn/faq`, `/learn/screen-wake-lock-api-guide`, `/learn/does-a-wake-lock-keep-teams-green`, `/learn/browser-support-matrix`.
- **Drafts (19):** `/for/downloads`, `/for/kiosk`, `/for/sheet-music`, `/for/reading`, `/for/night-clock`, `/for/video-calls`, `/for/teleprompter`, `/for/workouts`, `/on/ios-home-screen`, `/on/samsung-internet`, `/on/linux`, `/on/firefox`, `/on/edge`, `/vs/amphetamine`, `/vs/caffeinate-command`, `/guides/chrome-energy-saver`, `/guides/android-screen-timeout-one-app`, `/learn/low-power-mode-and-wake-locks`, `/learn/how-we-tested`.

---

## 4. Title, description, canonical

- **Title**: "{H1} · AwakeTab", under 60 characters (`titleFor` in `apps/site/lib/seo.ts`). When the `h1` is too long, the page's hand-written `title` is used with the same suffix, then the `h1`'s clause before a colon or question mark, then its crumb; a title is never cut in the middle of a phrase. A title that already names AwakeTab ("AwakeTab vs Caffeine") stands alone, so the brand appears once. The home page keeps "AwakeTab — Keep this screen awake" from the listing copy.
- **Meta description**: 140–155 characters on site pages (the home line is the listing's 134), 70–155 on articles, 70–80 for Japanese and Chinese; it states the answer and the limit, with no ellipsis, no "click here" and no email address; unique per URL and per locale.
- **Canonical**: absolute `https://awaketab.com{path}`, self-referential on every indexable page; `/until/*` is canonical to `/` and `noindex`; query strings are never part of it. No URL has a trailing slash except `/` itself: the locale homes are `/es`, `/de` and so on.
- **Robots**: articles add `max-image-preview:large`. `/pip`, `/embed/cook`, `/until/*`, `/s/*`, the system pages, drafts and unreviewed translations are `noindex`. The preview deployment (`NEXT_PUBLIC_DEPLOY_ENV=play`) is `noindex` everywhere.
- **Open Graph**: `og:type` (`article` on articles), `og:title`, `og:description`, `og:url`, `og:image` with width, height and alt, `og:locale` as language_TERRITORY (`en_US`, `es_LA`, `pt_BR`, `de_DE`, `fr_FR`, `ja_JP`, `zh_CN`, `hi_IN`), `twitter:card = summary_large_image`, and `theme-color` for both colour schemes.

---

## 5. hreflang

- Every indexable page emits one `<link rel="alternate" hreflang="…">` per locale where an indexable translation exists (reciprocal), plus itself, plus `x-default` pointing at the English URL. A page with no translations still emits itself and `x-default`. A `noindex` page emits none.
- Codes: `en`, `es`, `pt-BR`, `de`, `fr`, `ja`, `zh-Hans`, `hi` (`LOCALE_META` in `apps/site/i18n/locales.ts`).
- Locale subfolders only (`/es/for/cocinar`); English is at the root with no `/en/` prefix.
- The sitemap repeats the same alternates. Both come from `alternatesFor()` in `apps/site/lib/content.ts`, so they cannot disagree.
- Translated slugs: `es`, `pt-br`, `de` and `fr` translate slugs through `apps/site/i18n/slugs.json`, keyed by collection and English slug; `ja`, `zh` and `hi` keep the English slug (readable when shared, no percent-encoding). A missing entry falls back to the English slug. Slugs are ASCII, lowercase, hyphenated, ≤ 60 characters.
- A translation is indexable only when its file says `reviewed: true`; a locale home only when `LOCALE_META[locale].reviewed` is true. Until then it is live, `noindex`, out of the sitemap and hreflang, and shows "Translated from English — native review pending" with a link to the English original.

---

## 6. Sitemap and robots

`https://awaketab.com/sitemap.xml` (one file, `apps/site/app/sitemap.ts`) lists the English site pages, then every indexable article with its alternates. `lastmod` is the page's real last change: `updated`, else `published`, on articles, and the newest release note on `/changelog`; a page with no known date gets none. No `<priority>` or `<changefreq>`. Excluded: everything `noindex`, `/api/*`, `/until/*`, and `/pro` while Pro is off.

`robots.txt` (`apps/site/app/robots.ts`) allows everything except `/api/`, `/pip` and each `/{lang}/pip`, `/embed/` (the iframe apps; the `/embed` landing page stays crawlable) and `/dev`, and names the sitemap. No AI-crawler blocks.

---

## 7. Structured data (JSON-LD)

Built by `apps/site/lib/seo.ts`; one `<script type="application/ld+json">` per page holding a `@graph`. Only types that are still rendered or used for entity understanding: `WebSite`, `Organization`, `WebApplication`, `SoftwareApplication`, `Article`, `BreadcrumbList`, `ItemList` (hubs) and `Person`. `FAQPage` and `HowTo` are not emitted; FAQs remain content.

### 7.1 Home

```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://awaketab.com/#org",
      "name": "AwakeTab",
      "url": "https://awaketab.com/",
      "logo": { "@type": "ImageObject", "url": "https://awaketab.com/icons/icon-512.png", "width": 512, "height": 512 },
      "founder": { "@id": "https://awaketab.com/about#person" },
      "sameAs": ["https://github.com/soubhik-biswas/awaketab"]
    },
    {
      "@type": "WebSite",
      "@id": "https://awaketab.com/#website",
      "url": "https://awaketab.com/",
      "name": "AwakeTab",
      "publisher": { "@id": "https://awaketab.com/#org" },
      "inLanguage": "en"
    },
    {
      "@type": "WebApplication",
      "@id": "https://awaketab.com/#app",
      "name": "AwakeTab",
      "url": "https://awaketab.com/",
      "description": "Keeps your screen awake with the browser's Wake Lock API. Presets, until-time, clock modes. No account, no tracking.",
      "applicationCategory": "UtilitiesApplication",
      "operatingSystem": "Any (web browser)",
      "browserRequirements": "Requires a browser with the Screen Wake Lock API (Chrome 84, Edge 84, Firefox 126, Safari 16.4) or a video fallback.",
      "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
      "featureList": ["Screen Wake Lock", "Timer presets", "Until a clock time", "Ambient clock modes", "Picture-in-Picture", "Offline PWA"],
      "screenshot": "https://awaketab.com/screens/phone-held.png",
      "author": { "@id": "https://awaketab.com/#org" },
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.7",
        "ratingCount": "312",
        "bestRating": "5",
        "worstRating": "1"
      }
    }
  ]
}
```

`aggregateRating` is emitted only when `data/ratings.json` holds at least 25 submitted ratings; below that the property is left out. `sameAs` lists only profiles that exist: the public source repository `github.com/soubhik-biswas/awaketab`. Locale homes reuse the same `@id`s and set `inLanguage`.

### 7.2 Articles and hubs

```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Article",
      "@id": "https://awaketab.com/for/cooking#article",
      "headline": "Keep your screen on while cooking",
      "description": "…",
      "inLanguage": "en",
      "datePublished": "2026-09-20",
      "dateModified": "2026-10-04",
      "author": { "@id": "https://awaketab.com/about#person" },
      "publisher": { "@id": "https://awaketab.com/#org" },
      "mainEntityOfPage": "https://awaketab.com/for/cooking",
      "image": "https://awaketab.com/og/en/for/cooking.png",
      "about": { "@id": "https://awaketab.com/#app" },
      "isPartOf": { "@id": "https://awaketab.com/#website" }
    },
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "AwakeTab", "item": "https://awaketab.com/" },
        { "@type": "ListItem", "position": 2, "name": "Scenarios", "item": "https://awaketab.com/for" },
        { "@type": "ListItem", "position": 3, "name": "Cooking", "item": "https://awaketab.com/for/cooking" }
      ]
    }
  ]
}
```

Visible breadcrumbs render the same items. `dateModified` equals the sitemap `lastmod`. Hubs add an `ItemList` of their pages.

### 7.3 `/about`

```json
{
  "@context": "https://schema.org",
  "@type": "Person",
  "@id": "https://awaketab.com/about#person",
  "name": "Soubhik <surname>",
  "url": "https://awaketab.com/about",
  "image": "https://awaketab.com/img/soubhik.jpg",
  "jobTitle": "Developer, AwakeTab",
  "worksFor": { "@id": "https://awaketab.com/#org" },
  "knowsAbout": ["Screen Wake Lock API", "Progressive Web Apps", "Browser power management"],
  "sameAs": ["https://github.com/<handle>", "https://www.linkedin.com/in/<handle>"]
}
```

`/extension` uses `SoftwareApplication` with a free `Offer`. No structured data names a price or a paid plan while Pro is off.

---

## 8. FAQ policy

Each article has 3–5 questions that answer real follow-ups, 40–600 characters each, and never repeat the body. The first item is open and the rest closed, with a plus or minus that shows which. No `FAQPage` markup.

---

## 9. Share images

1200 × 630. Five fixed files in `apps/site/public/og`: og-01 the default (home, tool and system pages), og-02 legal and about, og-04 Pro and sign-in, og-08 the changelog (og-03 is unused). Three templates drawn per page by `/og`: the porcelain use-case card for `/for`, the graphite guide card for devices, comparisons, guides, docs, help, hubs and product pages, and the clock card for shared links. Every image has `og:image:alt`; text stays inside the central 1100 × 560.

---

## 10. Internal linking

- Every article links up to `/` and to its family hub, sideways to 3–6 `related` pages shown as cards with the target's `h1` as anchor text, and down to the tool with the length it recommends, using the duration as anchor ("Start a 30-minute session").
- Anchor text is the target's intent phrase, never "here", "this page" or a bare URL.
- The footer carries the board's four columns, one "More" row for the hubs and product pages the columns leave out, and the language links; a footer link opens the reader's own language when the article is translated.
- Scenario ↔ device ↔ guide triangles are mandatory where they exist (`/for/sheet-music` → `/on/ipad` → `/guides/iphone-auto-lock-never-greyed-out`).
- `/vs/*` pages link to `/learn/*` evidence; external links to competitors are plain citations.
- At most 100 links per page and 12 in the body.

---

## 11. Content quality bar

Every page passes this checklist before publish:

1. **Checked facts**: names the browser and OS versions and the date the sources were checked; a device result is claimed only when the run is recorded.
2. **Specific facts** over adjectives: "Safari 16.4 (March 2023) added the Wake Lock API", not "modern browsers support it".
3. **Honest limit** present and prominent, stating when the page's promise fails.
4. **No templated filler**: no paragraph appears on more than one indexable page.
5. **The reader can act** within the first screen: the tool or the first step is above the fold.
6. **Sources cited** for any claim about a third party, with an access date.
7. **Freshness signal**: `lastVerified` or `updated` visible and truthful.
8. **Native-reviewed** for non-English.
9. Reading level about grade 8, active voice, second person, no em dashes in English prose.
10. Word bar met without padding; shorter is fine if complete.
11. **Matches the tool** (§2): no control, state, length, face count or shortcut the shipped tool does not have, and no Pro, price or sign-in wording while Pro is off.

---

## 12. Slug lists with intent, preset and honest limit

`preset` is the length the page's start button carries; `mode` is kept in the frontmatter and picks the face on the tool card (`cook` draws Bold). Honest limits are the sentence the limit callout must convey (edit for voice, keep the fact).

### 12.1 `/for/` — 14 scenarios

No browser refuses a wake lock because of a battery saver, and no limit below rests on a device test that has not been recorded.

| Slug | Intent (target query) | Preset / mode | Honest limit |
|---|---|---|---|
| `cooking` | keep screen on while cooking | `pinf` / `cook` | Works while the AwakeTab tab is on screen; on a phone the recipe and AwakeTab cannot both be in front, so switching apps releases the lock until you return. |
| `presentations` | keep screen on during presentation | `p120` / `standard` | Full-screen slides hide the tab; use the mini clock (desktop Chrome, Edge 116+, Firefox 151+) or the extension, and the projector still follows the OS display timeout. |
| `downloads` | keep screen on during a long download | `pinf` / `standard` | Keeps the display on while visible, which also stops Windows and macOS idle sleep; closing the lid always sleeps. |
| `ai-agents` | keep computer awake while an ai agent runs | `pinf` / `minimal` | A visible tab keeps the display on; for a terminal job with the screen off, `caffeinate -i` or PowerToys Awake fit better; a closed lid sleeps. |
| `dashboards` | keep dashboard screen on | `pinf` / `minimal` | AwakeTab must stay visible on the same display as the dashboard (side by side, second window or its own monitor). Use `?autostart=1` (Safari needs one tap). |
| `kiosk` | keep screen on kiosk browser | `pinf` / `minimal` | Not a kiosk browser: no lockdown, no auto-launch. Pair it with the OS kiosk mode; see `/kiosk` for wall mode. |
| `sheet-music` | keep ipad screen on for sheet music | `p60` / `minimal` | AwakeTab must stay on screen beside the score app (windowed apps on iPadOS 26, Split View on iPadOS 18 and earlier); Low Power Mode sets Auto-Lock to 30 s. |
| `reading` | keep screen on while reading | `p60` / `minimal` | Only the visible tab is kept awake; for a reading app, use split-screen with AwakeTab beside it. |
| `night-clock` | night clock online oled | `pinf` / `night` | A screen on all night needs power, so plug in. Pixel shift reduces OLED burn-in risk but cannot remove it. |
| `video-calls` | keep screen on during video call | `p60` / `standard` | Does not keep Teams, Slack or Zoom "available": presence follows keyboard and mouse activity, not the display. |
| `teleprompter` | teleprompter keep screen on | `p30` / `minimal` | Not a teleprompter; the prompter page must be visible alongside AwakeTab (side by side or the mini clock). |
| `workouts` | keep screen on during workout timer | `p45` / `clock` | Sweaty taps can stop the session; lock the phone orientation and keep it plugged in for long sessions. |
| `work-laptop` | keep work laptop from locking | `p30` / `standard` | Cannot override lid-close sleep, smart-card removal or a lock policy that isn't the display timeout; will not show you as active in Teams. |
| `classroom` | keep classroom screen on | `p60` / `clock` | Keeps the display on while this tab is visible. A school policy that locks the screen still applies; ask IT about the timeout. |

### 12.2 `/on/` — 11 devices and browsers

| Slug | Intent | Preset / mode | Honest limit |
|---|---|---|---|
| `iphone-safari` | keep iphone screen on safari | `p30` / `standard` | Safari 16.4+ only, after one tap; switching apps releases the lock; Low Power Mode sets Auto-Lock to 30 s (whether the lock still holds under it is not yet device-tested). |
| `ios-home-screen` | keep screen on iphone web app | `pinf` / `clock` | Wake lock in Home Screen web apps needs iOS 18.4+ (iOS 26 opens Home Screen sites as web apps by default); notifications work only in the installed app. |
| `ipad` | keep ipad screen on | `p60` / `minimal` | A tab in the background releases the lock (windowed apps on iPadOS 26; Split View on 18 and earlier); Low Power Mode sets Auto-Lock to 30 s. |
| `android-chrome` | keep android screen on chrome | `p30` / `standard` | Leaving Chrome releases the lock; some makers' sleeping-apps settings can close the tab after you leave it. Battery Saver does not refuse the lock. |
| `samsung-internet` | keep screen on samsung internet | `p30` / `standard` | Samsung Internet 14+ (Chromium 87 base); Samsung's sleeping-apps settings can close the tab after you leave it. |
| `chromebook` | keep chromebook screen on | `pinf` / `standard` | Managed Chromebooks may enforce power policies AwakeTab cannot override; closing the lid sleeps unless "Sleep when cover is closed" is off. |
| `windows-11` | keep screen on windows 11 (and 10; `/on/windows-10` 301s here) | `p60` / `standard` | The lock screen has its own 60-second monitor timeout; the lid follows the lid-close setting. Energy saver does not refuse the lock. |
| `macos` | prevent mac display sleep in browser | `p60` / `standard` | While the display is kept on, the Mac does not idle-sleep; closing the lid still sleeps unless you use clamshell mode with power and an external display. |
| `linux` | keep screen on linux browser | `pinf` / `standard` | Needs a desktop that honours the browser's sleep inhibit (GNOME SessionManager or freedesktop ScreenSaver); device results pending. |
| `firefox` | keep screen on firefox | `p30` / `standard` | Wake lock since Firefox 126 (May 2024); refused at 5 % battery or less while not charging; older versions use the video fallback with higher CPU. |
| `edge` | keep screen on edge | `p30` / `standard` | Edge 84+; sleeping tabs affect only background tabs; Energy saver may dim the screen but does not refuse the lock. |

### 12.3 `/vs/` — 7 comparisons

| Slug | Intent | Preset / mode | Honest limit |
|---|---|---|---|
| `caffeine` | caffeine alternative online | `pinf` / `standard` | Caffeine for Mac holds a macOS power assertion with nothing visible (the F15 key press is Caffeine for Windows); AwakeTab needs a visible tab. |
| `amphetamine` | amphetamine mac alternative | `pinf` / `standard` | Amphetamine is native, has triggers and a closed-display mode; no browser tab can keep a closed Mac awake. |
| `powertoys-awake` | powertoys awake alternative | `pinf` / `standard` | PowerToys Awake keeps the system awake with the display off by default, or on with "Keep screen on"; it stops at the lock screen. AwakeTab needs a visible tab. |
| `caffeinate-command` | caffeinate command alternative | `pinf` / `standard` | `caffeinate -di` prevents idle and display sleep from a terminal; AwakeTab needs its tab on screen. |
| `nosleep-page` | nosleep.page alternative | `p30` / `standard` | Both are tabs and both release when hidden; the difference is the status, the visible end time and session restore. Facts dated. |
| `nosleep-js` | nosleep.js alternative (absorbs nosleep.js vs wake lock; `/learn/nosleep-js-vs-wake-lock` 301s here) | `pinf` / `standard` | NoSleep.js (last release December 2020) uses the Wake Lock API where present and a video otherwise; `@awaketab/wake` is an actively maintained alternative (npm package coming soon); see `/library`. |
| `mouse-jigglers` | mouse jiggler alternative | `pinf` / `standard` | AwakeTab never simulates input and does not keep Teams or Slack green. Jigglers do, and may breach your employer's policy. |

### 12.4 `/guides/` — 7 OS how-tos

| Slug | Intent | Preset / mode | Honest limit |
|---|---|---|---|
| `windows-11-screen-turns-off-after-1-minute` | windows 11 screen turns off after 1 minute | `p60` / `standard` | On managed PCs the setting is locked by policy; the lock screen's 60-second timeout needs the powercfg fix; AwakeTab works only while its tab is visible. |
| `mac-prevent-sleep-lid-closed` | prevent mac sleep lid closed | `pinf` / `standard` | No browser can keep a closed Mac awake; clamshell mode with power and an external display, or a native tool, can. |
| `iphone-auto-lock-never-greyed-out` | iphone auto lock never greyed out | `p30` / `standard` | Low Power Mode, or a work or school profile, locks Auto-Lock; whether a Safari wake lock holds under Low Power Mode is not yet device-tested. |
| `chrome-energy-saver` | chrome energy saver | `p30` / `standard` | Energy Saver throttles background tabs; it does not block a visible tab's wake lock, and neither do OS battery savers. |
| `android-screen-timeout-one-app` | android screen timeout for one app | `p30` / `standard` | Stock Android has no per-app timeout; AwakeTab covers the browser only. |
| `second-monitor-turns-off` | second monitor turns off (absorbs `/for/second-monitor`, which 301s here) | `pinf` / `clock` | Signal-detection sleep, DisplayPort link drops and cables are outside any software's reach. |
| `lock-screen-vs-sleep` | lock screen vs sleep (absorbs modern standby; `/guides/modern-standby` 301s here) | `p30` / `standard` | A wake lock prevents display sleep, not a "require sign-in after N minutes" policy, and it does not control what drivers do in Modern Standby once the screen is off. |

### 12.5 `/learn/` — 8 docs, deep and developer pages

| Slug | Intent | Preset / mode | Honest limit |
|---|---|---|---|
| `how-awaketab-works` | how does awaketab work | `p30` / `standard` | A wake lock holds the display only while the tab is visible and only as long as the browser and OS allow it; AwakeTab shows when that stops. |
| `honest-limits` | what awaketab cannot do | `p30` / `standard` | Each limit rests on documentation and engine source checked 26 September 2026; device results pending. |
| `faq` | awaketab faq | `p30` / `standard` | Answers describe what browsers are built to do; device results pending. |
| `screen-wake-lock-api-guide` | screen wake lock api | `p15` / `standard` | Secure contexts only; released when the document is hidden; `NotAllowedError` for a hidden document, a Permissions-Policy block, Safari without a tap, or Firefox at ≤ 5 % battery. |
| `does-a-wake-lock-keep-teams-green` | does wake lock keep teams status green | `p30` / `standard` | No. Presence follows keyboard and mouse input (Microsoft and Slack documentation); AwakeTab will not change your status. |
| `low-power-mode-and-wake-locks` | low power mode wake lock | `p30` / `standard` | iOS Low Power Mode sets Auto-Lock to 30 s; Chromium and WebKit have no battery-saver check; Firefox refuses at ≤ 5 % battery. Draft until device results exist. |
| `browser-support-matrix` | wake lock browser support | `p15` / `standard` | Checked against browser documentation and engine source on the stated date; device results pending; older versions fall back. |
| `how-we-tested` | how awaketab is checked | `p15` / `standard` | Methodology page: what each claim rests on today, and which device runs are still pending. |

---

## 13. Editorial workflow

1. **Brief**: slug, intent, secondary queries, preset, honest limit and related pages from §12, copied into the frontmatter first.
2. **Draft** (English): outline per template, facts with versions and dates.
3. **Fact-check** against `/learn/browser-support-matrix` and `apps/extension/data/support-matrix.json`: every browser or OS claim matches a row or adds one.
4. **Tool check** (§2, §11 item 11) against the brief, `messages/en.json` and `keys.ts`.
5. **Native review** for translations (`07-i18n.md` §8); English gets a second read for tone.
6. **Publish**: the merge deploys; `published` is set, and `lastVerified` is the date the sources were checked, not the merge date.
7. **After publish**: `node scripts/indexnow.mjs` submits the sitemap's URLs; check Search Console indexing after 7 days.

## 14. Freshness cadence

| Content | Trigger | Action |
|---|---|---|
| Support matrix and `/on/*` | Every Chrome, Edge, Firefox or Safari stable release and every iOS or Android major | Update the rows and `lastVerified`, republish |
| `/guides/*` | Quarterly, or on an OS release that moves the setting | Update the steps |
| `/vs/*` | Quarterly | Check competitor versions, prices and last-shipped dates |
| `/for/*` | Twice a year | Re-check the limits, refresh questions from search queries |
| `/learn/*` | On any contradicting evidence, else yearly | Re-check the sources |
| `/about`, `/privacy`, `/extension` | Whenever the tool, the API or the extension changes | Rebuild the keyboard map, credits, storage keys, records and permissions from the code |
| `/changelog` | Every release | One note per user-visible change |

A page whose `lastVerified` is older than 180 days shows "Sources checked over 6 months ago. Re-checking now.".

## 15. Search Console, Bing, IndexNow

- [ ] Verify `awaketab.com` as a Domain property in Google Search Console (DNS TXT).
- [ ] Submit `sitemap.xml` and check it reports "Success".
- [ ] Bing Webmaster Tools: import from Search Console; submit the same sitemap.
- [ ] IndexNow: the key file is served from `apps/site/public`, and `node scripts/indexnow.mjs` sends every URL the live sitemap lists (indexable pages only) after a production deploy.
- [ ] Set international targeting to none (hreflang handles it).
- [ ] Request indexing by hand for `/` and the first ten pages at launch.
- [ ] Review the Core Web Vitals report weekly.
- [ ] Watch "Page indexing" for "Alternate page with proper canonical tag" spikes, which mean a locale URL is being folded: check hreflang.

## 16. Measurement

Rank tracking: 25 English queries × 8 locales (localised equivalents from `07-i18n.md` §7), weekly, plus Search Console clicks and impressions per family. The 25 English queries:

1. keep screen awake · 2. keep screen awake online · 3. keep screen on · 4. keep my screen on · 5. prevent screen from sleeping · 6. stop screen from turning off · 7. keep computer awake · 8. keep screen on website · 9. nosleep page · 10. nosleep.page alternative · 11. keep screen on while cooking · 12. keep screen on during presentation · 13. keep computer awake while downloading · 14. keep iphone screen on safari · 15. keep chromebook screen on · 16. keep screen on windows 11 · 17. prevent mac display sleep · 18. caffeine alternative online · 19. powertoys awake alternative · 20. screen wake lock api · 21. nosleep.js alternative · 22. does wake lock keep teams green · 23. keep android screen on chrome · 24. keep screen on for 2 hours · 25. awaketab

Targets: at day 30, every indexable page indexed and no draft or unreviewed translation in the index; at day 90, long-tail top-ten positions and organic tool starts growing month on month; head terms are a day-180 goal and depend on links.

## 17. Acceptance criteria

- **FR-SEO-01** Every indexable page has exactly one `<h1>`, a title under 60 characters that names AwakeTab once, a unique description within its length band and a self canonical.
- **FR-SEO-02** Every alternate of a translated page lists all the others plus itself and `x-default`, and the sitemap alternates match.
- **FR-SEO-03** With fewer than 25 ratings in `data/ratings.json`, the home page's `WebApplication` has no `aggregateRating`.
- **FR-SEO-04** With `NEXT_PUBLIC_PRO_ENABLED` off, no indexable page, feed, sitemap entry or structured data names Pro, a price, sign-in or billing.
- **FR-CONTENT-01** Every `/on/*`, `/vs/*` and `/guides/*` page has `lastVerified`, rendered as "Sources checked {date}" with the full date.
- **FR-CONTENT-02** Every pill, length, button and shortcut an article quotes exists in the shipped tool.

`apps/site/app/metadata.test.ts` checks the head of every main route and every English article; `apps/site/app/deployment.test.ts` checks robots and the preview's `noindex`.
