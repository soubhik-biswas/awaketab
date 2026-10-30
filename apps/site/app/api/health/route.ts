import { api } from '@/lib/server/api';
import { polarServer } from '@/lib/server/polar';

export const dynamic = 'force-dynamic';

// `polar` lets a deploy check confirm which Polar the licence API talks to.
export const GET = api((_request, { env }) => {
  const version = (env.CF_PAGES_COMMIT_SHA ?? env.COMMIT_SHA)?.slice(0, 12) ?? 'dev';
  return Response.json({ ok: true, version, polar: polarServer(env) }, { headers: { 'cache-control': 'no-store' } });
});
