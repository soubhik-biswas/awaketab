import type { ComponentType } from 'react';
import Ring from './faces/ring';
import type { IDrawProps } from './kit';
import type { TFaceId } from './model';

export type TFaceKind = 'digital' | 'analog' | 'ambient';

export interface IFaceInfo {
  id: TFaceId;
  num: string;
  name: string;
  blurb: string;
  kind: TFaceKind;
  featured: boolean;
}

// The faces board's numbers, names, descriptions, kinds and Featured marks, in gallery order.
export const FACES: readonly IFaceInfo[] = [
  {
    id: 'ring',
    num: '01',
    name: 'Ring',
    blurb: 'The signature. The light rides the end of the arc and turns amber the moment the lock pauses.',
    kind: 'analog',
    featured: true,
  },
  {
    id: 'bold',
    num: '02',
    name: 'Bold',
    blurb: 'Heavy display digits for across-the-room reading, with a slim progress rail.',
    kind: 'digital',
    featured: true,
  },
  {
    id: 'horizon',
    num: '03',
    name: 'Horizon',
    blurb: 'A light-sun sets toward the horizon as the session runs down.',
    kind: 'ambient',
    featured: false,
  },
  {
    id: 'tide',
    num: '04',
    name: 'Tide',
    blurb: 'The water level is the time left. Calm and glanceable.',
    kind: 'ambient',
    featured: false,
  },
  {
    id: 'flip',
    num: '05',
    name: 'Flip',
    blurb: 'Split-flap cards with a real hinge gap.',
    kind: 'digital',
    featured: true,
  },
  {
    id: 'rolling',
    num: '06',
    name: 'Rolling',
    blurb: 'Odometer drums — the next digit is always just visible.',
    kind: 'digital',
    featured: false,
  },
  {
    id: 'analog',
    num: '07',
    name: 'Analog',
    blurb: 'Real time on the hands; the arc on the bezel runs to the end time.',
    kind: 'analog',
    featured: false,
  },
  {
    id: 'luxe',
    num: '08',
    name: 'Analog luxe',
    blurb: 'A deeper dial with serif numerals, a minute track and a lit sector.',
    kind: 'analog',
    featured: false,
  },
  {
    id: 'rings',
    num: '09',
    name: 'Rings',
    blurb: 'Session, minutes and seconds as three concentric rings.',
    kind: 'analog',
    featured: false,
  },
  {
    id: 'words',
    num: '10',
    name: 'Words',
    blurb: 'Time in a plain English sentence, like a note on the desk.',
    kind: 'ambient',
    featured: false,
  },
  {
    id: 'nixie',
    num: '11',
    name: 'Nixie',
    blurb: 'Glass tubes with mesh and ghost 8s; the glow takes the light colour.',
    kind: 'digital',
    featured: true,
  },
  {
    id: 'lcd',
    num: '12',
    name: 'LCD',
    blurb: 'Slanted segments over a faint 88:88 ghost, like a bedside clock.',
    kind: 'digital',
    featured: false,
  },
  {
    id: 'dive',
    num: '13',
    name: 'Diver',
    blurb: 'A dive-watch bezel: the green arc is the minutes left, the hands keep real time.',
    kind: 'analog',
    featured: true,
  },
  {
    id: 'chrono',
    num: '14',
    name: 'Chronograph',
    blurb: 'Minute and second sub-dials with a sweeping chrono hand.',
    kind: 'analog',
    featured: true,
  },
  {
    id: 'gauge',
    num: '15',
    name: 'Gauge',
    blurb: 'An instrument needle with a five-minute warning zone.',
    kind: 'analog',
    featured: false,
  },
  {
    id: 'type',
    num: '16',
    name: 'Type',
    blurb: 'Minutes in huge type, seconds in green, a progress hairline.',
    kind: 'digital',
    featured: false,
  },
  {
    id: 'bars',
    num: '17',
    name: 'Bars',
    blurb: 'The whole session as bars — spent fades, the current one breathes.',
    kind: 'ambient',
    featured: false,
  },
  {
    id: 'timeline',
    num: '18',
    name: 'Timeline',
    blurb: 'Now → Ends, like a boarding pass. The most literal way to read time left.',
    kind: 'digital',
    featured: false,
  },
  {
    id: 'pilot',
    num: '19',
    name: 'Pilot',
    blurb: 'Aviator dial with a triangle at 12, sword hands and a green minutes-left sector.',
    kind: 'analog',
    featured: true,
  },
  {
    id: 'dual',
    num: '20',
    name: 'Dual time',
    blurb: 'Two small dials side by side: the time now and the time it ends.',
    kind: 'digital',
    featured: false,
  },
  {
    id: 'radar',
    num: '21',
    name: 'Radar',
    blurb: 'A sweeping scope; the blip marks the end time on the rings.',
    kind: 'analog',
    featured: false,
  },
  {
    id: 'dots',
    num: '22',
    name: 'Dots',
    blurb: 'Sixty dots around the dial; each minute left keeps one lit.',
    kind: 'analog',
    featured: false,
  },
  {
    id: 'hourglass',
    num: '23',
    name: 'Hourglass',
    blurb: 'Sand falls from top to bottom as the session runs; a fine stream moves while awake.',
    kind: 'ambient',
    featured: false,
  },
  {
    id: 'battery',
    num: '24',
    name: 'Battery',
    blurb: 'Time left as a charge level, with a gentle sheen across the cell.',
    kind: 'ambient',
    featured: false,
  },
  {
    id: 'stack',
    num: '25',
    name: 'Stack',
    blurb: 'Minutes over seconds in a tight editorial stack, end time underneath.',
    kind: 'digital',
    featured: false,
  },
  {
    id: 'board',
    num: '26',
    name: 'Departure board',
    blurb: 'Split-flap tiles like a station board; the seconds tile flaps each tick.',
    kind: 'digital',
    featured: false,
  },
  {
    id: 'orbit',
    num: '27',
    name: 'Orbit',
    blurb: 'Three orbits: the session in green, minutes in sky, a violet moon sweeping the seconds.',
    kind: 'analog',
    featured: true,
  },
  {
    id: 'disc',
    num: '28',
    name: 'Time disc',
    blurb: 'A solid disc that shrinks toward 12, warming from green to ember in the last minutes.',
    kind: 'ambient',
    featured: false,
  },
  {
    id: 'clocks',
    num: '29',
    name: 'Clock of clocks',
    blurb: 'Twenty-four tiny clocks whose hands swing into place to spell the time left.',
    kind: 'digital',
    featured: false,
  },
  {
    id: 'wordgrid',
    num: '30',
    name: 'Word grid',
    blurb: 'A letter grid that lights the words — “about forty minutes left”.',
    kind: 'ambient',
    featured: false,
  },
  {
    id: 'tape',
    num: '31',
    name: 'Tape',
    blurb: 'A minute ruler glides under a fixed needle; the heat strip shows the final stretch.',
    kind: 'ambient',
    featured: false,
  },
  {
    id: 'moon',
    num: '32',
    name: 'Moon phase',
    blurb:
      'The moon wanes from full to new as the session runs down — a night sky in dark, a pale daytime sky in light.',
    kind: 'ambient',
    featured: true,
  },
  {
    id: 'aurora',
    num: '33',
    name: 'Aurora',
    blurb: 'A drifting northern-light mesh; pastel in light theme, deep in dark.',
    kind: 'ambient',
    featured: true,
  },
  {
    id: 'glass',
    num: '34',
    name: 'Glass',
    blurb: 'A frosted pane floats over soft colour orbs; the time sits on the glass.',
    kind: 'ambient',
    featured: true,
  },
  {
    id: 'neon',
    num: '35',
    name: 'Neon',
    blurb:
      'A neon sign on a wall — a dark wall at night, a white-washed wall by day — with a humming flicker while awake.',
    kind: 'digital',
    featured: true,
  },
  {
    id: 'liquid',
    num: '36',
    name: 'Liquid',
    blurb: 'A glass sphere of light that drains as the session runs, with waves and bubbles.',
    kind: 'ambient',
    featured: true,
  },
  {
    id: 'eclipse',
    num: '37',
    name: 'Eclipse',
    blurb: 'The moon slides across the sun; totality arrives when time is up. Night sky in dark, bright sky in light.',
    kind: 'ambient',
    featured: true,
  },
  {
    id: 'skeleton',
    num: '38',
    name: 'Skeleton',
    blurb: 'An open movement: brass gears turn and the balance wheel swings.',
    kind: 'analog',
    featured: true,
  },
  {
    id: 'bauhaus',
    num: '39',
    name: 'Bauhaus',
    blurb: 'Primary shapes and a pie of time left — a design object on the desk.',
    kind: 'analog',
    featured: false,
  },
  {
    id: 'poster',
    num: '40',
    name: 'Poster',
    blurb: 'Giant minutes in Archivo Expanded on a poster grid, the seconds printed in a disc.',
    kind: 'digital',
    featured: true,
  },
  {
    id: 'eink',
    num: '41',
    name: 'E-ink',
    blurb: 'Paper-like and calm. Dark themes turn it into night paper.',
    kind: 'digital',
    featured: false,
  },
  {
    id: 'waveform',
    num: '42',
    name: 'Waveform',
    blurb: 'A ring of audio bars that dances while awake; lit bars are time left.',
    kind: 'ambient',
    featured: false,
  },
  {
    id: 'blob',
    num: '43',
    name: 'Fluid',
    blurb: 'A morphing gradient orb, like a voice assistant at rest.',
    kind: 'ambient',
    featured: false,
  },
  {
    id: 'hud',
    num: '44',
    name: 'HUD',
    blurb: 'A car-dashboard arc of segments with italic digits and tell-tale lights.',
    kind: 'digital',
    featured: false,
  },
  {
    id: 'constellation',
    num: '45',
    name: 'Constellation',
    blurb:
      'Each minute left is a star; they join into a constellation. Stars glow in dark and become ink dots at dawn in light.',
    kind: 'ambient',
    featured: true,
  },
  {
    id: 'halo',
    num: '46',
    name: 'Halo',
    blurb: 'A glowing gradient ring that closes toward 12.',
    kind: 'analog',
    featured: true,
  },
];

export const faceName = (id: TFaceId): string => FACES.find((f) => f.id === id)?.name ?? id;
export const faceKind = (id: TFaceId): TFaceKind => FACES.find((f) => f.id === id)?.kind ?? 'ambient';

export type TFaceDrawing = ComponentType<IDrawProps>;
type TLoader = () => Promise<{ default: TFaceDrawing }>;

// Ring ships with the page; every other face is its own chunk, loaded the first time it is drawn.
export const FACE_LOADERS: Readonly<Record<Exclude<TFaceId, 'ring'>, TLoader>> = {
  bold: () => import('./faces/bold'),
  horizon: () => import('./faces/horizon'),
  tide: () => import('./faces/tide'),
  flip: () => import('./faces/flip'),
  rolling: () => import('./faces/rolling'),
  analog: () => import('./faces/analog'),
  luxe: () => import('./faces/luxe'),
  rings: () => import('./faces/rings'),
  words: () => import('./faces/words'),
  nixie: () => import('./faces/nixie'),
  lcd: () => import('./faces/lcd'),
  dive: () => import('./faces/dive'),
  chrono: () => import('./faces/chrono'),
  gauge: () => import('./faces/gauge'),
  type: () => import('./faces/type'),
  bars: () => import('./faces/bars'),
  timeline: () => import('./faces/timeline'),
  pilot: () => import('./faces/pilot'),
  dual: () => import('./faces/dual'),
  radar: () => import('./faces/radar'),
  dots: () => import('./faces/dots'),
  hourglass: () => import('./faces/hourglass'),
  battery: () => import('./faces/battery'),
  stack: () => import('./faces/stack'),
  board: () => import('./faces/board'),
  orbit: () => import('./faces/orbit'),
  disc: () => import('./faces/disc'),
  clocks: () => import('./faces/clocks'),
  wordgrid: () => import('./faces/wordgrid'),
  tape: () => import('./faces/tape'),
  moon: () => import('./faces/moon'),
  aurora: () => import('./faces/aurora'),
  glass: () => import('./faces/glass'),
  neon: () => import('./faces/neon'),
  liquid: () => import('./faces/liquid'),
  eclipse: () => import('./faces/eclipse'),
  skeleton: () => import('./faces/skeleton'),
  bauhaus: () => import('./faces/bauhaus'),
  poster: () => import('./faces/poster'),
  eink: () => import('./faces/eink'),
  waveform: () => import('./faces/waveform'),
  blob: () => import('./faces/blob'),
  hud: () => import('./faces/hud'),
  constellation: () => import('./faces/constellation'),
  halo: () => import('./faces/halo'),
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

export type TFaceCollection = 'featured' | TFaceKind | 'all';

// The gallery's filter chips, in the prototype's order: Featured 18 · Digital · Analog · Ambient · All 46.
export const FACE_COLLECTIONS: Readonly<Record<TFaceCollection, readonly TFaceId[]>> = {
  featured: [
    'ring',
    'aurora',
    'liquid',
    'halo',
    'eclipse',
    'skeleton',
    'neon',
    'dive',
    'flip',
    'bold',
    'glass',
    'chrono',
    'pilot',
    'orbit',
    'nixie',
    'poster',
    'moon',
    'constellation',
  ],
  digital: [
    'bold',
    'type',
    'stack',
    'poster',
    'flip',
    'rolling',
    'nixie',
    'neon',
    'lcd',
    'board',
    'hud',
    'eink',
    'clocks',
    'timeline',
    'dual',
  ],
  analog: [
    'skeleton',
    'analog',
    'luxe',
    'dive',
    'chrono',
    'pilot',
    'gauge',
    'dots',
    'radar',
    'rings',
    'orbit',
    'ring',
    'halo',
    'bauhaus',
  ],
  ambient: [
    'aurora',
    'liquid',
    'eclipse',
    'glass',
    'blob',
    'constellation',
    'waveform',
    'horizon',
    'tide',
    'hourglass',
    'battery',
    'bars',
    'words',
    'wordgrid',
    'tape',
    'moon',
    'disc',
  ],
  all: FACES.map((f) => f.id),
};
