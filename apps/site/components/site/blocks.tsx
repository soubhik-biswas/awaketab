import {
  ArrowRight,
  Ban,
  Check,
  CircleCheck,
  CircleDashed,
  CirclePause,
  Info,
  Minus,
  Play,
  TriangleAlert,
  type LucideIcon,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import type { TSceneKey } from '@/lib/content';
import { cn } from '@/lib/utils';
import { Scene } from '@/components/scene/scene';
import * as s from './styles';

export function Block({
  id,
  h,
  sub,
  label,
  children,
  className,
}: {
  id?: string;
  h?: string;
  sub?: string;
  label?: string;
  children: ReactNode;
  className?: string;
}) {
  const headId = id && h ? `${id}-h` : undefined;
  return (
    <section
      id={id}
      aria-labelledby={headId}
      aria-label={headId ? undefined : (label ?? h)}
      className={cn('flex scroll-mt-6 flex-col gap-[14px] min-[700px]:gap-5', s.pad, className)}
    >
      {h && (
        <h2 id={headId} className={s.h2}>
          {h}
        </h2>
      )}
      {sub && <p className={s.sub}>{sub}</p>}
      {children}
    </section>
  );
}

export interface ICard {
  href: string;
  title: string;
  desc?: string;
  link: string;
  scene?: TSceneKey;
  meta?: readonly string[];
  lang?: string;
}

export function Cards({ items, cols }: { items: readonly ICard[]; cols: 1 | 2 | 3 | 4 }) {
  return (
    <ul role="list" className={cn(s.grid[cols], 'm-0 list-none p-0')}>
      {items.map((card) => (
        <li key={card.href} className="flex">
          <a
            href={card.href}
            hrefLang={card.lang}
            className="group flex flex-1 flex-col items-stretch overflow-hidden rounded-[24px] border border-border bg-card text-left text-foreground no-underline transition-shadow duration-fast ease-glide hover:shadow-e2"
          >
            {card.scene && (
              <span className={s.artWell}>
                <Scene
                  scene={card.scene}
                  width={300}
                  decorative
                  className="h-auto w-[300px] max-w-full min-[700px]:w-[260px]"
                />
              </span>
            )}
            <span className="flex flex-1 flex-col gap-2 px-5 pt-[18px] pb-5">
              {card.meta && card.meta.length > 0 && (
                <span className="flex flex-wrap gap-1.5">
                  {card.meta.map((m) => (
                    <span
                      key={m}
                      className="rounded-full bg-secondary px-2.5 py-[3px] text-[12px] font-semibold text-muted-foreground-strong"
                    >
                      {m}
                    </span>
                  ))}
                </span>
              )}
              <strong className={s.h3}>{card.title}</strong>
              {card.desc && <span className={s.body}>{card.desc}</span>}
              <span className="mt-auto inline-flex min-h-8 items-center gap-1.5 text-[15px] font-semibold text-lamp">
                {card.link}
                <ArrowRight
                  className="size-4 transition-transform duration-fast ease-glide group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </span>
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
}

const STEP_SCENES: readonly TSceneKey[] = ['firstaction', 'hero', 'success'];

export interface IStep {
  title: ReactNode;
  body: ReactNode;
  scene?: TSceneKey;
}

// Step cards carry a scene above the number; without one they take the board's first-action, hero, success turn.
export function Steps({ items }: { items: readonly IStep[] }) {
  const n = Math.min(Math.max(items.length, 1), 4) as 1 | 2 | 3 | 4;
  return (
    <ol className={cn(s.grid[n], 'm-0 list-none p-0')}>
      {items.map((item, i) => (
        <li key={i} className="flex flex-col overflow-hidden rounded-[24px] border border-border bg-card">
          <div className={s.artWell}>
            <Scene
              scene={item.scene ?? STEP_SCENES[i % STEP_SCENES.length] ?? 'hero'}
              width={280}
              decorative
              className="h-auto w-[280px] max-w-full min-[700px]:w-[240px]"
            />
          </div>
          <div className="flex flex-1 flex-col gap-2.5 px-[22px] pt-5 pb-6">
            <span
              aria-hidden="true"
              className={cn(
                s.display,
                'inline-flex size-10 items-center justify-center rounded-full bg-lamp text-[20px] font-extrabold text-lamp-foreground',
              )}
            >
              {i + 1}
            </span>
            <strong className={s.h3}>{item.title}</strong>
            <span className={s.body}>{item.body}</span>
          </div>
        </li>
      ))}
    </ol>
  );
}

type TStatusKind = 'yes' | 'fallback' | 'no' | 'paused' | 'blocked' | 'untested';

export type TCell =
  { kind: TStatusKind; text: string } | { kind: 'text'; text: ReactNode; bold?: boolean; html?: string };

const CELL_ICON: Record<TStatusKind, LucideIcon> = {
  yes: CircleCheck,
  fallback: Play,
  no: Minus,
  paused: CirclePause,
  blocked: Ban,
  untested: CircleDashed,
};
const CELL_TONE: Record<TStatusKind, string> = {
  yes: 'font-semibold text-lamp',
  fallback: 'font-semibold text-warning',
  no: 'text-muted-foreground-strong',
  paused: 'font-semibold text-warning',
  blocked: 'font-semibold text-destructive',
  untested: 'text-muted-foreground-strong',
};

export const yes = (text: string): TCell => ({ kind: 'yes', text });
export const fallbackCell = (text: string): TCell => ({ kind: 'fallback', text });
export const no = (text: string): TCell => ({ kind: 'no', text });
export const tx = (text: ReactNode, bold = false): TCell => ({ kind: 'text', text, bold });
export const status = (kind: TStatusKind, text: string): TCell => ({ kind, text });
export const html = (markup: string, bold = false): TCell => ({ kind: 'text', text: null, html: markup, bold });

function CellBody({ cell, prefix }: { cell: TCell; prefix?: string }) {
  const lead = prefix ? <span className="min-[700px]:hidden">{prefix}: </span> : null;
  if (cell.kind === 'text') {
    if (cell.html)
      return (
        <span>
          {lead}
          <span dangerouslySetInnerHTML={{ __html: cell.html }} />
        </span>
      );
    return (
      <span>
        {lead}
        {cell.text}
      </span>
    );
  }
  const Icon = CELL_ICON[cell.kind];
  return (
    <>
      <Icon className="size-4 flex-none" strokeWidth={2.25} aria-hidden="true" />
      <span>
        {lead}
        {cell.text}
      </span>
    </>
  );
}

// Columns collapse into stacked rows on phones, each value led by its column name.
export function DataTable({
  label,
  cols,
  rows,
  template,
}: {
  label: string;
  cols: readonly string[];
  rows: ReadonlyArray<readonly TCell[]>;
  template: string;
}) {
  return (
    <div
      role="table"
      aria-label={label}
      className="overflow-hidden rounded-[20px] border border-border bg-card"
      style={{ ['--tmpl' as string]: template }}
    >
      <div role="rowgroup" className="hidden min-[700px]:block">
        <div role="row" className="grid grid-cols-[var(--tmpl)] gap-4 bg-secondary px-5 py-3">
          {cols.map((col, i) => (
            <span
              key={i}
              role="columnheader"
              className="font-mono text-[12px] tracking-[0.08em] text-muted-foreground-strong uppercase"
            >
              {col}
            </span>
          ))}
        </div>
      </div>
      <div role="rowgroup">
        {rows.map((row, r) => (
          <div
            key={r}
            role="row"
            className="grid grid-cols-1 items-center gap-1 border-t border-border px-[14px] py-3 min-[700px]:grid-cols-[var(--tmpl)] min-[700px]:gap-4 min-[700px]:px-5 min-[700px]:py-[14px]"
          >
            {row.map((cell, c) => (
              <span
                key={c}
                role={c === 0 ? 'rowheader' : 'cell'}
                className={cn(
                  'flex items-center gap-2 text-[15px]',
                  cell.kind === 'text' ? ['leading-[1.45]', cell.bold && 'font-bold'] : CELL_TONE[cell.kind],
                )}
              >
                <CellBody cell={cell} prefix={c > 0 ? cols[c] : undefined} />
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export type TTone = 'info' | 'warning' | 'lamp';

const TONE: Record<TTone, { box: string; tile: string; fg: string; icon: LucideIcon }> = {
  info: { box: 'site-callout-info', tile: 'bg-info-soft border-info/25', fg: 'text-info', icon: Info },
  warning: {
    box: 'site-callout-warning',
    tile: 'bg-warning-soft border-warning/25',
    fg: 'text-warning',
    icon: TriangleAlert,
  },
  lamp: { box: 'site-callout-lamp', tile: 'bg-accent border-lamp/25', fg: 'text-lamp', icon: CircleCheck },
};

// The callout card: a tinted corner glow on the surface, the tone's icon in a soft tile, an Archivo title.
export function Callout({
  tone,
  title,
  children,
  id,
  as: Tag = 'div',
}: {
  tone: TTone;
  title: ReactNode;
  children: ReactNode;
  id?: string;
  as?: 'div' | 'aside';
}) {
  const look = TONE[tone];
  const Icon = look.icon;
  return (
    <Tag
      id={id}
      role="note"
      className={cn(
        'site-callout relative flex items-start gap-[14px] overflow-hidden rounded-[24px] border border-border p-5 min-[700px]:items-center min-[700px]:gap-[22px] min-[700px]:px-8 min-[700px]:py-7',
        look.box,
      )}
    >
      <span
        className={cn(
          'flex size-11 flex-none items-center justify-center rounded-[14px] border min-[700px]:size-14 min-[700px]:rounded-[18px]',
          look.tile,
        )}
      >
        <Icon className={cn('size-[26px]', look.fg)} strokeWidth={1.75} aria-hidden="true" />
      </span>
      <span className="flex min-w-0 flex-col gap-1.5">
        <strong
          className={cn(
            s.display,
            'text-[20px] leading-[1.15] font-extrabold tracking-[-0.02em] min-[700px]:text-[24px]',
          )}
        >
          {title}
        </strong>
        <span className="site-prose text-[16px] leading-[1.55] text-muted-foreground-strong min-[700px]:text-[18px]">
          {children}
        </span>
      </span>
    </Tag>
  );
}

export function Faq({ items }: { items: ReadonlyArray<{ q: string; a: ReactNode }> }) {
  return (
    <Accordion type="multiple" defaultValue={items.map((_, i) => String(i))} className="flex flex-col">
      {items.map((item, i) => (
        <AccordionItem
          key={i}
          value={String(i)}
          className="flex max-w-[900px] flex-col gap-2 border-b border-border py-[18px] last:border-b"
        >
          <AccordionTrigger className="items-center gap-3 rounded-[10px] py-0 text-[17px] font-bold text-foreground hover:no-underline focus-visible:ring-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring [&>svg]:size-5 [&>svg]:translate-y-0 [&>svg]:text-muted-foreground-strong [&[data-state=closed]>svg]:-rotate-90 [&[data-state=open]>svg]:rotate-0">
            {item.q}
          </AccordionTrigger>
          <AccordionContent className={cn(s.body, 'site-prose pb-0')}>{item.a}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

export interface IProseItem {
  h?: string;
  id?: string;
  p?: ReactNode;
  list?: readonly ReactNode[];
  html?: string;
  children?: ReactNode;
}

export function Prose({ items, level = 3 }: { items: readonly IProseItem[]; level?: 2 | 3 }) {
  const H = level === 2 ? 'h2' : 'h3';
  return (
    <div className="site-prose flex max-w-[760px] flex-col gap-[26px]">
      {items.map((item, i) => (
        <div key={i} className="flex scroll-mt-6 flex-col gap-2" id={item.id}>
          {item.h && <H className={s.h3Prose}>{item.h}</H>}
          {item.p && <p className={s.proseP}>{item.p}</p>}
          {item.children}
          {item.list && (
            <ul className={s.proseList}>
              {item.list.map((li, k) => (
                <li key={k}>{li}</li>
              ))}
            </ul>
          )}
          {item.html && (
            <div
              className="flex flex-col gap-4 text-[17px] leading-[1.7] min-[700px]:text-[18px]"
              dangerouslySetInnerHTML={{ __html: item.html }}
            />
          )}
        </div>
      ))}
    </div>
  );
}

export function Note({ children }: { children: ReactNode }) {
  return (
    <p className="m-0 max-w-[760px] border-t border-border pt-3 text-[14px] leading-[1.55] text-muted-foreground-strong">
      {children}
    </p>
  );
}

// The closing band is midnight in every theme: volt and violet glows on #0B1020 with the dark-theme act button.
export function Cta({ title, desc, href, label }: { title: string; desc: string; href: string; label: string }) {
  return (
    <div className="site-cta flex flex-col items-stretch justify-between gap-5 rounded-[28px] p-6 text-[var(--site-night-ink)] min-[700px]:items-start min-[700px]:p-10 min-[1100px]:flex-row min-[1100px]:items-center">
      <span className="flex flex-col gap-2">
        <strong
          className={cn(
            s.display,
            'text-[32px] leading-[1.04] font-extrabold tracking-[-0.035em] text-balance min-[700px]:text-[40px] min-[1100px]:text-[48px]',
          )}
        >
          {title}
        </strong>
        <span className="text-[16px] text-[var(--site-night-muted)]">{desc}</span>
      </span>
      <Button
        asChild
        size="cta"
        className="border-[var(--site-cta-button)] bg-[var(--site-cta-button)] text-[var(--site-cta-button-ink)] shadow-[0_12px_30px_var(--site-cta-button-glow)] hover:border-[var(--site-cta-button)] hover:bg-[var(--site-cta-button)] hover:opacity-90"
      >
        <a href={href}>
          <Play className="size-5" aria-hidden="true" />
          {label}
        </a>
      </Button>
    </div>
  );
}

export interface IRelease {
  id: string;
  tag: string;
  tone: 'new' | 'fixed' | 'changed';
  meta: string;
  title: string;
  items: readonly string[];
}

const TAG = {
  new: 'bg-accent text-lamp',
  fixed: 'bg-info-soft text-info',
  changed: 'bg-secondary text-foreground',
} as const;

export function Releases({ items }: { items: readonly IRelease[] }) {
  return (
    <div className="flex max-w-[900px] flex-col gap-[18px]">
      {items.map((r) => (
        <article
          key={r.id}
          aria-labelledby={`rel-${r.id}`}
          className="flex flex-col gap-2.5 rounded-[20px] border border-border bg-card px-6 py-[22px]"
        >
          <span className="flex flex-wrap items-center gap-2.5">
            <span className={cn('rounded-full px-2.5 py-[3px] text-[12px] font-bold', TAG[r.tone])}>{r.tag}</span>
            <span className="font-mono text-[13px] text-muted-foreground-strong">{r.meta}</span>
          </span>
          <h3 id={`rel-${r.id}`} className={cn(s.h3, 'm-0')}>
            {r.title}
          </h3>
          <ul className="site-prose m-0 flex flex-col gap-2 pl-[22px] text-[16px] leading-[1.65]">
            {r.items.map((markup, i) => (
              <li key={i} dangerouslySetInnerHTML={{ __html: markup }} />
            ))}
          </ul>
        </article>
      ))}
    </div>
  );
}

export interface IPlan {
  title: string;
  price: string;
  desc: string;
  features: readonly string[];
  action: ReactNode;
  badge?: string;
  featured?: boolean;
}

// The plan cards of the Pro page: the featured one has the act-coloured 2 px border and its glow.
export function Plans({ items }: { items: readonly IPlan[] }) {
  return (
    <div className={s.grid[2]}>
      {items.map((p) => (
        <div
          key={p.title}
          className={cn(
            'flex flex-col gap-[14px] rounded-[24px] bg-card',
            p.featured
              ? 'border-2 border-primary p-[26px] shadow-[0_20px_50px_var(--site-pro-glow)]'
              : 'border border-border p-[26px]',
          )}
        >
          <span className="flex items-center justify-between">
            <strong className={s.h3}>{p.title}</strong>
            {p.badge && (
              <span className="rounded-full bg-primary-soft px-2.5 py-[3px] text-[13px] font-bold text-primary">
                {p.badge}
              </span>
            )}
          </span>
          <span className={cn(s.display, 'text-[34px] font-extrabold tracking-[-0.03em] min-[700px]:text-[44px]')}>
            {p.price}
          </span>
          <span className={s.body}>{p.desc}</span>
          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {p.features.map((f) => (
              <li key={f} className="flex items-start gap-2.5 text-[15px] leading-[1.45]">
                <Check className="mt-0.5 size-[18px] flex-none text-lamp" strokeWidth={2.25} aria-hidden="true" />
                {f}
              </li>
            ))}
          </ul>
          {p.action}
        </div>
      ))}
    </div>
  );
}
