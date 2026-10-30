'use client';

import { useTheme } from 'next-themes';
import { useIsClient, useMediaQuery } from 'usehooks-ts';
import { Face, isFaceId, type TFaceState, type TFaceTheme } from '@/components/face';

// A face in the page's own theme. The server and the first paint keep a box of the face's size, so nothing shifts
// when the drawing arrives.
export function SiteFace({
  face,
  size,
  total,
  remain,
  state = 'idle',
  bare = false,
  indef = false,
  phoneSize,
  className,
}: {
  face: string;
  size: number;
  total: number;
  remain?: number;
  state?: TFaceState;
  bare?: boolean;
  indef?: boolean;
  phoneSize?: number;
  className?: string;
}) {
  const { resolvedTheme } = useTheme();
  const mounted = useIsClient();
  const wide = useMediaQuery('(min-width: 700px)', { defaultValue: true, initializeWithValue: false });
  const px = !wide && phoneSize ? phoneSize : size;
  const theme: TFaceTheme = resolvedTheme === 'dark' || resolvedTheme === 'oled' ? resolvedTheme : 'light';
  if (!mounted)
    return (
      <span
        aria-hidden="true"
        className={
          className ?? (phoneSize ? 'block size-[var(--face-phone)] min-[700px]:size-[var(--face-wide)]' : 'block')
        }
        style={{
          width: phoneSize ? undefined : size,
          height: phoneSize ? undefined : size,
          ['--face-phone' as string]: `${String(phoneSize ?? size)}px`,
          ['--face-wide' as string]: `${String(size)}px`,
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
      indef={indef}
      {...(className ? { className } : {})}
    />
  );
}
