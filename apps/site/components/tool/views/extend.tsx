'use client';

import { useState } from 'react';
import { AlarmClock } from 'lucide-react';
import { Chip } from '@/components/product/chip';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { clockTime } from '@/lib/tool/clock';
import { useTool } from '@/components/tool/context';
import { BTN_PRIMARY_FULL, FIELD, Group } from '@/components/tool/kit';

const CHIPS: Array<[number, string]> = [
  [300, '+5 min'],
  [900, '+15 min'],
  [1800, '+30 min'],
  [3600, '+1 hour'],
];

const pad = (n: number) => String(n).padStart(2, '0');

function toInput(ms: number): string {
  const d = new Date(ms);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromInput(v: string, now: number): number | null {
  const m = /^(\d{2}):(\d{2})$/u.exec(v);
  if (!m) return null;
  const d = new Date(now);
  d.setHours(Number(m[1]), Number(m[2]), 0, 0);
  if (d.getTime() <= now + 30_000) d.setDate(d.getDate() + 1);
  return d.getTime();
}

export default function ExtendView() {
  const { m, a } = useTool();
  const live = m.state !== 'idle' && m.state !== 'ended' && m.state !== 'unsupported';
  const base = live && !m.indef ? m.endsAt : m.now;
  const [value, setValue] = useState(() => toInput(base + 900_000));
  const target = fromInput(value, m.now);
  const label = target === null ? '' : clockTime(target, m.lang, m.fmt);
  return (
    <>
      <div className="grid grid-cols-4 gap-2">
        {CHIPS.map(([sec, text]) => (
          <Chip
            key={sec}
            shape="tile"
            pressed={sec === 900}
            className="h-11 px-2 text-[14px]"
            onClick={() => {
              a.extend(sec);
              a.close();
            }}
          >
            {text}
          </Chip>
        ))}
      </div>
      <Group label="Or until a time">
        <label className={cn(FIELD, 'focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ring')}>
          <AlarmClock className="size-4 shrink-0 text-muted-foreground-strong" strokeWidth={2} aria-hidden="true" />
          <span className="sr-only">Keep awake until</span>
          <Input
            type="time"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="h-full min-w-0 flex-1 rounded-none border-0 bg-transparent p-0 text-[15px] shadow-none outline-none focus-visible:outline-none"
          />
        </label>
      </Group>
      <Button
        type="button"
        disabled={target === null}
        onClick={() => {
          if (target === null) return;
          a.until(target);
          a.close();
        }}
        className={BTN_PRIMARY_FULL}
      >
        {live ? `Extend to ${label}` : `Keep awake until ${label}`}
      </Button>
    </>
  );
}
