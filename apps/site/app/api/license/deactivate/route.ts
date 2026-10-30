import { api, options } from '@/lib/server/api';
import { deactivateRoute } from '@/lib/server/license-deactivate';

export const dynamic = 'force-dynamic';
export const POST = api((request, { env }) => deactivateRoute(request, env));
export const OPTIONS = options;
