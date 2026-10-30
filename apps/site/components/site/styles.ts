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

export const btn =
  'inline-flex h-11 items-center justify-center gap-2 rounded-[12px] border px-[18px] text-[15px] font-semibold whitespace-nowrap no-underline shadow-none';

export const btnXl =
  'h-[54px] w-full gap-2 rounded-[18px] border border-primary bg-primary px-5 text-[17px] font-bold text-primary-foreground shadow-[0_12px_30px_var(--site-act-glow)] hover:bg-primary/90 min-[700px]:h-[60px] min-[700px]:w-auto min-[700px]:px-[26px] [&_svg]:size-5';

export const btnOutXl =
  'h-[54px] w-full rounded-[18px] border border-input bg-transparent px-[22px] text-[17px] font-semibold text-foreground shadow-none hover:bg-secondary min-[700px]:h-[60px] min-[700px]:w-auto';

export const linkBtn =
  'min-h-11 bg-transparent px-1 text-[15px] font-bold text-lamp underline underline-offset-[3px] hover:bg-transparent';

export const grid: Record<1 | 2 | 3 | 4, string> = {
  1: 'grid grid-cols-1 gap-[14px] min-[700px]:gap-5',
  2: 'grid grid-cols-1 gap-[14px] min-[700px]:grid-cols-2 min-[700px]:gap-5',
  3: 'grid grid-cols-1 gap-[14px] min-[700px]:grid-cols-2 min-[700px]:gap-5 lg:grid-cols-3',
  4: 'grid grid-cols-1 gap-[14px] min-[700px]:grid-cols-2 min-[700px]:gap-5 xl:grid-cols-4',
};
