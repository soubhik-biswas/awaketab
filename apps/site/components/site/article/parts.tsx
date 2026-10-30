import { ArrowDown, ArrowRight } from 'lucide-react';
import type { ReactNode } from 'react';
import type { TArticle } from '@/lib/content';
import { inline, splitArticle, tokenize, type ISection } from '@/lib/markdown';
import { cn } from '@/lib/utils';
import { StatusPill, type TPillState } from '../_pending/status-pill';
import { Block, Callout, DataTable, html, Steps, status, tx, type TCell } from '../blocks';
import * as s from '../styles';
import { Checklist } from './checklist';
import { CodeBlock } from './code-block';
import { TrackedSteps } from './tracked-steps';

type TT = (key: string, values?: Record<string, string | number>) => string;
type TLock = 'idle' | 'requesting' | 'held' | 'lost' | 'denied' | 'unsupported' | 'fallback';

const LOCK_PILL: Record<TLock, TPillState> = {
  idle: 'idle',
  requesting: 'starting',
  held: 'awake',
  lost: 'paused',
  denied: 'blocked',
  unsupported: 'unsupported',
  fallback: 'fallback',
};

const RESULT: Record<string, Parameters<typeof status>[0]> = {
  works: 'yes',
  pauses: 'paused',
  blocked: 'blocked',
  fallback: 'fallback',
  no: 'no',
  untested: 'untested',
};

function Rows({ rows }: { rows: NonNullable<TArticle['rows']>[string] }) {
  return (
    <ul className="m-0 flex max-w-[900px] list-none flex-col overflow-hidden rounded-[20px] border border-border bg-card p-0">
      {rows.map((row, i) =>
        row.value !== undefined ? (
          <li key={i} className="flex items-center justify-between gap-4 border-t border-border px-5 py-[14px] first:border-t-0">
            <span className="site-prose text-[15px] font-bold" dangerouslySetInnerHTML={{ __html: inline(row.title) }} />
            <span className="text-[15px] text-muted-foreground-strong">{row.value}</span>
          </li>
        ) : (
          <li key={i} className="flex flex-col gap-1 border-t border-border px-5 py-4 first:border-t-0">
            <strong className="site-prose text-[17px]" dangerouslySetInnerHTML={{ __html: inline(row.title) }} />
            {row.text && <span className={cn(s.body, 'site-prose')} dangerouslySetInnerHTML={{ __html: inline(row.text) }} />}
            {row.link && (
              <a href={row.link.href} className="text-[15px] font-semibold text-lamp underline underline-offset-[3px]">
                {row.link.label}
              </a>
            )}
          </li>
        ),
      )}
    </ul>
  );
}

function Picks({ picks }: { picks: NonNullable<TArticle['picks']>[string] }) {
  return (
    <ol className="m-0 flex max-w-[900px] list-none flex-col gap-3 p-0">
      {picks.map((pick, i) => (
        <li key={i} className="flex gap-4 rounded-[22px] border border-border bg-card p-[22px]">
          <span
            aria-hidden="true"
            className="inline-flex size-10 flex-none items-center justify-center rounded-full bg-lamp text-[20px] font-extrabold text-lamp-foreground"
          >
            {i + 1}
          </span>
          <span className="flex flex-col gap-1.5">
            <strong className={s.h3} dangerouslySetInnerHTML={{ __html: inline(pick.title) }} />
            <span className={cn(s.body, 'site-prose')} dangerouslySetInnerHTML={{ __html: inline(pick.text) }} />
          </span>
        </li>
      ))}
    </ol>
  );
}

function PillStates({ pills, t }: { pills: NonNullable<TArticle['pills']>; t: TT }) {
  return (
    <dl className="m-0 flex max-w-[900px] flex-col overflow-hidden rounded-[20px] border border-border bg-card">
      {pills.map((row, i) => (
        <div
          key={i}
          className="flex flex-col gap-2 border-t border-border px-5 py-4 first:border-t-0 min-[700px]:flex-row min-[700px]:items-center min-[700px]:gap-5"
        >
          <dt className="min-[700px]:w-[260px] min-[700px]:flex-none">
            <StatusPill state={LOCK_PILL[row.state]} label={pillLabel(t, row.state)} />
          </dt>
          <dd className={cn(s.body, 'site-prose m-0')} dangerouslySetInnerHTML={{ __html: inline(row.text) }} />
        </div>
      ))}
    </dl>
  );
}

const pillLabel = (t: TT, state: TLock): string => (state === 'idle' ? t('pill.idle._') : t(`pill.${state}`));

function Lifecycle({ data, t }: { data: NonNullable<TArticle['lifecycle']>; t: TT }) {
  const pill = (state: TLock) => <StatusPill state={LOCK_PILL[state]} label={pillLabel(t, state)} />;
  const edge = (text: string, mono = false) => (
    <span className="inline-flex items-center gap-1.5 text-[14px] text-muted-foreground-strong">
      <ArrowRight className="hidden size-4 min-[700px]:inline" aria-hidden="true" />
      <ArrowDown className="size-4 min-[700px]:hidden" aria-hidden="true" />
      <span className={mono ? 'font-mono' : undefined}>{text}</span>
    </span>
  );
  const chain = (...nodes: ReactNode[]) => (
    <li className="flex flex-col items-start gap-2 min-[700px]:flex-row min-[700px]:flex-wrap min-[700px]:items-center min-[700px]:gap-3">
      {nodes.map((node, i) => (
        <span key={i}>{node}</span>
      ))}
    </li>
  );
  return (
    <figure className="m-0 flex max-w-[900px] flex-col gap-4 rounded-[22px] border border-border bg-card p-[22px]">
      <strong className={s.h3}>{data.title}</strong>
      <p className="sr-only">{data.desc}</p>
      <ol className="m-0 flex list-none flex-col gap-4 p-0">
        {chain(pill('idle'), edge('request()', true), pill('requesting'), edge(data.edges.granted), pill('held'))}
        {chain(pill('held'), edge(data.edges.hidden), pill('lost'), edge(data.edges.visible), pill('requesting'))}
      </ol>
      <span className="font-mono text-[12px] tracking-[0.1em] text-muted-foreground-strong uppercase">{data.others}</span>
      <ol className="m-0 flex list-none flex-col gap-4 p-0">
        {chain(pill('requesting'), edge('NotAllowedError', true), pill('denied'))}
        {chain(pill('idle'), edge(data.edges.noApi), pill('unsupported'), edge(data.edges.tap), pill('fallback'))}
        {chain(pill('held'), edge('release()', true), pill('idle'))}
      </ol>
      <figcaption className="text-[14px] text-muted-foreground-strong">{data.caption}</figcaption>
    </figure>
  );
}

function Figures({ figures }: { figures: NonNullable<TArticle['figures']> }) {
  const shown = figures.filter((f) => f.src);
  if (shown.length === 0) return null;
  return (
    <div className="grid grid-cols-1 gap-5 min-[700px]:grid-cols-2">
      {shown.map((fig, i) => (
        <figure key={i} className="m-0 flex flex-col gap-2">
          <img
            src={fig.src}
            width={fig.width}
            height={fig.height}
            alt={fig.alt}
            loading="lazy"
            decoding="async"
            className="h-auto w-full rounded-[20px] border border-border"
          />
          <figcaption className="text-[14px] text-muted-foreground-strong">{fig.caption}</figcaption>
        </figure>
      ))}
    </div>
  );
}

function ArticleSteps({ a, t }: { a: TArticle; t: TT }) {
  const steps = a.steps ?? [];
  if (steps.some((st) => st.shot)) {
    return (
      <ol className="m-0 flex max-w-[900px] list-none flex-col gap-4 p-0">
        {steps.map((st, i) => (
          <li
            key={i}
            id={`step-${String(i + 1)}`}
            className="grid grid-cols-1 gap-4 rounded-[22px] border border-border bg-card p-[22px] min-[700px]:grid-cols-[1fr_auto]"
          >
            <div className="flex flex-col gap-2">
              <span
                aria-hidden="true"
                className="inline-flex size-10 items-center justify-center rounded-full bg-lamp text-[20px] font-extrabold text-lamp-foreground"
              >
                {i + 1}
              </span>
              <h3 className={cn(s.h3, 'm-0')}>
                <span className="sr-only">{t('step', { n: i + 1 })}: </span>
                <span dangerouslySetInnerHTML={{ __html: inline(st.title) }} />
              </h3>
              {st.path && <span className="font-mono text-[13px] text-muted-foreground-strong">{st.path}</span>}
              <p className={cn(s.body, 'site-prose m-0')} dangerouslySetInnerHTML={{ __html: inline(st.text) }} />
            </div>
            {st.shot && st.shotSrc && (
              <img
                src={st.shotSrc}
                width={st.shotWidth}
                height={st.shotHeight}
                alt={st.shot}
                loading="lazy"
                decoding="async"
                className="h-auto max-w-[280px] rounded-[16px] border border-border"
              />
            )}
          </li>
        ))}
      </ol>
    );
  }
  if (a.kind === 'guides') {
    return (
      <TrackedSteps
        steps={steps.map((st) => ({ title: inline(st.title), text: inline(st.text), ...(st.path ? { path: st.path } : {}) }))}
        {...(a.stepsDone ? { doneText: a.stepsDone } : {})}
        labels={{
          step: t('step', { n: '{n}' }),
          link: t('stepLink', { n: '{n}' }),
          next: t('nextUp'),
          done: t('done'),
          mark: t('markDone'),
          count: t('progressCount', { n: '{n}', total: '{total}' }),
          clear: t('clearProgress'),
        }}
      />
    );
  }
  return (
    <Steps
      items={steps.map((st) => ({
        title: <span dangerouslySetInnerHTML={{ __html: inline(st.title) }} />,
        body: <span className="site-prose" dangerouslySetInnerHTML={{ __html: inline(st.text) }} />,
      }))}
    />
  );
}

function Part({ a, name, arg, t, tp }: { a: TArticle; name: string; arg: string; t: TT; tp: TT }) {
  const missing = (): never => {
    throw new Error(`${a.kind}/${a.locale}/${a.enSlug}: block ::${name}${arg ? ` ${arg}` : ''} has no frontmatter data`);
  };
  switch (name) {
    case 'steps':
      return a.steps ? <ArticleSteps a={a} t={t} /> : missing();
    case 'figures':
      return a.figures ? <Figures figures={a.figures} /> : missing();
    case 'pills':
      return a.pills ? <PillStates pills={a.pills} t={tp} /> : missing();
    case 'checklist':
      return a.checklist ? (
        <Checklist items={a.checklist.map(inline)} counter={t('checked', { n: '{n}', total: a.checklist.length })} />
      ) : (
        missing()
      );
    case 'matrix': {
      const m = a.matrix ?? missing();
      const rows: TCell[][] = m.rows.map((r) => [html(inline(r.what), true), status(RESULT[r.result] ?? 'no', r.label), html(inline(r.text))]);
      return <DataTable label={m.label} cols={m.cols} rows={rows} template="1.3fr 0.9fr 1.6fr" />;
    }
    case 'rows':
      return a.rows?.[arg] ? <Rows rows={a.rows[arg]} /> : missing();
    case 'compare': {
      const c = a.compare ?? missing();
      const cols = [c.what, ...c.cols.map((col) => col.name)];
      const rows: TCell[][] = c.rows.map((r) => [
        tx(
          <>
            <span dangerouslySetInnerHTML={{ __html: inline(r.what) }} />
            {r.same && (
              <span className="ml-2 rounded-full bg-secondary px-2.5 py-[3px] text-[12px] font-semibold text-muted-foreground-strong">
                {t('same')}
              </span>
            )}
          </>,
          true,
        ),
        ...r.cells.map((cell) => html(inline(cell))),
      ]);
      const template = ['1.1fr', ...c.cols.map(() => '1fr')].join(' ');
      return <DataTable label={c.label} cols={cols} rows={rows} template={template} />;
    }
    case 'picks':
      return a.picks?.[arg] ? <Picks picks={a.picks[arg]} /> : missing();
    case 'code': {
      const code = a.code?.[arg] ?? missing();
      const lines = code.text
        .replace(/\n$/u, '')
        .split('\n')
        .map((line) => tokenize(line, code.lang));
      return (
        <CodeBlock
          file={arg}
          lines={lines}
          copy={t('copy')}
          copied={t('copied')}
          copyLabel={t('copyFile', { file: arg })}
          scrollLabel={t('codeScroll', { file: arg })}
        />
      );
    }
    case 'note': {
      const note = a.notes?.[arg] ?? missing();
      return (
        <Callout tone="lamp" title={note.kicker}>
          <span dangerouslySetInnerHTML={{ __html: inline(note.text) }} />
        </Callout>
      );
    }
    case 'lifecycle':
      return a.lifecycle ? <Lifecycle data={a.lifecycle} t={tp} /> : missing();
    default:
      return missing();
  }
}

function SectionBody({ section, a, t, tp }: { section: ISection; a: TArticle; t: TT; tp: TT }) {
  return (
    <>
      {section.parts.map((part, i) =>
        part.kind === 'html' ? (
          <div
            key={i}
            className="site-prose flex max-w-[760px] flex-col gap-4 text-[17px] leading-[1.65]"
            dangerouslySetInnerHTML={{ __html: part.html }}
          />
        ) : (
          <Part key={i} a={a} name={part.name} arg={part.arg} t={t} tp={tp} />
        ),
      )}
    </>
  );
}

// The Markdown body as board blocks: one section per h2, prose and the placed `::blocks` in page order.
export function ArticleBody({ a, t, tp }: { a: TArticle; t: TT; tp: TT }) {
  return (
    <>
      {splitArticle(a.html).map((section, i) => (
        <Block key={section.id ?? i} {...(section.id ? { id: section.id } : {})} {...(section.title ? { h: section.title } : { label: a.h1 })}>
          <SectionBody section={section} a={a} t={t} tp={tp} />
        </Block>
      ))}
    </>
  );
}
