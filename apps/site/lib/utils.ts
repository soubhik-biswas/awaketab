import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

// In Tailwind 4 a leading-* class always wins over a font size's own line height, so a later text-* class must not drop it.
const twMerge = extendTailwindMerge({ override: { conflictingClassGroups: { 'font-size': [] } } });

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
