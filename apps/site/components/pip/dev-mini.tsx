'use client';

import { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import { toFaceId } from '@/components/face';
import { MiniChip, type TMiniChip } from '@/components/pip/mini-chip';
import { MiniView } from '@/components/pip/mini-view';
import { miniDial, miniLang, useMiniSound } from '@/components/pip/pip-launcher';
import { useToolSettings } from '@/lib/tool/settings';
import { useFaceTheme, useWindowNow } from '@/lib/surfaces/hooks';
import { MINI_SIZE, type TMiniSize } from '@/lib/surfaces/pip';
import { EXTEND_SEC, surfaceView } from '@/lib/surfaces/session';
import { useWake, wake } from '@/lib/wake';

const DEV_MINI_EVENT = 'awaketab:dev-mini';

interface IDevMini {
  size: TMiniSize | null;
  w?: number;
  h?: number;
  chip?: TMiniChip;
}

const isSize = (v: unknown): v is TMiniSize => v === 'compact' || v === 'expanded';
const isChip = (v: unknown): v is TMiniChip => v === 'offer' || v === 'missed' || v === 'open';
const px = (v: unknown): number | undefined => {
  const n = Number(v);
  return Number.isFinite(n) && n >= 120 && n <= 1200 ? Math.round(n) : undefined;
};

function read(raw: Record<string, unknown>): IDevMini {
  return {
    size: isSize(raw.size) ? raw.size : null,
    w: px(raw.w),
    h: px(raw.h),
    chip: isChip(raw.chip) ? raw.chip : undefined,
  };
}

function fromUrl(): IDevMini | null {
  if (typeof window === 'undefined' || !window.location.pathname.startsWith('/dev/')) return null;
  const q = new URLSearchParams(window.location.search);
  const cfg = read({ size: q.get('mini'), w: q.get('miniw'), h: q.get('minih'), chip: q.get('minichip') });
  return cfg.size || cfg.chip ? cfg : null;
}

// Development only: the mini clock's window content drawn in a fixed box over the dev tool, for browsers without
// Document Picture-in-Picture. ?mini=compact|expanded (&miniw=&minih= for a hand-resized window, &minichip=
// offer|missed|open), or window.dispatchEvent(new CustomEvent('awaketab:dev-mini', { detail: { size, w, h, chip } })).
export function DevMini() {
  const [cfg, setCfg] = useState<IDevMini | null>(fromUrl);
  useEffect(() => {
    if (!window.location.pathname.startsWith('/dev/')) return;
    const on = (e: Event) => {
      const detail = e instanceof CustomEvent ? (e.detail as unknown) : null;
      setCfg(detail && typeof detail === 'object' ? read(detail as Record<string, unknown>) : null);
    };
    window.addEventListener(DEV_MINI_EVENT, on);
    return () => window.removeEventListener(DEV_MINI_EVENT, on);
  }, []);
  if (!cfg) return null;
  return (
    <>
      {cfg.size ? (
        <DevBox key={`${cfg.size}-${String(cfg.w)}-${String(cfg.h)}`} cfg={{ ...cfg, size: cfg.size }} />
      ) : null}
      {cfg.chip ? (
        <MiniChip kind={cfg.chip} onOpen={() => undefined} onDismiss={() => undefined} onClose={() => undefined} />
      ) : null}
    </>
  );
}

function DevBox({ cfg }: { cfg: IDevMini & { size: TMiniSize } }) {
  const snap = useWake();
  const now = useWindowNow(null);
  const locale = useLocale();
  const settings = useToolSettings();
  const theme = useFaceTheme();
  const sound = useMiniSound();
  const size = cfg.size;
  const lang = miniLang(locale);
  const fmt = miniDial(settings, lang);
  const view = surfaceView({ ...snap, now }, { locale, fmt });
  const width = cfg.w ?? MINI_SIZE[size].width;
  const height = cfg.h ?? MINI_SIZE[size].height;
  return (
    <div
      className="fixed right-6 bottom-6 z-[60] overflow-hidden rounded-[10px] shadow-[0_24px_60px_rgba(0,0,0,.45)] ring-1 ring-(--tg-border-hi)"
      style={{ width, height }}
    >
      <MiniView
        view={view}
        theme={theme}
        face={toFaceId(settings.face)}
        lang={lang}
        fmt={fmt}
        now={now}
        size={size}
        actions={{
          pause: () => wake.pause(),
          resume: () => wake.resume(),
          extend: () => wake.extend(EXTEND_SEC),
          stop: () => wake.stop(),
          start: () => wake.start(settings.totalSec),
          retry: () => wake.resume(),
          sound,
        }}
      />
    </div>
  );
}
