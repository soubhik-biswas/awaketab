import type { ComponentType } from 'react';
import Ring from './faces/ring';
import type { IDrawProps } from './kit';
import type { TFaceId } from './model';

export interface IFaceInfo {
  id: TFaceId;
  num: string;
  name: string;
  blurb: string;
}

// The faces board's numbers, names and descriptions, in sheet order.
export const FACES: readonly IFaceInfo[] = [
  {
    id: 'ring',
    num: '01',
    name: 'Ring',
    blurb: 'The signature. The lamp rides the end of the arc and turns amber the moment the lock pauses.',
  },
  {
    id: 'bold',
    num: '02',
    name: 'Bold',
    blurb: 'Heavy display digits for across-the-room reading, with a slim progress rail.',
  },
  { id: 'horizon', num: '03', name: 'Horizon', blurb: 'A lamp-sun sets toward the horizon as the session runs down.' },
  { id: 'tide', num: '04', name: 'Tide', blurb: 'The water level is the time left. Calm and glanceable.' },
  { id: 'flip', num: '05', name: 'Flip', blurb: 'Split-flap cards with a real hinge gap.' },
  { id: 'rolling', num: '06', name: 'Rolling', blurb: 'Odometer drums — the next digit is always just visible.' },
  {
    id: 'analog',
    num: '07a',
    name: 'Analog',
    blurb: 'Real time on the hands; the lamp arc on the bezel runs to the end time.',
  },
  {
    id: 'luxe',
    num: '07b',
    name: 'Analog luxe',
    blurb: 'A deeper dial with serif numerals, a minute track and a lamp sector.',
  },
  { id: 'rings', num: '08', name: 'Rings', blurb: 'Session, minutes and seconds as three concentric rings.' },
  {
    id: 'words',
    num: '09',
    name: 'Words',
    blurb: 'Time in a sentence, written natively in each of the eight languages.',
  },
  {
    id: 'nixie',
    num: '10',
    name: 'Nixie',
    blurb: 'Glass tubes with mesh and ghost 8s; the glow takes the lamp colour.',
  },
  { id: 'lcd', num: '11', name: 'LCD', blurb: 'Slanted segments over a faint 88:88 ghost, like a bedside clock.' },
  { id: 'led', num: '12', name: 'LED', blurb: 'Dot-matrix board with a scrolling status line. Best in OLED.' },
  {
    id: 'dive',
    num: '13',
    name: 'Diver',
    blurb: 'A dive-watch bezel: the green arc is the minutes left, the hands keep real time.',
  },
  { id: 'chrono', num: '14', name: 'Chronograph', blurb: 'Minute and second sub-dials with a sweeping chrono hand.' },
  { id: 'gauge', num: '15', name: 'Gauge', blurb: 'An instrument needle with a five-minute warning zone.' },
  { id: 'type', num: '16', name: 'Type', blurb: 'Minutes in huge type, seconds in green, a progress hairline.' },
  {
    id: 'bars',
    num: '17',
    name: 'Bars',
    blurb: 'The whole session as bars — spent fades, the current one breathes.',
  },
  {
    id: 'timeline',
    num: '18',
    name: 'Timeline',
    blurb: 'Now → Ends, like a boarding pass. The most literal way to read time left.',
  },
  {
    id: 'pilot',
    num: '19',
    name: 'Pilot',
    blurb: 'Aviator dial with a triangle at 12, sword hands and a green minutes-left sector.',
  },
  {
    id: 'dual',
    num: '20',
    name: 'Dual time',
    blurb: 'Two small dials side by side: the time now and the time it ends.',
  },
  { id: 'radar', num: '21', name: 'Radar', blurb: 'A sweeping scope; the blip marks the end time on the rings.' },
  { id: 'dots', num: '22', name: 'Dots', blurb: 'Sixty dots around the dial; each minute left keeps one lit.' },
  {
    id: 'hourglass',
    num: '23',
    name: 'Hourglass',
    blurb: 'Sand falls from top to bottom as the session runs; a fine stream moves while awake.',
  },
  {
    id: 'battery',
    num: '24',
    name: 'Battery',
    blurb: 'Time left as a charge level, with a gentle sheen across the cell.',
  },
  {
    id: 'stack',
    num: '25',
    name: 'Stack',
    blurb: 'Minutes over seconds in a tight editorial stack, end time underneath.',
  },
  {
    id: 'board',
    num: '26',
    name: 'Departure board',
    blurb: 'Split-flap tiles like a station board; the seconds tile flaps each tick.',
  },
  {
    id: 'orbit',
    num: '27',
    name: 'Orbit',
    blurb: 'Three orbits: the session in green, minutes in sky, a violet moon sweeping the seconds.',
  },
  {
    id: 'disc',
    num: '28',
    name: 'Time disc',
    blurb: 'A solid disc that shrinks toward 12, warming from green to ember in the last minutes.',
  },
  {
    id: 'clocks',
    num: '29',
    name: 'Clock of clocks',
    blurb: 'Twenty-four tiny clocks whose hands swing into place to spell the time left.',
  },
  {
    id: 'wordgrid',
    num: '30',
    name: 'Word grid',
    blurb: 'A letter grid that lights the words — “about forty minutes left”.',
  },
  {
    id: 'tape',
    num: '31',
    name: 'Tape',
    blurb: 'A minute ruler glides under a fixed needle; the heat strip shows the final stretch.',
  },
  {
    id: 'moon',
    num: '32',
    name: 'Moon phase',
    blurb: 'The moon wanes from full to new as the session runs down, under an aurora sky.',
  },
];

export const faceName = (id: TFaceId): string => FACES.find((f) => f.id === id)?.name ?? id;

export type TFaceDrawing = ComponentType<IDrawProps>;
type TLoader = () => Promise<{ default: TFaceDrawing }>;

// Ring ships with the page; every other face is its own chunk, loaded the first time it is drawn.
export const FACE_LOADERS: Readonly<Partial<Record<Exclude<TFaceId, 'ring'>, TLoader>>> = {
  bold: () => import('./faces/bold'),
  flip: () => import('./faces/flip'),
  analog: () => import('./faces/analog'),
  luxe: () => import('./faces/luxe'),
  disc: () => import('./faces/disc'),
};

const loaded = new Map<TFaceId, TFaceDrawing>([['ring', Ring]]);
const pending = new Map<TFaceId, Promise<TFaceDrawing>>();

export const loadedFace = (id: TFaceId): TFaceDrawing | undefined => loaded.get(id);

// Loads a face's drawing once; later calls share the same promise, so React's use() can wait on it.
export function loadFace(id: TFaceId): Promise<TFaceDrawing> {
  const have = loaded.get(id);
  if (have) return Promise.resolve(have);
  let p = pending.get(id);
  if (!p) {
    const load = FACE_LOADERS[id as Exclude<TFaceId, 'ring'>];
    if (!load) return Promise.reject(new Error(`No drawing for the ${id} face yet`));
    p = load().then(
      (mod) => {
        loaded.set(id, mod.default);
        return mod.default;
      },
      (err: unknown) => {
        pending.delete(id);
        throw err;
      },
    );
    pending.set(id, p);
  }
  return p;
}

export const preloadFaces = (ids: readonly TFaceId[] = FACES.map((f) => f.id)): Promise<unknown> =>
  Promise.allSettled(ids.map(loadFace));
