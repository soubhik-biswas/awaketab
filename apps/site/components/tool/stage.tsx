'use client';

import { forwardRef, useLayoutEffect, useRef, useState, type RefObject } from 'react';
import dynamic from 'next/dynamic';
import { LifeBuoy, LoaderCircle, Pause, Play, Plus, RotateCcw, X, type LucideIcon } from 'lucide-react';
import { Banner } from '@/components/product/banner';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { fill } from '@/lib/tool/chrome';
import { faceRemain } from '@/lib/tool/model';
import { type TBanner } from '@/lib/tool/ui';
import { STAGE_ID } from '@/lib/tool/stage-id';
import { useTool } from '@/components/tool/context';
import { ToolPill } from '@/components/tool/header';

const Face = dynamic(() => import('@/components/face').then((mod) => mod.Face), { ssr: false });

// The banner the conditions call for: offline, another tab holding the lamp, or a new version.
function useBannerKind(): Exclude<TBanner, 'none'> | null {
  const { snap, ui, online } = useTool();
  const qa = ui.qa.banner;
  if (qa !== undefined) return qa === 'none' ? null : qa;
  if (!online) return 'offline';
  if (snap.peerHolds) return 'conflict';
  if (ui.update) return 'update';
  return null;
}

function Banners() {
  const { ui, m, a } = useTool();
  const c = m.c;
  const kind = useBannerKind();
  return (
    <>
      {kind === 'offline' ? (
        <Banner kind="offline" title={c.bOfflineT} body={c.bOfflineB} className="shrink-0" />
      ) : null}
      {kind === 'conflict' ? (
        <Banner
          kind="conflict"
          title={c.bConflictT}
          body={c.bConflictB}
          actionLabel={c.bConflictA}
          className="shrink-0"
          onAction={a.takeOver}
        />
      ) : null}
      {kind === 'update' ? (
        <Banner
          kind="update"
          title={c.bUpdateT}
          body={c.bUpdateB}
          actionLabel={c.bUpdateA}
          className="shrink-0"
          onAction={() => window.location.reload()}
        />
      ) : null}
      {m.state === 'needsyou' ? (
        <Banner
          kind="needsyou"
          title={c.bNeedsT}
          body={c.bNeedsB}
          className="shrink-0"
          actionLabel={m.s.resume}
          onAction={a.resume}
        />
      ) : null}
      {m.state === 'blocked' && ui.view !== 'fix' ? (
        // The refusal is already announced once, assertively, so the banner itself stays quiet.
        <Banner
          kind="blocked"
          role="note"
          title={c.bBlockedT}
          body={c.bBlockedB}
          actionLabel={c.bBlockedA}
          className="shrink-0"
          onAction={() => a.go('fix')}
        />
      ) : null}
    </>
  );
}

type TCtrl = {
  key: string;
  label: string;
  icon?: LucideIcon;
  onClick: () => void;
  className: string;
  variant: 'default' | 'secondary' | 'outline';
  spin?: boolean;
  disabled?: boolean;
  primary?: boolean;
  keys?: string;
};

// Fullscreen keeps the session's buttons under the face, in the drawn sizes.
function useFocusControls(): TCtrl[] {
  const { device, m, a } = useTool();
  const phone = device === 'phone';
  const s = m.s;
  const st = m.state;
  const xl = cn(
    'gap-2 font-bold [&_svg:not([class*=size-])]:size-5',
    phone ? 'h-14 rounded-[18px] px-[22px] text-[17px]' : 'h-16 rounded-[20px] px-[30px] text-[18px]',
  );
  const glow = 'shadow-[0_12px_32px_var(--primary-glow)]';
  const mid = cn(
    'h-13 gap-2 rounded-[16px] px-4 text-[15px] font-semibold [&_svg:not([class*=size-])]:size-[18px]',
    phone && 'min-w-0 flex-1 gap-1.5 px-2',
  );
  const tall = cn(
    'gap-2 px-4 text-[15px] font-semibold [&_svg:not([class*=size-])]:size-[18px]',
    phone ? 'h-14 rounded-[18px]' : 'h-16 rounded-[20px]',
  );
  if (st === 'idle')
    return [
      {
        key: 'start',
        label: s.keep,
        icon: Play,
        onClick: () => a.start(),
        className: cn(xl, glow, phone && 'w-full'),
        variant: 'default',
        primary: true,
        keys: 'Space',
      },
    ];
  if (st === 'starting')
    return [
      {
        key: 'starting',
        label: s.starting,
        onClick: () => undefined,
        className: cn(
          xl,
          'cursor-progress border-surface-3 bg-surface-3 text-muted-foreground-strong hover:border-surface-3 hover:bg-surface-3',
          phone && 'w-full',
        ),
        variant: 'secondary',
        spin: true,
        disabled: true,
        primary: true,
      },
    ];
  if (st === 'running' || st === 'fallback')
    return [
      {
        key: 'pause',
        label: s.pause,
        icon: Pause,
        onClick: a.pause,
        className: cn(mid, 'border-border'),
        variant: 'secondary',
        primary: true,
        keys: 'Space',
      },
      {
        key: 'ext',
        label: s.ext15,
        icon: Plus,
        onClick: () => a.extend(900),
        className: cn(mid, 'shadow-[0_10px_26px_var(--primary-glow)]'),
        variant: 'default',
        keys: '+',
      },
      { key: 'stop', label: s.stop, icon: X, onClick: a.stop, className: mid, variant: 'outline' },
    ];
  if (st === 'paused' || st === 'needsyou')
    return [
      {
        key: 'resume',
        label: s.resume,
        icon: Play,
        onClick: a.resume,
        className: cn(xl, glow, phone && 'flex-1'),
        variant: 'default',
        primary: true,
        keys: 'Space',
      },
      { key: 'stop', label: s.stop, icon: X, onClick: a.stop, className: tall, variant: 'outline' },
    ];
  if (st === 'blocked')
    return [
      {
        key: 'fix',
        label: s.fix,
        icon: LifeBuoy,
        onClick: () => a.go('fix'),
        className: cn(xl, glow, phone && 'w-full'),
        variant: 'default',
        primary: true,
      },
      {
        key: 'fallback',
        label: s.fallback,
        icon: Play,
        onClick: a.useFallback,
        className: cn(mid, phone && 'w-full flex-none'),
        variant: 'outline',
      },
    ];
  if (st === 'unsupported')
    return [
      {
        key: 'fallback',
        label: s.fallback,
        icon: Play,
        onClick: a.useFallback,
        className: cn(xl, glow, phone && 'w-full'),
        variant: 'default',
        primary: true,
      },
    ];
  return [
    {
      key: 'again',
      label: s.again,
      icon: RotateCcw,
      onClick: () => a.setLength(m.total),
      className: cn(xl, glow, phone && 'flex-1'),
      variant: 'default',
      primary: true,
    },
    {
      key: 'ext',
      label: s.ext15,
      icon: Plus,
      onClick: () => a.extend(900),
      className: cn(tall, 'border-border'),
      variant: 'secondary',
      keys: '+',
    },
  ];
}

function FocusControls() {
  const { device, m } = useTool();
  const phone = device === 'phone';
  const list = useFocusControls();
  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center gap-2.5',
        phone ? 'mt-auto w-full' : 'w-auto',
        phone && m.state === 'blocked' ? 'flex-wrap' : 'flex-nowrap',
      )}
    >
      {list.map((c) => {
        const Icon = c.icon;
        return (
          <Button
            key={c.key}
            type="button"
            variant={c.variant}
            onClick={c.disabled ? undefined : c.onClick}
            aria-disabled={c.disabled || undefined}
            aria-keyshortcuts={c.keys}
            data-primary={c.primary || undefined}
            className={c.className}
          >
            {c.spin ? (
              <LoaderCircle className="size-[18px] animate-spinner" strokeWidth={2.25} aria-hidden="true" />
            ) : null}
            {Icon ? <Icon strokeWidth={2} aria-hidden="true" /> : null}
            <span>{c.label}</span>
          </Button>
        );
      })}
    </div>
  );
}

function StageFace({ size }: { size: number }) {
  const { m, theme, settings, pro } = useTool();
  const minute = Math.ceil(m.remain / 60);
  const hour = new Date(m.now).getHours();
  // "Dim the clock at night": after 10:00 PM and until 6:00 AM.
  const dim = settings.dim && (hour >= 22 || hour < 6);
  const c = m.c;
  // Whole minutes only, so the label changes once a minute and the countdown is never read every second.
  const label = m.indef
    ? fill(c.faceOpen, { n: Math.floor(m.elapsed / 60) })
    : m.state === 'ended'
      ? fill(c.faceUp, { time: m.endedT })
      : minute === 1
        ? fill(c.faceLeft1, { time: m.endT })
        : fill(c.faceLeft, { n: minute, time: m.endT });
  return (
    <div
      role="timer"
      aria-label={label}
      data-stage-face=""
      className={cn(
        'pointer-events-none shrink-0 overflow-visible transition-opacity duration-arrive',
        dim && 'opacity-60',
      )}
      style={{ width: size, height: Math.round(size * 0.875) }}
    >
      <div aria-hidden="true">
        <Face
          face={settings.face}
          theme={theme}
          state={m.faceState}
          size={size}
          remain={faceRemain(m)}
          total={m.indef ? 3600 : m.total}
          nowSec={m.nowSec}
          indef={m.indef}
          bare
          lamp={pro.isPro && pro.studio.lamp ? pro.studio.lamp : undefined}
          lblTop={m.lblTop}
          lblEnd={m.lblEnd}
          fmt={m.fmt}
        />
      </div>
    </div>
  );
}

const MIN_FACE = 140;

// Between the drawn viewports the face shrinks to whatever the stage leaves, never past its drawn size.
function useFittedFace(stage: RefObject<HTMLElement | null>, want: number): number {
  const [size, setSize] = useState(want);
  const measure = useRef<() => void>(() => undefined);
  measure.current = () => {
    const el = stage.current;
    if (!el) return;
    const cs = getComputedStyle(el);
    const gap = parseFloat(cs.rowGap) || 0;
    const innerH = el.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
    const innerW = el.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    let others = 0;
    let count = 0;
    for (const child of Array.from(el.children)) {
      if (!(child instanceof HTMLElement) || child.offsetParent === null) continue;
      count += 1;
      if (child.hasAttribute('data-stage-face')) continue;
      others += child.offsetHeight;
    }
    const room = innerH - others - gap * Math.max(0, count - 1);
    const next = Math.max(MIN_FACE, Math.min(want, Math.floor(room / 0.875), Math.floor(innerW)));
    setSize((prev) => (prev === next ? prev : next));
  };
  useLayoutEffect(() => measure.current());
  useLayoutEffect(() => {
    const el = stage.current;
    if (!el) return;
    const ro = new ResizeObserver(() => measure.current());
    ro.observe(el);
    return () => ro.disconnect();
  }, [stage]);
  return size;
}

export const Stage = forwardRef<HTMLElement, { faceSize: number; top: number; bottom: number }>(function Stage(
  { faceSize, top, bottom },
  ref,
) {
  const { device, ui, m, settings } = useTool();
  const phone = device === 'phone';
  const focus = ui.view === 'focus';
  const banner = useBannerKind();
  const local = useRef<HTMLElement | null>(null);
  const size = useFittedFace(local, faceSize);
  const s = m.s;
  const hero = !focus && m.state === 'idle' && (ui.view === 'timer' || ui.view === 'palette') && banner === null;
  return (
    <main
      ref={(el) => {
        local.current = el;
        if (typeof ref === 'function') ref(el);
        else if (ref) ref.current = el;
      }}
      id={STAGE_ID}
      tabIndex={0}
      aria-label={s.timer}
      aria-keyshortcuts="Space + Shift++ U F Shift+D ? 1 2 3 4 5 6 7 8 9"
      className={cn(
        'absolute inset-x-0 z-[1] box-border flex flex-col items-center justify-center-safe overflow-x-hidden overflow-y-auto outline-none [scrollbar-width:none] focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-ring',
        phone ? 'gap-2.5 px-4 py-3.5' : 'gap-3.5 px-8 py-6',
      )}
      style={{ top, bottom }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) e.currentTarget.focus({ preventScroll: true });
      }}
    >
      {!focus ? <Banners /> : null}
      {phone || focus ? <ToolPill className="shrink-0" /> : null}
      {hero ? (
        <div
          className={cn(
            'flex shrink-0 flex-col items-center text-center',
            phone ? 'max-w-[350px] gap-2' : 'max-w-[820px] gap-3.5',
          )}
        >
          <h1
            className={cn(
              'm-0 font-display leading-[.98] font-extrabold tracking-[-0.035em] text-balance text-foreground [font-stretch:112%]',
              phone
                ? 'text-[34px]'
                : device === 'tabletL'
                  ? 'text-[56px]'
                  : device === 'tabletP'
                    ? 'text-[60px]'
                    : 'text-[68px]',
            )}
          >
            {s.hero}
          </h1>
          <span
            className={cn(
              'leading-[1.45] text-balance text-muted-foreground-strong',
              phone ? 'text-[16px]' : 'text-[19px]',
            )}
          >
            {phone ? s.heroSubPhone : s.heroSub}
          </span>
        </div>
      ) : null}
      {!focus ? (
        <span
          className={cn(
            'shrink-0 text-center font-mono tracking-[.02em] text-muted-foreground-strong',
            phone ? 'text-[13px]' : 'text-[14px]',
          )}
        >
          {m.dateText}
        </span>
      ) : null}
      <StageFace size={size} />
      {!focus && m.state !== 'idle' && m.state !== 'starting' && settings.label ? (
        <span
          className={cn(
            'max-w-full shrink-0 truncate text-center font-semibold tracking-[-0.01em] text-muted-foreground-strong',
            phone ? 'text-[16px]' : 'text-[18px]',
          )}
        >
          {settings.label}
        </span>
      ) : null}
      {focus ? (
        <FocusControls />
      ) : (
        // The drawn stage keeps its empty control row, whose gap is part of how the stack centres.
        <div aria-hidden="true" className="h-0 shrink-0" />
      )}
    </main>
  );
});
