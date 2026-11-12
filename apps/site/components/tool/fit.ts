import type { TDevice } from '@/lib/tool/ui';

// The layout tiers: desktop from 1300, tablet landscape from 1100, tablet portrait from 700.
const TIER_MIN: Record<TDevice, number> = { phone: 0, tabletP: 700, tabletL: 1100, desktop: 1300 };
const TIERS: readonly TDevice[] = ['phone', 'tabletP', 'tabletL', 'desktop'];

export function deviceFor(w: number): TDevice {
  if (w >= TIER_MIN.desktop) return 'desktop';
  if (w >= TIER_MIN.tabletL) return 'tabletL';
  if (w >= TIER_MIN.tabletP) return 'tabletP';
  return 'phone';
}

export const FACE_FLOOR = 96;
export const FACE_RATIO = 0.875;
const FLOOR_H = FACE_FLOOR * FACE_RATIO;
export const STAGE_BOTTOM = 24;
const EDGE = 16;

interface ISetTier {
  top: number;
  gap: number;
  pill: number;
  eyebrow: number;
  heroGap: number;
  headline: number;
  want: number;
  core: number;
  ctrlGap: number;
  note: number;
}

// What Set mode stacks in each tier, in px: the top bar, the gap between parts, the status pill (in the stage on
// narrow screens only), the eyebrow and headline, the face's full size, the length control with the button under it
// (core) and the note below them.
const SET: Record<TDevice, ISetTier> = {
  phone: {
    top: 64,
    gap: 14,
    pill: 38,
    eyebrow: 16,
    heroGap: 8,
    headline: 71,
    want: 296,
    core: 131,
    ctrlGap: 14,
    note: 20,
  },
  tabletP: {
    top: 76,
    gap: 20,
    pill: 38,
    eyebrow: 17,
    heroGap: 12,
    headline: 59,
    want: 480,
    core: 141,
    ctrlGap: 18,
    note: 20,
  },
  tabletL: {
    top: 76,
    gap: 20,
    pill: 0,
    eyebrow: 17,
    heroGap: 12,
    headline: 51,
    want: 340,
    core: 141,
    ctrlGap: 18,
    note: 20,
  },
  desktop: {
    top: 76,
    gap: 20,
    pill: 0,
    eyebrow: 17,
    heroGap: 12,
    headline: 63,
    want: 380,
    core: 141,
    ctrlGap: 18,
    note: 20,
  },
};

export interface ISetFit {
  level: number;
  eyebrow: boolean;
  headline: boolean;
  pill: boolean;
  face: boolean;
  note: boolean;
  scroll: boolean;
  px: number;
  above: number;
  room: number;
  // The height the whole stack is planned to take, to check against what is really drawn.
  plan: number;
}

const controlsHeight = (t: ISetTier) => t.core + t.ctrlGap + t.note;

// What sits above the face at each step: everything, then without the eyebrow, the headline and the stage's
// status pill.
function aboveHeights(t: ISetTier): number[] {
  const pill = t.pill ? t.pill + t.gap : 0;
  return [pill + t.eyebrow + t.heroGap + t.headline + t.gap, pill + t.headline + t.gap, pill, 0];
}

// Set mode for the room the frame really has. The length control and the button always fit: as the frame gets
// shorter the face shrinks to its floor, then the eyebrow goes, then the headline, the stage's status pill, the face
// and the note; a frame shorter than the two controls scrolls.
export function setFit(W: number, H: number, device: TDevice, pad = 0): ISetFit {
  const t = SET[device];
  const avail = H - t.top - STAGE_BOTTOM - pad;
  const below = controlsHeight(t) + t.gap;
  const steps = aboveHeights(t);
  for (let level = 0; level < steps.length; level++) {
    const above = steps[level] ?? 0;
    const room = avail - above - below;
    if (room < FLOOR_H) continue;
    const px = Math.max(FACE_FLOOR, Math.round(Math.min(t.want, W - 2 * EDGE, room / FACE_RATIO)));
    return {
      level,
      eyebrow: level < 1,
      headline: level < 2,
      pill: level < 3 && t.pill > 0,
      face: true,
      note: true,
      scroll: false,
      px,
      above,
      room,
      plan: above + Math.round(px * FACE_RATIO) + below,
    };
  }
  const bare = { eyebrow: false, headline: false, pill: false, face: false, px: FACE_FLOOR, above: 0, room: 0 };
  if (avail >= controlsHeight(t)) return { ...bare, level: 4, note: true, scroll: false, plan: controlsHeight(t) };
  if (avail >= t.core) return { ...bare, level: 5, note: false, scroll: false, plan: t.core };
  return { ...bare, level: 6, note: false, scroll: true, plan: t.core };
}

// The height every part but the face takes at each step, the top bar and the stage's bottom inset included.
function fixedHeights(t: ISetTier): number[] {
  return aboveHeights(t).map((above) => t.top + STAGE_BOTTOM + above + controlsHeight(t) + t.gap);
}

// The frame heights below which each step takes over, in the order of setFit's levels 1 to 6.
export function setSteps(device: TDevice): number[] {
  const t = SET[device];
  const base = t.top + STAGE_BOTTOM;
  return [...fixedHeights(t).map((f) => f + FLOOR_H), base + controlsHeight(t), base + t.core];
}

const HIDE =
  'position:absolute;width:1px;height:1px;margin:-1px;padding:0;border:0;overflow:hidden;clip-path:inset(50%);white-space:nowrap;';

const STEP_RULES = [
  '.tg-shell-eyebrow{display:none;}',
  `.tg-shell-hero{display:contents;}.tg-shell-headline{${HIDE}}`,
  '.tg-shell-pill{display:none;}',
  '.tg-shell-face{display:none;}',
  '.tg-shell-note{display:none;}',
  '.tg-shell-stage{overflow-y:auto;}',
];

// The same steps as container queries, for the markup the server sends before the frame can be measured. glance.css
// holds this text; a test keeps the two in step.
export function shellCss(): string {
  const out: string[] = [];
  TIERS.forEach((device, i) => {
    const t = SET[device];
    const next = TIERS[i + 1];
    const lo = TIER_MIN[device];
    const width = [lo ? `(width >= ${lo}px)` : '', next ? `(width < ${TIER_MIN[next]}px)` : ''].filter(Boolean);
    const fixed = fixedHeights(t);
    const steps = setSteps(device);
    const when = (h?: number) => [...width, h === undefined ? '' : `(height < ${h}px)`].filter(Boolean).join(' and ');
    out.push(`@container tg-frame ${when()}{.tg-shell-stage{--tg-set-want:${t.want}px;--tg-set-fixed:${fixed[0]}px;}}`);
    STEP_RULES.forEach((rule, level) => {
      const taken = fixed[level + 1];
      const room = taken === undefined ? '' : `.tg-shell-stage{--tg-set-fixed:${taken}px;}`;
      out.push(`@container tg-frame ${when(steps[level])}{${room}${rule}}`);
    });
  });
  return out.join('\n');
}
