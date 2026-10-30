'use client';

import { useRef, useState, type ReactNode } from 'react';
import dynamic from 'next/dynamic';
import { RovingFocus } from 'radix-ui/internal';
import {
  ChevronUp,
  LifeBuoy,
  LoaderCircle,
  Maximize,
  Pause,
  Play,
  Plus,
  RotateCcw,
  X,
  type LucideIcon,
} from 'lucide-react';
import { faceName } from '@/components/face';
import { fill, lengthText } from '@/lib/tool/chrome';
import { cn } from '@/lib/utils';
import { useTool } from '@/components/tool/context';
import { useArrive } from '@/components/tool/motion';

const Face = dynamic(() => import('@/components/face').then((mod) => mod.Face), { ssr: false });

type TChip = { id: string; label: string; aria?: string; on?: boolean; go: () => void };
type TAct = {
  id: string;
  label: string;
  icon?: LucideIcon;
  go: () => void;
  spin?: boolean;
  disabled?: boolean;
  keys?: string;
};

const EXTEND: Array<[number, string]> = [
  [300, '+5'],
  [900, '+15'],
  [1800, '+30'],
  [3600, '+1 h'],
];

const LENGTHS: Array<[number, string, string]> = [
  [900, '15 min', '15m'],
  [1800, '30 min', '30m'],
  [3600, '1 hour', '1h'],
  [7200, '2 hours', '2h'],
  [0, '∞', '∞'],
];

function useBarModel() {
  const { device, m, a } = useTool();
  const { s, c } = m;
  const st = m.state;
  const compact = device === 'phone' || device === 'tabletP';
  const running = st === 'running' || st === 'fallback';
  let chips: TChip[] = [];
  if (running && !m.indef)
    chips = EXTEND.map(([sec, label]) => ({
      id: `ext-${sec}`,
      label: label + (compact || sec === 3600 ? '' : ' min'),
      aria: sec === 3600 ? c.addHour : fill(c.addMin, { n: sec / 60 }),
      go: () => a.extend(sec),
    }));
  else if (st === 'idle' || st === 'ended' || st === 'unsupported')
    chips = LENGTHS.map(([sec, full, short]) => ({
      id: `len-${sec}`,
      label: compact ? short : full,
      aria: compact || sec === 0 || m.lang !== 'en' ? (sec % 3600 === 0 ? lengthText(sec, s, c) : fill(c.minutes, { n: sec / 60 })) : undefined,
      on: sec === m.total,
      go: () => a.setLength(sec),
    }));
  let acts: TAct[];
  if (st === 'idle') acts = [{ id: 'primary', label: s.keep, icon: Play, go: () => a.start(), keys: 'Space' }];
  else if (st === 'starting')
    acts = [{ id: 'primary', label: s.starting, go: () => undefined, spin: true, disabled: true }];
  else if (running)
    acts = [
      { id: 'primary', label: s.pause, icon: Pause, go: a.pause, keys: 'Space' },
      { id: 'stop', label: s.stop, icon: X, go: a.stop },
    ];
  else if (st === 'paused' || st === 'needsyou')
    acts = [
      { id: 'primary', label: s.resume, icon: Play, go: a.resume, keys: 'Space' },
      { id: 'stop', label: s.stop, icon: X, go: a.stop },
    ];
  else if (st === 'blocked')
    acts = [
      { id: 'primary', label: s.fix, icon: LifeBuoy, go: () => a.go('fix') },
      { id: 'fallback', label: s.fallback, icon: Play, go: a.useFallback },
    ];
  else if (st === 'unsupported') acts = [{ id: 'primary', label: s.fallback, icon: Play, go: a.useFallback }];
  else
    acts = [
      { id: 'primary', label: s.again, icon: RotateCcw, go: () => a.setLength(m.total) },
      { id: 'ext', label: s.ext15, icon: Plus, go: () => a.extend(900), keys: '+' },
    ];
  const capLabel = running ? s.extend : s.length;
  const full = device !== 'phone' && (st === 'idle' || running);
  return { chips, acts, capLabel, full };
}

function Item({ id, children }: { id: string; children: ReactNode }) {
  return (
    <RovingFocus.Item asChild tabStopId={id} focusable>
      {children}
    </RovingFocus.Item>
  );
}

function Divider({ hidden }: { hidden: boolean }) {
  return hidden ? null : <span aria-hidden="true" className="h-9 w-px shrink-0 bg-border" />;
}

export function ControlBar() {
  const { device, m, settings, theme, a } = useTool();
  const phone = device === 'phone';
  const compact = phone || device === 'tabletP';
  const { chips, acts, capLabel, full } = useBarModel();
  const ref = useRef<HTMLDivElement>(null);
  useArrive(ref, { y: 24, duration: 0.52, ease: 'expo.out' });
  const ids = [...chips.map((c) => c.id), ...acts.map((x) => x.id), 'face', 'full'];
  const [stop, setStop] = useState<string | null>('primary');
  const tabStop = stop && ids.includes(stop) ? stop : 'primary';
  const name = faceName(settings.face);
  const ghost = 'border border-border bg-(--tool-ghost) text-foreground';
  const press =
    'cursor-pointer outline-none transition-[background-color,color,box-shadow,transform] duration-glide ease-glide focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:translate-y-px';
  const tall = phone ? 'h-13' : 'h-14';
  // A long primary label (Japanese) wraps to a second line on the phone instead of being cut off.
  const primaryLabel = phone ? 'min-w-0 text-center leading-[1.1] text-balance whitespace-normal' : 'truncate';
  return (
    <RovingFocus.Root
      ref={ref}
      role="toolbar"
      aria-label={m.c.controls}
      aria-orientation="horizontal"
      orientation="horizontal"
      loop
      currentTabStopId={tabStop}
      onCurrentTabStopIdChange={setStop}
      className={cn(
        'absolute z-[4] box-border flex items-center border border-border backdrop-blur-[20px]',
        phone
          ? 'inset-x-3 bottom-3.5 flex-wrap gap-2.5 rounded-[28px] bg-(--tool-bar-phone) p-3 shadow-(--tool-bar-shadow-phone)'
          : 'bottom-6 left-1/2 -translate-x-1/2 gap-3.5 rounded-[30px] bg-(--tool-bar) py-2.5 pr-2.5 pl-[18px] whitespace-nowrap shadow-(--tool-bar-shadow)',
      )}
    >
      {chips.length > 0 ? (
        <>
          <div
            role="group"
            aria-label={capLabel}
            className={cn('flex', phone ? 'w-full flex-col items-stretch gap-1.5' : 'flex-row items-center gap-2.5')}
          >
            <span
              aria-hidden="true"
              className={cn(
                'font-mono text-[12px] tracking-[.1em] text-muted-foreground-strong uppercase',
                device === 'tabletP' && 'hidden',
                phone && 'pl-1',
              )}
            >
              {capLabel}
            </span>
            <div className={cn('flex gap-1 rounded-[16px] bg-(--tool-chips) p-1', phone && 'box-border w-full')}>
              {chips.map((c) => (
                <Item key={c.id} id={c.id}>
                  <button
                    type="button"
                    onClick={c.go}
                    aria-pressed={c.on === undefined ? undefined : c.on}
                    aria-label={c.aria}
                    className={cn(
                      press,
                      'relative rounded-[12px] border-0 whitespace-nowrap',
                      phone
                        ? 'h-10 min-w-0 flex-1 basis-0 px-1.5 text-[15px] after:absolute after:inset-x-0 after:-inset-y-0.5'
                        : 'h-11 px-3.5 text-[16px]',
                      c.on
                        ? 'bg-(--tool-chip-on) font-bold text-foreground shadow-(--tool-chip-on-shadow)'
                        : 'bg-transparent font-semibold text-muted-foreground-strong hover:text-foreground',
                    )}
                  >
                    {c.label}
                  </button>
                </Item>
              ))}
            </div>
          </div>
          <Divider hidden={phone} />
        </>
      ) : null}
      <div className={cn('flex items-center gap-2', phone && 'min-w-0 flex-auto')}>
        {acts.map((x, i) => {
          const Icon = x.icon;
          const primary = i === 0;
          return (
            <Item key={x.id} id={x.id}>
              <button
                type="button"
                onClick={x.disabled ? undefined : x.go}
                aria-disabled={x.disabled || undefined}
                aria-keyshortcuts={x.keys}
                data-primary={primary || undefined}
                className={cn(
                  press,
                  'inline-flex items-center justify-center rounded-[18px] whitespace-nowrap [&_svg]:shrink-0',
                  tall,
                  primary
                    ? cn(
                        'min-w-0 gap-2.5 overflow-hidden border-0 font-bold tracking-[-0.01em]',
                        phone ? 'flex-auto px-[18px] text-[17px]' : 'flex-none px-[26px] text-[18px]',
                        x.disabled
                          ? 'cursor-progress bg-surface-3 text-muted-foreground-strong active:translate-y-0'
                          : 'bg-primary text-primary-foreground shadow-(--tool-act-shadow) hover:bg-primary-hover',
                      )
                    : cn(
                        ghost,
                        'flex-none gap-2 text-[15px] font-semibold hover:bg-secondary',
                        phone ? 'px-3.5' : 'px-[18px]',
                      ),
                )}
              >
                {x.spin ? (
                  <LoaderCircle className="size-[18px] animate-spinner" strokeWidth={2.25} aria-hidden="true" />
                ) : null}
                {Icon ? <Icon className="size-5" strokeWidth={2} aria-hidden="true" /> : null}
                <span className={cn(primary && primaryLabel)}>{x.label}</span>
              </button>
            </Item>
          );
        })}
      </div>
      <Divider hidden={phone} />
      <Item id="face">
        <button
          type="button"
          onClick={() => a.go('faces')}
          aria-label={fill(m.c.faceBtn, { name })}
          aria-haspopup="dialog"
          className={cn(
            press,
            ghost,
            'inline-flex flex-none items-center gap-2.5 rounded-[18px] pl-1.5 hover:bg-secondary',
            tall,
            phone ? 'pr-2.5' : 'pr-3',
          )}
        >
          <span aria-hidden="true" className="block size-11 shrink-0 overflow-hidden rounded-[14px] bg-(--tool-thumb)">
            <Face
              face={settings.face}
              theme={theme}
              state="running"
              remain={2292}
              total={3600}
              nowSec={39828}
              size={44}
              bare
              motion="off"
              fmt={m.fmt}
            />
          </span>
          {!compact ? (
            <span className="flex min-w-0 flex-col items-start gap-px">
              <span className="font-mono text-[12px] tracking-[.08em] text-muted-foreground-strong uppercase">
                {m.s.face}
              </span>
              <span className="max-w-[140px] truncate text-[16px] font-bold tracking-[-0.01em]">{name}</span>
            </span>
          ) : null}
          <ChevronUp className="size-4" strokeWidth={2} aria-hidden="true" />
        </button>
      </Item>
      {full ? (
        <Item id="full">
          <button
            type="button"
            onClick={() => a.go('focus')}
            aria-label={m.c.fullscreen}
            aria-keyshortcuts="F"
            className={cn(
              press,
              'inline-flex size-14 flex-none items-center justify-center rounded-[18px] border border-border bg-transparent text-foreground hover:bg-secondary',
            )}
          >
            <Maximize className="size-5" strokeWidth={2} aria-hidden="true" />
          </button>
        </Item>
      ) : null}
    </RovingFocus.Root>
  );
}
