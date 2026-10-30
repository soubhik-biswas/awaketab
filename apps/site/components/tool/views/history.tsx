'use client';

import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { clockTime, dayHeading, lengthBadge } from '@/lib/tool/clock';
import { groupByDay, sampleHistory, type IHistoryItem } from '@/lib/tool/history';
import { useTool } from '@/components/tool/context';
import { BTN_DANGER_OUT, HELP, PRESET_ICONS, ROW, SecLabel } from '@/components/tool/kit';
import { iconForLabel } from '@/lib/tool/presets';

export default function HistoryView() {
  const { history, ui, m, snap, settings, a } = useTool();
  const base = ui.qa.samples && history.length === 0 ? sampleHistory(m.now) : history;
  const liveRow: IHistoryItem | null =
    snap.startedAt !== null && m.state !== 'idle' && m.state !== 'ended' && m.state !== 'unsupported'
      ? {
          id: 'live',
          label: settings.label || 'This session',
          icon: iconForLabel(settings.label, m.total),
          face: settings.face,
          startedAt: snap.startedAt,
          endedAt: m.now,
          totalSec: m.total,
          awakeSec: 0,
          reason: 'completed',
        }
      : null;
  const items = liveRow ? [liveRow, ...base] : base;
  const days = groupByDay(items);
  const t = (ms: number) => clockTime(ms, m.lang, m.fmt);
  return (
    <>
      {days.length === 0 ? (
        <span className="text-[14px] leading-[1.5] text-muted-foreground-strong">
          No sessions yet. Finished sessions show here, grouped by day.
        </span>
      ) : null}
      {days.map((d) => (
        <div key={d.key} className="flex flex-col">
          <SecLabel>{dayHeading(d.at, m.now)}</SecLabel>
          {d.items.map((r) => {
            const live = r.id === 'live';
            const Icon = PRESET_ICONS[r.icon];
            return (
              <div key={r.id} className={ROW}>
                <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-[10px] border border-border bg-secondary">
                  <Icon className="size-4" strokeWidth={2} aria-hidden="true" />
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="text-[14px] font-semibold">{r.label || 'Session'}</span>
                  <span className={HELP}>
                    {t(r.startedAt)} – {live ? 'now' : t(r.endedAt)}
                  </span>
                </span>
                <span
                  className={cn(
                    'shrink-0 rounded-full px-[9px] py-[3px] text-[12px] font-semibold whitespace-nowrap',
                    live ? 'bg-accent text-lamp' : 'font-mono text-muted-foreground-strong',
                  )}
                >
                  {live ? 'Awake' : lengthBadge((r.endedAt - r.startedAt) / 1000)}
                </span>
              </div>
            );
          })}
        </div>
      ))}
      <Button type="button" variant="outline" onClick={() => a.go('clear')} className={BTN_DANGER_OUT}>
        <Trash2 strokeWidth={2} aria-hidden="true" />
        Clear history…
      </Button>
      <span className={HELP}>History is stored only on this device.</span>
    </>
  );
}
