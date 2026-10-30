import * as React from 'react';
import { cn } from 'cn';

import { SCENE_FILL, SCENES, type TSceneKey } from '@/components/scene/scene-data';

export type { TSceneKey };

export type TSceneTheme = 'auto' | 'light' | 'dark';

export interface ISceneProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height' | 'viewBox'> {
  scene: TSceneKey;
  theme?: TSceneTheme;
  width?: number;
  float?: boolean;
  label?: string;
  decorative?: boolean;
}

const STROKE = { stroke: 'var(--scene-ink)', strokeWidth: 3, strokeLinejoin: 'round' } as const;

export function Scene({
  scene,
  theme = 'auto',
  width = 320,
  float = false,
  label,
  decorative = false,
  className,
  ...props
}: ISceneProps) {
  const def = SCENES[scene] ?? SCENES.hero;
  const [lx, ly, lr] = def.lamp;
  const shadow = def.layers.map(([, d]) => d).join(' ');
  return (
    <svg
      width={width}
      height={Math.round(width * 0.75)}
      viewBox="0 0 320 240"
      role={decorative ? undefined : 'img'}
      aria-label={decorative ? undefined : (label ?? def.alt)}
      aria-hidden={decorative || undefined}
      data-scene={scene}
      className={cn(
        'block shrink-0',
        theme === 'light' && 'scene-light',
        theme === 'dark' && 'scene-dark',
        float && 'animate-float',
        className,
      )}
      {...props}
    >
      {def.blob ? <path d={def.blob} fill="var(--scene-blob)" /> : null}
      {def.blob2 ? <path d={def.blob2} fill="var(--scene-blob-2)" /> : null}
      <path d={shadow} fill="var(--scene-shadow)" transform="translate(6 6)" />
      {def.layers.map(([fill, d], i) => (
        <path key={i} d={d} fill={SCENE_FILL[fill]} {...STROKE} />
      ))}
      {def.ring ? (
        <path d={def.ring} fill="none" stroke="var(--scene-ring)" strokeWidth={8} strokeLinecap="round" />
      ) : null}
      {def.ln ? (
        <path
          d={def.ln}
          fill="none"
          stroke="var(--scene-ink)"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : null}
      {def.lnLight ? (
        <path
          d={def.lnLight}
          fill="none"
          stroke="var(--scene-lamp)"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : null}
      {def.sp ? (
        <path d={def.sp} fill="none" stroke="var(--scene-spark)" strokeWidth={3.5} strokeLinecap="round" />
      ) : null}
      <circle cx={lx} cy={ly} r={lr * 2.3} fill="var(--scene-lamp)" opacity={0.35} />
      <circle cx={lx} cy={ly} r={lr} fill="var(--scene-lamp)" stroke="var(--scene-ink)" strokeWidth={3} />
      <circle
        cx={lx - lr * 0.3}
        cy={ly - lr * 0.3}
        r={Math.max(1.5, lr * 0.28)}
        fill="var(--scene-highlight)"
        opacity={0.85}
      />
    </svg>
  );
}
