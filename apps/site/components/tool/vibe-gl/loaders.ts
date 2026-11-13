import type { TVibe } from '@/lib/tool/settings';
import type { IVibeShader } from './types';

// Each scene's shader loads only when that vibe is shown.
export const SHADERS: Record<TVibe, () => Promise<IVibeShader>> = {
  aurora: () => import('./frags/aurora').then((m) => m.default),
  night: () => import('./frags/night').then((m) => m.default),
  rain: () => import('./frags/rain').then((m) => m.default),
  sunset: () => import('./frags/sunset').then((m) => m.default),
  lava: () => import('./frags/lava').then((m) => m.default),
  calm: () => import('./frags/calm').then((m) => m.default),
};
