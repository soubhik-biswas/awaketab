// pnpm kv:backup: the runbook is in docs/14-devops.md §7.
import { runBackup } from './lib/cli.ts';
import { nodeDeps } from './lib/node-deps.ts';

process.exitCode = await runBackup(process.argv.slice(2), nodeDeps());
