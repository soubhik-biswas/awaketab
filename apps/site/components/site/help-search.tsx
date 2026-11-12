'use client';

import { Search } from 'lucide-react';
import { Fragment, useId, useState } from 'react';

export interface IHelpEntry {
  title: string;
  href: string;
  words: string;
}

// The help centre search: topics filter as you type, and the line under the field names the matches.
export function HelpSearch({
  topics,
  chips,
  labels,
}: {
  topics: readonly IHelpEntry[];
  chips: ReadonlyArray<readonly [string, string]>;
  labels: { search: string; placeholder: string; chips: string; idle: string; one: string; many: string; none: string };
}) {
  const [q, setQ] = useState('');
  const id = useId();
  const query = q.trim().toLowerCase();
  const hits = query ? topics.filter((t) => `${t.title} ${t.words}`.toLowerCase().includes(query)) : [];
  const count = !query
    ? labels.idle
    : (hits.length === 0 ? labels.none : hits.length === 1 ? labels.one : labels.many)
        .replace('{n}', String(hits.length))
        .replace('{q}', q.trim());
  return (
    <div className="flex max-w-[760px] flex-col gap-[14px]">
      <label
        htmlFor={id}
        className="flex items-center gap-2.5 rounded-2xl border border-[var(--site-strong-line)] bg-[var(--site-search)] px-[18px] text-muted-foreground-strong focus-within:outline-2 focus-within:outline-offset-3 focus-within:outline-ring"
      >
        <Search className="size-[22px] flex-none" strokeWidth={2} aria-hidden="true" />
        <span className="sr-only">{labels.search}</span>
        <input
          id={id}
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={labels.placeholder}
          aria-describedby={`${id}-count`}
          className="h-[58px] min-w-0 flex-1 border-0 bg-transparent px-0.5 text-[18px] text-foreground outline-none placeholder:text-muted-foreground"
        />
      </label>
      <nav aria-label={labels.chips} className="flex flex-wrap gap-2">
        {chips.map(([label, href]) => (
          <a
            key={href}
            href={href}
            className="inline-flex h-11 items-center rounded-full border border-border bg-secondary px-4 text-[15px] font-semibold text-foreground no-underline hover:bg-surface-3"
          >
            {label}
          </a>
        ))}
      </nav>
      <p id={`${id}-count`} aria-live="polite" className="m-0 text-[14px] leading-[1.55] text-muted-foreground-strong">
        {count}
        {hits.length > 0 && ': '}
        {hits.slice(0, 3).map((h, i) => (
          <Fragment key={h.href}>
            {i > 0 && ' · '}
            <a href={h.href} className="font-semibold text-lamp underline underline-offset-[3px]">
              {h.title}
            </a>
          </Fragment>
        ))}
      </p>
    </div>
  );
}
