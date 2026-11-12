// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { decryptUtf8, encryptUtf8 } from '../../../apps/site/lib/server/license.ts';
import { encryptKeyEnc, tryDecryptKeyEnc } from '../lib/crypto.ts';

// `pnpm kv:reencrypt` must open what the site writes, and the site must open what a key rotation rewrites.
describe('keyEnc interop between the site and the KV ops scripts', () => {
  const key = btoa(String.fromCharCode(...new Uint8Array(32).fill(7)));
  const rotated = btoa(String.fromCharCode(...new Uint8Array(32).fill(42)));
  const raw = 'AWAKE-TEST-KEY-0001';

  it('the script opens what the site wrote', async () => {
    expect(await tryDecryptKeyEnc(await encryptUtf8(raw, key), key)).toBe(raw);
  });

  it('the site opens what the script re-encrypted with the new key', async () => {
    const reencrypted = await encryptKeyEnc(raw, rotated);
    expect(await decryptUtf8(reencrypted, rotated)).toBe(raw);
    await expect(decryptUtf8(reencrypted, key)).rejects.toThrow();
  });
});
