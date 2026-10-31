import { api } from '@/lib/server/api';
import { polarWebhookRoute } from '@/lib/server/polar-webhook';

export const dynamic = 'force-dynamic';
export const POST = api((request, { env }) => polarWebhookRoute(request, env));
