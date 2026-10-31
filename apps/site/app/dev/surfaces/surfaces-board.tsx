'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { EmbedWidget, KitchenTimers, type IEmbedWidgetProps } from '@/components/embed/embed-widget';
import { KioskPage } from '@/components/kiosk/kiosk-page';
import { MiniClock } from '@/components/pip/mini-clock';
import { PipLauncher } from '@/components/pip/pip-launcher';
import { Button } from '@/components/ui/button';
import { LiveWidgets } from '@/components/widgets/widget-sync';
import { WidgetPresets, WidgetScreen, WidgetSmall, WidgetWide } from '@/components/widgets/widget-tiles';
import { formatClock } from '@/lib/embed/clock';
import type { ICookTimer } from '@/lib/embed/timers';
import { surfaceView } from '@/lib/surfaces/session';
import type { TWakeState } from '@/lib/wake';

// The board's "another app" document behind the mini clock: window dots and grey text lines (art, not UI).
const DOTS = ['#FF6B81', '#FFC53D', '#5CF59E'] as const;
const DOC_LINES = ['94%', '88%', '96%', '72%', '90%', '84%', '60%', '92%'];

const midnight = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

// The board's session: 38:12 left at 11:03:48 AM, so it ends at 11:42 AM; it counts down live like the prototype.
function useBoardClock() {
  const [tick, setTick] = useState(0);
  const [extra, setExtra] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setTick((n) => n + 1), 1000);
    return () => window.clearInterval(id);
  }, []);
  const now = midnight() + (39_828 + tick) * 1000;
  const remain = Math.max(0, 2292 + extra - tick);
  return { now, remain, extend: () => setExtra((e) => e + 900) };
}

function boardView(state: TWakeState, now: number, remain: number) {
  return surfaceView({
    state,
    now,
    totalSec: 3600,
    endsAt: now + remain * 1000,
    pausedAt: null,
    pauseReason: state === 'paused' ? 'hidden' : null,
    endedAt: state === 'ended' ? now : null,
    mode: state === 'fallback' ? 'video' : 'native',
  });
}

function H2({ children }: { children: ReactNode }) {
  return <h2 className="m-0 text-[22px] font-bold">{children}</h2>;
}

function Note({ children }: { children: ReactNode }) {
  return <span className="text-[14px] leading-[1.5] text-muted-foreground-strong">{children}</span>;
}

const EMBED_BASE: Omit<IEmbedWidgetProps, 'lock' | 'action'> = {
  mode: 'cook',
  size: 'compact',
  theme: 'dark',
  digits: '00:00',
  muted: true,
  digitsLabel: 'Keep screen awake, 00:00',
  hint: 'Tap Start to keep the screen awake.',
  foot: 'Works while this page is visible',
  note: null,
  notice: null,
  paused: false,
  onAction: () => undefined,
  onDigits: () => undefined,
};

const EMBED_STATES: Array<[string, Partial<IEmbedWidgetProps> & Pick<IEmbedWidgetProps, 'lock' | 'action'>]> = [
  ['Ready', { lock: 'idle', action: 'start' }],
  ['Starting', { lock: 'requesting', action: 'stop', hint: 'Asking your browser…' }],
  ['Awake', { lock: 'held', action: 'stop', digits: '38:12', muted: false, hint: 'Tap the timer to pause' }],
  ['Video fallback', { lock: 'fallback', action: 'stop', digits: '38:12', muted: false }],
  [
    'Not allowed by the site',
    {
      lock: 'idle',
      action: 'start',
      notice: { tone: 'bad', text: 'Ask the site owner to allow screen wake lock for this widget.', fix: true },
    },
  ],
  [
    'Blocked',
    {
      lock: 'denied',
      action: 'retry',
      hint: '',
      notice: { tone: 'bad', text: 'Your browser said no. Bring this tab to the front, then tap Retry.', fix: false },
    },
  ],
  [
    'Needs a tap',
    {
      lock: 'unsupported',
      action: 'start',
      notice: { tone: 'lamp', text: 'Tap Start to keep the screen awake.', fix: false },
    },
  ],
  ['Narrow frame', { lock: 'held', action: 'stop', digits: '38:12', muted: false, long: true }],
];

function EmbedEdges({ now }: { now: number }) {
  const timers: ICookTimer[] = [
    { id: 'a', name: 'Pasta', durationMs: 600_000, endsAt: now + 412_000, doneAt: null },
    { id: 'b', name: 'Oven', durationMs: 1_800_000, endsAt: now - 1000, doneAt: now - 1000 },
  ];
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-6">
        {EMBED_STATES.map(([name, p]) => (
          <div key={name} className="flex flex-col gap-2">
            <span className="font-mono text-[12px] tracking-[.1em] text-muted-foreground-strong uppercase">{name}</span>
            <EmbedWidget {...EMBED_BASE} {...p} className={p.long ? 'max-w-[280px]' : 'max-w-[320px]'} />
          </div>
        ))}
      </div>
      <EmbedWidget
        {...EMBED_BASE}
        size="full"
        lock="held"
        action="stop"
        digits="38:12"
        muted={false}
        hint="Tap the timer to pause"
        timers={
          <KitchenTimers
            timers={timers}
            now={now}
            format={formatClock}
            onAdd={() => undefined}
            onRemove={() => undefined}
          />
        }
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <EmbedWidget
          {...EMBED_BASE}
          mode="clock"
          size="full"
          theme="light"
          lock="held"
          action="stop"
          digits="11:03 AM"
          muted={false}
          hint="The time, kept on screen"
          foot="Saturday, 31 October 2026"
        />
        <EmbedWidget
          {...EMBED_BASE}
          mode="minimal"
          size="full"
          theme="oled"
          lock="idle"
          action="start"
          note="Keeps this screen on while you read."
        />
      </div>
    </div>
  );
}

export function SurfacesBoard() {
  const { now, remain, extend } = useBoardClock();
  const [pip, setPip] = useState(true);
  const view = boardView('running', now, remain);
  return (
    <div className="dark flex min-h-dvh w-full flex-col gap-10 bg-[var(--board-ground)] px-12 py-14 text-foreground [--board-ground:#04060C]">
      <header className="flex flex-col gap-2">
        <span className="font-mono text-[14px] tracking-[.12em] text-lamp">DEV · SURFACES</span>
        <h1 className="m-0 font-display text-[56px] font-extrabold tracking-[-0.035em] [font-stretch:112%]">
          Mini clock, widgets and kiosk
        </h1>
      </header>

      <section className="grid items-start gap-8 xl:grid-cols-[860px_1fr]">
        <div className="flex flex-col gap-3">
          <H2>Picture-in-picture mini clock</H2>
          <div className="relative h-[520px] w-[860px] max-w-full overflow-hidden rounded-[20px] bg-[linear-gradient(135deg,var(--surface-3),var(--card))]">
            <div className="light absolute top-9 left-10 flex h-[430px] w-[640px] flex-col rounded-[14px] bg-card text-foreground shadow-[0_20px_50px_rgba(0,0,0,.4)]">
              <div className="flex h-9 items-center gap-2 border-b border-border px-[14px] text-[13px] text-muted-foreground-strong">
                {DOTS.map((c) => (
                  <span key={c} className="size-2.5 rounded-full" style={{ background: c }} />
                ))}
                <span className="ml-2.5">Another app · quarterly-report.doc</span>
              </div>
              <div className="flex flex-col gap-3 px-9 py-7">
                <strong className="text-[28px]">Quarterly report</strong>
                {DOC_LINES.map((w, i) => (
                  <span key={i} className="h-3 rounded-[6px] bg-surface-3" style={{ width: w }} />
                ))}
              </div>
            </div>
            {pip ? (
              <MiniClock
                view={view}
                theme="dark"
                onExtend={extend}
                onClose={() => setPip(false)}
                className="absolute right-7 bottom-7"
              />
            ) : (
              <Button
                type="button"
                size="lg"
                onClick={() => setPip(true)}
                className="absolute right-7 bottom-7 h-13 rounded-[14px] px-[18px] text-[16px] font-bold shadow-[0_12px_30px_var(--primary-glow)]"
              >
                Pop out mini clock
              </Button>
            )}
          </div>
          <Note>
            The board drawing above; the real button below opens Document Picture-in-Picture (or the /pip popup) on this
            machine.
          </Note>
          <PipLauncher className="self-start" />
          <div className="flex flex-wrap gap-4">
            {(['paused', 'needsyou', 'blocked', 'ended', 'idle'] as const).map((s) => (
              <MiniClock key={s} view={boardView(s, now, remain)} theme="dark" onClose={() => undefined} />
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <H2>Home-screen widgets</H2>
          <WidgetScreen>
            <WidgetSmall view={view} theme="dark" />
            <WidgetPresets />
            <WidgetWide view={view} label="Presenting to the board" />
          </WidgetScreen>
          <Note>Live, from this tab’s engine:</Note>
          <LiveWidgets />
        </div>
      </section>

      <section className="-mx-12">
        <KioskPage />
      </section>

      <section className="flex flex-col gap-3">
        <H2>Website widget</H2>
        <EmbedEdges now={now} />
      </section>
    </div>
  );
}
