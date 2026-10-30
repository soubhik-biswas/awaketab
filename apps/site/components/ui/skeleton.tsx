import { cn } from 'cn';

function Skeleton({
  className,
  tone = 'default',
  ...props
}: React.ComponentProps<'div'> & { tone?: 'default' | 'raised' }) {
  return (
    <div
      data-slot="skeleton"
      data-tone={tone}
      className={cn(
        'block animate-shimmer rounded-xs bg-[length:200%_100%]',
        tone === 'default' &&
          'bg-secondary bg-[linear-gradient(90deg,var(--secondary)_0%,var(--surface-3)_50%,var(--secondary)_100%)]',
        tone === 'raised' &&
          'bg-surface-3 bg-[linear-gradient(90deg,var(--surface-3)_0%,var(--border)_50%,var(--surface-3)_100%)]',
        className,
      )}
      {...props}
    />
  );
}

export { Skeleton };
