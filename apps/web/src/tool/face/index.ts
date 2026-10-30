import './face.css';
import { type TDraw, type TFaceId, type IFaceProps, frame, isFace, vals } from './base.js';
import { ring } from './ring.js';

export type { TFaceId, IFaceProps, TFaceState, TFaceTheme } from './base.js';
export { setFaceText } from './base.js';

declare const __AT_FACES__: string | undefined;

// The faces board's names and descriptions, in sheet order.
export const FACES: readonly { id: TFaceId; name: string; blurb: string }[] = [
  {
    id: 'ring',
    name: 'Ring',
    blurb: 'The signature. The lamp rides the end of the arc and turns amber the moment the lock pauses.',
  },
  { id: 'bold', name: 'Bold', blurb: 'Heavy display digits for across-the-room reading, with a slim progress rail.' },
  { id: 'horizon', name: 'Horizon', blurb: 'A lamp-sun sets toward the horizon as the session runs down.' },
  { id: 'tide', name: 'Tide', blurb: 'The water level is the time left. Calm and glanceable.' },
  { id: 'flip', name: 'Flip', blurb: 'Split-flap cards with a real hinge gap.' },
  { id: 'rolling', name: 'Rolling', blurb: 'Odometer drums — the next digit is always just visible.' },
  { id: 'analog', name: 'Analog', blurb: 'Real time on the hands; the lamp arc on the bezel runs to the end time.' },
  { id: 'luxe', name: 'Analog luxe', blurb: 'A deeper dial with serif numerals, a minute track and a lamp sector.' },
  { id: 'rings', name: 'Rings', blurb: 'Session, minutes and seconds as three concentric rings.' },
  { id: 'words', name: 'Words', blurb: 'Time in a sentence, written natively in each of the eight languages.' },
  { id: 'nixie', name: 'Nixie', blurb: 'Glass tubes with mesh and ghost 8s; the glow takes the lamp colour.' },
  { id: 'lcd', name: 'LCD', blurb: 'Slanted segments over a faint 88:88 ghost, like a bedside clock.' },
  { id: 'led', name: 'LED', blurb: 'Dot-matrix board with a scrolling status line. Best in OLED.' },
  {
    id: 'dive',
    name: 'Diver',
    blurb: 'A dive-watch bezel: the green arc is the minutes left, the hands keep real time.',
  },
  { id: 'chrono', name: 'Chronograph', blurb: 'Minute and second sub-dials with a sweeping chrono hand.' },
  { id: 'gauge', name: 'Gauge', blurb: 'An instrument needle with a five-minute warning zone.' },
  { id: 'type', name: 'Type', blurb: 'Minutes in huge type, seconds in green, a progress hairline.' },
  { id: 'bars', name: 'Bars', blurb: 'The whole session as bars — spent fades, the current one breathes.' },
  {
    id: 'timeline',
    name: 'Timeline',
    blurb: 'Now → Ends, like a boarding pass. The most literal way to read time left.',
  },
  {
    id: 'pilot',
    name: 'Pilot',
    blurb: 'Aviator dial with a triangle at 12, sword hands and a green minutes-left sector.',
  },
  { id: 'dual', name: 'Dual time', blurb: 'Two small dials side by side: the time now and the time it ends.' },
  { id: 'radar', name: 'Radar', blurb: 'A sweeping scope; the blip marks the end time on the rings.' },
  { id: 'dots', name: 'Dots', blurb: 'Sixty dots around the dial; each minute left keeps one lit.' },
  {
    id: 'hourglass',
    name: 'Hourglass',
    blurb: 'Sand falls from top to bottom as the session runs; a fine stream moves while awake.',
  },
  { id: 'battery', name: 'Battery', blurb: 'Time left as a charge level, with a gentle sheen across the cell.' },
  { id: 'stack', name: 'Stack', blurb: 'Minutes over seconds in a tight editorial stack, end time underneath.' },
  {
    id: 'board',
    name: 'Departure board',
    blurb: 'Split-flap tiles like a station board; the seconds tile flaps each tick.',
  },
  {
    id: 'orbit',
    name: 'Orbit',
    blurb: 'Three orbits: the session in green, minutes in sky, a violet moon sweeping the seconds.',
  },
  {
    id: 'disc',
    name: 'Time disc',
    blurb: 'A solid disc that shrinks toward 12, warming from green to ember in the last minutes.',
  },
  {
    id: 'clocks',
    name: 'Clock of clocks',
    blurb: 'Twenty-four tiny clocks whose hands swing into place to spell the time left.',
  },
  { id: 'wordgrid', name: 'Word grid', blurb: 'A letter grid that lights the words — “about forty minutes left”.' },
  {
    id: 'tape',
    name: 'Tape',
    blurb: 'A minute ruler glides under a fixed needle; the heat strip shows the final stretch.',
  },
  {
    id: 'moon',
    name: 'Moon phase',
    blurb: 'The moon wanes from full to new as the session runs down, under an aurora sky.',
  },
];

type TGroup = Partial<Record<TFaceId, TDraw>>;
// Ring draws with the page; every other face ships in a small lazy group (one chunk each, see astro.config.mjs).
const GROUPS = {
  classic: () => import('./faces/classic.js'),
  retro: () => import('./faces/retro.js'),
  dials: () => import('./faces/dials.js'),
  orbits: () => import('./faces/orbits.js'),
  words: () => import('./faces/words.js'),
} satisfies Record<string, () => Promise<{ default: TGroup }>>;
type TGroupId = keyof typeof GROUPS;

// The Volt faces exist only in apps/site; this site draws Ring for them.
const GROUP_OF: Partial<Record<Exclude<TFaceId, 'ring'>, TGroupId>> = {
  bold: 'classic',
  horizon: 'classic',
  tide: 'classic',
  type: 'classic',
  stack: 'classic',
  bars: 'classic',
  battery: 'classic',
  hourglass: 'classic',
  flip: 'retro',
  rolling: 'retro',
  nixie: 'retro',
  lcd: 'retro',
  led: 'retro',
  board: 'retro',
  analog: 'dials',
  luxe: 'dials',
  dive: 'dials',
  chrono: 'dials',
  pilot: 'dials',
  dual: 'dials',
  gauge: 'dials',
  rings: 'orbits',
  radar: 'orbits',
  dots: 'orbits',
  orbit: 'orbits',
  disc: 'orbits',
  moon: 'orbits',
  tape: 'orbits',
  timeline: 'orbits',
  words: 'words',
  wordgrid: 'words',
  clocks: 'words',
};

const DRAW: TGroup = { ring };
const loading = new Map<TGroupId, Promise<void>>();
let css: Promise<void> | undefined;

// Registers a group of face drawings (the lazy groups, or face/all.ts at build time).
export function registerFaces(group: TGroup): void {
  Object.assign(DRAW, group);
}

// The faces sheet (public/assets/faces.css): art palette, keyframes, the picker grid and the Luxe, Words and LED fonts.
export function faceSheet(): Promise<void> {
  if (css) return css;
  const href = typeof __AT_FACES__ === 'string' ? __AT_FACES__ : '';
  if (!href || typeof document === 'undefined') return (css = Promise.resolve());
  const have = document.querySelector<HTMLLinkElement>('link[data-at-faces]');
  return (css = new Promise((resolve) => {
    if (have?.sheet) {
      resolve();
      return;
    }
    const link = have ?? document.createElement('link');
    link.onload = link.onerror = () => {
      resolve();
    };
    // A sheet that never answers must not hold a face back for good.
    setTimeout(resolve, 3000);
    if (!have) {
      link.rel = 'stylesheet';
      link.href = href;
      link.dataset.atFaces = '';
      document.head.append(link);
    }
  }));
}

export function loadFace(id: TFaceId): Promise<void> {
  if (id === 'ring') return Promise.resolve();
  const g = GROUP_OF[id];
  if (!g) return Promise.resolve();
  let p = loading.get(g);
  if (!p) {
    p = Promise.all([GROUPS[g](), faceSheet()]).then(([m]) => {
      registerFaces(m.default);
    });
    p.catch(() => loading.delete(g));
    loading.set(g, p);
  }
  return p;
}

export const loadAllFaces = (): Promise<void> => Promise.all(FACES.map((f) => loadFace(f.id))).then(() => undefined);

// Markup for a face whose drawing is loaded (Ring always is; import face/all.ts for every face at build time).
export function faceSvg(p: IFaceProps): string {
  const v = vals(p, p.nowSec);
  const draw = DRAW[v.face];
  return frame(v, draw ? draw(v) : '', p.bare);
}

// Patches the old tree into the new one node by node, so running animations and transitions carry on.
function morph(from: Element, to: Element): void {
  for (const a of [...from.attributes]) if (!to.hasAttribute(a.name)) from.removeAttribute(a.name);
  for (const a of [...to.attributes]) if (from.getAttribute(a.name) !== a.value) from.setAttribute(a.name, a.value);
  const next = [...to.childNodes];
  const cur = [...from.childNodes];
  next.forEach((n, i) => {
    const o = cur[i];
    if (!o) from.append(n);
    else if (o.nodeType !== n.nodeType || o.nodeName !== n.nodeName) o.replaceWith(n);
    else if (n instanceof Element) morph(o as Element, n);
    else if (o.nodeValue !== n.nodeValue) o.nodeValue = n.nodeValue;
  });
  for (let i = next.length; i < cur.length; i++) cur[i]?.remove();
}

function parse(html: string): Element | null {
  const tpl = document.createElement('template');
  tpl.innerHTML = html;
  return tpl.content.firstElementChild;
}

export function mountFace(el: HTMLElement, p: IFaceProps): { update(p: Partial<IFaceProps>): void; destroy(): void } {
  let props: IFaceProps = { ...p };
  let t0 = p.nowSec;
  let drawn: TFaceId | '' = '';
  let wasLive = false;
  let turn = 0;
  let dead = false;

  const paint = () => {
    if (dead) return;
    const id = isFace(props.face) ? props.face : 'ring';
    const draw = DRAW[id];
    if (!draw || (id !== 'ring' && !css)) {
      const mine = ++turn;
      loadFace(id).then(
        () => {
          if (mine === turn) paint();
        },
        () => undefined,
      );
      // The previous face stays until the next one is ready; a first mount holds an empty box of the right size.
      if (drawn) return;
    }
    let v = vals(props, t0);
    const swap = drawn !== id;
    // Sweeps restart from the current second whenever motion starts or the face changes.
    if ((v.live && !wasLive) || swap) {
      t0 = props.nowSec;
      v = vals(props, t0);
    }
    wasLive = v.live;
    const html = frame(v, draw ? draw(v) : '', props.bare);
    const next = parse(html);
    const old = el.firstElementChild;
    if (!next) return;
    if (!old || swap || !draw) el.replaceChildren(next);
    else morph(old, next);
    drawn = draw ? id : '';
  };

  paint();
  return {
    update(next) {
      props = { ...props, ...next };
      paint();
    },
    destroy() {
      dead = true;
      turn++;
      el.replaceChildren();
    },
  };
}
