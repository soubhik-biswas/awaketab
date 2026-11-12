'use client';

import { memo } from 'react';
import { motion } from 'motion/react';
import { History, Play, Sparkle, TriangleAlert, type LucideIcon } from 'lucide-react';
import { useGlance, type IGlance, type TBannerKind } from './context';
import { EASE } from './kit';

interface IBannerDef {
  col: string;
  soft: string;
  icon: LucideIcon;
  action?: (g: IGlance) => void;
  // How the banner is spoken. The tool's announcer already speaks a refused or hidden session, so those banners
  // stay quiet and nothing is said twice.
  role?: 'alert' | 'status';
}

const DEFS: Record<TBannerKind, IBannerDef> = {
  blocked: {
    col: '--tg-red',
    soft: '--tg-red-soft',
    icon: TriangleAlert,
    action: (g) => g.a.open('help'),
  },
  unsupported: {
    col: '--tg-sky',
    soft: '--tg-sky-soft',
    icon: TriangleAlert,
    action: (g) => g.a.useFallback(),
    role: 'alert',
  },
  fallback: { col: '--tg-sky', soft: '--tg-sky-soft', icon: Play, role: 'status' },
  needsyou: {
    col: '--tg-amber',
    soft: '--tg-amber-soft',
    icon: TriangleAlert,
    action: (g) => g.a.resume(),
  },
  conflict: {
    col: '--tg-amber',
    soft: '--tg-amber-soft',
    icon: History,
    action: (g) => g.a.takeOver(),
    role: 'status',
  },
  offline: { col: '--tg-t2', soft: '--tg-s2', icon: TriangleAlert, role: 'status' },
  update: {
    col: '--tg-violet',
    soft: '--tg-violet-soft',
    icon: Sparkle,
    action: (g) => g.a.reload(),
    role: 'status',
  },
};

// Problems appear only when they are true: under the top bar, in words, with the fix one tap away.
export const Banner = memo(function Banner() {
  const g = useGlance();
  const kind = g.banner;
  if (!kind || g.panel !== 'none') return null;
  const d = DEFS[kind];
  const Icon = d.icon;
  const w = Math.min(g.W - 32, 760);
  const action = d.action;
  const base = kind === 'blocked' ? `banner.blocked.${g.reason}` : `banner.${kind}`;
  return (
    <motion.div
      key={kind}
      role={d.role}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: g.hidden ? 0 : 1, y: 0 }}
      transition={{ duration: 0.42, ease: EASE }}
      className="tg-glass absolute z-[4] flex items-center gap-3.5 rounded-[18px] py-2.5 pr-2.5 pl-3.5"
      style={{
        left: Math.round((g.W - w) / 2),
        top: g.topH + 8,
        width: w,
        background: `var(${d.soft})`,
        borderColor: `color-mix(in srgb, var(${d.col}) 33%, transparent)`,
      }}
    >
      <span
        className="flex size-9 flex-none items-center justify-center rounded-[12px]"
        style={{ color: `var(${d.col})`, background: `var(${d.soft})` }}
      >
        <Icon className="size-[18px]" strokeWidth={2} aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1 leading-[1.4] text-(--tg-text)" style={{ fontSize: g.phone ? 14 : 15 }}>
        <strong>{g.t(`${base}.t`)}</strong> {g.t(`${base}.d`)}
      </span>
      {action ? (
        <button
          type="button"
          onClick={() => action(g)}
          className="tg-btn h-11 flex-none rounded-[12px] border-0 px-4 text-[15px] font-bold whitespace-nowrap text-(--tg-on-banner)"
          style={{ background: `var(${d.col})` }}
        >
          {g.t(`${base}.btn`)}
        </button>
      ) : null}
    </motion.div>
  );
});
