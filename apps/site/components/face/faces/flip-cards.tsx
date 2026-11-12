'use client';

import { useEffect, useLayoutEffect, useRef, useSyncExternalStore } from 'react';
import { flapMount, type IFlap, loadFlap, onFlapMount } from './flip-view';

export const CARD_W = 136;
const CARD_H = 168;
const HINGE = 2;
const HALF = (CARD_H - HINGE) / 2;
const AXIS = CARD_H / 2;

// One sheet styles both the still card React draws and the cards the split-flap view builds, so swapping one for the
// other changes no pixel. Porcelain by day, graphite at night.
export const FLIP_CSS = `
.af-flip{position:relative;display:block;flex:none;width:${CARD_W}px;height:${CARD_H}px;border-radius:18px;font-size:98px;font-weight:600;letter-spacing:-.04em;font-variant-numeric:tabular-nums;color:var(--fc-ink);box-shadow:var(--fc-drop);
--fc-ink:#EEF2FA;--fc-top:linear-gradient(180deg,rgba(255,255,255,.07),rgba(255,255,255,0) 92%),#252935;--fc-bottom:linear-gradient(180deg,rgba(0,0,0,.26),rgba(0,0,0,0) 22px),#1A1D26;--fc-rim-top:inset 0 1px 0 rgba(255,255,255,.1);--fc-rim-bottom:inset 0 1px 0 rgba(255,255,255,.06);--fc-gap:#07080B;--fc-drop:0 14px 28px rgba(0,0,0,.28);--fc-fall:linear-gradient(0deg,rgba(0,0,0,.62),rgba(0,0,0,.22));--fc-cover:linear-gradient(180deg,rgba(0,0,0,.6),rgba(0,0,0,.34));--fc-lift:linear-gradient(180deg,rgba(255,255,255,.05),rgba(255,255,255,.12))}
.af.oled .af-flip{--fc-drop:0 0 0 1px #1A2236}
.af.light .af-flip{--fc-ink:#0B1020;--fc-top:linear-gradient(180deg,#FFFFFF,#F7F8FC);--fc-bottom:linear-gradient(180deg,rgba(11,16,32,.07),rgba(11,16,32,0) 20px),#EEF0F6;--fc-rim-top:inset 0 0 0 1px #D6D9E3;--fc-rim-bottom:inset 0 0 0 1px #D6D9E3;--fc-gap:#AEB4C6;--fc-drop:0 14px 28px rgba(11,16,32,.12);--fc-fall:linear-gradient(0deg,rgba(11,16,32,.3),rgba(11,16,32,.08));--fc-cover:linear-gradient(180deg,rgba(11,16,32,.26),rgba(11,16,32,.12));--fc-lift:linear-gradient(180deg,rgba(255,255,255,.5),rgba(255,255,255,.85))}
.af-flip::before{content:"";position:absolute;left:1px;right:1px;top:${HALF - 2}px;height:${HINGE + 4}px;background:var(--fc-gap)}
.af-flip .tick-flip{position:absolute;left:0;top:0;display:block;width:${CARD_W}px;height:${CARD_H}px}
.af-flip .tick-flip:not(:empty)+.tick-flip{visibility:hidden}
.af-flip .tick-flip-spacer,.af-flip .tick-flip-shadow,.af-flip .tick-flip-card-shadow{display:none}
.af-flip .tick-flip-card{position:absolute;left:0;top:0;z-index:1;display:block;width:${CARD_W}px;height:${CARD_H}px;perspective:960px}
.af-flip .tick-flip-panel{position:absolute;left:0;display:block;width:${CARD_W}px;height:${HALF}px;overflow:hidden;transform:rotateX(0deg);backface-visibility:hidden;-webkit-backface-visibility:hidden}
.af-flip .tick-flip-panel-front{top:0;z-index:2;transform-origin:50% ${AXIS}px;border-radius:18px 18px 3px 3px;background:var(--fc-top);box-shadow:var(--fc-rim-top)}
.af-flip .tick-flip-panel-back{top:${HALF + HINGE}px;z-index:1;transform-origin:50% ${AXIS - HALF - HINGE}px;border-radius:3px 3px 18px 18px;background:var(--fc-bottom);box-shadow:var(--fc-rim-bottom)}
.af-flip .tick-flip-panel-front-text,.af-flip .tick-flip-panel-back-text{position:absolute;left:0;top:0;display:block;width:${CARD_W}px;height:${HALF}px}
.af-flip .tick-flip-panel-text-wrapper{position:absolute;left:0;top:0;display:block;width:${CARD_W}px;height:${CARD_H}px;padding-right:.04em;line-height:${CARD_H}px;text-align:center;white-space:pre}
.af-flip .tick-flip-panel-back-text .tick-flip-panel-text-wrapper{top:-${HALF + HINGE}px}
.af-flip .tick-flip-panel-front-shadow,.af-flip .tick-flip-panel-back-shadow,.af-flip .tick-flip-panel-back-highlight{position:absolute;left:0;top:0;display:block;width:${CARD_W}px;height:${HALF}px;opacity:0}
.af-flip .tick-flip-panel-front-shadow{background:var(--fc-fall)}
.af-flip .tick-flip-panel-back-shadow{background:var(--fc-cover)}
.af-flip .tick-flip-panel-back-highlight{background:var(--fc-lift)}
`;

function Half({ side, value }: { side: 'front' | 'back'; value: string }) {
  return (
    <span className={`tick-flip-panel-${side} tick-flip-panel`}>
      <span className={`tick-flip-panel-${side}-text`}>
        <span className="tick-flip-panel-text-wrapper">{value}</span>
      </span>
    </span>
  );
}

// One split-flap card. It is drawn still; where motion is allowed the split-flap view takes over and, whenever the
// value changes, folds the old top half down over the hinge onto the new value.
export function FlipCard({ value, flap }: { value: string; flap: boolean }) {
  const host = useRef<HTMLSpanElement>(null);
  const view = useRef<IFlap | null>(null);
  const mount = useSyncExternalStore(onFlapMount, flapMount, () => null);

  useEffect(() => {
    if (flap) loadFlap();
  }, [flap]);

  useLayoutEffect(() => {
    const el = host.current;
    if (!flap || !mount || !el) return;
    if (view.current) view.current.set(value);
    else view.current = mount(el, value);
  }, [flap, mount, value]);

  useLayoutEffect(() => {
    if (!flap || !mount) return;
    return () => {
      view.current?.destroy();
      view.current = null;
    };
  }, [flap, mount]);

  return (
    <span className="af-flip">
      <span ref={host} className="tick-flip" />
      <span className="tick-flip">
        <span className="tick-flip-card">
          <Half side="front" value={value} />
          <Half side="back" value={value} />
        </span>
      </span>
    </span>
  );
}
