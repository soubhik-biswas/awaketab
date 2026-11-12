'use client';

import { useTranslations } from 'next-intl';
import { ROW, RowText, SwitchRow } from '@/components/tool/kit';
import { updateSettings, useToolSettings } from '@/lib/tool/settings';
import { useMounted } from '@/lib/surfaces/hooks';
import { miniTier } from '@/lib/surfaces/pip';

// Settings → "Mini clock when you leave". It promises only what this browser can do: open by itself where the
// browser allows, a one-tap offer where it cannot, and a plain "not available" where there is no floating window.
export function MiniSetting() {
  const t = useTranslations('surfaces.pip');
  const { autoMini } = useToolSettings();
  const tier = useMounted() ? miniTier() : 'none';
  if (tier === 'none') {
    return (
      <div className={ROW}>
        <RowText title={t('auto')} desc={t('noneD')} />
      </div>
    );
  }
  return (
    <SwitchRow
      title={t('auto')}
      desc={tier === 'auto' ? t('autoD') : t('tapD')}
      checked={autoMini}
      onChange={(on) => updateSettings({ autoMini: on })}
    />
  );
}
