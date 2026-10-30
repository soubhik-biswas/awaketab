'use client';

import { useMemo } from 'react';
import {
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
import { CommandPalette, type ICommandAction, type ICommandGroup } from '@/components/product/command-palette';
import { returnFocus } from '@/lib/tool/focus';
import { toolUi } from '@/lib/tool/ui';
import { useTool, type IToolContext } from '@/components/tool/context';

interface ICmd extends ICommandAction {
  group: string;
}

const PALETTE_FACES: TFace[] = [
  'ring', 'bold', 'flip', 'luxe', 'dive', 'gauge', 'timeline', 'nixie', 'led', 'pilot',
  'dual', 'radar', 'board', 'hourglass', 'orbit', 'disc', 'clocks', 'wordgrid', 'tape', 'moon',
];

function commands({ m, a }: IToolContext): ICmd[] {
  const list: ICmd[] = [];
  const add = (group: string, label: string, icon: LucideIcon, keys: string[], run: () => void) =>
    list.push({ id: `cmd-${list.length}`, group, label, icon, keys, onSelect: run });
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
  const { ui, a } = ctx;
  const all = useMemo(() => commands(ctx), [ctx]);
  const groups = useMemo(() => grouped(all), [all]);
  const idle = useMemo(
    () => grouped(all.filter((c) => c.group === 'Session' || c.label === 'Fullscreen' || c.label === 'Help & fixes').slice(0, 7)),
    [all],
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
      emptyHint="Try “extend”, “face” or “theme”."
    />
  );
}
