# Roadmap

This is a short, honest picture of where AwakeTab is going. It is a plan, not a promise of dates. The maintainer works on AwakeTab a few hours a week (see [GOVERNANCE.md](GOVERNANCE.md)), so items move when they are ready.

## Vision

AwakeTab is the browser tab that keeps your screen awake and tells you, honestly, whether it is working. Open the page, and the screen stays on; the status pill says "Screen awake" only while the browser has actually confirmed it. It should be calm, readable from across the room, and done in one tap.

## Scope

**AwakeTab is:**

- a free web tool that asks the browser for a screen wake lock, with a video fallback where the browser has none;
- sessions that end after a duration or at a clock time, survive a reload, and tell you when time is up;
- clock faces, ambient views and focus tools that make a screen that stays on pleasant to look at;
- an installable, offline-capable web app in eight languages, accessible to WCAG 2.2 AA;
- a Chrome and Edge extension for keeping the screen awake while you work in another tab;
- an embeddable widget for other websites, and an open-source library, `@awaketab/wake`, for developers.

**AwakeTab deliberately is not:**

- a mouse jiggler or anything that fakes input, and it does not keep Teams, Slack or other apps showing you as "available";
- a way to stop sleep when a laptop lid is closed, or to override a device's or employer's power and lock policy;
- a service that stores your data: the free tool needs no account, and settings, notes and history stay in your browser;
- a place for ads on the awake screen, the floating pill, the widget or the extension;
- a native app, or (for now) a Firefox or Safari extension.

Proposals that fall outside this scope are usually closed with `not-planned` and a short explanation. If you think the scope itself should change, open a discussion.

## Now

Work in progress or next in line:

- **Bring back the browser test suite** for the new site, so user journeys are checked in real browsers on every change.
- **Keep the free tool honest and fast:** fix reported bugs, and refresh the [browser support matrix](https://awaketab.com/learn/browser-support-matrix) after each major browser release.

## Next

Built in the repository, waiting on release work:

- **Publish the extension** to the Chrome Web Store and Edge Add-ons. Today it can be built and loaded unpacked.
- **Publish `@awaketab/wake` and `@awaketab/core` to npm.** Today they can be built from source.
- **Record real-device results** for the device test matrix, so support claims are backed by checks on physical phones, tablets and computers.

## Later

Planned, but not switched on yet:

- **AwakeTab Pro.** Optional extras for people who run several screens: keeping up to five screens in sync, starting or stopping them all from one, and history across devices, with sign-in. It is built and tested in the code but turned off, and nothing can be bought today. Keeping the screen awake stays free, with no account, before and after Pro launches.
- **Recurring schedules**, starting a session automatically at set times while the tab is open.
- **More languages** beyond the current eight, as reviewers become available.

## How to influence the roadmap

- Comment on an existing issue with your situation; real use cases carry the most weight.
- Open a [feature request](https://github.com/soubhik-biswas/awaketab/issues/new?template=feature_request.yml) and say how it fits the scope above.
- Help with an item already listed here; look for issues labelled `help wanted` or `good first issue`.

Shipped changes are listed in the [changelog](https://awaketab.com/changelog).
