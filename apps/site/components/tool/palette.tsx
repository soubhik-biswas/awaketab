'use client';

import { useMemo } from 'react';
import {
  AlarmClock,
  Contrast,
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
import {
  CommandPalette,
  type ICommandAction,
  type ICommandGroup,
  type ICommandPaletteLabels,
} from '@/components/product/command-palette';
import { fill } from '@/lib/tool/chrome';
import { returnFocus } from '@/lib/tool/focus';
import { toolUi } from '@/lib/tool/ui';
import { useTool, type IToolContext } from '@/components/tool/context';

interface ICmd extends ICommandAction {
  group: string;
  kind: string;
}

const PALETTE_FACES: TFace[] = [
  'ring',
  'bold',
  'flip',
  'luxe',
  'dive',
  'gauge',
  'timeline',
  'nixie',
  'led',
  'pilot',
  'dual',
  'radar',
  'board',
  'hourglass',
  'orbit',
  'disc',
  'clocks',
  'wordgrid',
  'tape',
  'moon',
];

function commands({ m, a, presets }: IToolContext): ICmd[] {
  const { s, c } = m;
  const list: ICmd[] = [];
  const add = (group: string, label: string, icon: LucideIcon, keys: string[], run: () => void, kind = '') =>
    list.push({ id: `cmd-${list.length}`, group, label, icon, keys, onSelect: run, kind });
  const st = m.state;
  if (st === 'running' || st === 'fallback') {
    add(s.session, s.pause, Pause, ['Space'], a.pause);
    add(s.session, c.cStopAwake, X, [], a.stop);
  } else if (st === 'paused' || st === 'needsyou') add(s.session, s.resume, Play, ['Space'], a.resume);
  else add(s.session, s.keep, Play, ['Space'], () => a.start());
  add(s.session, c.cExt15, Plus, ['+'], () => a.extend(900));
  add(s.session, c.cExt60, Plus, ['⇧', '+'], () => a.extend(3600));
  // Searchable only: the idle list keeps the drawn commands, and U is listed here so every key has a home.
  add(s.session, c.cUntil, AlarmClock, ['U'], () => a.go('extend'), 'extra');
  add(s.session, fill(c.cLen, { len: fill(c.minutes, { n: 30 }) }), Timer, [], () => a.setLength(1800));
  add(s.session, fill(c.cLen, { len: s.hours2 }), Timer, [], () => a.setLength(7200));
  add(s.session, fill(c.cLen, { len: c.cLenOpen }), InfinityGlyph, [], () => a.setLength(0));
  presets.slice(0, 9).forEach((p, i) =>
    add(s.presets, fill(c.cPreset, { name: p.label }), ListChecks, [String(i + 1)], () => a.applyPreset(p, true)),
  );
  for (const f of PALETTE_FACES) add(s.faces, fill(c.cFace, { name: faceName(f) }), LayoutGrid, [], () => a.setFace(f));
  add(c.gGo, c.cOpenPresets, ListChecks, [], () => a.go('presets'));
  add(c.gGo, c.cOpenHistory, History, [], () => a.go('history'));
  add(c.gGo, c.cOpenSettings, Settings, [], () => a.go('settings'));
  add(c.gGo, s.help, LifeBuoy, ['?'], () => a.go('fix'), 'help');
  add(c.gGo, c.share, Share2, [], () => a.go('share'));
  add(c.gGo, s.studio, Palette, [], () => a.go('studio'));
  add(c.gGo, c.ambient, Volume2, [], () => a.go('sound'));
  add(c.gGo, c.account, User, [], () => a.go('account'));
  add(c.gLook, c.fullscreen, Maximize, ['F'], () => a.go('focus'), 'full');
  add(c.gLook, c.cToggleTheme, Contrast, ['⇧', 'D'], a.cycleTheme);
  add(c.gLook, fill(c.themeIs, { name: c.light }), Sun, [], () => a.setTheme('light'));
  add(c.gLook, fill(c.themeIs, { name: c.dark }), Moon, [], () => a.setTheme('dark'));
  add(c.gLook, fill(c.themeIs, { name: c.oled }), Contrast, [], () => a.setTheme('oled'));
  return list;
}

function grouped(list: ICmd[]): ICommandGroup[] {
  const out: ICommandGroup[] = [];
  for (const c of list) {
    const g = out.find((x) => x.heading === c.group);
    if (g) g.items.push(c);
    else out.push({ heading: c.group, items: [c] });
  }
  return out;
}

export function ToolPalette() {
  const ctx = useTool();
  const { ui, m, a } = ctx;
  const c = m.c;
  const all = useMemo(() => commands(ctx), [ctx]);
  const groups = useMemo(() => grouped(all), [all]);
  const idle = useMemo(
    () =>
      grouped(
        all
          .filter((x) => (x.group === m.s.session && x.kind === '') || x.kind === 'help' || x.kind === 'full')
          .slice(0, 7),
      ),
    [all, m.s.session],
  );
  const labels = useMemo<ICommandPaletteLabels>(
    () => ({
      move: c.palMove,
      run: c.palRun,
      close: c.palClose,
      closePalette: c.palClosePalette,
      noMatch: (q) => fill(c.palEmpty, { q }),
      count: (n, searching) =>
        searching
          ? n === 1
            ? c.palResult1
            : fill(c.palResults, { n })
          : n === 1
            ? c.palCommand1
            : fill(c.palCommands, { n }),
    }),
    [c],
  );
  return (
    <CommandPalette
      open={ui.view === 'palette'}
      onOpenChange={(open) => {
        if (open) return;
        if (toolUi.get().view === 'palette') a.close();
        setTimeout(() => {
          if (toolUi.get().view === 'timer') returnFocus();
        }, 0);
      }}
      idleGroups={idle}
      groups={groups}
      query={ui.palQuery}
      onQueryChange={(palQuery) => toolUi.set({ palQuery })}
      emptyHint={c.palHint}
      placeholder={c.palPlaceholder}
      title={c.palTitle}
      labels={labels}
    />
  );
}
