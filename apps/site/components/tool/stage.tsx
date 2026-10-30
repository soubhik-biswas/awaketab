'use client';

import { forwardRef } from 'react';
import dynamic from 'next/dynamic';
import { LifeBuoy, LoaderCircle, Maximize, Pause, Play, Plus, RotateCcw, X, type LucideIcon } from 'lucide-react';
import { Banner } from '@/components/product/banner';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { faceRemain } from '@/lib/tool/model';
import { useTool } from '@/components/tool/context';
import { ToolPill } from '@/components/tool/header';
import { SecLabel } from '@/components/tool/kit';
import { LengthChips } from '@/components/tool/length-chips';

const Face = dynamic(() => import('@/components/face').then((mod) => mod.Face), { ssr: false });

function Banners() {
  const { snap, ui, online, m, a } = useTool();
  const banner = ui.qa.banner;
  return (
    <>
      {banner === 'offline' || (banner === undefined && !online) ? <Banner kind="offline" /> : null}
      {banner === 'conflict' || (banner === undefined && snap.peerHolds) ? (
        <Banner kind="conflict" onAction={a.takeOver} />
      ) : null}
      {m.state === 'needsyou' ? <Banner kind="needsyou" actionLabel={m.s.resume} onAction={a.resume} /> : null}
      {m.state === 'blocked' && ui.view !== 'fix' ? (
        <Banner kind="blocked" role="alert" onAction={() => a.go('fix')} />
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
  aria?: string;
  spin?: boolean;
  disabled?: boolean;
  primary?: boolean;
  keys?: string;
};

function useControls(focus: boolean): TCtrl[] {
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
  const tall = phone ? 'h-14 rounded-[18px]' : 'h-16 rounded-[20px]';
  const quiet = 'h-11 gap-2 rounded-[10px] px-4 text-[15px] font-semibold [&_svg:not([class*=size-])]:size-[18px]';
  let list: TCtrl[] = [];
  if (st === 'idle')
    list = [
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
  else if (st === 'starting')
    list = [
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
  else if (st === 'running' || st === 'fallback')
    list = [
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
  else if (st === 'paused' || st === 'needsyou')
    list = [
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
      { key: 'stop', label: s.stop, icon: X, onClick: a.stop, className: cn(quiet, tall), variant: 'outline' },
    ];
  else if (st === 'blocked')
    list = [
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
        className: cn(
          'h-13 gap-2 rounded-[16px] px-4 text-[15px] font-semibold [&_svg:not([class*=size-])]:size-[18px]',
          phone && 'w-full',
        ),
        variant: 'outline',
      },
    ];
  else if (st === 'unsupported')
    list = [
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
  else if (st === 'ended')
    list = [
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
        className: cn(quiet, tall, 'border-border'),
        variant: 'secondary',
        keys: '+',
      },
    ];
  if (focus) return list.slice(0, 3);
  if (!phone && (st === 'idle' || st === 'running' || st === 'fallback'))
    list.push({
      key: 'full',
      label: '',
      aria: 'Fullscreen',
      icon: Maximize,
      onClick: () => a.go('focus'),
      className: 'size-13 rounded-[16px] p-0 [&_svg:not([class*=size-])]:size-5',
      variant: 'outline',
      keys: 'F',
    });
  return list;
}

export function Controls({ focus = false }: { focus?: boolean }) {
  const { device, m } = useTool();
  const phone = device === 'phone';
  const list = useControls(focus);
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
            aria-label={c.aria}
            aria-disabled={c.disabled || undefined}
            aria-keyshortcuts={c.keys}
            data-primary={c.primary || undefined}
            className={c.className}
          >
            {c.spin ? (
              <LoaderCircle className="size-[18px] animate-spinner" strokeWidth={2.25} aria-hidden="true" />
            ) : null}
            {Icon ? <Icon strokeWidth={2} aria-hidden="true" /> : null}
            {c.label ? <span>{c.label}</span> : null}
          </Button>
        );
      })}
    </div>
  );
}

export function StageFace({ size }: { size: number }) {
  const { m, theme, settings, pro } = useTool();
  const minute = Math.ceil(m.remain / 60);
  const hour = new Date(m.now).getHours();
  // "Dim the clock at night": after 10:00 PM and until 6:00 AM.
  const dim = settings.dim && (hour >= 22 || hour < 6);
  const label = m.indef
    ? `${Math.floor(m.elapsed / 60)} minutes awake, no end`
    : m.state === 'ended'
      ? `Time’s up, ended at ${m.endedT}`
      : `${minute} ${minute === 1 ? 'minute' : 'minutes'} left, until ${m.endT}`;
  return (
    <div
      role="timer"
      aria-label={label}
      className={cn('shrink-0 overflow-visible transition-opacity duration-arrive', dim && 'opacity-60')}
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

export const Stage = forwardRef<
  HTMLElement,
  { faceSize: number; left: number; right: number; top: number; bottom: number }
>(function Stage({ faceSize, left, right, top, bottom }, ref) {
  const { device, ui, m, settings, a } = useTool();
  const phone = device === 'phone';
  const focus = ui.view === 'focus';
  const sheets = device === 'phone' || device === 'tabletP';
  const inline = sheets && !focus && ui.view === 'timer' && (m.state === 'idle' || m.state === 'ended');
  return (
    <main
      ref={ref}
      tabIndex={0}
      aria-label="Timer"
      aria-keyshortcuts="Space + Shift++ U F Shift+D ? 1 2 3 4 5 6 7 8 9"
      className={cn(
        'absolute z-[1] box-border flex flex-col items-center overflow-x-hidden overflow-y-auto outline-none focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-ring',
        phone ? 'justify-start gap-3 px-4 py-3.5' : 'justify-center gap-4 px-8 py-6',
      )}
      style={{ left, right, top, bottom }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) e.currentTarget.focus({ preventScroll: true });
      }}
    >
      {!focus ? <Banners /> : null}
      {phone || focus ? <ToolPill /> : null}
      {!focus ? (
        <span
          className={cn('shrink-0 text-center text-muted-foreground-strong', phone ? 'text-[13px]' : 'text-[14px]')}
        >
          {m.dateText}
        </span>
      ) : null}
      <StageFace size={faceSize} />
      {!focus && m.state !== 'idle' && m.state !== 'starting' && settings.label ? (
        <span className="max-w-full shrink-0 truncate text-center text-[15px] font-semibold text-muted-foreground-strong">
          {settings.label}
        </span>
      ) : null}
      <Controls focus={focus} />
      {m.note && !focus ? (
        <span className="max-w-[520px] shrink-0 text-center text-[13px] leading-[1.45] text-muted-foreground-strong">
          {m.note}
        </span>
      ) : null}
      {inline ? (
        <div className="flex w-full max-w-[560px] flex-col gap-2">
          <SecLabel>{m.s.length}</SecLabel>
          <LengthChips columns={device === 'tabletP' ? 6 : 3} onUntil={() => a.go('extend')} />
        </div>
      ) : null}
    </main>
  );
});
