---
title: "How AwakeTab works — AwakeTab"
description: "AwakeTab asks your browser for a screen wake lock and shows what the browser answered: one pill, one big clock, and an end time you can see."
h1: "How AwakeTab works"
crumb: "How AwakeTab works"
intent: "how does awaketab work"
secondaryQueries:
  - "how does a keep screen awake website work"
  - "what does awake mean in awaketab"
  - "awaketab status pill"
  - "keep screen on without installing anything"
preset: p30
mode: standard
locale: en
reviewed: true
lastVerified: 2026-09-26
browsers: []
os: []
lead: "AwakeTab keeps your display on by asking the browser for a screen wake lock, the same request a video player makes while you watch. It says the screen is awake only after the browser confirms the lock, and the pill at the top of the tool always says, in words, what is happening. There is no account and nothing to download: the whole tool is one page."
toc:
  what-does-awaketab-do: "What it does"
  how-does-a-session-work: "How a session works"
  what-does-the-pill-say: "What the pill says"
  what-happens-when-you-switch-tabs-or-apps: "Switching tabs or apps"
  what-else-can-the-screen-show: "Faces, backgrounds and sound"
  where-do-your-settings-and-data-go: "Your settings and data"
  when-is-the-extension-the-better-fit: "The extension"
  what-does-this-page-not-cover: "Limits"
steps:
  - title: "You pick a length."
    text: "15 min, 30 min, 1 hour, 2 hours or No end. One hour is ready when you land. The line under the button names the end before you start, such as \"Ends at 12:23 PM\". On a keyboard, the left and right arrows change the length and `Enter` starts."
    short: "Pick a length"
  - title: "The browser is asked for a screen wake lock."
    text: "It is the same Screen Wake Lock API a video player uses. The browser can accept, refuse, or take the lock back later, and all three answers show on the pill as they happen."
    short: "Ask the browser"
  - title: "The clock counts down to a fixed end time."
    text: "The end is stored as a time, not as a counter, so a laptop that was suspended comes back with an honest number. Add 5 minutes, 15 minutes or 1 hour from the dock, or pause and resume. When time is up you hear a soft chime and the screen sleeps normally again."
    short: "Count down"
pills:
  - state: idle
    text: "Nothing requested yet. Pick a length and tap Keep awake."
  - state: requesting
    text: "The request is in flight; the browser has not answered."
  - state: held
    text: "The browser confirmed the lock. A timed session names its end instead, such as \"Awake · until 12:26 PM\"."
  - state: lost
    text: "The tab was hidden, so the browser took the lock back, and it wants a tap before it grants a new one."
  - state: denied
    text: "The browser refused the request. The words after the dot give the reason, and a red banner offers See the fix."
  - state: unsupported
    text: "No Screen Wake Lock API here. Tap Use video to keep the screen on another way."
  - state: fallback
    text: "A silent, invisible video is holding the display. It needs this tab visible and uses a little more battery."
rows:
  data:
    - title: "Settings"
      text: "Theme, clock face, background, length, chime and language are saved in this browser's storage. Clear the site's data and they are gone."
    - title: "Presets and history"
      text: "Presets you save and the sessions you finish stay in this browser, in Recents. **Settings → Clear history** removes the history and keeps your presets."
    - title: "The current session"
      text: "Saved in this browser so a reload carries on where you left off."
    - title: "This week"
      text: "How long the screen was kept awake, day by day, counted and kept in this browser only."
    - title: "Feedback"
      text: "Sent only when you press Send in **Settings → Send feedback**: your rating, the topics you ticked, your note, and your browser and device type. It is anonymous."
    - title: "Usage events"
      text: "Counted only if you press Allow on \"Count this visit?\": anonymous page views and sessions, with no cookies, user ids or fingerprints. The [privacy policy](/privacy) lists everything."
notes:
  pill:
    kicker: "Good to know"
    text: "The pill never reads \"Awake\" because you tapped the button. It changes only when the browser answers, so a refused or lost lock is always visible."
faq:
  - q: "Why does the pill say Asking the browser… for a moment?"
    a: "That is the moment between the request and the browser's answer, usually too short to notice. AwakeTab waits for the real answer instead of guessing, so the pill moves on to Awake, or to Not awake with the reason, as soon as the browser replies."
  - q: "Can I use AwakeTab without a mouse?"
    a: "Yes. `Space` starts, pauses and resumes, the arrow keys pick a length, `+` and `-` add or take off 5 minutes, and `Ctrl K` (`⌘ K` on a Mac) opens a palette that lists every command with its key. The tool also works with a screen reader, and the pill is announced when its state changes."
  - q: "Does AwakeTab work offline?"
    a: "Yes, after your first visit. The page is kept by the browser, so a session starts without a connection. Your browser's Install or Add to Home Screen option also puts AwakeTab on a home screen or dock."
honestLimit: "A wake lock keeps the display on only while this tab is visible, and only as long as the browser and the operating system allow it. AwakeTab shows when that stops; it cannot overrule it."
related:
  - "/learn/honest-limits"
  - "/learn/faq"
  - "/learn/browser-support-matrix"
  - "/learn/screen-wake-lock-api-guide"
  - "/extension"
author: soubhik
published: 2026-09-27
updated: 2026-11-13
---

## What does AwakeTab do?

AwakeTab uses the browser's Screen Wake Lock API while its tab is visible. Pick a length, 15 minutes, 30 minutes, 1 hour, 2 hours or no end, tap **Keep awake**, and the display stops dimming and going to sleep. A work idle-lock policy can still lock the screen; that rule belongs to your organisation, not to the browser.

The status is the point. The pill reads "Awake · until 12:26 PM", with your own end time, only while the browser is actually holding the lock. Hide the tab and the browser takes the lock back, so the session pauses until you come back, and AwakeTab asks for a new lock as soon as the tab is visible again.

Nothing needs installing. [Open AwakeTab](/) in any current browser, tap the button and read the pill. It works offline after the first visit, and your browser's Install or Add to Home Screen option puts it on a home screen or dock like an app.

## How does a session work?

Every session goes through the same three steps, whether you start it with a tap, a key or a link such as a preset page.

::steps

Once a session runs, the headline and the length control move out of the way and the clock grows, so you can read it from across the room. After 5 seconds without a touch the controls fade; move the pointer or tap anywhere to bring them back. A session with no end keeps the screen on until you tap Stop.

## What does the pill say?

The pill names the state you are in, in words. Each state has its own words, shape and colour, so you never have to guess from a colour alone.

::pills

::note pill

Two more readings belong to the timer rather than the lock. "Paused · 57 min left" means you pressed Pause: the countdown stands still and the screen may sleep. "Time's up · it slept at 12:26 PM" means the session ended and the screen went back to its normal timeout. When a request is refused, the banner's **See the fix** opens Help & fixes with the real reason, the time it was checked and numbered steps.

## What happens when you switch tabs or apps?

Browsers release a wake lock the moment its page is hidden. Switching tabs, minimising the window, changing apps on a phone and locking the phone all count as hidden. That is a rule every browser follows, not a setting AwakeTab can change.

AwakeTab does not hide this. The tab title changes to "Paused", and the end time stays where it was. When you come back, AwakeTab asks again and the pill returns to "Awake" once the browser agrees. If the browser wants a tap first, the pill reads "Tap to resume · tab was hidden" and one tap carries on. A window that is visible but not focused keeps its lock, so AwakeTab can sit beside the document you are reading.

## What else can the screen show?

The wake lock is the core, and everything else sits around it without touching it. **Faces** (`F`) holds 46 clock faces, grouped as Featured, Digital, Analog and Ambient; Ring is the one you start with, and tapping a tile applies it straight away. **Vibe** (`V`) sets one of six living backgrounds: Aurora, Night sky, Rain on glass, Sunset, Lava lamp or Calm, each at Still, Calm or Lively motion. **Settings** (`,`) has the theme (System, Light, Dark or OLED), the 12-hour clock, the chime, Face studio for your own accent colour, and an ambient mixer of rain, café, fireplace and brown noise.

**Recents** (`R`) keeps your presets and history, with a "This week" card for the time you kept a screen awake. On a desktop browser, the palette's **Open the mini clock** floats a small clock above your other windows while a session runs.

None of this changes the pill: sound never keeps the screen awake, and no face or background hides a paused or refused state. Every face, background and sound is free.

## Where do your settings and data go?

Your settings, the current session, your presets and your history stay in the browser you are using. There is no account, so there is nothing on a server to sign in to.

::rows data

## When is the extension the better fit?

A web page can hold the screen only while it is visible. If you need the display awake behind other windows, or with the browser minimised, [AwakeTab for Chrome](/extension) asks the browser itself instead. It works in Chrome and Edge on desktop, keeps working in any tab, and its status is just as honest. It still cannot stop a laptop from sleeping when the lid closes.

## What does this page not cover?

This page explains the tool. The rules it cannot change, from a closed lid to your chat status, are on [Honest limits: what AwakeTab cannot do](/learn/honest-limits). Which browser versions support the wake lock is on [Wake lock browser support matrix](/learn/browser-support-matrix), and the questions people ask most are answered in [AwakeTab FAQ: the questions we are asked most](/learn/faq).
