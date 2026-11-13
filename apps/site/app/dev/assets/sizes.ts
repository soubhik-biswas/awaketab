interface IFrameSpec {
  w: number;
  h: number;
  tone: 'dark' | 'light';
}

// Every marketing image the page can draw, at its exact pixel size and page theme.
export const FRAMES = {
  'og-01': { w: 1200, h: 630, tone: 'dark' },
  'og-02': { w: 1200, h: 630, tone: 'light' },
  'og-03': { w: 1200, h: 630, tone: 'dark' },
  'og-04': { w: 1200, h: 630, tone: 'dark' },
  'og-07': { w: 1200, h: 630, tone: 'dark' },
  'og-08': { w: 1200, h: 630, tone: 'dark' },
  'ph-01': { w: 1270, h: 760, tone: 'dark' },
  'ph-02': { w: 1270, h: 760, tone: 'light' },
  'ph-03': { w: 1270, h: 760, tone: 'dark' },
  'ph-04': { w: 1270, h: 760, tone: 'dark' },
  'ph-05': { w: 1270, h: 760, tone: 'light' },
  'soc-01-square': { w: 1080, h: 1080, tone: 'dark' },
  'soc-02-story': { w: 1080, h: 1920, tone: 'dark' },
  'cws-01': { w: 1280, h: 800, tone: 'dark' },
  'cws-02': { w: 1280, h: 800, tone: 'light' },
  'cws-03': { w: 1280, h: 800, tone: 'dark' },
  'cws-04': { w: 1280, h: 800, tone: 'dark' },
  'cws-05': { w: 1280, h: 800, tone: 'light' },
  'promo-small-440x280': { w: 440, h: 280, tone: 'dark' },
  'promo-marquee-1400x560': { w: 1400, h: 560, tone: 'dark' },
} as const satisfies Record<string, IFrameSpec>;

export type TFrameId = keyof typeof FRAMES;

export const FRAME_IDS = Object.keys(FRAMES) as TFrameId[];

export const isFrameId = (v: unknown): v is TFrameId => typeof v === 'string' && Object.hasOwn(FRAMES, v);
