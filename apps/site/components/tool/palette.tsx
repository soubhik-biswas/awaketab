'use client';

import { useMemo, useState } from 'react';
import {
  Contrast,
  CornerDownLeft,
  History,
  Infinity as InfinityGlyph,
  LayoutGrid,
  LifeBuoy,
  ListChecks,
  Maximize,
  Moon,
  Palette,
  Pause,
  Play,
  Plus,
  Settings,
  Share2,
  Sun,
  Timer,
  User,
  Volume2,
  X,
  type LucideIcon,
} from 'lucide-react';
import type { TFace } from '@awaketab/core';
import { faceName } from '@/components/face';
import { Scene } from '@/components/scene';
import { Command, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Kbd } from '@/components/ui/kbd';
import { cn } from '@/lib/utils';
import { returnFocus } from '@/lib/tool/focus';
import { toolUi } from '@/lib/tool/ui';
import { useTool, type IToolContext } from '@/components/tool/context';
import { KBD } from '@/components/tool/kit';

interface ICmd {
  id: string;
  group: string;
  label: string;
  icon: LucideIcon;
  keys: string[];
  run: () => void;
}

const PALETTE_FACES: TFace[] = [
  'ring', 'bold', 'flip', 'luxe', 'dive', 'gauge', 'timeline', 'nixie', 'led', 'pilot',
  'dual', 'radar', 'board', 'hourglass', 'orbit', 'disc', 'clocks', 'wordgrid', 'tape', 'moon',
];

function commands({ m, a }: IToolContext): ICmd[] {
  const list: ICmd[] = [];
  const add = (group: string, label: string, icon: LucideIcon, keys: string[], run: () => void) =>
    list.push({ id: `cmd-${list.length}`, group, label, icon, keys, run });
  const st = m.state;
  if (st === 'running' || st === 'fallback') {
    add('Session', 'Pause', Pause, ['Space'], a.pause);
    add('Session', 'Stop keeping awake', X, [], a.stop);
  } else if (st === 'paused' || st === 'needsyou') add('Session', 'Resume', Play, ['Space'], a.resume);
  else add('Session', 'Keep awake', Play, ['Space'], () => a.start());
  add('Session', 'Extend 15 minutes', Plus, ['+'], () => a.extend(900));
  add('Session', 'Extend 1 hour', Plus, ['⇧', '+'], () => a.extend(3600));
  add('Session', 'Set length: 30 minutes', Timer, [], () => a.setLength(1800));
  add('Session', 'Set length: 2 hours', Timer, [], () => a.setLength(7200));
  add('Session', 'Set length: until I stop it', InfinityGlyph, [], () => a.setLength(0));
  for (const f of PALETTE_FACES) add('Faces', `Face: ${faceName(f)}`, LayoutGrid, [], () => a.setFace(f));
  add('Go to', 'Open presets', ListChecks, [], () => a.go('presets'));
  add('Go to', 'Open history', History, [], () => a.go('history'));
  add('Go to', 'Open settings', Settings, [], () => a.go('settings'));
  add('Go to', 'Help & fixes', LifeBuoy, ['?'], () => a.go('fix'));
  add('Go to', 'Share this setup', Share2, [], () => a.go('share'));
  add('Go to', 'Face studio', Palette, [], () => a.go('studio'));
  add('Go to', 'Ambient sound', Volume2, [], () => a.go('sound'));
  add('Go to', 'Account', User, [], () => a.go('account'));
  add('Appearance', 'Fullscreen', Maximize, ['F'], () => a.go('focus'));
  add('Appearance', 'Theme: light', Sun, [], () => a.setTheme('light'));
  add('Appearance', 'Theme: dark', Moon, [], () => a.setTheme('dark'));
  add('Appearance', 'Theme: OLED black', Contrast, [], () => a.setTheme('oled'));
  return list;
}

function Highlight({ label, q }: { label: string; q: string }) {
  const at = q ? label.toLowerCase().indexOf(q) : -1;
  if (at < 0) return <>{label}</>;
  return (
    <>
      {label.slice(0, at)}
      <mark className="rounded-[3px] bg-accent p-0 font-bold text-lamp">{label.slice(at, at + q.length)}</mark>
      {label.slice(at + q.length)}
    </>
  );
}

export function CommandPalette() {
  const ctx = useTool();
  const { ui, device, night, a } = ctx;
  const phone = device === 'phone';
  const q = ui.palQuery.trim().toLowerCase();
  const all = useMemo(() => commands(ctx), [ctx]);
  let found = all.filter((c) => !q || c.label.toLowerCase().includes(q));
  if (!q) found = found.filter((c) => c.group === 'Session' || c.label === 'Fullscreen' || c.label === 'Help & fixes').slice(0, 7);
  const groups: Array<[string, ICmd[]]> = [];
  for (const c of found) {
    const g = groups.find(([n]) => n === c.group);
    if (g) g[1].push(c);
    else groups.push([c.group, [c]]);
  }
  const [selected, setSelected] = useState('');
  const run = (c: ICmd) => {
    a.close();
    setTimeout(c.run, 0);
  };
  return (
    <Dialog open onOpenChange={(o) => !o && a.close()}>
      <DialogContent
        showCloseButton={false}
        aria-describedby={undefined}
        onCloseAutoFocus={(e) => {
          e.preventDefault();
          returnFocus();
        }}
        className={cn(
          'flex flex-col gap-0 overflow-hidden bg-pop p-0',
          phone
            ? 'inset-0 top-0 left-0 h-dvh max-h-none w-full max-w-none translate-x-0 translate-y-0 rounded-none shadow-none'
            : cn('top-[12vh] max-h-[72vh] translate-y-0 rounded-[20px] shadow-e3', device === 'tabletP' ? 'w-[640px] max-w-[640px]' : 'w-[620px] max-w-[620px]'),
        )}
      >
        <DialogTitle className="sr-only">Command palette</DialogTitle>
        <Command
          shouldFilter={false}
          loop
          value={selected}
          onValueChange={setSelected}
          className="flex min-h-0 flex-1 flex-col bg-pop"
        >
          <div className="relative flex h-[58px] shrink-0 items-center border-b border-border [&_[data-slot=command-input-wrapper]]:h-full [&_[data-slot=command-input-wrapper]]:flex-1 [&_[data-slot=command-input-wrapper]]:border-0 [&_[data-slot=command-input-wrapper]]:pr-[72px]">
            <CommandInput
              value={ui.palQuery}
              onValueChange={(v) => toolUi.set({ palQuery: v })}
              placeholder="Type a command or search…"
              autoFocus
              spellCheck={false}
              className="h-11 text-[17px]"
            />
            <button
              type="button"
              onClick={a.close}
              aria-label="Close palette"
              className="absolute right-4 h-11 min-w-11 cursor-pointer rounded-[8px] border border-border bg-background px-2.5 font-mono text-[12px] text-muted-foreground-strong"
            >
              esc
            </button>
          </div>
          <CommandList className="flex max-h-none min-h-0 flex-1 flex-col gap-0.5 overflow-auto p-2">
            {found.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-4 py-3 text-center">
                <Scene scene="notfound" theme={night ? 'dark' : 'light'} width={168} decorative />
                <strong className="text-[16px]">No commands match “{ui.palQuery}”</strong>
                <span className="text-[14px] text-muted-foreground-strong">Try “extend”, “face” or “theme”.</span>
              </div>
            ) : null}
            {groups.map(([name, items]) => (
              <CommandGroup
                key={name}
                heading={name}
                className="p-0 [&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:pt-2.5 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:font-mono [&_[cmdk-group-heading]]:text-[12px] [&_[cmdk-group-heading]]:font-normal [&_[cmdk-group-heading]]:tracking-[.08em] [&_[cmdk-group-heading]]:text-muted-foreground-strong [&_[cmdk-group-heading]]:uppercase"
              >
                {items.map((c) => {
                  const Icon = c.icon;
                  return (
                    <CommandItem
                      key={c.id}
                      value={c.id}
                      onSelect={() => run(c)}
                      className="group flex min-h-[46px] w-full cursor-pointer items-center gap-3 rounded-[10px] px-2.5 text-foreground data-[selected=true]:bg-secondary data-[selected=true]:shadow-[0_0_0_1px_var(--border)] dark:data-[selected=true]:bg-surface-3"
                    >
                      <span className="inline-flex size-[30px] shrink-0 items-center justify-center rounded-[9px] border border-border bg-secondary">
                        <Icon className="size-4" strokeWidth={2} aria-hidden="true" />
                      </span>
                      <span className="min-w-0 flex-1 truncate text-left text-[15px]">
                        <Highlight label={c.label} q={q} />
                      </span>
                      {c.keys.length ? (
                        <span className="flex gap-1">
                          {c.keys.map((k) => (
                            <Kbd key={k} className={KBD}>
                              {k}
                            </Kbd>
                          ))}
                        </span>
                      ) : null}
                      <CornerDownLeft
                        className="hidden size-4 shrink-0 text-muted-foreground-strong group-data-[selected=true]:block"
                        strokeWidth={2}
                        aria-hidden="true"
                      />
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            ))}
          </CommandList>
          <div className="flex h-11 shrink-0 items-center gap-3.5 border-t border-border px-4 text-[12px] text-muted-foreground-strong">
            <span className="inline-flex items-center gap-1.5">
              <Kbd className={KBD}>↑</Kbd>
              <Kbd className={KBD}>↓</Kbd>
              move
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Kbd className={KBD}>↵</Kbd>
              run
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Kbd className={KBD}>esc</Kbd>
              close
            </span>
            <span className="ml-auto" aria-live="polite">
              {found.length} {found.length === 1 ? 'result' : 'results'}
            </span>
          </div>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
