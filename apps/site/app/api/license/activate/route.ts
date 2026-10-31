import { api, options } from '@/lib/server/api';
import { activateRoute } from '@/lib/server/license-activate';

export const dynamic = 'force-dynamic';
export const POST = api((request, { env }) => activateRoute(request, env));
export const OPTIONS = options;
