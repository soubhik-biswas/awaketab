# AwakeTab extension release guide

AwakeTab — Keep your screen awake is preparing the **1.0.1** artwork update for its first Chrome Web Store release. Version 1.0.0 was submitted on 2026-10-23; it must not be uploaded again. The existing item ID is `kphiinpjmodhjfojkleoigcgiakahfpk`. This guide records the packaging workflow; the publisher dashboard determines submission, review and publication status.

## Release scope

Everything is free: the popup (15 min, 30 min, 1 hour or no end, with Pause, Resume and Stop), the toolbar badge, the Alt+Shift+A shortcut, the end chime and the options (badge timer, auto-wake on chosen sites, release when the tab is hidden). Pro is optional and only syncs many screens; nothing in the extension is locked.

## Packaging and recovery

Use Node.js 22 and the repository's pnpm 9.15.9. Complete the root README's setup first. From the repository root:

Packaging includes the current working tree, including pending edits. Inspect `git status` and `git diff` before running it, and record the source revision and any pending changes with the release evidence.

```bash
# First release only, while this exact version has never been uploaded:
pnpm -F extension publish:package --current

# Later releases: interactive patch / minor / major selection:
pnpm -F extension publish:package

# Explicit noninteractive choice, or a custom destination:
pnpm -F extension publish:package patch
pnpm -F extension publish:package --current --output-dir /path/to/output
```

The command follows the local packaging convention used by DOM Scanner Pro and Prismwink:

1. Lock against overlapping package runs and refuse to overwrite an existing ZIP.
2. Use `apps/extension/package.json` as the version source; WXT derives the manifest version from it. pnpm's workspace lockfile contains no extension version metadata to change.
3. For a version bump, update the package metadata; `--current` preserves the original bytes.
4. Run extension type checks, extension/core/wake unit and build tests, and the installed-extension browser suite.
5. Build with `PUBLIC_POLAR_SERVER=production`, `PUBLIC_PAYMENTS_ENABLED=0`, no test hooks and no missing-key waiver. The build checks production licence keys and scans the bundle for the development key.
6. Rebuild twice in production mode and compare ZIP hashes. Compare the packaged ZIP with the production build byte for byte, including the root manifest and the product/version identity.
7. Install the ZIP atomically as `~/Desktop/AwakeTab-v<version>.zip` and print its size and SHA-256.

This command creates a local package. It does not upload, submit, publish to npm, commit, push or tag. Review the version change after a successful bump. Before an upload, confirm the version is greater than every version already uploaded to the existing store item, including unpublished drafts. Never reuse `--current` for a version the store has seen.

On validation failure or Ctrl+C, subprocesses stop before version metadata is restored, and temporary archive files are removed. A concurrent metadata edit is preserved and reported rather than overwritten. If the process is forcibly killed or the computer loses power, inspect `git diff` and `.publish-package.lock` before retrying; automatic crash recovery is not implemented. A failed attempt can leave build outputs for its attempted version: use only the final ZIP printed after a successful run.

## Submission kit

- Compiled extension ZIP only: manifest at the root, bundled scripts, locales, fonts, icons and dependency licence notices. Do not upload the repository or the outer handoff bundle as the extension package.
- [Listing copy](listing.md), with a summary that matches the manifest.
- [Reviewer instructions](reviewer-instructions.md) and [privacy form preparation](privacy-disclosures.md).
- `store/images/cws-01.png` … `cws-05.png`: 1280×800 screenshots, in that order.
- `store/images/promo-small-440x280.png` (required), `promo-marquee-1400x560.png`, `icon-128.png` and, for Edge, `edge-logo-300.png`.

The images and the toolbar icons (`public/icons/extension-16/32/48/128.png`) come from the Glance marketing kit and are used as-is. When the product UI changes, re-export them from the marketing board; nothing in this package renders them.

## Verification and remaining submission work

Keep a verification record with the exact source revision, package version, SHA-256, build flags and test results. Run the flow against the final production package in a fresh profile: a 1-hour session, Pause and Resume, Stop, no end, the toolbar badge in each state, popup reopen, each option, Add this site, and no optional site permissions by default.

Automated tests establish browser API behavior and accessibility checks. They do not establish that a real display stayed lit through a full idle interval on every operating system. Before submission, record a physical idle/timer check on a target machine, the end chime and the global shortcut. Chrome must remain running; a deliberate lock or closed laptop lid can still sleep.

In the publisher dashboard, verify the signed-in account is the owner's authorized publisher account, developer registration, contact verification, 2-Step Verification and existing item/draft status. Confirm the public homepage, privacy policy and help centre work. Upload the correct ZIP, select the current matching productivity/tools category, complete disclosures from the actual implementation, choose distribution and inspect every dashboard warning. Do not infer registration, mailbox delivery, trader status, submission or approval from repository files.

After store approval and publication, put the exact item ID in `apps/web/src/lib/extension.ts` and enable the real store link. Prepare Edge submission separately against its current dashboard requirements.

## Official requirements

- [Prepare the extension and ZIP](https://developer.chrome.com/docs/webstore/prepare)
- [Listing images](https://developer.chrome.com/docs/webstore/images)
- [Privacy fields](https://developer.chrome.com/docs/webstore/cws-dashboard-privacy)
- [Submission and review](https://developer.chrome.com/docs/webstore/publish)
