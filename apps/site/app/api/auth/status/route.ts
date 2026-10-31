import { api } from '@/lib/server/api';
import { authStatus } from '@/lib/auth/server';

export const dynamic = 'force-dynamic';

// Which sign-in methods are set up, so the page can say plainly when one is not.
export const GET = api((_request, { env }) => Response.json(authStatus(env)));
