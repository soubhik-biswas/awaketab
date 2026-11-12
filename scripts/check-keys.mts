// A production build must ship a real licence key and never trust the public dev one (docs/09 §2.4).
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { PRODUCTION_LICENSE_PUBLIC_KEYS } from '../packages/core/src/license.ts';
import { polarServer } from './polar-server.mjs';

export const DEV_KEY_FILE = path.join(path.dirname(fileURLToPath(import.meta.url)), 'dev-license-key.json');
const TEXT = /\.(?:html|js|mjs|cjs|css|json|webmanifest|txt|xml|svg|map)$|^_headers$|^_redirects$/u;

export interface IPublicPoint {
  x: string;
  y: string;
}

export interface IProblem {
  message: string;
  waivable: boolean;
}

export async function devPublicKey(file = DEV_KEY_FILE): Promise<IPublicPoint> {
  const jwk = JSON.parse(await readFile(file, 'utf8')) as Partial<IPublicPoint>;
  if (typeof jwk.x !== 'string' || typeof jwk.y !== 'string') throw new Error(`${file} is not an EC JWK`);
  return { x: jwk.x, y: jwk.y };
}

export function keyProblems(keys: Readonly<Record<number, JsonWebKey>>, dev: IPublicPoint): IProblem[] {
  const problems: IProblem[] = [];
  const entries = Object.entries(keys);
  if (entries.length === 0) {
    problems.push({
      message: 'PRODUCTION_LICENSE_PUBLIC_KEYS is empty: run `pnpm keys:prod` and add the public JWK',
      waivable: true,
    });
  }
  for (const [ver, jwk] of entries) {
    if (jwk.x === dev.x || jwk.y === dev.y) {
      problems.push({
        message: `LICENSE_PUBLIC_KEYS[${ver}] is the dev key from scripts/dev-license-key.json; its private half is public`,
        waivable: false,
      });
    }
    if (jwk.kty !== 'EC' || jwk.crv !== 'P-256' || !jwk.x || !jwk.y) {
      problems.push({ message: `LICENSE_PUBLIC_KEYS[${ver}] is not a P-256 public JWK`, waivable: false });
    }
    if ('d' in jwk)
      problems.push({ message: `LICENSE_PUBLIC_KEYS[${ver}] contains a private key (d)`, waivable: false });
  }
  return problems;
}

async function textFiles(dir: string): Promise<string[]> {
  const out: string[] = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await textFiles(full)));
    else if (TEXT.test(entry.name)) out.push(full);
  }
  return out;
}

export async function distProblems(
  dir: string,
  dev: IPublicPoint,
  keys: Readonly<Record<number, JsonWebKey>>,
): Promise<IProblem[]> {
  const problems: IProblem[] = [];
  const unseen = new Map(Object.entries(keys).map(([ver, jwk]) => [ver, jwk.x ?? '']));
  for (const file of await textFiles(dir)) {
    const text = await readFile(file, 'utf8');
    if (text.includes(dev.x) || text.includes(dev.y)) {
      problems.push({
        message: `${path.relative(process.cwd(), file)} contains the dev licence public key`,
        waivable: false,
      });
    }
    for (const [ver, x] of unseen) if (x && text.includes(x)) unseen.delete(ver);
  }
  for (const ver of unseen.keys()) {
    problems.push({
      message: `${dir}: LICENSE_PUBLIC_KEYS[${ver}] is in no built file (licence verifier not bundled?)`,
      waivable: false,
    });
  }
  return problems;
}

export async function runCheck(
  args: string[],
  env: Record<string, string | undefined> = process.env,
): Promise<{ ok: boolean; lines: string[] }> {
  if (polarServer(env) !== 'production' && !args.includes('--force')) {
    return {
      ok: true,
      lines: ['check-keys: PUBLIC_POLAR_SERVER is not production; the dev licence key stays trusted (skipped)'],
    };
  }
  const dev = await devPublicKey();
  const dists = args.flatMap((arg, i) => (arg === '--dist' && args[i + 1] ? [path.resolve(args[i + 1] ?? '')] : []));
  const problems =
    dists.length > 0
      ? (await Promise.all(dists.map((dir) => distProblems(dir, dev, PRODUCTION_LICENSE_PUBLIC_KEYS)))).flat()
      : keyProblems(PRODUCTION_LICENSE_PUBLIC_KEYS, dev);
  const waive = env.AT_ALLOW_MISSING_PRODUCTION_KEY === '1';
  const errors = problems.filter((p) => !(waive && p.waivable));
  const warnings = problems.filter((p) => waive && p.waivable);
  const lines = [
    ...errors.map((p) => `check-keys: ERROR ${p.message}`),
    ...warnings.map((p) => `check-keys: WARNING (AT_ALLOW_MISSING_PRODUCTION_KEY=1) ${p.message}`),
  ];
  if (errors.length === 0) lines.push(`check-keys: ok (${dists.length > 0 ? dists.join(', ') : 'source'})`);
  return { ok: errors.length === 0, lines };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { ok, lines } = await runCheck(process.argv.slice(2));
  for (const line of lines) (ok ? process.stdout : process.stderr).write(`${line}\n`);
  if (!ok) process.exitCode = 1;
}
