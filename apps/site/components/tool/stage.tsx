'use client';

import { memo, useLayoutEffect, useRef, useState, type RefObject } from 'react';
import { AnimatePresence, LayoutGroup, motion } from 'motion/react';
import { Check } from 'lucide-react';
import { Face } from '@/components/face';
import { cn } from '@/lib/utils';
import { dayDate } from '@/lib/tool/clock';
import { STAGE_ID } from '@/lib/tool/stage-id';
import type { TRating } from '@/lib/tool/ui';
import { isLive } from '@/lib/wake';
import { useGlance, useTick, useTickValue, type IGlance, type ITick } from './context';
import { FACE_FLOOR, FACE_RATIO, setFit, STAGE_BOTTOM, type ISetFit } from './fit';
import { EASE } from './kit';
import { DOCK_BOTTOM } from './dock';
import { Orbit } from './orbit';
import { HINT_BOTTOM } from './overlays';
import { SetControls } from './set-controls';
import { Headline } from './shell';
import { FACE_STATE, pillText, StatusPill } from './status-pill';

const GLANCE_SIZE = { desktop: 560, tabletL: 470, tabletP: 640, phone: 340 } as const;

const ARRIVE = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -14 },
  transition: { duration: 0.42, ease: EASE },
};

const GROW = { duration: 0.5, ease: EASE };

export const RATES: Array<[TRating, string]> = [
  ['love', '😍'],
  ['good', '🙂'],
  ['bad', '😕'],
];

const PILL_H = 38;
const FIRST_H = 170;
const HINT_H = 34;
const EDGE = 8;

interface IFit {
  px: number;
  rings: number;
  top: number;
  bottom: number;
  pad: number;
  set: ISetFit | null;
}

// The stage's box and the face inside it, sized from the frame the tool really has. The face takes the board's size
// and gives way to the smaller of the room's width and height, so the face, its halo and the orbit stay inside the
// window at any shape: a short, wide desktop window, a phone on its side, a tablet. With the controls resting the
// stage takes the whole frame bar the hint. Set mode has its own steps for short frames (fit.ts); `over` is how much
// taller its words were drawn than planned.
function stageFit(g: IGlance, showFirst: boolean, over: number): IFit {
  const { W, H, phone, narrow, hidden, isSet, device } = g;
  const gap = phone ? 14 : 20;
  const top = hidden ? 24 : g.topH;
  const bottom = isSet
    ? STAGE_BOTTOM
    : hidden
      ? (phone ? HINT_BOTTOM.phone : HINT_BOTTOM.wide) + HINT_H + 14
      : g.dockH + (phone ? DOCK_BOTTOM.phone : DOCK_BOTTOM.wide);
  const pad = !hidden && g.banner && g.panel === 'none' ? (phone ? 96 : 72) : 0;
  const set = isSet ? setFit(W, H, device, pad + over) : null;
  const above = set ? set.above : narrow && !hidden ? PILL_H + gap : 0;
  const below = showFirst ? FIRST_H + gap : 0;
  const room = set ? set.room : H - top - bottom - pad - above - below;
  const want = hidden ? Math.max(GLANCE_SIZE[device], W * 0.62) : GLANCE_SIZE[device];
  // The stack is centred as one, so the face's centre does not depend on its own size.
  const cy = top + pad + above + room / 2;
  const orbitRoom = Math.min(W, 2 * Math.min(cy, H - cy)) - 2 * EDGE;
  let px = set ? set.px : Math.min(want, W - 32, room / FACE_RATIO);
  // On wide screens the orbit is part of the picture, so the face leaves it room to clear the dial.
  if (!set && !narrow) px = Math.min(px, orbitRoom / 1.25);
  px = Math.max(FACE_FLOOR, Math.round(px));
  const rings = Math.round(Math.max(0, Math.min(px * (narrow ? 1.5 : 1.8), orbitRoom)));
  return { px, rings, top, bottom, pad, set };
}

interface ISpill {
  key: string;
  over: number;
  scroll: boolean;
}

// The stage's fit, checked against what was really drawn. Words can come out taller than planned (a longer
// translation, a larger text size), so Set mode is measured after layout: extra height is taken out of the room,
// which shrinks the face or drops a step, and if the stack would still pass the frame's edge the stage scrolls. The
// extra only ever grows for one frame size and language, so the layout settles.
function useStageFit(ref: RefObject<HTMLElement | null>, g: IGlance, showFirst: boolean) {
  const key = `${g.W}:${g.H}:${g.lang}:${g.isSet}`;
  const [spill, setSpill] = useState<ISpill>({ key, over: 0, scroll: false });
  const cur = spill.key === key ? spill : { key, over: 0, scroll: false };
  const fit = stageFit(g, showFirst, cur.over);
  const plan = fit.set?.plan ?? null;
  const [, refit] = useState(false);
  useLayoutEffect(() => {
    let alive = true;
    // Web fonts change the height of the words when they arrive.
    void document.fonts.ready.then(() => alive && refit(true));
    return () => {
      alive = false;
    };
  }, []);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || plan === null) return;
    // A part on its way out is lifted out of the stack, so it is not counted.
    const parts = [...el.querySelectorAll<HTMLElement>(':scope > [data-part]')].filter(
      (part) => getComputedStyle(part).position !== 'absolute',
    );
    const first = parts[0];
    const last = parts[parts.length - 1];
    if (!first || !last) return;
    const end = last.offsetTop + last.offsetHeight;
    const extra = Math.ceil(end - first.offsetTop - plan);
    const over = extra > cur.over + 1 ? extra : cur.over;
    const scroll = end > el.clientHeight + STAGE_BOTTOM;
    if (over !== cur.over || scroll !== cur.scroll) setSpill({ key, over, scroll });
  });
  return { fit, key, scroll: fit.set !== null && (fit.set.scroll || cur.scroll) };
}

// The words inside the face, for the state it is really in. English keeps the face's own words unless one would be
// wrong: a session that needs a tap is never "paused", and an end past midnight says tomorrow.
function faceLabels(g: IGlance, tick: ITick): { top?: string; end?: string } {
  const { st, tf, indef } = g;
  const en = g.lang === 'en';
  const until = g.until(tick.endsAt);
  const late = until !== g.time(tick.endsAt);
  const open = tf(st === 'idle' ? 't.end.indefIdle' : 't.end.indef');
  const untilEnd = tf('t.end.until', { time: until });
  if (st === 'ended')
    return en ? {} : { top: tf('t.top.up'), end: tf('t.end.ended', { time: g.time(g.endedAt ?? tick.now) }) };
  if (st === 'needsyou') return { top: tf('t.top.blocked'), end: indef ? open : untilEnd };
  if (en) {
    if (indef || !late) return {};
    return { end: st === 'idle' ? tf('t.end.idle', { min: Math.round(g.total / 60), time: until }) : untilEnd };
  }
  if (st === 'idle')
    return { top: g.t('face.ready'), end: indef ? open : `${g.dur(g.total)} · ${g.t('face.ends', { time: until })}` };
  if (st === 'running' || st === 'fallback')
    return indef
      ? { top: tf('t.top.awakeFor'), end: open }
      : { top: g.t('face.left'), end: g.t('pill.awake', { time: until }) };
  return { top: tf(`t.top.${FACE_STATE[st]}`), end: indef ? open : untilEnd };
}

// What assistive technology reads on the face: its name, the state with its end time, and the time left in whole
// minutes, so the words change about once a minute and never every second.
function timerName(g: IGlance, tick: ITick): string {
  const { t, st, indef } = g;
  const parts = [t('face.aria', { face: g.faceName(g.face) }), pillText(g, tick)];
  if (st === 'idle') parts.push(indef ? t('set.noEndCap') : g.durLong(g.total));
  else if (!indef && isLive(st) && st !== 'paused')
    parts.push(t('tab.left', { t: g.durLong(Math.ceil(tick.remain / 60) * 60) }));
  return parts.join(', ');
}

function Eyebrow() {
  const g = useGlance();
  const text = useTickValue((tick) => `${dayDate(tick.now, g.lang)} · ${g.time(tick.now)}`);
  return (
    <span className="font-mono tracking-[.16em] text-(--tg-t2) uppercase" style={{ fontSize: g.phone ? 12 : 13 }}>
      {text}
    </span>
  );
}

function Hero({ eyebrow }: { eyebrow: boolean }) {
  const g = useGlance();
  const { phone, tabL, tabP, lang } = g;
  const size = phone ? 36 : tabL ? 52 : tabP ? 60 : 64;
  return (
    <motion.div
      {...ARRIVE}
      data-part=""
      className="flex flex-none flex-col items-center text-center"
      style={{ gap: phone ? 8 : 12, maxWidth: phone ? 350 : 900 }}
    >
      {eyebrow ? <Eyebrow /> : null}
      <Headline lang={lang} t={g.t} style={{ fontSize: size }} />
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

// The face is the one timer on the stage: its name says which face it is, the state and the time left. The drawing
// is hidden from assistive technology, which reads the name instead.
function StageFace({ px }: { px: number }) {
  const g = useGlance();
  const tick = useTick();
  const { st } = g;
  const labels = faceLabels(g, tick);
  return (
    <div role="timer" aria-label={timerName(g, tick)} className="relative">
      <div aria-hidden="true">
        <Face
          face={g.face}
          theme={g.faceTheme}
          state={FACE_STATE[st]}
          remain={tick.remain}
          total={g.total}
          indef={g.indef}
          nowSec={tick.nowSec}
          size={px}
          bare
          fmt={g.fmt}
          lamp={g.pro.studio.lamp || undefined}
          needs={st === 'needsyou'}
          lblTop={labels.top}
          lblEnd={labels.end}
          lblCap={pillText(g, tick)}
          motion="auto"
        />
      </div>
    </div>
  );
}

// The stage between the top bar and the dock. Set mode stacks the headline, the face and the controls; starting a
// session sends the headline and controls out while the face grows in place (Motion layout, 500 ms), so nothing jumps.
// Every size comes from stageFit, so nothing is drawn past the edge of the window, and only the parts that read the
// clock are drawn again each second.
export const Stage = memo(function Stage() {
  const g = useGlance();
  const { st, phone, narrow, hidden } = g;
  const ref = useRef<HTMLElement>(null);
  const showFirst = st === 'ended' && g.ui.first && g.panel === 'none';
  const { fit, key, scroll } = useStageFit(ref, g, showFirst);
  const { px, rings, top, bottom, pad, set } = fit;
  const h = Math.round(px * FACE_RATIO);
  const showPill = narrow && !hidden && (set ? set.pill : true);
  const halo =
    st === 'running' ? 'var(--tg-halo-run)' : st === 'paused' ? 'var(--tg-amber-soft)' : 'var(--tg-halo-rest)';
  const soft = g.dim ? 0.4 : 1;
  const glow = (Math.max(0, Math.min(100, g.pro.studio.glow)) / 70) * soft;
  // Motion measures the layout again only when one of these moves a box.
  const shape = [key, px, top, bottom, pad, showPill, showFirst, set?.level ?? -1].join(':');
  return (
    <main
      ref={ref}
      id={STAGE_ID}
      tabIndex={-1}
      aria-label={g.t('stage.label')}
      className={cn(
        'absolute inset-x-0 z-[1] flex flex-col items-center px-4 outline-none',
        set ? '[justify-content:safe_center]' : 'justify-center',
        scroll && 'tg-scroll overflow-y-auto',
      )}
      style={{ top, bottom, gap: phone ? 14 : 20, paddingTop: pad || undefined }}
    >
      <LayoutGroup>
        {showPill ? (
          <motion.div layout layoutDependency={shape} transition={GROW} data-part="" className="flex-none">
            <StatusPill />
          </motion.div>
        ) : null}
        <AnimatePresence initial={false} mode="popLayout">
          {set?.headline ? <Hero key="hero" eyebrow={set.eyebrow} /> : null}
        </AnimatePresence>
        {set && !set.headline ? <Headline lang={g.lang} t={g.t} className="sr-only" /> : null}
        {!set || set.face ? (
          <motion.div
            layout
            layoutDependency={shape}
            transition={GROW}
            data-part=""
            className="relative flex flex-none items-center justify-center"
            style={{ width: px, height: h }}
          >
            {g.settings.vibe === 'aurora' || g.settings.vibe === 'night' ? (
              <div
                aria-hidden="true"
                className={cn(
                  'pointer-events-none absolute top-1/2 left-1/2 -translate-1/2',
                  (g.still || g.settings.motion === 'still') && 'tg-still',
                )}
                style={{
                  width: rings,
                  height: rings,
                  maskImage: 'radial-gradient(circle closest-side, #000 74%, transparent 100%)',
                  opacity: `calc(var(--vibe-opacity) * ${(hidden ? 0.55 : 1) * soft})`,
                }}
              >
                <Orbit px={px} rings={rings} />
              </div>
            ) : null}
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
            <StageFace px={px} />
          </motion.div>
        ) : null}
        <AnimatePresence initial={false} mode="popLayout">
          {showFirst ? <FirstCard key="first" /> : null}
        </AnimatePresence>
        <AnimatePresence initial={false} mode="popLayout">
          {set ? (
            <motion.div key="set" {...ARRIVE} data-part="" className="w-full flex-none">
              <SetControls note={set.note} />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </LayoutGroup>
    </main>
  );
});
