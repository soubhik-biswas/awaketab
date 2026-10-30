import { cn } from '@/lib/utils';
import type { TSceneKey } from '@/lib/content';

// Stand-in for components/scene: a 4:3 frame with the ring and lamp, until the illustrations land.
export function Scene({
  sceneKey,
  width = 320,
  className,
  label,
}: {
  sceneKey: TSceneKey;
  width?: number;
  className?: string;
  label?: string;
}) {
  return (
    <svg
      width={width}
      height={Math.round(width * 0.75)}
      viewBox="0 0 320 240"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      data-scene={sceneKey}
      className={cn('h-auto max-w-full', className)}
    >
      <rect x="40" y="40" width="240" height="160" rx="20" className="fill-card stroke-border" strokeWidth="3" />
      <path
        d="M160 76 A44 44 0 1 1 116.25 115.4"
        fill="none"
        className="stroke-foreground"
        strokeWidth="10"
        strokeLinecap="round"
      />
      <circle cx="130.4" cy="88.4" r="9" className="fill-lamp" />
    </svg>
  );
}
