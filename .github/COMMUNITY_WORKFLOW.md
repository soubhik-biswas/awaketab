# AwakeTab contribution workflow

[Project board](https://github.com/users/soubhik-biswas/projects/2) · [Issue forms](https://github.com/soubhik-biswas/awaketab/issues/new/choose)

## From an idea to production

1. A contributor opens a bug, feature or documentation issue with the issue forms.
2. The maintainer triages it. Only `soubhik-biswas` applies the `approved` label; work on an issue starts after that label is there. An approval from any other account does not count.
3. The maintainer uses `ready`, `in-progress`, `blocked`, `needs-information` or `not-planned` to show where an approved issue stands.
4. Contributors open focused pull requests against `main` and link the approved issue with `Closes #123` or `Tracks: #123`. A draft means work in progress; a ready pull request means it can be reviewed.
5. CI must pass. Before merging, the maintainer can deploy the branch to the preview at play.awaketab.com (`pnpm -F site run deploy:preview`) to check it there.
6. A merge into `main` is built and deployed to production by Cloudflare; the **Workers Builds: awaketab-site** check on the merge commit shows the result. See [Deployment](../docs/DEPLOYMENT.md).

## The board

The project board is updated by GitHub's built-in project workflows, switched on in the board's **Workflows** menu: new issues and pull requests from this repository are added automatically, and closed issues and merged pull requests move to Done. No token or custom automation is involved; the maintainer sets the stages in between by hand.

## Labels

| Label | Meaning |
| --- | --- |
| `approved` | The maintainer has accepted the issue; work can start |
| `ready` | Approved and specified well enough to pick up |
| `in-progress` | Someone is working on it |
| `blocked` | Waiting on something else |
| `needs-information` | Waiting for a reply from the reporter |
| `not-planned` | Will not be done; the issue says why |
