import * as React from 'react';
import { cn } from 'cn';
import { ChevronRight, type LucideIcon } from 'lucide-react';

export interface IListRowProps extends Omit<React.ComponentProps<'div'>, 'title'> {
  icon?: LucideIcon;
  tile?: React.ReactNode;
  title: React.ReactNode;
  meta?: React.ReactNode;
  trailing?: React.ReactNode;
  tileSize?: 'sm' | 'md';
  divider?: 'top' | 'bottom' | 'none';
  titleSize?: 'sm' | 'md';
}

const rowClasses = (divider: IListRowProps['divider']) =>
  cn(
    'flex min-h-[52px] w-full items-center gap-2.5 text-left text-foreground',
    divider === 'bottom' && 'border-b',
    divider === 'top' && 'border-t',
  );

function RowBody({
  icon: Icon,
  tile,
  title,
  meta,
  trailing,
  tileSize = 'sm',
  titleSize = 'sm',
}: Pick<IListRowProps, 'icon' | 'tile' | 'title' | 'meta' | 'trailing' | 'tileSize' | 'titleSize'>) {
  return (
    <>
      {tile ??
        (Icon ? (
          <span
            className={cn(
              'inline-flex shrink-0 items-center justify-center rounded-sm border bg-secondary',
              tileSize === 'sm' ? 'size-8' : 'size-9',
            )}
          >
            <Icon
              className={tileSize === 'sm' ? 'size-4' : 'size-[18px]'}
              strokeWidth={tileSize === 'sm' ? 2 : 1.75}
              aria-hidden="true"
            />
          </span>
        ) : null)}
      <span className="flex min-w-0 flex-1 flex-col gap-px">
        <span className={cn('font-semibold', titleSize === 'sm' ? 'text-[14px]' : 'text-[15px]')}>{title}</span>
        {meta ? <span className="text-[12px] leading-[1.45] text-muted-foreground-strong">{meta}</span> : null}
      </span>
      {trailing}
    </>
  );
}

export interface IListRowButtonProps
  extends
    Omit<React.ComponentProps<'button'>, 'title'>,
    Pick<IListRowProps, 'icon' | 'tile' | 'title' | 'meta' | 'trailing' | 'tileSize' | 'divider' | 'titleSize'> {
  chevron?: boolean;
}

export function ListRowButton({
  icon,
  tile,
  title,
  meta,
  trailing,
  tileSize = 'md',
  titleSize = 'md',
  divider = 'bottom',
  chevron = true,
  className,
  type = 'button',
  ...props
}: IListRowButtonProps) {
  return (
    <button
      type={type}
      data-slot="list-row"
      className={cn(
        'cursor-pointer border-0 bg-transparent p-0 outline-none focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-ring',
        rowClasses(divider),
        className,
      )}
      {...props}
    >
      <RowBody
        {...{ icon, tile, title, meta, tileSize, titleSize }}
        trailing={
          <>
            {trailing}
            {chevron ? (
              <ChevronRight className="size-[18px] shrink-0 text-muted-foreground-strong" aria-hidden="true" />
            ) : null}
          </>
        }
      />
    </button>
  );
}
