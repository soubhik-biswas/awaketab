import { api, options } from '@/lib/server/api';
import { validateRoute } from '@/lib/server/license-validate';

export const dynamic = 'force-dynamic';
export const POST = api((request, { env }) => validateRoute(request, env));
export const OPTIONS = options;
