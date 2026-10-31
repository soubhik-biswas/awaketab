import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { Block, Callout } from '@/components/site/blocks';
import { Chips } from '@/components/site/chips';
import { PageHero } from '@/components/site/page-hero';
import { ToolSlot } from '@/components/site/tool-slot';
import { englishOnly, pageMetadata, titleFor } from '@/lib/seo';

type TParams = Promise<{ locale: string; time: string }>;

const pad = (n: number) => String(n).padStart(2, '0');
const twelve = (h: number, m: number) => `${String(h % 12 || 12)}:${pad(m)} ${h < 12 ? 'AM' : 'PM'}`;

export const dynamicParams = false;

// Every /until/HH-MM exists in 5-minute steps, as on the old site.
export function generateStaticParams() {
  const out: Array<{ locale: string; time: string }> = [];
  for (let h = 0; h < 24; h += 1)
    for (let m = 0; m < 60; m += 5) out.push({ locale: 'en', time: `${pad(h)}-${pad(m)}` });
  return out;
}

function parse(time: string): [number, number] {
  const m = /^(\d{2})-(\d{2})$/u.exec(time);
  const h = Number(m?.[1]);
  const mm = Number(m?.[2]);
  if (!m || h > 23 || mm > 59 || mm % 5 !== 0) notFound();
  return [h, mm];
}

export async function generateMetadata({ params }: { params: TParams }): Promise<Metadata> {
  const { time } = await params;
  const [h, m] = parse(time);
  const t = await getTranslations({ locale: 'en', namespace: 'page' });
  return pageMetadata({
    title: titleFor(`Keep your screen awake until ${twelve(h, m)}`),
    description: t('until.description', { time: twelve(h, m) }),
    path: '/',
    noindex: true,
    og: { image: 'og-01', alt: 'AwakeTab clock showing 38:12 left' },
  });
}

// An until-time page: the tool counts down to this wall-clock time (noindex, canonical home, docs/00 §7).
export default async function Page({ params }: { params: TParams }) {
  await englishOnly(params);
  const { time } = await params;
  const [h, m] = parse(time);
  const ts = await getTranslations({ locale: 'en', namespace: 'site' });
  const tt = await getTranslations({ locale: 'en', namespace: 'tool' });
  const here = twelve(h, m);
  const overnight = h < 10;
  const at = h * 60 + m;
  const near = [-30, -15, 15, 30].map((d) => {
    const x = (at + d + 1440) % 1440;
    const hh = Math.floor(x / 60);
    const mm = x % 60;
    return { href: `/until/${pad(hh)}-${pad(mm)}`, label: twelve(hh, mm), aria: `Keep awake until ${twelve(hh, mm)}` };
  });
  return (
    <>
      <PageHero
        eyebrow="Keep awake until"
        h1={`Keep your screen awake until ${here}`}
        lead={`AwakeTab works out the length from your device clock, then counts down to ${here}. If ${here} has already passed today, the session ends at ${here} tomorrow, and the tool says so above the countdown.`}
      />
      <Block id="s-tool" label={`Until ${here}`}>
        <ToolSlot
          preset="until"
          minutes={null}
          eyebrow={ts('tool.eyebrow')}
          title={`Until ${here}`}
          desc={`The end time stays fixed while the session runs. +15 min moves it 15 minutes later, and Stop ends it now. The pill reads “${tt('pill.held')}” only while the browser holds the wake lock.`}
          href={`/?until=${time}`}
          label={`Keep awake until ${here}`}
        />
      </Block>
      <Block id="about" label="Honest limit">
        <Callout tone="info" title="Honest limit">
          {overnight
            ? 'An overnight session needs this tab in front for the whole night. A hidden tab, a closed lid or another app in front lets the display sleep. Plug in so the battery lasts until morning.'
            : `The session needs this tab in front until ${here}. A hidden tab, a closed lid or another app in front lets the display sleep. For a long wait, plug in so the battery lasts.`}
        </Callout>
      </Block>
      <Block id="times" h="Nearby times">
        <Chips label="Nearby times" items={near} />
        <a href="/" className="text-[15px] font-semibold text-lamp underline underline-offset-[3px]">
          Any other time: open the tool and pick Until a time…
        </a>
      </Block>
    </>
  );
}
