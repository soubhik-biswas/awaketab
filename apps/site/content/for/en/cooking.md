---
title: "Keep your screen on while you cook — AwakeTab"
description: "Keep the screen on with floury hands: one tap, a big clock, no install. It works while its tab is visible; on a phone, that is the one catch."
h1: "Keep your screen on while cooking"
crumb: "Cooking"
intent: "keep screen on while cooking"
secondaryQueries:
  - "cook mode keep screen on"
  - "keep iphone screen on for recipe"
  - "keep ipad screen on while cooking"
  - "kitchen timer that keeps screen on"
preset: pinf
mode: cook
locale: en
reviewed: true
lastVerified: 2026-09-26
browsers: ["chrome", "edge", "firefox", "safari", "samsung-internet"]
os: ["ipados", "ios", "android", "windows", "macos", "chromeos"]
lead: "Phones dim and lock after 30 seconds to a few minutes without a touch, and nobody wants to wake a screen with floury fingers. AwakeTab asks your browser for a screen wake lock, so the display stays on for as long as you cook. It works while this tab is on screen, next to the recipe or on its own, and the pill in the tool tells you whether the lock is really held."
toc:
  what-to-expect-while-you-cook: "What to expect"
steps:
  - title: "Open this page on the kitchen device."
    text: "Prop the phone, tablet or laptop where you can read it from the counter. Plug it in if the cook will run long."
  - title: "Tap \"Keep awake · no end\"."
    text: "The button on this page starts a session with no end time, on the Bold face with its large digits. In Safari, this tap is also the one the browser needs before it grants the lock. Wait for the pill to read \"Awake · until you stop\"."
  - title: "Put the recipe beside it."
    text: "On an iPad, a laptop or an Android phone in split screen, open the recipe in a window next to AwakeTab. On an iPhone only one app is on screen, so keep this tab in front and switch to the recipe only when you need the next step."
figures:
  - frame: phone
    label: "Phone screenshot"
    alt: "AwakeTab on the Bold face on iPhone Safari"
    caption: "The Bold face on iPhone Safari."
  - frame: desktop
    label: "Desktop screenshot"
    alt: "a recipe and AwakeTab side by side in Chrome on a laptop"
    caption: "A recipe and AwakeTab side by side in Chrome on a laptop."
pills:
  - state: requesting
    text: "AwakeTab has asked the browser and is waiting for an answer."
  - state: held
    text: "The browser is holding the lock, so the screen stays on while you cook."
  - state: lost
    text: "You switched apps, changed tabs or the phone locked. Come back to this tab and AwakeTab asks again."
  - state: denied
    text: "The browser said no. The banner names the cause, such as Safari wanting one more tap, or Firefox at 5% battery or less while not charging."
checklist:
  - "The phone or tablet is plugged in for a braise or a slow bake."
  - "Low Power Mode is off on iPhone, so Auto-Lock is not forced to 30 seconds."
  - "The oven has its own timer set: AwakeTab keeps the screen on, it does not time the roast."
  - "The pill reads \"Awake · until you stop\" before your hands get messy."
faq:
  - q: "My hands are covered in flour. Do I have to touch the screen again?"
    a: "No. Once the pill reads Awake, the screen stays on without another touch until you stop it. When dinner is ready, tap Stop in the dock at the bottom with a knuckle or the back of a finger; every button there is at least 44 pixels wide."
  - q: "The recipe is in another app. Can I still use AwakeTab?"
    a: "Yes, if both stay on screen. Put the recipe app and your browser in side by side windows on an iPad, or use split screen on Android. On an iPhone only one app shows at a time, so use the recipe site's own cook mode, or a longer Auto-Lock in Settings > Display & Brightness until you finish."
  - q: "Will a long braise drain my battery?"
    a: "The wake lock costs almost nothing; the lit screen is what uses power. For a cook that runs for hours, plug the phone in and turn the brightness down."
  - q: "Does it keep working if the phone locks?"
    a: "No. Pressing the side button or letting the phone lock hides the page, and the browser takes the lock back. Unlock it and return to this tab, and AwakeTab asks the browser again."
honestLimit: "Works while the AwakeTab tab is on screen. On a phone the recipe and AwakeTab cannot both be in front, so opening another app releases the lock until you return, and so does locking the phone."
related:
  - "/on/iphone-safari"
  - "/on/android-chrome"
  - "/on/ipad"
  - "/guides/iphone-auto-lock-never-greyed-out"
  - "/embed"
author: soubhik
published: 2026-09-09
updated: 2026-09-27
---

## Set it up in 30 seconds

::steps

::figures

::ad

## What to expect while you cook

The session on this page has no end time, so nothing interrupts a recipe: the screen stays on until you tap Stop. The Bold face fills the screen with large digits you can read from the counter, and Faces has 45 more if you prefer an analog dial. If you would rather it ended by itself, pick 30 min, 1 hour or 2 hours before you start; a soft chime marks the end and the screen sleeps normally again. AwakeTab does not time the food, so set the oven timer as usual.

The pill at the top of the tool tells you what the browser is doing:

::pills

## Before a long cook

::checklist
