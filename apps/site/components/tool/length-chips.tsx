'use client';

import { Chip } from '@/components/product/chip';
import { useTool } from '@/components/tool/context';

export function LengthChips({ columns, onUntil }: { columns: number; onUntil: () => void }) {
  const { m, a } = useTool();
  const s = m.s;
  const lens: Array<[number, string]> = [
    [900, `15${s.min}`],
    [1800, `30${s.min}`],
    [3600, s.hour],
    [7200, s.hours2],
    [-1, s.untilT],
    [0, '∞'],
  ];
  return (
    <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
      {lens.map(([sec, label]) => (
        <Chip
          key={sec}
          shape="tile"
          pressed={sec === m.total}
          aria-label={sec === 0 ? 'No end' : undefined}
          aria-keyshortcuts={sec === -1 ? 'U' : undefined}
          className="h-11 px-2 text-[14px]"
          onClick={() => (sec >= 0 ? a.setLength(sec) : onUntil())}
        >
          {label}
        </Chip>
      ))}
    </div>
  );
}
