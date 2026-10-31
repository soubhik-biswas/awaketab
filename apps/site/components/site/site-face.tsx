'use client';

import { useTheme } from 'next-themes';
import { useIsClient, useMediaQuery } from 'usehooks-ts';
import { cn } from '@/lib/utils';
import { Face, isFaceId, type TFaceMotion, type TFaceState, type TFaceTheme } from '@/components/face';

// The boards' sample moment: 38:12 left of an hour at 11:03:48 AM.
export const SAMPLE = { remain: 2292, total: 3600, nowSec: 39_828 } as const;

// A face in the page's own theme. The server and the first paint keep a box of the face's size, so nothing shifts
// when the drawing arrives; the phone size is picked after mount, never from window during render.
export function SiteFace({
  face,
  size,
  total,
  remain,
  nowSec,
  state = 'idle',
  bare = false,
  framed = false,
  indef = false,
  motion,
  phoneSize,
  tabletSize,
  className,
}: {
  face: string;
  size: number;
  total: number;
  remain?: number;
  nowSec?: number;
  state?: TFaceState;
  bare?: boolean;
  framed?: boolean;
  indef?: boolean;
  motion?: TFaceMotion;
  phoneSize?: number;
  tabletSize?: number;
  className?: string;
}) {
  const { resolvedTheme } = useTheme();
  const mounted = useIsClient();
  const wide = useMediaQuery('(min-width: 700px)', { defaultValue: true, initializeWithValue: false });
  const large = useMediaQuery('(min-width: 1100px)', { defaultValue: true, initializeWithValue: false });
  const px = !wide && phoneSize ? phoneSize : !large && tabletSize ? tabletSize : size;
  const theme: TFaceTheme = resolvedTheme === 'dark' || resolvedTheme === 'oled' ? resolvedTheme : 'light';
  // A bare face is its 360 × 315 artboard; with the caption or the case it stays square.
  const tall = (n: number) => (bare && !framed ? Math.round(n * 0.875) : n);
  if (!mounted)
    return (
      <span
        aria-hidden="true"
        className={cn(
          className,
          phoneSize ? 'block h-(--face-ph) w-(--face-pw) min-[700px]:h-(--face-h) min-[700px]:w-(--face-w)' : 'block',
        )}
        style={{
          width: phoneSize ? undefined : size,
          height: phoneSize ? undefined : tall(size),
          ['--face-pw' as string]: `${String(phoneSize ?? size)}px`,
          ['--face-ph' as string]: `${String(tall(phoneSize ?? size))}px`,
          ['--face-w' as string]: `${String(size)}px`,
          ['--face-h' as string]: `${String(tall(size))}px`,
        }}
      />
    );
  return (
    <Face
      face={isFaceId(face) ? face : 'ring'}
      theme={theme}
      state={state}
      size={px}
      total={total}
      remain={remain ?? total}
      bare={bare}
      framed={framed}
      indef={indef}
      {...(nowSec === undefined ? {} : { nowSec })}
      {...(motion ? { motion } : {})}
      {...(className ? { className } : {})}
    />
  );
}
