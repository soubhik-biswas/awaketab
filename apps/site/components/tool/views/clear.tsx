'use client';

import { useId } from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { toolUi } from '@/lib/tool/ui';
import { useTool } from '@/components/tool/context';
import { BTN, H3 } from '@/components/tool/kit';

const WORD = 'CLEAR';

export default function ClearView() {
  const { ui, a } = useTool();
  const id = useId();
  const text = ui.clearText;
  const ok = text === WORD;
  let matched = 0;
  for (let i = 0; i < Math.min(text.length, WORD.length); i += 1) {
    if (text[i] === WORD[i]) matched += 1;
    else break;
  }
  return (
    <div className="flex flex-col gap-3" aria-label="Clear all history">
      <strong className={H3}>Clear all history?</strong>
      <span className="text-[14px] leading-[1.5] text-muted-foreground-strong">
        Deletes every saved session on this device. Presets stay. This can’t be undone.
      </span>
      <label className="flex flex-col gap-1.5">
        <span className="text-[13px] font-semibold">Type CLEAR to confirm</span>
        <Input
          value={text}
          onChange={(e) => toolUi.set({ clearText: e.target.value })}
          placeholder={WORD}
          autoComplete="off"
          spellCheck={false}
          aria-describedby={`${id}-hint`}
          className={cn(
            'h-12 rounded-[10px] border-2 bg-field px-3 font-mono text-[16px] font-bold tracking-[.08em] text-foreground',
            ok ? 'border-lamp' : 'border-input',
          )}
        />
      </label>
      <span id={`${id}-hint`} aria-live="polite" className={cn('text-[12px] font-semibold', ok ? 'text-lamp' : 'text-muted-foreground-strong')}>
        {ok ? 'Matches — the button is now enabled.' : `Type CLEAR exactly (${matched} of 5 letters).`}
      </span>
      <div className="flex flex-wrap justify-end gap-2">
        <Button type="button" variant="outline" className={BTN} onClick={() => a.go('history')}>
          Cancel
        </Button>
        <Button
          type="button"
          variant={ok ? 'destructive' : 'secondary'}
          aria-disabled={!ok}
          onClick={() => ok && a.clearHistory()}
          className={cn(BTN, '[&_svg:not([class*=size-])]:size-4', !ok && 'cursor-not-allowed border-secondary bg-secondary text-muted-foreground hover:border-secondary hover:bg-secondary')}
        >
          <Trash2 strokeWidth={2} aria-hidden="true" />
          Clear history
        </Button>
      </div>
    </div>
  );
}
