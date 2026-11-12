'use client';

import { memo } from 'react';
import type { TVibe, TVibeMotion } from '@/lib/tool/settings';
import type { TWakeState } from '@/lib/wake';
import { VibeScene } from './vibe-scene';

const TINT: Partial<Record<TWakeState, [string, string]>> = {
  running: ['rgba(61,245,142,.07)', 'rgba(17,122,59,.05)'],
  paused: ['rgba(255,197,61,.08)', 'rgba(138,90,0,.06)'],
  blocked: ['rgba(255,107,129,.09)', 'rgba(194,29,62,.06)'],
  ended: ['rgba(124,187,255,.06)', 'rgba(28,100,184,.05)'],
};

interface IBackdropProps {
  night: boolean;
  narrow: boolean;
  topH: number;
  vibe: TVibe;
  motion: TVibeMotion;
  still: boolean;
  dim: boolean;
  state: TWakeState;
}

// The vibe behind the tool, tinted by the state. The whole layer dims to --vibe-opacity on OLED, softens again when
// Dim at night is on after 10 PM, and every animation stops on Still, battery saver and reduced motion.
export const Backdrop = memo(function Backdrop({
  night,
  narrow,
  topH,
  vibe,
  motion,
  still,
  dim,
  state,
}: IBackdropProps) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden transition-opacity duration-600"
      style={{ opacity: dim ? 'calc(var(--vibe-opacity) * 0.4)' : 'var(--vibe-opacity)' }}
    >
      <VibeScene
        vibe={vibe}
        night={night}
        motion={motion}
        still={still}
        narrow={narrow}
        topH={topH}
        tint={TINT[state]?.[night ? 0 : 1]}
      />
    </div>
  );
});
