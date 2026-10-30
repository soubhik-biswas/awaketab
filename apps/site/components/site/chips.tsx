import { cn } from '@/lib/utils';

export interface IChip {
  href: string;
  label: string;
  current?: boolean;
  aria?: string;
}

// The help board's chip row, used for the lengths and times next to a tool page.
export function Chips({ items, label }: { items: readonly IChip[]; label: string }) {
  return (
    <ul aria-label={label} className="m-0 flex list-none flex-wrap gap-2 p-0">
      {items.map((c) => (
        <li key={c.href}>
          {c.current ? (
            <span
              aria-current="page"
              className="inline-flex h-11 items-center gap-2 rounded-full border-2 border-lamp bg-accent px-4 text-[15px] font-bold text-foreground"
            >
              <span className="size-2 rounded-full bg-lamp" aria-hidden="true" />
              {c.label}
            </span>
          ) : (
            <a
              href={c.href}
              aria-label={c.aria}
              className={cn(
                'inline-flex h-11 items-center rounded-full border border-border bg-secondary px-4 text-[15px] font-semibold text-foreground no-underline hover:bg-surface-3',
              )}
            >
              {c.label}
            </a>
          )}
        </li>
      ))}
    </ul>
  );
}
