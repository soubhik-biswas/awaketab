'use client';

import { Bookmark, Lock, Monitor } from 'lucide-react';
import { FaceGrid } from '@/components/face';
import { SegmentedControl } from '@/components/product/segmented-control';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useTool } from '@/components/tool/context';
import { FIELD, Group, HELP, LINK_BTN, SwitchLine } from '@/components/tool/kit';
import { LengthChips } from '@/components/tool/length-chips';

const MINI_FACES = ['ring', 'disc', 'flip', 'orbit', 'clocks', 'moon'] as const;

export function SetupView() {
  const { m, settings, device, theme, a } = useTool();
  const s = m.s;
  return (
    <>
      <Group label={s.length}>
        <LengthChips columns={3} onUntil={() => a.go('extend')} />
        <span className={HELP}>{m.endsText}</span>
      </Group>
      <Group label={s.label}>
        <label className={cn(FIELD, 'focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ring')}>
          <Bookmark className="size-4 shrink-0 text-muted-foreground-strong" strokeWidth={2} aria-hidden="true" />
          <span className="sr-only">{s.label}</span>
          <Input
            value={settings.label}
            maxLength={80}
            placeholder="Add a label"
            onChange={(e) => a.updateSettings({ label: e.target.value })}
            className="h-full min-w-0 flex-1 rounded-none border-0 bg-transparent p-0 text-[15px] shadow-none outline-none focus-visible:outline-none"
          />
        </label>
      </Group>
      <Group
        label={s.face}
        aside={
          <button type="button" className={LINK_BTN} onClick={() => a.go('faces')}>
            {s.allFaces}
          </button>
        }
      >
        <FaceGrid
          selected={settings.face}
          onSelect={a.setFace}
          theme={theme}
          ids={MINI_FACES}
          size={device === 'tabletL' ? 72 : 80}
          columns={3}
          labels={false}
        />
      </Group>
      <Group label={s.options}>
        <SwitchLine
          label={s.sound}
          desc={s.soundD}
          on={settings.chime !== 'off'}
          onToggle={() => a.updateSettings({ chime: settings.chime === 'off' ? 'two' : 'off' })}
        />
        <SwitchLine
          label={s.dim}
          desc={s.dimD}
          on={settings.dim}
          onToggle={() => a.updateSettings({ dim: !settings.dim })}
        />
        <SwitchLine
          label={s.secs}
          desc={s.secsD}
          on={settings.secs}
          onToggle={() => a.updateSettings({ secs: !settings.secs })}
        />
      </Group>
      <Group label={s.level}>
        <SegmentedControl
          aria-label="Keep-awake level"
          value="screen"
          options={[
            { value: 'screen', label: s.screen, icon: Monitor },
            { value: 'system', label: s.system, icon: Lock, disabled: true },
          ]}
        />
        <span className={HELP}>
          Blocking system sleep needs the desktop app. The browser can only keep the screen on.
        </span>
      </Group>
    </>
  );
}
