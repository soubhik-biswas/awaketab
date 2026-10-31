import { cn } from '@/lib/utils';

// Meteors from Magic UI (magicui.design, MIT), cut down to placed meteors so a scene can draw its one shooting star
// where the design puts it; the keyframes live with the tool's background (ue-meteor).
interface IMeteorsProps {
  meteors: React.CSSProperties[];
  angle?: number;
  tail?: number;
  className?: string;
}

export function Meteors({ meteors, angle = 24, tail = 140, className }: IMeteorsProps) {
  return (
    <>
      {meteors.map((style, idx) => (
        <span
          key={idx}
          aria-hidden="true"
          style={{ '--angle': `${-angle}deg`, ...style } as React.CSSProperties}
          className={cn(
            'ue-meteor pointer-events-none absolute size-0.5 rotate-(--angle) rounded-full bg-white shadow-[0_0_0_1px_#ffffff10]',
            className,
          )}
        >
          <span
            className="pointer-events-none absolute top-1/2 left-0 -z-10 h-0.5 -translate-y-1/2 rounded-[2px] bg-linear-to-r from-white to-transparent"
            style={{ width: tail }}
          />
        </span>
      ))}
    </>
  );
}
