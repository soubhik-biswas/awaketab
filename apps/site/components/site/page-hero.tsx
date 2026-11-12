import { Fragment } from 'react';
import { Play } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import type { TSceneKey } from '@/lib/content';
import { cn } from '@/lib/utils';
import { Scene } from '@/components/scene/scene';
import { Accented } from './accent';
import { Arrive } from './arrive';
import * as s from './styles';

export interface ICrumb {
  href?: string;
  label: string;
}

function Crumbs({ items, label }: { items: readonly ICrumb[]; label: string }) {
  return (
    <Breadcrumb aria-label={label}>
      <BreadcrumbList className="gap-2 text-[14px] text-muted-foreground-strong sm:gap-2">
        {items.map((c, i) => (
          <Fragment key={i}>
            {i > 0 && (
              <BreadcrumbSeparator className="text-muted-foreground-strong">
                <span>/</span>
              </BreadcrumbSeparator>
            )}
            <BreadcrumbItem className="gap-2">
              {i === items.length - 1 ? (
                <BreadcrumbPage className="text-foreground">{c.label}</BreadcrumbPage>
              ) : c.href ? (
                <BreadcrumbLink
                  href={c.href}
                  className="text-muted-foreground-strong underline-offset-2 hover:underline"
                >
                  {c.label}
                </BreadcrumbLink>
              ) : (
                <span>{c.label}</span>
              )}
            </BreadcrumbItem>
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

export interface IHeroAction {
  href?: string;
  label: string;
}

export function HeroButtons({ primary, secondary }: { primary?: IHeroAction; secondary?: IHeroAction }) {
  if (!primary && !secondary) return null;
  return (
    <div className="flex w-full flex-wrap gap-2.5 min-[700px]:w-auto">
      {primary && (
        <Button asChild size="cta" className={s.btnXl}>
          <a href={primary.href}>
            <Play className="size-5" aria-hidden="true" />
            {primary.label}
          </a>
        </Button>
      )}
      {secondary && (
        <Button asChild variant="outline" size="cta" className={s.btnOutXl}>
          <a href={secondary.href}>{secondary.label}</a>
        </Button>
      )}
    </div>
  );
}

// The hero of every content and system page: a row from tablet landscape up, stacked below that.
export function PageHero({
  crumbs,
  crumbLabel = 'Breadcrumb',
  eyebrow,
  kicker,
  h1,
  h1Class,
  accent,
  lead,
  meta,
  actions,
  scene,
  sceneLabel,
  face,
  children,
}: {
  crumbs?: readonly ICrumb[];
  crumbLabel?: string;
  eyebrow?: string;
  kicker?: ReactNode;
  h1: ReactNode;
  h1Class?: string;
  accent?: string;
  lead?: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
  scene?: TSceneKey;
  sceneLabel?: string;
  face?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <section
      className={cn(
        'flex flex-col items-center gap-5 min-[700px]:items-start min-[700px]:gap-9 min-[1100px]:flex-row min-[1100px]:items-center min-[1100px]:gap-14',
        s.pad,
      )}
    >
      <div className="flex min-w-0 flex-1 flex-col items-start gap-[14px] self-stretch min-[700px]:gap-5 min-[1100px]:self-auto">
        {crumbs && crumbs.length > 0 && <Crumbs items={crumbs} label={crumbLabel} />}
        {kicker ?? (eyebrow && <span className={s.eyebrow}>{eyebrow}</span>)}
        <h1 className={cn(s.h1, scene && s.h1Art, h1Class)}>
          {typeof h1 === 'string' ? <Accented text={h1} {...(accent ? { accent } : {})} /> : h1}
        </h1>
        {lead && <p className={cn(s.lead, 'site-prose')}>{lead}</p>}
        {meta && <div className={cn('flex flex-wrap items-center gap-x-4 gap-y-1', s.meta)}>{meta}</div>}
        {actions}
        {children}
      </div>
      {face && (
        <Arrive className="flex flex-none justify-center rounded-[36px] border border-border bg-card p-3 shadow-[0_24px_60px_var(--site-lift)] min-[700px]:self-center min-[1100px]:self-auto">
          {face}
        </Arrive>
      )}
      {scene && (
        <Arrive className="flex-none min-[700px]:self-center min-[1100px]:self-auto">
          <Scene
            scene={scene}
            width={600}
            {...(sceneLabel ? { label: sceneLabel } : { decorative: true })}
            className="site-float h-auto w-[350px] max-w-full min-[700px]:w-[600px] min-[1100px]:w-[440px] min-[1300px]:w-[520px]"
          />
        </Arrive>
      )}
    </section>
  );
}
