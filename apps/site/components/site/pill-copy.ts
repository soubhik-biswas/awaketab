export type TLock = 'idle' | 'requesting' | 'held' | 'lost' | 'denied' | 'unsupported' | 'fallback';

type TT = (key: string, values?: Record<string, string | number>) => string;

// What the tool's pill reads in each lock state, from the tool's own strings (`t` is the "tool" namespace), so
// pages never quote copy the tool does not show. Forms without an end time are used: they need no sample clock.
export function lockPillLabel(t: TT, state: TLock): string {
  switch (state) {
    case 'idle':
      return t('glance.pill.idle');
    case 'requesting':
      return t('glance.pill.starting');
    case 'held':
      return t('glance.pill.awakeOpen');
    case 'lost':
      return t('glance.pill.needsyou');
    case 'denied':
      return t('glance.pill.blocked', { reason: t('glance.reason.unknown') });
    case 'unsupported':
      return t('glance.pill.unsupported');
    case 'fallback':
      return t('glance.pill.fallbackOpen');
  }
}
