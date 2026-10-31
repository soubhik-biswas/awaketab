'use client';

import { useState, type ReactNode } from 'react';
import { isDrawerPanel, type TDrawerPanel } from '@/lib/tool/ui';
import { useGlance } from '../context';
import { FacesStore } from './faces';
import { FeedbackPanel } from './feedback';
import { SoundPanel, StudioPanel, VibesPanel } from './look';
import { ClearPanel, HelpPanel, LanguagePanel, SharePanel } from './misc';
import { DevicesPanel, PlanPanel, ProDonePanel, ProPanel } from './pro';
import { RecentsPanel } from './recents';
import { SettingsPanel } from './settings';
import { PanelShell } from './shell';

const BODIES: Record<TDrawerPanel, () => ReactNode> = {
  recents: RecentsPanel,
  settings: SettingsPanel,
  help: HelpPanel,
  studio: StudioPanel,
  feedback: FeedbackPanel,
  vibes: VibesPanel,
  share: SharePanel,
  devices: DevicesPanel,
  sound: SoundPanel,
  clear: ClearPanel,
  language: LanguagePanel,
  pro: ProPanel,
  proDone: ProDonePanel,
  plan: PlanPanel,
};

export function Panels() {
  const g = useGlance();
  const open = isDrawerPanel(g.panel);
  // The last drawer stays drawn while it slides away, so the exit animation has something to move.
  const [kind, setKind] = useState<TDrawerPanel>('settings');
  if (isDrawerPanel(g.panel) && g.panel !== kind) setKind(g.panel);
  const Body = BODIES[kind];
  return (
    <>
      <PanelShell open={open} title={g.t(`panel.${kind}.t`)} sub={g.t(`panel.${kind}.d`)}>
        <Body key={kind} />
      </PanelShell>
      <FacesStore open={g.panel === 'faces'} />
    </>
  );
}
