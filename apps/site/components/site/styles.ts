// Type and button roles from the content-page board, phone values first, desktop from 700 px (the board's own
// split), with a 48 px gutter on tablets so the 96 px desktop gutter only applies from 1280 px.
export const pad = 'px-5 min-[700px]:px-12 xl:px-24';

export const eyebrow = 'font-mono text-[12px] font-medium tracking-[0.12em] text-lamp uppercase min-[700px]:text-[13px]';

export const h1 =
  'm-0 text-[40px] leading-[1.02] font-extrabold tracking-[-0.04em] text-balance min-[700px]:text-[80px]';
export const h1Art = 'min-[700px]:text-[72px]';

export const lead = 'm-0 max-w-[640px] text-[17px] leading-normal text-muted-foreground-strong min-[700px]:text-[21px]';

export const h2 = 'm-0 text-[28px] leading-[1.1] font-extrabold tracking-[-0.03em] min-[700px]:text-[40px]';

export const sub = 'm-0 text-[15px] text-muted-foreground-strong';

export const h3 = 'text-left text-[20px] leading-[1.2] font-bold tracking-[-0.02em] min-[700px]:text-[22px]';

export const h3Prose = 'm-0 text-[22px] font-bold tracking-[-0.02em] min-[700px]:text-[26px]';

export const body = 'text-left text-[15px] leading-[1.55] text-muted-foreground-strong min-[700px]:text-[16px]';

// Use with <Button> (default size): the board's 44 px button has a 12 px radius and 15 px label.
export const btn = 'rounded-[12px] px-[18px] text-[15px]';

// Use with <Button size="cta">: 54 px and full width on phones, 60 px from 700 px.
export const btnXl = 'h-[54px] w-full px-5 min-[700px]:h-15 min-[700px]:w-auto min-[700px]:px-[26px]';

// Use with <Button variant="outline" size="cta">.
export const btnOutXl = 'h-[54px] w-full px-[22px] font-semibold min-[700px]:h-15 min-[700px]:w-auto';

export const grid: Record<1 | 2 | 3 | 4, string> = {
  1: 'grid grid-cols-1 gap-[14px] min-[700px]:gap-5',
  2: 'grid grid-cols-1 gap-[14px] min-[700px]:grid-cols-2 min-[700px]:gap-5',
  3: 'grid grid-cols-1 gap-[14px] min-[700px]:grid-cols-2 min-[700px]:gap-5 lg:grid-cols-3',
  4: 'grid grid-cols-1 gap-[14px] min-[700px]:grid-cols-2 min-[700px]:gap-5 xl:grid-cols-4',
};
