// PUBLIC_POLAR_SERVER (sandbox | production, default sandbox) picks Polar and whether a bundle trusts the dev licence key.

export const POLAR_SERVERS = ['sandbox', 'production'];

export function polarServer(env = process.env) {
  const value = env.PUBLIC_POLAR_SERVER?.trim() ?? '';
  if (value === '') return 'sandbox';
  if (value === 'sandbox' || value === 'production') return value;
  throw new Error(`PUBLIC_POLAR_SERVER must be "sandbox" or "production" (got ${JSON.stringify(value)})`);
}

export function paymentsEnabled(env = process.env) {
  const value = env.PUBLIC_PAYMENTS_ENABLED?.trim() ?? '';
  if (value === '' || value === '1') return true;
  if (value === '0') return false;
  throw new Error('PUBLIC_PAYMENTS_ENABLED must be "0" or "1"');
}

export function polarDefines(env = process.env) {
  const server = polarServer(env);
  return {
    __AT_POLAR_SERVER__: JSON.stringify(server),
    __AT_PAYMENTS_ENABLED__: JSON.stringify(paymentsEnabled(env)),
    __AT_LICENSE_DEV_KEY__: JSON.stringify(server !== 'production'),
  };
}
