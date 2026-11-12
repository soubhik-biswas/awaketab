// pnpm kv:restore: the runbook is in docs/14-devops.md §7.
import { runRestore } from './lib/cli.ts';
import { nodeDeps } from './lib/node-deps.ts';

process.exitCode = await runRestore(process.argv.slice(2), nodeDeps());
