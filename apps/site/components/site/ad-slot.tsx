import * as s from './styles';

export const adsEnabled = (): boolean => process.env.NEXT_PUBLIC_ADS_ENABLED === '1';

// One slot per content page, below the tool, never beside a button and never animated; drawn only when ads are on.
export function AdSlot({ label, note }: { label: string; note: string }) {
  if (!adsEnabled()) return null;
  return (
    <div className={s.pad}>
      <div
        role="complementary"
        aria-label={label}
        data-ad-slot=""
        className="flex min-h-[90px] max-w-[770px] flex-col gap-1.5 rounded-2xl border border-dashed border-input bg-secondary p-5"
      >
        <span className={s.eyebrow}>{label}</span>
        <span className={s.body}>{note}</span>
      </div>
    </div>
  );
}
