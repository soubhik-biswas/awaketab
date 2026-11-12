# Getting help

AwakeTab is maintained by one person in their spare time. This page shows where to go so your question reaches the right place and gets an answer sooner.

## Read first

Most questions are answered in the user guides on the site:

- [Help](https://awaketab.com/help) and the [FAQ](https://awaketab.com/learn/faq)
- [Honest limits](https://awaketab.com/learn/honest-limits): what a browser can and cannot keep awake
- [Browser support matrix](https://awaketab.com/learn/browser-support-matrix): which browsers and systems AwakeTab supports
- [Device guides](https://awaketab.com/on): steps for specific phones, tablets and computers
- [Service status](https://awaketab.com/status)

If you build with the library, start with the [`@awaketab/wake` README](packages/wake/README.md).

## Where to go

| You want to | Go here |
| --- | --- |
| Ask a question or get help using AwakeTab | [Discussions, Q&A category](https://github.com/soubhik-biswas/awaketab/discussions/categories/q-a) |
| Share an idea before it becomes a feature request | [Discussions](https://github.com/soubhik-biswas/awaketab/discussions) |
| Report a bug you can reproduce | [Bug report form](https://github.com/soubhik-biswas/awaketab/issues/new?template=bug_report.yml) |
| Ask for a feature | [Feature request form](https://github.com/soubhik-biswas/awaketab/issues/new?template=feature_request.yml) |
| Point out unclear or wrong docs | [Documentation form](https://github.com/soubhik-biswas/awaketab/issues/new?template=documentation.yml) |
| Report a security problem | [Private vulnerability report](https://github.com/soubhik-biswas/awaketab/security/advisories/new). Never in a public issue. See [SECURITY.md](SECURITY.md). |
| Report a Code of Conduct concern | See [Enforcement](CODE_OF_CONDUCT.md#enforcement) |

Please search existing issues and discussions first; adding detail to an existing thread helps more than a duplicate.

## A good bug report

The single most useful detail is the exact text the status pill showed, for example "Paused — tab hidden". Also include:

- where it happened: the website, the Chrome or Edge extension, the website widget, or the npm library;
- your browser and its version, your operating system, and the device;
- the steps that led there, what you expected, and what happened instead.

Leave out personal data, licence keys and tokens.

## What to expect

- A first response to issues and discussions within about **7 days**, often sooner.
- An acknowledgement of a security report within **3 days**.
- Answers are best effort. There is no paid support plan, no phone or chat support, and no guaranteed fix date.

See [GOVERNANCE.md](GOVERNANCE.md) for how the maintainer's time is spent and how decisions are made.

## Out of scope

The maintainer cannot help with:

- browsers, versions or devices outside the [support matrix](https://awaketab.com/learn/browser-support-matrix);
- general device support, such as changing a work laptop's power or lock-screen policy, or fixing a device that sleeps for reasons outside the browser;
- keeping chat or meeting apps showing you as "available", or anything that fakes mouse or keyboard activity. AwakeTab deliberately does not do this;
- forks, modified builds or copies of AwakeTab hosted elsewhere;
- problems with services AwakeTab relies on but does not run, such as your browser vendor or extension store.

If a request falls outside this list but you think it should be supported, open a discussion and explain your situation. That is how the support matrix grows.
