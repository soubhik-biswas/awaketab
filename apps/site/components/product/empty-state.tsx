import * as React from 'react';
import { cn } from 'cn';

import { Scene } from '@/components/scene/scene';
import type { TSceneKey } from '@/components/scene/scene-data';
import type { TSceneTheme } from '@/components/scene/scene';

export interface IEmptyStateProps extends Omit<React.ComponentProps<'div'>, 'title'> {
  scene: TSceneKey;
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  size?: 'compact' | 'panel';
  sceneWidth?: number;
  sceneTheme?: TSceneTheme;
  float?: boolean;
}

export function EmptyState({
  scene,
  title,
  description,
  action,
  size = 'panel',
  sceneWidth,
  sceneTheme = 'auto',
  float = false,
  className,
  ...props
}: IEmptyStateProps) {
  const compact = size === 'compact';
  return (
    <div
      data-slot="empty-state"
      className={cn(
        'flex flex-col items-center gap-2.5 text-center',
        compact ? 'px-1 py-2' : 'py-3',
        className,
      )}
      {...props}
    >
      <Scene scene={scene} theme={sceneTheme} width={sceneWidth ?? (compact ? 220 : 240)} float={float} />
      <strong
        className={cn(
          'font-sans text-foreground',
          compact ? 'text-[17px] font-bold' : 'text-[20px] font-extrabold tracking-[-0.02em]',
        )}
      >
        {title}
      </strong>
      {description ? (
        <span
          className={cn(
            'leading-[1.5] text-muted-foreground-strong',
            compact ? 'max-w-[260px] text-[13px]' : 'max-w-[300px] text-[14px]',
          )}
        >
          {description}
        </span>
      ) : null}
      {action}
    </div>
  );
}
