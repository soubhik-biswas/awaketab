import { cn } from 'cn';
import { LoaderCircle } from 'lucide-react';

function Spinner({ className, ...props }: React.ComponentProps<'svg'>) {
  return (
    <LoaderCircle
      role="status"
      aria-label="Loading"
      strokeWidth={2.25}
      className={cn('size-4 animate-spinner', className)}
      {...props}
    />
  );
}

export { Spinner };
