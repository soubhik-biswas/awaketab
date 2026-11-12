import { LAYERS, SILENCE, type TLayer, type TMix } from '@/lib/tool/sound-mix';

export type TSoundGroup = 'nature' | 'places' | 'noise' | 'music';

export const GROUPS: ReadonlyArray<readonly [TSoundGroup, readonly TLayer[]]> = [
  ['nature', ['rain', 'ocean', 'stream', 'wind', 'crickets', 'thunder']],
  ['places', ['cafe', 'fire', 'train', 'fan']],
  ['noise', ['brown', 'pink', 'white']],
  ['music', ['pad', 'keys', 'drone', 'bells']],
];

export type TScene = 'focus' | 'rainy' | 'train' | 'ocean' | 'fire' | 'keys' | 'storm' | 'night';

const scene = (levels: Partial<TMix>): TMix => ({ ...SILENCE, ...levels });

export const SCENES: ReadonlyArray<readonly [TScene, TMix]> = [
  ['focus', scene({ pad: 70, drone: 50, brown: 35 })],
  ['rainy', scene({ rain: 60, cafe: 40, keys: 30 })],
  ['train', scene({ train: 60, rain: 25, pad: 30 })],
  ['ocean', scene({ ocean: 65, wind: 25, bells: 20 })],
  ['fire', scene({ fire: 70, wind: 20, pad: 25 })],
  ['keys', scene({ keys: 65, pad: 35, stream: 20 })],
  ['storm', scene({ rain: 70, thunder: 55, wind: 25 })],
  ['night', scene({ crickets: 45, stream: 35, drone: 25 })],
];

const sameMix = (a: TMix, b: TMix) => LAYERS.every((k) => a[k] === b[k]);

export function sceneOf(mix: TMix): TScene | null {
  return SCENES.find(([, m]) => sameMix(m, mix))?.[0] ?? null;
}

const any = <T>(xs: readonly T[]): T | undefined => xs[Math.floor(Math.random() * xs.length)];
const level = (lo: number, hi: number) => Math.round((lo + Math.random() * (hi - lo)) / 5) * 5;

// A fresh mix that still makes sense: one bed of music or noise under one or two sounds of a place or of nature.
export function shuffleMix(from: TMix): TMix {
  const music = GROUPS[3]?.[1] ?? [];
  const noise = GROUPS[2]?.[1] ?? [];
  const around = [...(GROUPS[0]?.[1] ?? []), ...(GROUPS[1]?.[1] ?? [])].filter((k) => k !== 'thunder');
  for (let tries = 0; tries < 8; tries += 1) {
    const next = { ...SILENCE };
    const bed = any(Math.random() < 0.7 ? music : noise);
    if (bed) next[bed] = level(35, 65);
    const first = any(around);
    if (first) next[first] = level(40, 70);
    if (Math.random() < 0.55) {
      const second = any(around.filter((k) => k !== first));
      if (second) next[second] = level(15, 35);
    }
    if (!sameMix(next, from)) return next;
  }
  return { ...SILENCE, pad: 50, rain: 40 };
}
