'use client';

import type { ComponentType } from 'react';
import '@/components/tool/glance.css';
import { Cws01, Cws02, Cws03, Cws04, Cws05 } from './cws';
import { toneVars } from './kit';
import { Og01, Og02, Og03, Og04, Og07, Og08 } from './og';
import { Ph01, Ph02, Ph03, Ph04, Ph05 } from './ph';
import { FRAMES, type TFrameId } from './sizes';
import { PromoMarquee, PromoSmall, Soc01, Soc02 } from './social';

const DRAW: Readonly<Record<TFrameId, ComponentType>> = {
  'og-01': Og01,
  'og-02': Og02,
  'og-03': Og03,
  'og-04': Og04,
  'og-07': Og07,
  'og-08': Og08,
  'ph-01': Ph01,
  'ph-02': Ph02,
  'ph-03': Ph03,
  'ph-04': Ph04,
  'ph-05': Ph05,
  'soc-01-square': Soc01,
  'soc-02-story': Soc02,
  'cws-01': Cws01,
  'cws-02': Cws02,
  'cws-03': Cws03,
  'cws-04': Cws04,
  'cws-05': Cws05,
  'promo-small-440x280': PromoSmall,
  'promo-marquee-1400x560': PromoMarquee,
};

// The status dot breathes on the site; a screenshot needs it at rest.
const PAGE_CSS =
  'html,body{margin:0;padding:0;overflow:hidden}#asset [data-slot=status-pill] *{animation:none!important}';

export function AssetFrame({ id }: { id: TFrameId }) {
  const { w, h, tone } = FRAMES[id];
  const Draw = DRAW[id];
  return (
    <>
      <style>{PAGE_CSS}</style>
      <div
        id="asset"
        className={tone}
        style={{ position: 'absolute', left: 0, top: 0, width: w, height: h, overflow: 'hidden', ...toneVars(tone) }}
      >
        <Draw />
      </div>
    </>
  );
}
