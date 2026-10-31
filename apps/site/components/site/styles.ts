// Type and button roles from the page boards at their four tiers: phone first, tablet portrait from 700 px,
// tablet landscape from 1100 px and desktop from 1300 px.
export const pad = 'px-5 min-[700px]:px-10 min-[1100px]:px-16 min-[1300px]:px-24';

export const display = 'font-display [font-optical-sizing:auto]';

export const eyebrow =
  'font-mono text-[13px] font-medium tracking-[0.14em] text-lamp uppercase min-[700px]:text-[14px]';

export const h1 = `${display} m-0 text-[46px] leading-[.96] font-bold tracking-[-0.04em] text-balance min-[700px]:text-[68px] min-[1100px]:text-[80px] min-[1300px]:text-[96px]`;

// A hero with a scene beside it steps down one size on the two wide tiers.
export const h1Art = 'min-[1100px]:text-[68px] min-[1300px]:text-[80px]';

export const lead =
  'm-0 max-w-[680px] text-[18px] leading-normal text-pretty text-muted-foreground-strong min-[700px]:text-[22px]';

export const meta = 'text-[14px] text-muted-foreground-strong';

export const h2 = `${display} m-0 text-[32px] leading-[1.04] font-bold tracking-[-0.035em] text-balance min-[700px]:text-[42px] min-[1100px]:text-[52px]`;

export const sub = 'm-0 max-w-[720px] text-[16px] leading-normal text-muted-foreground-strong min-[700px]:text-[18px]';

export const h3 = `${display} text-left text-[21px] leading-[1.15] font-bold tracking-[-0.02em] min-[700px]:text-[24px]`;

export const h3Prose = `${display} m-0 text-[24px] font-bold tracking-[-0.02em] min-[700px]:text-[28px]`;

export const body = 'text-left text-[16px] leading-[1.55] text-muted-foreground-strong min-[700px]:text-[17px]';

export const proseP = 'm-0 text-[17px] leading-[1.7] min-[700px]:text-[18px]';

export const proseList = 'm-0 flex flex-col gap-2 pl-[22px] text-[17px] leading-[1.65] min-[700px]:text-[18px]';

// Use with <Button size="cta">: 54 px and full width on phones, 60 px from 700 px.
export const btnXl =
  'h-[54px] w-full px-5 shadow-[0_12px_30px_var(--site-act-glow)] min-[700px]:h-15 min-[700px]:w-auto min-[700px]:px-[26px]';

// Use with <Button variant="outline" size="cta">.
export const btnOutXl =
  'h-[54px] w-full border-[var(--site-strong-line)] px-[22px] font-semibold min-[700px]:h-15 min-[700px]:w-auto';

// The board's cols(n): one column on phones, at most two on tablet portrait, n from tablet landscape.
const gap = 'gap-[14px] min-[700px]:gap-5';
export const grid: Record<1 | 2 | 3 | 4, string> = {
  1: `grid grid-cols-1 ${gap}`,
  2: `grid grid-cols-1 ${gap} min-[700px]:grid-cols-2`,
  3: `grid grid-cols-1 ${gap} min-[700px]:grid-cols-2 min-[1100px]:grid-cols-3`,
  4: `grid grid-cols-1 ${gap} min-[700px]:grid-cols-2 min-[1100px]:grid-cols-4`,
};

// The art well of cards and step cards on content pages: the second surface, a deeper night in dark themes.
export const artWell = 'flex justify-center bg-[var(--site-art)] pt-[14px]';

// The home story (home board): its own side gutters, section rhythm, heads and card text.
export const story = {
  sec: `flex flex-col gap-7 min-[700px]:gap-11 ${pad}`,
  head: 'flex max-w-[900px] flex-col gap-3 min-[700px]:gap-4',
  eyebrow: 'font-mono text-[12px] tracking-[0.16em] text-lamp min-[700px]:text-[13px]',
  h2: `${display} m-0 text-[34px] leading-none font-bold tracking-[-0.04em] text-balance min-[700px]:text-[46px] min-[1100px]:text-[60px]`,
  lead: 'm-0 max-w-[680px] text-[17px] leading-[1.55] text-muted-foreground-strong min-[700px]:text-[20px]',
  cellH: `${display} text-[21px] leading-[1.15] font-bold tracking-[-0.02em] min-[700px]:text-[24px]`,
  cellD: 'text-[15px] leading-[1.55] text-muted-foreground-strong min-[700px]:text-[16px]',
  card: 'site-card relative overflow-hidden rounded-[24px] min-[700px]:rounded-[28px]',
};
