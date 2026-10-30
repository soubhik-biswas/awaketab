'use client';

import type { KeyboardEvent } from 'react';
import { RadioGroup } from 'radix-ui';
import { Face, FACE_COLLECTIONS, FACE_IDS, faceName, isFaceId, type TFaceId } from '@/components/face';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { toolUi, type TFaceCol } from '@/lib/tool/ui';
import { useTool } from '@/components/tool/context';
import { HELP } from '@/components/tool/kit';

const TABS: ReadonlyArray<[TFaceCol, string]> = [
  ['fresh', 'New ✦'],
  ['signature', 'Signature'],
  ['digital', 'Digital'],
  ['analog', 'Analog'],
  ['ambient', 'Ambient'],
  ['all', `All ${FACE_IDS.length}`],
];

function idsOf(col: TFaceCol): readonly TFaceId[] {
  return col === 'all' ? FACE_IDS : FACE_COLLECTIONS[col];
}

export default function FacesView() {
  const { settings, device, theme, viewport, ui, a } = useTool();
  const phone = device === 'phone';
  const cols = phone ? 2 : 4;
  const sheetW = phone ? viewport.w : Math.min(viewport.w - 48, 860);
  const px = Math.min(phone ? 150 : 176, Math.floor((sheetW - (phone ? 32 : 56) - 16 - 10 * (cols - 1)) / cols - 16));
  const ids = idsOf(ui.faceCol);

  // Up and Down move by a whole row; Left and Right step through the faces.
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
    const items = [...e.currentTarget.querySelectorAll<HTMLButtonElement>('[role="radio"]')];
    const i = items.indexOf(document.activeElement as HTMLButtonElement);
    if (i < 0) return;
    e.preventDefault();
    const to = items[Math.min(items.length - 1, Math.max(0, i + (e.key === 'ArrowDown' ? cols : -cols)))];
    const id = to?.dataset.face;
    if (!to || !isFaceId(id)) return;
    to.focus();
    a.setFace(id);
  };

  return (
    <Tabs
      value={ui.faceCol}
      onValueChange={(v) => {
        const hit = TABS.find(([k]) => k === v);
        if (hit) toolUi.set({ faceCol: hit[0] });
      }}
      className="gap-4"
    >
      <TabsList
        aria-label="Face collections"
        className="flex-wrap justify-start gap-1.5 rounded-none border-0 bg-transparent p-0"
      >
        {TABS.map(([k, label]) => (
          <TabsTrigger
            key={k}
            value={k}
            className="h-10 flex-none rounded-full border border-border bg-transparent px-4 text-[14px] font-semibold text-muted-foreground-strong after:top-[-2px] after:bottom-[-2px] after:h-auto after:bg-transparent hover:text-foreground data-[state=active]:border-foreground data-[state=active]:bg-foreground data-[state=active]:font-bold data-[state=active]:text-background data-[state=active]:shadow-none"
          >
            {label}
          </TabsTrigger>
        ))}
      </TabsList>
      <TabsContent value={ui.faceCol} className="flex flex-col gap-4">
        <RadioGroup.Root
          value={settings.face}
          onValueChange={(v) => {
            if (isFaceId(v)) a.setFace(v);
          }}
          orientation="horizontal"
          aria-label="Clock face"
          onKeyDown={onKeyDown}
          className="grid gap-x-2.5 gap-y-3.5"
          style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
        >
          {ids.map((id) => {
            const on = id === settings.face;
            return (
              <RadioGroup.Item
                key={id}
                value={id}
                data-face={id}
                className="group flex min-w-0 cursor-pointer flex-col items-stretch gap-1 border-0 bg-transparent p-0 text-foreground outline-none"
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    'flex justify-center overflow-visible rounded-[30px] border-2 bg-transparent p-1.5 transition-[border-color,box-shadow] duration-fast ease-glide group-focus-visible:outline-2 group-focus-visible:outline-offset-2 group-focus-visible:outline-ring',
                    on ? 'border-lamp shadow-[0_0_0_4px_var(--halo)]' : 'border-transparent',
                  )}
                >
                  <Face
                    framed
                    face={id}
                    theme={theme}
                    state="running"
                    remain={2292}
                    total={3600}
                    nowSec={39828}
                    size={px}
                    bare
                  />
                </span>
                <span
                  className={cn(
                    'truncate text-center text-[14px]',
                    on ? 'font-bold text-foreground' : 'font-medium text-muted-foreground-strong',
                  )}
                >
                  {faceName(id)}
                </span>
              </RadioGroup.Item>
            );
          })}
        </RadioGroup.Root>
        <span className={HELP}>Faces change only how time is drawn. Status always shows as words and an icon too.</span>
      </TabsContent>
    </Tabs>
  );
}
