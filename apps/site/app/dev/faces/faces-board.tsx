'use client';

import { useEffect, useState } from 'react';
import {
  Face,
  FACE_DEFAULTS,
  FACE_STATES,
  FaceGrid,
  FACES,
  faceName,
  type TFaceId,
  type TFaceMotion,
  type TFaceState,
  type TFaceTheme,
} from '@/components/face';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn } from '@/lib/utils';

const RULES = [
  'Time left is always the largest thing.',
  'End time as a full 12-hour time.',
  'Motion only while awake; none with reduced motion.',
  'Status = words + icon, never colour alone.',
  'Readable at 120 px in a tab corner and at full screen.',
  'The same accent colour drives every face, set in Face studio.',
  'Multi-colour only while awake: green · sky · violet for layers, green → ember for the last minutes.',
];

const BANDS: readonly { id: TFaceTheme; name: string; hex: string; ground: string; line: string }[] = [
  { id: 'light', name: 'Light', hex: '#F5F5FA', ground: 'bg-background', line: 'border-border' },
  { id: 'dark', name: 'Dark', hex: '#070B16', ground: 'bg-card', line: 'border-border' },
  { id: 'oled', name: 'OLED', hex: '#000000', ground: 'bg-background', line: 'border-surface-3' },
];

const BAND_STATES: readonly { id: TFaceState; label: string }[] = [
  { id: 'idle', label: 'Idle' },
  { id: 'running', label: 'Awake' },
  { id: 'paused', label: 'Paused' },
  { id: 'blocked', label: 'Blocked' },
  { id: 'fallback', label: 'Fallback' },
  { id: 'up', label: 'Time’s up' },
];

const TOTALS = [
  [900, '15 min'],
  [1800, '30 min'],
  [2700, '45 min'],
  [3600, '1 hour'],
  [7200, '2 hours'],
] as const;

// Face studio's accent swatches on the boards; empty keeps the lamp.
const LAMPS = ['', '#3DF58E', '#FFC53D', '#7CBBFF', '#9F7BFF'] as const;
const SIZES = [96, 120, 150, 169, 200, 240, 250, 296, 380, 440];
// The board's rules text, between the two ink tokens.
const RULE_INK = '#C9D1E0';

const meta = 'font-mono text-xs';

// Dev-only replica of the clock faces board, with the knobs the coordinator needs to compare states.
export function FacesBoard() {
  const [state, setState] = useState<TFaceState>('running');
  const [total, setTotal] = useState<number>(FACE_DEFAULTS.total);
  const [remain, setRemain] = useState<number>(FACE_DEFAULTS.remain);
  const [nowSec, setNowSec] = useState<number>(FACE_DEFAULTS.nowSec);
  const [motion, setMotion] = useState<TFaceMotion>('auto');
  const [tick, setTick] = useState(false);
  const [indef, setIndef] = useState(false);
  const [fmt, setFmt] = useState<12 | 24>(12);
  const [lamp, setLamp] = useState<string>('');
  const [picked, setPicked] = useState<TFaceId>('ring');
  const [gridTheme, setGridTheme] = useState<TFaceTheme>('dark');

  useEffect(() => {
    if (!tick) return;
    const id = window.setInterval(() => {
      setNowSec((n) => n + 1);
      setRemain((r) => Math.max(0, r - 1));
    }, 1000);
    return () => {
      window.clearInterval(id);
    };
  }, [tick]);

  const session = { total, remain, nowSec, motion, indef, fmt, lamp: lamp || undefined };

  return (
    <div className="dark min-h-dvh overflow-x-auto bg-background text-foreground">
      <div className="sticky top-0 z-10 flex flex-wrap items-end gap-x-6 gap-y-3 border-b border-border bg-card/95 px-6 py-4 backdrop-blur">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="dev-state">Tile state</Label>
          <Select value={state} onValueChange={(v) => setState(v as TFaceState)}>
            <SelectTrigger id="dev-state" className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FACE_STATES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="dev-total">Length</Label>
          <Select
            value={String(total)}
            onValueChange={(v) => {
              setTotal(Number(v));
              setRemain((r) => Math.min(r, Number(v)));
            }}
          >
            <SelectTrigger id="dev-total" className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TOTALS.map(([sec, name]) => (
                <SelectItem key={sec} value={String(sec)}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex w-72 flex-col gap-3">
          <Label htmlFor="dev-remain">
            Remain {Math.floor(remain / 60)}:{String(remain % 60).padStart(2, '0')} ({remain} s)
          </Label>
          <Slider
            id="dev-remain"
            min={0}
            max={total}
            step={1}
            value={[remain]}
            onValueChange={([v]) => setRemain(v ?? 0)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">Motion</span>
          <ToggleGroup
            type="single"
            variant="outline"
            value={motion}
            onValueChange={(v) => v && setMotion(v as TFaceMotion)}
            aria-label="Motion"
          >
            <ToggleGroupItem value="auto">Auto</ToggleGroupItem>
            <ToggleGroupItem value="off">Off</ToggleGroupItem>
          </ToggleGroup>
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">Clock</span>
          <ToggleGroup
            type="single"
            variant="outline"
            value={String(fmt)}
            onValueChange={(v) => v && setFmt(v === '24' ? 24 : 12)}
            aria-label="Clock format"
          >
            <ToggleGroupItem value="12">12 h</ToggleGroupItem>
            <ToggleGroupItem value="24">24 h</ToggleGroupItem>
          </ToggleGroup>
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">Accent</span>
          <ToggleGroup
            type="single"
            variant="outline"
            value={lamp || 'lamp'}
            onValueChange={(v) => v && setLamp(v === 'lamp' ? '' : v)}
            aria-label="Face studio accent"
          >
            {LAMPS.map((c) => (
              <ToggleGroupItem key={c || 'lamp'} value={c || 'lamp'} aria-label={c || 'Lamp'}>
                {c ? <span className="size-4 rounded-full" style={{ background: c }} /> : 'Lamp'}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
        <div className="flex items-center gap-2 pb-3">
          <Switch id="dev-tick" checked={tick} onCheckedChange={setTick} />
          <Label htmlFor="dev-tick">Tick</Label>
        </div>
        <div className="flex items-center gap-2 pb-3">
          <Switch id="dev-indef" checked={indef} onCheckedChange={setIndef} />
          <Label htmlFor="dev-indef">No end</Label>
        </div>
      </div>

      <div className="box-border flex w-[1600px] flex-col gap-10 p-[72px]">
        <header className="flex items-end justify-between gap-10">
          <div className="flex flex-col gap-2">
            <span className="font-mono text-sm tracking-[.12em] text-link">14 · SYSTEM</span>
            <h1 className="m-0 text-[64px] leading-[normal] font-extrabold tracking-[-0.035em]">Clock faces</h1>
          </div>
          <p className="m-0 max-w-[640px] text-base leading-[1.55] text-muted-foreground-strong">
            Thirty-three faces, all free, built like premium watch and OS widgets: dimensional dials, precise ticks,
            live motion. Every tile shows the same session — 42:18 left, ending at 11:30 AM — and moves exactly as it
            will in the product: sweeping seconds, blinking colons, flipping cards, rolling drums, waves and needles.
            Status is always words plus an icon, never colour alone.
          </p>
        </header>

        <section className="grid grid-cols-5 gap-[18px]">
          {FACES.map((f) => (
            <figure
              key={f.id}
              className="m-0 flex flex-col gap-3 rounded-[24px] border border-border bg-card px-4 pt-4 pb-[18px]"
            >
              <div className="flex justify-center">
                <Face face={f.id} theme="dark" state={state} size={250} {...session} />
              </div>
              <figcaption className="flex flex-col gap-1 px-1.5">
                <div className="flex items-baseline gap-2.5">
                  <span className={cn(meta, 'text-muted-foreground')}>{f.num}</span>
                  <strong className="text-lg font-bold">{f.name}</strong>
                </div>
                <span className="text-sm leading-[1.45] text-muted-foreground-strong">{f.blurb}</span>
              </figcaption>
            </figure>
          ))}
          <div className="col-span-2 grid content-center gap-x-8 gap-y-3.5 rounded-[24px] border border-border bg-card px-8 py-7">
            <span className={cn(meta, 'tracking-[.1em] text-muted-foreground uppercase')}>Rules for every face</span>
            {RULES.map((r) => (
              <span key={r} className="flex gap-2.5 text-sm leading-normal" style={{ color: RULE_INK }}>
                <span className="mt-2 size-2 flex-none rounded-full bg-lamp" />
                {r}
              </span>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="m-0 text-[32px] leading-[normal] font-bold">States × themes · Ring</h2>
          {BANDS.map((b) => (
            <Band key={b.id} band={b} states={BAND_STATES} session={session} />
          ))}
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="m-0 text-[32px] leading-[normal] font-bold">Every state · Ring (dev)</h2>
          {BANDS.map((b) => (
            <Band key={b.id} band={b} states={FACE_STATES.map((s) => ({ id: s, label: s }))} session={session} />
          ))}
        </section>

        <section className="flex flex-col gap-4">
          <div className="flex items-end justify-between">
            <h2 className="m-0 text-[32px] leading-[normal] font-bold">Faces sheet</h2>
            <ToggleGroup
              type="single"
              variant="outline"
              value={gridTheme}
              onValueChange={(v) => v && setGridTheme(v as TFaceTheme)}
              aria-label="Sheet theme"
            >
              <ToggleGroupItem value="light">Light</ToggleGroupItem>
              <ToggleGroupItem value="dark">Dark</ToggleGroupItem>
              <ToggleGroupItem value="oled">OLED</ToggleGroupItem>
            </ToggleGroup>
          </div>
          <div className={cn(gridTheme, 'flex items-start gap-10 rounded-[24px] bg-background p-8 text-foreground')}>
            <div className="flex w-[336px] flex-col gap-2">
              <span className={cn(meta, 'text-muted-foreground uppercase')}>Desktop panel · 92 px · 3 columns</span>
              <FaceGrid selected={picked} onSelect={setPicked} theme={gridTheme} size={92} />
            </div>
            <div className="flex w-[680px] flex-col gap-2">
              <span className={cn(meta, 'text-muted-foreground uppercase')}>Tablet portrait · 5 columns</span>
              <FaceGrid selected={picked} onSelect={setPicked} theme={gridTheme} size={92} columns={5} />
            </div>
            <div className="flex w-[336px] flex-col gap-2">
              <span className={cn(meta, 'text-muted-foreground uppercase')}>Setup minis · 80 px</span>
              <FaceGrid
                selected={picked}
                onSelect={setPicked}
                theme={gridTheme}
                size={80}
                labels={false}
                ids={['ring', 'disc', 'flip', 'orbit', 'clocks', 'moon']}
              />
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="m-0 text-[32px] leading-[normal] font-bold">Sizes · {faceName(picked)}</h2>
          <p className="m-0 text-sm text-muted-foreground-strong">
            Below 170 px the face is compact (digits and graphics only); from 240 px every label stays at 12 px or more
            on screen.
          </p>
          <div
            className={cn(gridTheme, 'flex flex-wrap items-end gap-6 rounded-[24px] bg-background p-8 text-foreground')}
          >
            {SIZES.map((s) => (
              <div key={s} className="flex flex-col items-center gap-2">
                <Face face={picked} theme={gridTheme} state={state} size={s} {...session} />
                <span className={cn(meta, 'text-muted-foreground')}>{s} px</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function Band({
  band,
  states,
  session,
}: {
  band: (typeof BANDS)[number];
  states: readonly { id: TFaceState; label: string }[];
  session: Omit<Parameters<typeof Face>[0], 'face'>;
}) {
  return (
    <div
      className={cn(
        band.id,
        band.ground,
        band.line,
        'flex items-center gap-5 rounded-[24px] border px-6 py-5 text-foreground',
      )}
    >
      <div className="flex w-[110px] flex-none flex-col gap-1">
        <strong className="text-lg">{band.name}</strong>
        <span className={cn(meta, 'text-muted-foreground-strong')}>{band.hex}</span>
      </div>
      <div
        className="grid flex-1 gap-3"
        style={{ gridTemplateColumns: `repeat(${states.length > 6 ? 4 : states.length}, minmax(0, 1fr))` }}
      >
        {states.map((s) => (
          <div key={s.id} className="flex flex-col items-center gap-1">
            <Face face="ring" theme={band.id} state={s.id} size={200} {...session} />
            <span className={cn(meta, 'tracking-[.06em] text-muted-foreground-strong uppercase')}>{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
