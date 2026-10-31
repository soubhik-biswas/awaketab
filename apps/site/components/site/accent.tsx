import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

// The one accent word or phrase of a headline: Instrument Serif italic at 1.08em with the volt to violet gradient.
// CJK and Devanagari keep only the gradient and never break the phrase (site.css).
export function Accent({ children, night = false }: { children: ReactNode; night?: boolean }) {
  return <span className={cn('site-accent', night && 'site-accent-night')}>{children}</span>;
}

// A headline with its last word (or the given trailing phrase) set as the accent.
export function Accented({ text, accent }: { text: string; accent?: string }) {
  const tail = accent && text.endsWith(accent) ? accent : lastWord(text);
  if (!tail) return <>{text}</>;
  const head = text.slice(0, text.length - tail.length);
  return (
    <>
      {head}
      <Accent>{tail}</Accent>
    </>
  );
}

const lastWord = (text: string): string => {
  const at = text.trimEnd().lastIndexOf(' ');
  return at > 0 ? text.trimEnd().slice(at + 1) : '';
};
