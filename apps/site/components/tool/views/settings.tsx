'use client';

import { ChevronDown, Globe } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { TThemeChoice } from '@/lib/tool/settings';
import { useTool } from '@/components/tool/context';
import { BTN_DANGER_OUT, FIELD, Group, HELP, Segments, SwitchLine } from '@/components/tool/kit';

const THEMES: ReadonlyArray<[TThemeChoice, string]> = [
  ['auto', 'Auto'],
  ['light', 'Light'],
  ['dark', 'Dark'],
  ['oled', 'OLED'],
];

export default function SettingsView() {
  const { settings, themeChoice, a } = useTool();
  return (
    <>
      <Group label="Appearance">
        <Segments label="Theme" options={THEMES} value={themeChoice} onChange={a.setTheme} />
      </Group>
      <Group label="Clock and sound">
        <SwitchLine
          label="12-hour clock"
          desc="Shows 11:42 AM instead of 11:42"
          on={settings.h12}
          onToggle={() => a.updateSettings({ h12: !settings.h12 })}
        />
        <SwitchLine
          label="Show seconds"
          desc="On the face and the tab title"
          on={settings.secs}
          onToggle={() => a.updateSettings({ secs: !settings.secs })}
        />
        <SwitchLine
          label="Chime when it ends"
          desc="A soft two-note chime"
          on={settings.chime !== 'off'}
          onToggle={() => a.updateSettings({ chime: settings.chime === 'off' ? 'two' : 'off' })}
        />
        <SwitchLine
          label="Dim the clock at night"
          desc="After 10:00 PM"
          on={settings.dim}
          onToggle={() => a.updateSettings({ dim: !settings.dim })}
        />
      </Group>
      <Group label="Language">
        <span className={FIELD}>
          <Globe className="size-4 shrink-0 text-muted-foreground-strong" strokeWidth={2} aria-hidden="true" />
          English
          <ChevronDown
            className="ml-auto size-4 shrink-0 text-muted-foreground-strong"
            strokeWidth={2}
            aria-hidden="true"
          />
        </span>
        <span className={HELP}>Also Deutsch, Español, Français, Português, 日本語, 简体中文, हिन्दी.</span>
      </Group>
      <Group label="Motion">
        <span className="text-[14px] leading-[1.5]">
          Follows your system’s reduce-motion setting. Faces then change digits without flips, rolls or glow.
        </span>
      </Group>
      <Group label="Data">
        <Button type="button" variant="outline" onClick={() => a.go('clear')} className={BTN_DANGER_OUT}>
          Clear history…
        </Button>
        <span className={cn(HELP, '[&_a]:text-link [&_a]:underline')}>
          <Link href="/legal/privacy">Privacy</Link> · <Link href="/legal/terms">Terms</Link> · © [COMPANY NAME] ·
          Contact [CONTACT EMAIL]
        </span>
      </Group>
    </>
  );
}
