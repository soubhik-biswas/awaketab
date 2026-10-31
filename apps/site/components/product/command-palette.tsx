'use client';

import * as React from 'react';
import { CornerDownLeft, LoaderCircle, Search, type LucideIcon } from 'lucide-react';

import { Scene } from '@/components/scene/scene';
import { Button } from '@/components/ui/button';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from '@/components/ui/command';
import { Kbd } from '@/components/ui/kbd';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

export interface ICommandAction {
  id: string;
  label: string;
  icon: LucideIcon;
  keys?: string[];
  sub?: string;
  keywords?: string[];
  onSelect: () => void;
}

export interface ICommandGroup {
  heading: string;
  items: ICommandAction[];
}

export interface ICommandPaletteLabels {
  move: string;
  run: string;
  close: string;
  closePalette: string;
  noMatch: (q: string) => string;
  count: (n: number, searching: boolean) => string;
}

const LABELS: ICommandPaletteLabels = {
  move: 'move',
  run: 'run',
  close: 'close',
  closePalette: 'Close palette',
  noMatch: (q) => `No commands match “${q}”`,
  count: (n, searching) =>
    searching ? `${n} ${n === 1 ? 'result' : 'results'}` : `${n} ${n === 1 ? 'command' : 'commands'}`,
};

export interface ICommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  idleGroups: ICommandGroup[];
  groups: ICommandGroup[];
  query?: string;
  onQueryChange?: (query: string) => void;
  loading?: boolean;
  loadingHeading?: string;
  onSearchGuides?: (query: string) => void;
  placeholder?: string;
  emptyHint?: string;
  title?: string;
  labels?: ICommandPaletteLabels;
  // "tool" takes the tool board's palette sizes; the default follows the palette board.
  fit?: 'board' | 'tool';
}

function matches(action: ICommandAction, q: string): boolean {
  if (action.label.toLowerCase().includes(q)) return true;
  return (action.keywords ?? []).some((k) => k.toLowerCase().includes(q));
}

function filterCommandGroups(groups: ICommandGroup[], query: string): ICommandGroup[] {
  const q = query.trim().toLowerCase();
  if (!q) return groups;
  return groups
    .map((group) => ({ heading: group.heading, items: group.items.filter((item) => matches(item, q)) }))
    .filter((group) => group.items.length > 0);
}

function Highlight({ text, query }: { text: string; query: string }) {
  const q = query.trim().toLowerCase();
  const at = q ? text.toLowerCase().indexOf(q) : -1;
  if (at < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, at)}
      <mark className="rounded-[3px] bg-accent p-0 font-bold text-lamp">{text.slice(at, at + q.length)}</mark>
      {text.slice(at + q.length)}
    </>
  );
}

function FooterKey({ children }: { children: React.ReactNode }) {
  return <Kbd>{children}</Kbd>;
}

export function CommandPalette({
  open,
  onOpenChange,
  idleGroups,
  groups,
  query: queryProp,
  onQueryChange,
  loading = false,
  loadingHeading = 'Guides · searching',
  onSearchGuides,
  placeholder = 'Type a command or search…',
  emptyHint,
  title = 'Command palette',
  labels = LABELS,
  fit = 'board',
}: ICommandPaletteProps) {
  const tool = fit === 'tool';
  const [ownQuery, setOwnQuery] = React.useState('');
  const query = queryProp ?? ownQuery;
  const setQuery = (next: string) => {
    if (queryProp === undefined) setOwnQuery(next);
    onQueryChange?.(next);
  };
  const searching = query.trim().length > 0;
  const shown = searching ? filterCommandGroups(groups, query) : idleGroups;
  const total = shown.reduce((n, g) => n + g.items.length, 0);
  const firstId = shown[0]?.items[0]?.id ?? '';
  const [selected, setSelected] = React.useState(firstId);

  React.useEffect(() => {
    setSelected(firstId);
  }, [firstId, query]);

  React.useEffect(() => {
    if (!open && queryProp === undefined) setOwnQuery('');
  }, [open, queryProp]);

  const count = loading ? 'Searching…' : labels.count(total, searching);

  const run = (action: ICommandAction) => {
    onOpenChange(false);
    action.onSelect();
  };

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      commandProps={{ shouldFilter: false, loop: true, value: selected, onValueChange: setSelected, label: title }}
    >
      <CommandInput
        value={query}
        onValueChange={setQuery}
        placeholder={placeholder}
        {...(tool ? { wrapperClassName: 'h-[59px]' } : {})}
      >
        {loading ? (
          <LoaderCircle
            className="size-[18px] shrink-0 animate-spinner text-lamp"
            strokeWidth={2.25}
            aria-label="Searching"
          />
        ) : null}
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          aria-label={labels.closePalette}
          className={cn(
            'relative shrink-0 cursor-pointer outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
            tool
              ? 'h-11 min-w-11 rounded-[8px] border border-border bg-background px-2.5 font-mono text-[12px] text-muted-foreground-strong'
              : 'rounded-xs border-0 bg-transparent p-0 after:absolute after:-inset-[11px]',
          )}
        >
          {tool ? 'esc' : <Kbd>esc</Kbd>}
        </button>
      </CommandInput>
      <CommandList className="min-h-[300px] max-sm:min-h-0">
        {shown.map((group) => (
          <CommandGroup
            key={group.heading}
            heading={group.heading}
            {...(tool ? { className: '[&_[cmdk-group-heading]]:mb-0.5' } : {})}
          >
            {group.items.map((action) => {
              const Icon = action.icon;
              return (
                <CommandItem
                  key={action.id}
                  value={action.id}
                  onSelect={() => run(action)}
                  {...(tool
                    ? {
                        className: 'min-h-[46px] rounded-[10px] data-[selected=true]:shadow-[0_0_0_1px_var(--border)]',
                      }
                    : {})}
                >
                  <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-[9px] border bg-secondary text-foreground">
                    <Icon className="size-4" aria-hidden="true" />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-[15px]">
                      <Highlight text={action.label} query={query} />
                    </span>
                    {action.sub ? <span className="text-[12px] text-muted-foreground-strong">{action.sub}</span> : null}
                  </span>
                  {action.keys?.length ? (
                    <CommandShortcut>
                      {action.keys.map((key) => (
                        <Kbd key={key}>{key}</Kbd>
                      ))}
                    </CommandShortcut>
                  ) : null}
                  <CornerDownLeft
                    className="hidden size-4 text-muted-foreground-strong group-data-[selected=true]/command-item:block"
                    aria-hidden="true"
                  />
                </CommandItem>
              );
            })}
          </CommandGroup>
        ))}
        {loading ? (
          <div aria-hidden="true">
            <div className="px-2.5 pt-2.5 pb-1 font-mono text-[12px] tracking-[.08em] text-muted-foreground-strong uppercase">
              {loadingHeading}
            </div>
            {['62%', '48%'].map((width) => (
              <div key={width} className="flex min-h-12 items-center gap-3 px-2.5">
                <Skeleton tone="raised" className="size-8 rounded-[9px]" />
                <span className="flex flex-1 flex-col gap-1.5">
                  <Skeleton tone="raised" className="h-3 rounded-xs" style={{ width }} />
                  <Skeleton tone="raised" className="h-2.5 w-[30%] rounded-[5px]" />
                </span>
              </div>
            ))}
          </div>
        ) : null}
        {searching && !loading && total === 0 ? (
          <CommandEmpty>
            <Scene scene="notfound" width={176} />
            <strong className="text-[17px] font-bold">{labels.noMatch(query.trim())}</strong>
            <span className="text-[14px] leading-[1.5] text-muted-foreground-strong">
              {emptyHint ??
                (onSearchGuides
                  ? 'Try “extend”, “face” or “theme” — or search the guides instead.'
                  : 'Try “extend”, “face” or “theme”.')}
            </span>
            {onSearchGuides ? (
              <Button variant="outline" className="px-3.5" onClick={() => onSearchGuides(query.trim())}>
                <Search aria-hidden="true" />
                Search guides for “{query.trim()}”
              </Button>
            ) : null}
          </CommandEmpty>
        ) : null}
      </CommandList>
      <div
        className={cn(
          'flex shrink-0 items-center gap-3.5 border-t px-4 text-[12px] text-muted-foreground-strong',
          tool ? 'h-[45px]' : 'h-11',
        )}
      >
        <span className="inline-flex items-center gap-1.5">
          <FooterKey>↑</FooterKey>
          <FooterKey>↓</FooterKey>
          {labels.move}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <FooterKey>↵</FooterKey>
          {labels.run}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <FooterKey>esc</FooterKey>
          {labels.close}
        </span>
        <span className="ml-auto" aria-live="polite">
          {count}
        </span>
      </div>
    </CommandDialog>
  );
}
