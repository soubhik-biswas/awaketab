'use client';

import { type CSSProperties, useEffect, useState } from 'react';
import {
  Face,
  FACE_COLLECTIONS,
  FACE_STATES,
  FaceGrid,
  FACES,
  faceName,
  type TFaceCollection,
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

// The session the faces board mounts on every tile: 38:12 left at 11:03:48 AM, ending at 11:42 AM.
const BOARD = { total: 3600, remain: 2292, nowSec: 39_828 } as const;

const BANDS: readonly { id: TFaceTheme; title: string; bg: string; line: string; ink: string; mute: string }[] = [
  { id: 'dark', title: 'Dark theme', bg: '#05060A', line: 'rgba(255,255,255,.08)', ink: '#F2F4FA', mute: '#A6AFC2' },
  { id: 'light', title: 'Light theme', bg: '#F4F4F9', line: 'rgba(11,16,32,.08)', ink: '#0B1020', mute: '#4B5165' },
  { id: 'oled', title: 'OLED theme', bg: '#000000', line: 'rgba(255,255,255,.08)', ink: '#F2F4FA', mute: '#A6AFC2' },
];

const STATE_LABEL: Readonly<Record<TFaceState, string>> = {
  idle: 'Ready',
  starting: 'Starting',
  running: 'Awake',
  fallback: 'Video fallback',
  paused: 'Paused',
  blocked: 'Blocked',
  unsupported: 'Unsupported',
  up: 'Time’s up',
};

const TOTALS = [
  [900, '15 min'],
  [1800, '30 min'],
  [3600, '1 hour'],
  [7200, '2 hours'],
] as const;

const KIND = { digital: 'Digital', analog: 'Analog', ambient: 'Ambient' } as const;
// Face studio's accent swatches; empty keeps the lamp.
const LAMPS = ['', '#3DF58E', '#FFC53D', '#7CBBFF', '#9F7BFF'] as const;
// The sizes the no-overflow rule is checked at, from the dock thumbnail to fullscreen.
const SIZES = [44, 64, 96, 160, 200, 300, 360, 640] as const;
const COLLECTIONS: readonly TFaceCollection[] = ['featured', 'digital', 'analog', 'ambient', 'all'];

const mono: CSSProperties = { fontFamily: 'var(--font-geist-mono), monospace', fontSize: 12 };
const sectionStyle = (b: (typeof BANDS)[number]): CSSProperties => ({
  display: 'flex',
  flexDirection: 'column',
  gap: 20,
  padding: 32,
  borderRadius: 32,
  background: b.bg,
  border: `1px solid ${b.line}`,
  color: b.ink,
});
const cardStyle = (b: (typeof BANDS)[number]): CSSProperties => ({
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  padding: '14px 14px 16px',
  borderRadius: 22,
  background: b.id === 'light' ? '#FFFFFF' : 'linear-gradient(180deg, rgba(255,255,255,.05), rgba(255,255,255,.02))',
  border: `1px solid ${b.line}`,
});

// Dev-only replica of the faces board: all 46 faces on their tiles in dark, light and OLED, the state rows, the
// sizes the no-overflow rule is checked at, and the gallery tiles.
export function FacesBoard() {
  const [state, setState] = useState<TFaceState>('running');
  const [total, setTotal] = useState<number>(BOARD.total);
  const [remain, setRemain] = useState<number>(BOARD.remain);
  const [nowSec, setNowSec] = useState<number>(BOARD.nowSec);
  const [motion, setMotion] = useState<TFaceMotion>('off');
  const [tick, setTick] = useState(false);
  const [indef, setIndef] = useState(false);
  const [fmt, setFmt] = useState<12 | 24>(12);
  const [lamp, setLamp] = useState<string>('');
  const [picked, setPicked] = useState<TFaceId>('ring');
  const [collection, setCollection] = useState<TFaceCollection>('featured');

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

  const session = { total, remain, nowSec, motion, indef, fmt, ...(lamp ? { lamp } : {}) };

  return (
    <div className="dark min-h-dvh overflow-x-auto bg-[#04050A] text-[#F2F4FA]">
      <div className="sticky top-0 left-0 z-10 flex flex-wrap items-end gap-x-6 gap-y-3 border-b border-white/10 bg-[#04050A]/95 px-6 py-4 backdrop-blur">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="dev-state">Tile state</Label>
          <Select value={state} onValueChange={(v) => setState(v as TFaceState)}>
            <SelectTrigger id="dev-state" className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FACE_STATES.map((s) => (
                <SelectItem key={s} value={s}>
                  {STATE_LABEL[s]}
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
            Left {Math.floor(remain / 60)}:{String(remain % 60).padStart(2, '0')} ({remain} s)
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
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="dev-face">Face for rows</Label>
          <Select value={picked} onValueChange={(v) => setPicked(v as TFaceId)}>
            <SelectTrigger id="dev-face" className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FACES.map((f) => (
                <SelectItem key={f.id} value={f.id}>
                  {f.num} · {f.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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

      <div className="box-border flex w-[3080px] flex-col gap-12 px-[70px] py-[72px]">
        <header className="flex items-end justify-between gap-[60px]">
          <div className="flex flex-col gap-2.5">
            <span style={{ ...mono, fontSize: 16, letterSpacing: '.14em', color: '#3DF58E' }}>
              THE 46 FACES · DARK, LIGHT AND OLED
            </span>
            <h1 className="m-0 font-display text-[76px] leading-none font-bold tracking-[-0.04em]">
              One family of clocks.
            </h1>
          </div>
          <p className="m-0 max-w-[1100px] text-[20px] leading-[1.55] text-[#A6AFC2]">
            Every face is one component that follows light, dark and OLED, scales from a 44 px dock thumbnail to
            fullscreen, and takes a single heat colour for the time left. ★ = Featured collection (18). LED, Pulse and
            Terminal were retired.
          </p>
        </header>

        {BANDS.map((b) => (
          <section key={b.id} style={sectionStyle(b)}>
            <h2 className="m-0 text-[28px] font-bold">{b.title}</h2>
            <div className="grid grid-cols-8 gap-4">
              {FACES.map((f) => (
                <figure key={f.id} className="m-0" style={cardStyle(b)}>
                  <div className="flex justify-center">
                    <Face face={f.id} theme={b.id} state={state} size={300} bare {...session} />
                  </div>
                  <figcaption className="flex items-baseline gap-2">
                    <span style={{ ...mono, color: b.mute }}>{f.num}</span>
                    <strong className="text-[18px]">{f.name}</strong>
                    <span className="ml-auto" style={{ ...mono, color: b.mute }}>
                      {f.featured ? '★ ' : ''}
                      {KIND[f.kind]}
                    </span>
                  </figcaption>
                  <span className="text-[14px] leading-normal" style={{ color: b.mute }}>
                    {f.blurb}
                  </span>
                </figure>
              ))}
            </div>
          </section>
        ))}

        <section className="flex flex-col gap-5">
          <h2 className="m-0 text-[28px] font-bold">Every state · {faceName(picked)}</h2>
          {BANDS.map((b) => (
            <div key={b.id} style={{ ...sectionStyle(b), flexDirection: 'row', alignItems: 'center', padding: 24 }}>
              <strong className="w-[140px] flex-none text-[18px]">{b.title}</strong>
              <div className="grid flex-1 grid-cols-8 gap-4">
                {FACE_STATES.map((s) => (
                  <div key={s} className="flex flex-col items-center gap-2" style={cardStyle(b)}>
                    <Face face={picked} theme={b.id} state={s} size={300} bare {...session} />
                    <span style={{ ...mono, letterSpacing: '.06em', color: b.mute }}>
                      {STATE_LABEL[s].toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>

        <section className="flex flex-col gap-5">
          <h2 className="m-0 text-[28px] font-bold">Sizes · {faceName(picked)}</h2>
          <p className="m-0 text-[16px] text-[#A6AFC2]">
            Below 200 px secondary text hides; at 64 px and under only the main shape and digits stay. Nothing draws
            outside the box at any size. The last tile is the face with its status caption.
          </p>
          {BANDS.map((b) => (
            <div
              key={b.id}
              style={{ ...sectionStyle(b), flexDirection: 'row', alignItems: 'flex-end', flexWrap: 'wrap' }}
            >
              {SIZES.map((px) => (
                <div key={px} className="flex flex-col items-center gap-2">
                  <div style={{ outline: `1px dashed ${b.line}` }}>
                    <Face face={picked} theme={b.id} state={state} size={px} bare {...session} />
                  </div>
                  <span style={{ ...mono, color: b.mute }}>{px} px</span>
                </div>
              ))}
              <div className="flex flex-col items-center gap-2">
                <div style={{ outline: `1px dashed ${b.line}` }}>
                  <Face face={picked} theme={b.id} state={state} size={300} {...session} />
                </div>
                <span style={{ ...mono, color: b.mute }}>300 px · caption</span>
              </div>
            </div>
          ))}
        </section>

        <section className="flex flex-col gap-5">
          <div className="flex items-end justify-between">
            <h2 className="m-0 text-[28px] font-bold">Gallery tiles</h2>
            <ToggleGroup
              type="single"
              variant="outline"
              value={collection}
              onValueChange={(v) => v && setCollection(v as TFaceCollection)}
              aria-label="Collection"
            >
              {COLLECTIONS.map((c) => (
                <ToggleGroupItem key={c} value={c} className="capitalize">
                  {c} {FACE_COLLECTIONS[c].length}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
          {BANDS.map((b) => (
            <div key={b.id} style={sectionStyle(b)}>
              <strong className="text-[18px]">{b.title}</strong>
              <FaceGrid
                selected={picked}
                onSelect={setPicked}
                theme={b.id}
                ids={FACE_COLLECTIONS[collection]}
                size={176}
                columns={12}
              />
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
