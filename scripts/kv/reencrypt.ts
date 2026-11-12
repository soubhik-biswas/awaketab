// pnpm kv:reencrypt: the rotation runbook is in docs/14-devops.md §6.
import { runReencrypt } from './lib/cli.ts';
import { nodeDeps } from './lib/node-deps.ts';

process.exitCode = await runReencrypt(process.argv.slice(2), nodeDeps());
