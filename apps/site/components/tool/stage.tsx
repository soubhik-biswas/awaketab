'use client';

import { AnimatePresence, LayoutGroup, motion } from 'motion/react';
import { Check } from 'lucide-react';
import { Face, type TFaceState } from '@/components/face';
import { cn } from '@/lib/utils';
import { faceLabel } from '@/lib/tool/collections';
import { isLatin } from '@/lib/tool/strings';
import { dayDate } from '@/lib/tool/clock';
import { STAGE_ID } from '@/lib/tool/stage-id';
import type { TRating } from '@/lib/tool/ui';
import type { TWakeState } from '@/lib/wake';
import { useGlance, type IGlance } from './context';
import { EASE } from './kit';
import { Orbit } from './orbit';
import { SetControls } from './set-controls';
import { StatusPill } from './status-pill';

const FACE_STATE: Record<TWakeState, TFaceState> = {
  idle: 'idle',
  starting: 'starting',
  running: 'running',
  fallback: 'fallback',
  paused: 'paused',
  needsyou: 'paused',
  ended: 'up',
  blocked: 'blocked',
  unsupported: 'unsupported',
};

const SET_SIZE = { desktop: 380, tabletL: 340, tabletP: 480, phone: 296 } as const;
const GLANCE_SIZE = { desktop: 560, tabletL: 470, tabletP: 640, phone: 340 } as const;

const ARRIVE = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -14 },
  transition: { duration: 0.42, ease: EASE },
};

export const RATES: Array<[TRating, string]> = [
  ['love', '😍'],
  ['good', '🙂'],
  ['bad', '😕'],
];

function faceSize(g: Pick<IGlance, 'hidden' | 'isSet' | 'device' | 'W' | 'H'>): number {
  if (g.hidden) return Math.round(Math.min(g.W * 0.62, (g.H - 120) / 0.875));
  return g.isSet ? SET_SIZE[g.device] : GLANCE_SIZE[g.device];
}

function faceLabels(g: IGlance): { top: string; end: string } {
  if (g.lang === 'en') return { top: '', end: '' };
  const time = g.time(g.endsAt);
  if (g.isSet)
    return { top: g.t('face.ready'), end: `${g.dur(g.settings.totalSec || 3600)} · ${g.t('face.ends', { time })}` };
  return { top: g.t('face.left'), end: g.t('pill.awake', { time }) };
}

function Hero() {
  const g = useGlance();
  const { t, phone, tabL, tabP, lang } = g;
  const size = phone ? 36 : tabL ? 52 : tabP ? 60 : 64;
  return (
    <motion.div
      {...ARRIVE}
      className="flex flex-col items-center text-center"
      style={{ gap: phone ? 8 : 12, maxWidth: phone ? 350 : 900 }}
    >
      <span className="font-mono tracking-[.16em] text-(--tg-t2) uppercase" style={{ fontSize: phone ? 12 : 13 }}>
        {dayDate(g.now, lang)} · {g.time(g.now)}
      </span>
      <h1
        lang={lang}
        className="m-0 font-display leading-[.98] font-bold tracking-[-0.04em] text-balance [font-optical-sizing:auto]"
        style={{ fontSize: size }}
      >
        {t('set.h1a')}{' '}
        <span
          className={cn(
            'inline-block bg-clip-text whitespace-nowrap text-transparent [word-break:keep-all]',
            isLatin(lang) && 'pr-[.06em] font-accent text-[1.08em] font-normal tracking-[-0.01em] italic',
          )}
          style={{
            backgroundImage: 'linear-gradient(100deg, var(--tg-volt) 0%, var(--tg-mint) 45%, var(--tg-violet) 100%)',
          }}
        >
          {t('set.h1b')}
        </span>
      </h1>
    </motion.div>
  );
}

function FirstCard() {
  const g = useGlance();
  return (
    <motion.div
      {...ARRIVE}
      className="tg-glass flex max-w-full flex-col items-center gap-2.5 rounded-[24px] px-5 py-[18px] shadow-(--tg-shadow)"
    >
      <span className="inline-flex items-center gap-1.5 font-mono text-[12px] tracking-[.12em] text-(--tg-volt)">
        <Check className="size-3.5" strokeWidth={3} aria-hidden="true" />
        {g.t('first.kicker', { dur: g.dur(g.total || 3600).toUpperCase() })}
      </span>
      <strong className="font-display font-bold tracking-[-0.02em]" style={{ fontSize: g.phone ? 22 : 24 }}>
        {g.t('first.h')}
      </strong>
      <div className="flex flex-wrap justify-center gap-2">
        {RATES.map(([k, e]) => (
          <button
            key={k}
            type="button"
            onClick={() => g.a.feedback(k)}
            className="tg-btn tg-glass inline-flex h-11 items-center gap-2 rounded-full px-3.5 text-[14px] font-semibold whitespace-nowrap text-(--tg-text)"
          >
            <span aria-hidden="true" className="text-[20px] leading-none">
              {e}
            </span>
            {g.t(`rate.${k}`)}
          </button>
        ))}
      </div>
    </motion.div>
  );
}

// The stage between the top bar and the dock. Set mode stacks the headline, the face and the controls; starting a
// session sends the headline and controls out while the face grows in place (Motion layout, 500 ms), so nothing jumps.
export function Stage() {
  const g = useGlance();
  const { st, isSet, phone, narrow, hidden } = g;
  const px = faceSize(g);
  const h = Math.round(px * 0.875);
  const ring = st === 'idle' ? 1 : st === 'ended' ? 0 : g.total ? Math.max(0, Math.min(1, g.remain / g.total)) : 1;
  const arcOp = phone ? 0 : st === 'running' ? 0.6 : st === 'paused' ? 0.3 : st === 'idle' ? 0.15 : 0;
  const halo =
    st === 'running' ? 'var(--tg-halo-run)' : st === 'paused' ? 'var(--tg-amber-soft)' : 'var(--tg-halo-rest)';
  const glow = Math.max(0, Math.min(100, g.pro.studio.glow)) / 70;
  const labels = faceLabels(g);
  const lamp = g.pro.studio.lamp || undefined;
  const bannerPad = g.banner && g.panel === 'none' ? (phone ? 96 : 72) : 0;
  const bottom = isSet ? 24 : g.dockH + (phone ? 16 : 28);
  const showFirst = st === 'ended' && g.ui.first && g.panel === 'none';
  const rings = Math.round(px * (narrow ? 1.5 : 1.8));
  return (
    <main
      id={STAGE_ID}
      tabIndex={-1}
      aria-label={g.t('stage.label')}
      className="absolute inset-x-0 z-[1] flex flex-col items-center justify-center px-4 outline-none"
      style={{ top: g.topH, bottom, gap: phone ? 14 : 20, paddingTop: bannerPad || undefined }}
    >
      <LayoutGroup>
        {narrow && !hidden ? (
          <motion.div layout transition={{ duration: 0.5, ease: EASE }} className="flex-none">
            <StatusPill />
          </motion.div>
        ) : null}
        <AnimatePresence initial={false} mode="popLayout">
          {isSet ? <Hero key="hero" /> : null}
        </AnimatePresence>
        <motion.div
          layout
          transition={{ duration: 0.5, ease: EASE }}
          className="relative flex flex-none items-center justify-center"
          style={{ width: px, height: h }}
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-1/2 -translate-1/2"
            style={{
              width: rings,
              height: rings,
              maskImage: 'radial-gradient(circle closest-side, #000 62%, transparent 100%)',
              opacity: hidden ? 0.55 : 1,
            }}
          >
            <Orbit frac={ring} opacity={arcOp} />
          </div>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-1/2 -translate-1/2 rounded-full"
            style={{
              width: Math.round(px * 1.25),
              height: Math.round(px * 1.25),
              background: `radial-gradient(closest-side, ${halo}, transparent 70%)`,
              opacity: glow,
            }}
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-[15%] rounded-full blur-[4px]"
            style={{
              bottom: -Math.round(px * 0.06),
              height: Math.round(px * 0.12),
              background: 'radial-gradient(closest-side, var(--tg-floor), transparent)',
            }}
          />
          <div role="img" aria-label={g.t('face.aria', { face: faceLabel(g.face) })} className="relative">
            <Face
              face={g.face}
              theme={g.faceTheme}
              state={FACE_STATE[st]}
              remain={g.remain}
              total={g.total}
              indef={g.indef}
              nowSec={g.nowSec}
              size={px}
              bare
              fmt={g.fmt}
              lamp={lamp}
              lblTop={labels.top || undefined}
              lblEnd={labels.end || undefined}
              motion="auto"
            />
          </div>
        </motion.div>
        <AnimatePresence initial={false} mode="popLayout">
          {showFirst ? <FirstCard key="first" /> : null}
        </AnimatePresence>
        <AnimatePresence initial={false} mode="popLayout">
          {isSet ? (
            <motion.div key="set" {...ARRIVE} className="w-full">
              <SetControls />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </LayoutGroup>
    </main>
  );
}
