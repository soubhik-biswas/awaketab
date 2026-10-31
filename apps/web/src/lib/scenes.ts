export type TSceneKey =
  | 'hero'
  | 'firstaction'
  | 'welcome'
  | 'success'
  | 'offline'
  | 'conflict'
  | 'history'
  | 'expired'
  | 'notfound'
  | 'removed'
  | 'error'
  | 'maintenance'
  | 'noitems'
  | 'cooking'
  | 'presenting'
  | 'dashboard'
  | 'nightdesk';

type TFill = 'w' | 'w2' | 'p' | 'm' | 't' | 'o' | 'a' | 'a2' | 's' | 'v' | 'k' | 'r' | 'g';

interface IScene {
  alt: string;
  blob: string;
  blob2: string;
  layers: ReadonlyArray<readonly [TFill, string]>;
  ring: string;
  lamp: readonly [number, number, number];
  ln: string;
  lnLight?: string;
  sp: string;
}

const R = (x: number, y: number, w: number, h: number, r0 = 0): string => {
  const r = Math.min(r0, w / 2, h / 2);
  return `M${x + r} ${y}h${w - 2 * r}a${r} ${r} 0 0 1 ${r} ${r}v${h - 2 * r}a${r} ${r} 0 0 1 ${-r} ${r}h${-(w - 2 * r)}a${r} ${r} 0 0 1 ${-r} ${-r}v${-(h - 2 * r)}a${r} ${r} 0 0 1 ${r} ${-r}Z `;
};
const C = (cx: number, cy: number, r: number): string =>
  `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z `;
const E = (cx: number, cy: number, rx: number, ry: number): string =>
  `M${cx - rx} ${cy}a${rx} ${ry} 0 1 0 ${2 * rx} 0a${rx} ${ry} 0 1 0 ${-2 * rx} 0Z `;
// The scene ring is the mark's arc: from 12 o'clock round to −160°.
const ARC = (cx: number, cy: number, r: number): string => {
  const e = (-160 * Math.PI) / 180;
  return `M${cx} ${cy - r} A${r} ${r} 0 1 1 ${(cx + r * Math.cos(e)).toFixed(2)} ${(cy + r * Math.sin(e)).toFixed(2)}`;
};
const LAMP = (cx: number, cy: number, r: number, lr = 7): readonly [number, number, number] => {
  const a = (-125 * Math.PI) / 180;
  return [+(cx + r * Math.cos(a)).toFixed(2), +(cy + r * Math.sin(a)).toFixed(2), lr];
};
const SPARK = (x: number, y: number, s: number): string => `M${x - s} ${y}h${2 * s}M${x} ${y - s}v${2 * s} `;

const SCENES: Record<TSceneKey, IScene> = {
  hero: {
    alt: 'A tablet on a kitchen counter shows a glowing ring while a pot steams beside it',
    blob: C(160, 118, 104),
    blob2: C(262, 64, 30),
    layers: [
      ['w', R(88, 34, 144, 116, 16)],
      ['m', R(99, 45, 122, 94, 9)],
      ['k', 'M152 150 L142 198 H178 L168 150 Z'],
      ['o', R(30, 150, 76, 48, 12) + R(52, 140, 32, 12, 6)],
      ['a', C(262, 64, 16)],
      ['t', R(214, 168, 68, 30, 8)],
      ['w2', R(222, 160, 52, 12, 6)],
    ],
    ring: ARC(160, 92, 26),
    lamp: LAMP(160, 92, 26),
    ln: 'M18 198 H302 M30 166 H20 M106 166 H116 M52 128 c-6 -8 6 -12 0 -20 M68 124 c-6 -8 6 -12 0 -20 M84 128 c-6 -8 6 -12 0 -20',
    sp: SPARK(292, 36, 6) + SPARK(232, 30, 4),
  },
  firstaction: {
    alt: 'A big orange start button glows as the lamp above it lights up',
    blob: C(160, 128, 100),
    blob2: '',
    layers: [
      ['w', E(160, 186, 82, 18)],
      ['o', C(160, 140, 56)],
      ['k', 'M146 116 L182 140 L146 164 Z'],
      ['t', R(206, 40, 70, 34, 17)],
    ],
    ring: '',
    lamp: [160, 44, 10],
    ln: 'M96 96 l-14 -12 M224 96 l14 -12 M90 140 h-18 M230 140 h18 M218 57 h46',
    sp: SPARK(70, 60, 6) + SPARK(268, 112, 5),
  },
  welcome: {
    alt: 'A browser window with AwakeTab pinned in its toolbar, confetti around it',
    blob: C(160, 120, 104),
    blob2: C(60, 60, 22),
    layers: [
      ['w', R(36, 50, 248, 150, 16)],
      ['p', R(36, 50, 248, 34, 16)],
      ['m', R(212, 58, 36, 18, 9)],
      ['o', R(56, 30, 12, 12, 2) + R(276, 30, 10, 10, 2) + R(28, 196, 10, 10, 2)],
      ['v', R(254, 210, 12, 12, 2) + R(100, 22, 10, 10, 2)],
      ['t', R(52, 100, 96, 72, 10)],
    ],
    ring: '',
    lamp: [230, 67, 6],
    ln: 'M164 108 H262 M164 126 H244 M164 144 H254 M164 162 H226 M52 67 h0 M66 67 h0',
    sp: SPARK(300, 120, 6) + SPARK(20, 120, 5),
  },
  success: {
    alt: 'A clock face with a green check badge and celebration sparks',
    blob: C(160, 120, 104),
    blob2: C(250, 190, 26),
    layers: [
      ['w', C(150, 124, 70)],
      ['p', C(150, 124, 52)],
      ['t', C(214, 70, 28)],
      ['o', R(46, 52, 14, 14, 3) + R(262, 168, 14, 14, 3)],
      ['v', R(70, 190, 12, 12, 3)],
    ],
    ring: ARC(150, 124, 62),
    lamp: LAMP(150, 124, 62),
    ln: 'M150 124 V92 M150 124 L172 136 M202 70 l8 8 l16 -16',
    sp: SPARK(270, 40, 7) + SPARK(36, 130, 5) + SPARK(110, 34, 4),
  },
  offline: {
    alt: 'A cloud with a line through it while a tablet below keeps glowing',
    blob: C(160, 124, 100),
    blob2: '',
    layers: [
      ['w', 'M92 96 a30 30 0 0 1 22 -50 a40 40 0 0 1 74 -6 a30 30 0 0 1 40 30 a26 26 0 0 1 -6 26 Z'],
      ['m', R(112, 120, 96, 84, 12)],
      ['s', R(120, 128, 80, 68, 6)],
    ],
    ring: ARC(160, 162, 20),
    lamp: LAMP(160, 162, 20, 6),
    ln: 'M88 30 L236 110',
    sp: SPARK(270, 160, 6),
  },
  conflict: {
    alt: 'Two browser tabs overlap; one holds the lamp, the other is paused',
    blob: C(160, 120, 104),
    blob2: '',
    layers: [
      ['w', R(40, 56, 160, 118, 14)],
      ['p', R(40, 56, 160, 26, 14)],
      ['s', R(124, 92, 160, 118, 14)],
      ['w2', R(124, 92, 160, 26, 14)],
      ['a', C(204, 160, 18)],
    ],
    ring: '',
    lamp: [120, 124, 10],
    ln: 'M196 152 v16 M212 152 v16 M54 69 h0 M138 105 h0 M24 120 c0 -40 10 -60 40 -78',
    sp: SPARK(290, 60, 6),
  },
  history: {
    alt: 'Stacked session cards with a bar chart of awake time',
    blob: C(160, 122, 104),
    blob2: '',
    layers: [
      ['p', R(96, 30, 172, 136, 16)],
      ['w2', R(82, 42, 172, 136, 16)],
      ['w', R(66, 56, 180, 140, 16)],
      ['t', R(92, 140, 22, 36, 4) + R(124, 116, 22, 60, 4) + R(156, 128, 22, 48, 4) + R(188, 98, 22, 78, 4)],
      ['o', R(84, 72, 60, 14, 7)],
    ],
    ring: '',
    lamp: [222, 79, 8],
    ln: 'M86 178 H230',
    sp: SPARK(290, 70, 6) + SPARK(40, 190, 5),
  },
  expired: {
    alt: 'A licence key beside an hourglass that has run out',
    blob: C(160, 122, 104),
    blob2: '',
    layers: [
      ['a', C(104, 118, 36)],
      ['a2', R(134, 108, 112, 20, 6) + R(214, 128, 14, 22, 3) + R(190, 128, 12, 16, 3)],
      ['p', C(104, 118, 14)],
      ['v', 'M232 40 H286 L262 92 L286 146 H232 L256 92 Z'],
      ['w', 'M240 48 H278 L262 82 Z'],
    ],
    ring: '',
    lamp: [104, 118, 7],
    ln: 'M228 40 H290 M228 146 H290',
    sp: SPARK(44, 60, 6),
  },
  notfound: {
    alt: 'A signpost with arrows pointing different ways and a lantern on top',
    blob: C(160, 128, 100),
    blob2: E(160, 206, 120, 16),
    layers: [
      ['k', R(152, 60, 16, 140, 4)],
      ['w', 'M84 76 H200 L218 92 L200 108 H84 Z'],
      ['o', 'M236 118 H120 L102 134 L120 150 H236 Z'],
      ['m', R(146, 26, 28, 32, 8)],
    ],
    ring: '',
    lamp: [160, 42, 7],
    ln: 'M100 92 H170 M136 134 H210 M30 204 H290',
    sp: SPARK(270, 50, 6) + SPARK(50, 150, 5),
  },
  removed: {
    alt: 'A laptop with its power plug pulled out, a spark in the gap',
    blob: C(160, 122, 104),
    blob2: '',
    layers: [
      ['m', R(64, 50, 150, 104, 12)],
      ['w', 'M44 154 H234 L222 176 H56 Z'],
      ['o', R(244, 110, 40, 26, 6)],
      ['k', R(284, 116, 18, 4, 2) + R(284, 128, 18, 4, 2)],
    ],
    ring: '',
    lamp: [139, 100, 10],
    ln: 'M244 123 C 220 123 236 200 160 200 H40',
    sp: SPARK(232, 96, 6),
  },
  error: {
    alt: 'A cracked light bulb with a small spark',
    blob: C(160, 120, 100),
    blob2: '',
    layers: [
      ['a', 'M160 30 a56 56 0 0 1 34 100 c-8 8 -10 16 -10 26 H136 c0 -10 -2 -18 -10 -26 A56 56 0 0 1 160 30 Z'],
      ['w', R(136, 160, 48, 14, 4) + R(140, 178, 40, 14, 4)],
      ['r', R(148, 196, 24, 10, 5)],
    ],
    ring: '',
    lamp: [160, 86, 9],
    ln: 'M150 56 L166 76 L152 92 L170 112 M146 142 V156 M174 142 V156',
    sp: SPARK(240, 50, 7) + SPARK(80, 160, 5),
  },
  maintenance: {
    alt: 'A toolbox and a spanner next to the AwakeTab ring',
    blob: C(160, 124, 102),
    blob2: '',
    layers: [
      ['o', R(60, 130, 120, 70, 10)],
      ['w', R(52, 118, 136, 22, 8)],
      ['k', R(108, 104, 24, 16, 4)],
      ['w2', C(232, 92, 44)],
      ['s', 'M196 168 L250 114 l10 10 L206 178 Z'],
    ],
    ring: ARC(232, 92, 30),
    lamp: LAMP(232, 92, 30),
    ln: 'M60 160 H180 M260 104 a12 12 0 1 0 0.1 0',
    sp: SPARK(290, 180, 6),
  },
  noitems: {
    alt: 'An empty notebook with a pencil resting on it',
    blob: C(160, 122, 104),
    blob2: '',
    layers: [
      ['p', R(70, 42, 180, 150, 14)],
      ['w', R(80, 34, 168, 150, 12)],
      ['t', R(70, 34, 22, 158, 8)],
      ['a', 'M212 196 L268 84 L284 92 L228 204 Z'],
      ['k', 'M212 196 L218 212 L228 204 Z'],
    ],
    ring: '',
    lamp: [262, 64, 8],
    ln: 'M110 70 H222 M110 94 H200 M110 118 H214',
    sp: SPARK(46, 60, 6),
  },
  cooking: {
    alt: 'A recipe tablet propped beside a steaming pot',
    blob: C(160, 124, 104),
    blob2: C(270, 70, 24),
    layers: [
      ['o', R(36, 120, 120, 70, 14) + R(64, 108, 64, 14, 7)],
      ['w', R(176, 54, 110, 140, 14)],
      ['m', R(186, 64, 90, 112, 8)],
      ['k', R(216, 194, 30, 8, 4)],
    ],
    ring: ARC(231, 120, 22),
    lamp: LAMP(231, 120, 22, 6),
    ln: 'M36 140 H24 M156 140 H168 M70 98 c-6 -8 6 -12 0 -20 M96 94 c-6 -8 6 -12 0 -20 M122 98 c-6 -8 6 -12 0 -20 M20 200 H300',
    sp: SPARK(292, 34, 6),
  },
  presenting: {
    alt: 'A lectern facing a projector screen that shows the AwakeTab ring',
    blob: C(160, 120, 104),
    blob2: '',
    layers: [
      ['w', R(70, 26, 180, 112, 10)],
      ['m', R(80, 36, 160, 92, 6)],
      ['o', 'M110 156 H190 L180 206 H120 Z'],
      ['w2', R(104, 146, 92, 14, 4)],
    ],
    ring: ARC(160, 82, 28),
    lamp: LAMP(160, 82, 28),
    ln: 'M160 138 V146 M30 206 H290 M136 182 H164',
    sp: SPARK(280, 40, 6) + SPARK(40, 140, 5),
  },
  dashboard: {
    alt: 'A wall display with a rising chart and a plant beside it',
    blob: C(160, 118, 104),
    blob2: '',
    layers: [
      ['m', R(40, 40, 200, 128, 12)],
      ['s', R(54, 54, 80, 50, 6)],
      ['t', R(146, 54, 80, 50, 6)],
      ['o', 'M252 150 h40 l-6 50 h-28 Z'],
      ['g', 'M272 150 c-20 -10 -24 -40 -8 -56 c4 20 8 32 8 56 c0 -24 10 -44 30 -50 c4 20 -10 40 -30 50 Z'],
    ],
    ring: '',
    lamp: [222, 140, 9],
    ln: 'M140 168 V190 M110 192 H170',
    lnLight: 'M60 152 L90 128 L118 140 L150 116 L190 128',
    sp: SPARK(30, 30, 6),
  },
  nightdesk: {
    alt: 'A laptop running a long job at night, a moon in the window',
    blob: C(160, 122, 104),
    blob2: C(250, 60, 32),
    layers: [
      ['m', R(76, 70, 150, 102, 12)],
      ['w', 'M58 172 H244 L232 192 H70 Z'],
      ['v', 'M236 36 a26 26 0 1 0 30 30 a20 20 0 0 1 -30 -30 Z'],
      ['o', R(260, 150, 26, 42, 6)],
    ],
    ring: '',
    lamp: [204, 92, 8],
    ln: 'M260 160 h26',
    lnLight: 'M92 92 L102 100 L92 108 M110 110 H140 M92 126 H170 M92 144 H150',
    sp: SPARK(40, 50, 5) + SPARK(120, 40, 4),
  },
};

export interface ISceneOptions {
  width?: number | undefined;
  decorative?: boolean | undefined;
  className?: string | undefined;
}

// Inline SVG on a 320 × 240 artboard; every colour is a class that scene.css maps to the theme.
export function sceneSvg(key: TSceneKey, opts: ISceneOptions = {}): string {
  const sc = SCENES[key];
  const width = opts.width ?? 320;
  const height = Math.round(width * 0.75);
  const [lx, ly, lr] = sc.lamp;
  const n = (v: number): string => String(+v.toFixed(2));
  const a11y = opts.decorative ? 'aria-hidden="true"' : `role="img" aria-label="${sc.alt}"`;
  const cls = ['at-scene', opts.className].filter(Boolean).join(' ');
  const path = (d: string, c: string, extra = ''): string => (d ? `<path class="${c}" d="${d}"${extra}/>` : '');
  const shadow = sc.layers.map((l) => l[1]).join(' ');
  return (
    `<svg class="${cls}" width="${String(width)}" height="${String(height)}" viewBox="0 0 320 240" ${a11y} focusable="false">` +
    path(sc.blob, 'at-sc-blob') +
    path(sc.blob2, 'at-sc-blob2') +
    path(shadow, 'at-sc-shadow', ' transform="translate(6 6)"') +
    sc.layers.map(([f, d]) => path(d, `at-sc-l at-sc-${f}`)).join('') +
    path(sc.ring, 'at-sc-ring') +
    path(sc.ln, 'at-sc-ln') +
    path(sc.lnLight ?? '', 'at-sc-lnl') +
    path(sc.sp, 'at-sc-sp') +
    `<circle class="at-sc-halo" cx="${String(lx)}" cy="${String(ly)}" r="${n(lr * 2.3)}"/>` +
    `<circle class="at-sc-lamp" cx="${String(lx)}" cy="${String(ly)}" r="${String(lr)}"/>` +
    `<circle class="at-sc-hi" cx="${n(lx - lr * 0.3)}" cy="${n(ly - lr * 0.3)}" r="${n(Math.max(1.5, lr * 0.28))}"/>` +
    `</svg>`
  );
}

// Which scene a use case shows on its card and hero; anything unlisted falls back to the hero scene.
const USE_CASE_SCENE: Record<string, TSceneKey> = {
  cooking: 'cooking',
  presentations: 'presenting',
  teleprompter: 'presenting',
  classroom: 'presenting',
  'sheet-music': 'presenting',
  'video-calls': 'presenting',
  dashboards: 'dashboard',
  kiosk: 'success',
  downloads: 'history',
  'ai-agents': 'nightdesk',
  'night-clock': 'nightdesk',
  reading: 'nightdesk',
  'work-laptop': 'nightdesk',
  workouts: 'firstaction',
};

export function useCaseScene(slug: string): TSceneKey {
  return USE_CASE_SCENE[slug] ?? 'hero';
}
