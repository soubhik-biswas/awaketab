'use client';

import { Check, Copy } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import type { TToken } from '@/lib/markdown';
import { cn } from '@/lib/utils';

const TOKEN: Record<TToken[0], string> = {
  kw: 'text-ended',
  fn: 'text-info',
  id: 'text-foreground',
  str: 'text-lamp',
  com: 'text-muted-foreground',
  pun: 'text-muted-foreground-strong',
  tag: 'text-info',
  attr: 'text-warning',
};

// Copy puts the block on the clipboard and says "Copied" for 2 s.
export function CodeBlock({
  file,
  lines,
  copy,
  copied,
  copyLabel,
  scrollLabel,
}: {
  file: string;
  lines: TToken[][];
  copy: string;
  copied: string;
  copyLabel: string;
  scrollLabel: string;
}) {
  const [done, setDone] = useState(false);
  const timer = useRef(0);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const onCopy = () => {
    const text = lines.map((l) => l.map(([, t]) => t).join('')).join('\n');
    void navigator.clipboard.writeText(text).then(() => {
      setDone(true);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setDone(false), 2000);
    });
  };
  return (
    <div className="max-w-[900px] overflow-hidden rounded-[20px] border border-border bg-card">
      <div className="flex items-center justify-between gap-3 border-b border-border bg-secondary py-1 pr-2 pl-5">
        <code className="font-mono text-[13px] text-muted-foreground-strong">{file}</code>
        <Button
          variant={null}
          size={null}
          onClick={onCopy}
          aria-label={copyLabel}
          className="h-11 gap-1.5 rounded-[10px] border-0 bg-transparent px-3 text-[14px] font-semibold text-foreground hover:bg-surface-3"
        >
          {done ? <Check className="size-4" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
          <span aria-live="polite">{done ? copied : copy}</span>
        </Button>
      </div>
      <div role="region" tabIndex={0} aria-label={scrollLabel} className="overflow-x-auto">
        <pre className="m-0 px-5 py-4 font-mono text-[14px] leading-[1.6]">
          {lines.map((toks, i) => (
            <span key={i} className="block">
              <code>
                {toks.map(([kind, text], k) => (
                  <span key={k} className={cn(TOKEN[kind])}>
                    {text}
                  </span>
                ))}
                {toks.length === 0 ? ' ' : null}
              </code>
            </span>
          ))}
        </pre>
      </div>
    </div>
  );
}
