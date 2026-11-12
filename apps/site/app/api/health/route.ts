import { api, VERSION } from '@/lib/server/api';
import { polarServer } from '@/lib/server/polar';

export const dynamic = 'force-dynamic';

// `version` is the deployed commit; `polar` lets a deploy check confirm which Polar the licence API talks to.
export const GET = api((_request, { env }) =>
  Response.json({ ok: true, version: VERSION, polar: polarServer(env) }, { headers: { 'cache-control': 'no-store' } }),
);
