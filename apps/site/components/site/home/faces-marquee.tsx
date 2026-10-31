import { getTranslations } from 'next-intl/server';
import { faceName, type TFaceId } from '@/components/face';
import type { TLocale } from '@/i18n/locales';
import { cn } from '@/lib/utils';
import { Marquee } from '../effects/marquee';
import { SAMPLE, SiteFace } from '../site-face';
import { story } from '../styles';
import { StoryHead } from './story-head';

// The home board's 22 faces, split into two rows that drift in opposite directions.
const ROW_A: readonly TFaceId[] = [
  'ring',
  'aurora',
  'liquid',
  'halo',
  'eclipse',
  'skeleton',
  'neon',
  'dive',
  'flip',
  'bold',
  'glass',
];
const ROW_B: readonly TFaceId[] = [
  'chrono',
  'pilot',
  'orbit',
  'nixie',
  'poster',
  'moon',
  'constellation',
  'hud',
  'blob',
  'bauhaus',
  'eink',
];

function Row({ faces, reverse, seconds }: { faces: readonly TFaceId[]; reverse?: boolean; seconds: number }) {
  return (
    <Marquee
      repeat={2}
      reverse={reverse}
      className="[--gap:12px] min-[700px]:[--gap:16px]"
      style={{ ['--duration' as string]: `${String(seconds)}s` }}
    >
      {faces.map((id) => (
        <div
          key={id}
          className={cn(
            story.card,
            'flex w-[178px] flex-none flex-col items-center gap-1.5 px-3.5 pt-3.5 pb-3 min-[700px]:w-[238px]',
          )}
        >
          <SiteFace
            face={id}
            size={210}
            phoneSize={150}
            state="running"
            total={SAMPLE.total}
            remain={SAMPLE.remain}
            nowSec={SAMPLE.nowSec}
            bare
            motion="off"
          />
          <span className="text-[14px] font-semibold text-muted-foreground-strong">{faceName(id)}</span>
        </div>
      ))}
    </Marquee>
  );
}

// "A clock for every room you work in": the section head, then two masked rows of face tiles (home board).
export async function FacesMarquee({ locale }: { locale: TLocale }) {
  const t = await getTranslations({ locale, namespace: 'site.story.faces' });
  return (
    <section aria-labelledby="home-faces-h" className="flex flex-col">
      <div className={story.sec}>
        <StoryHead id="home-faces-h" eyebrow={t('eyebrow')} h={t('h')} accent={t('accent')} lead={t('lead')} />
      </div>
      <div className="site-mask-x mt-8 flex flex-col gap-3 overflow-hidden min-[700px]:mt-[50px] min-[700px]:gap-4">
        <Row faces={ROW_A} seconds={60} />
        <Row faces={ROW_B} seconds={70} reverse />
      </div>
    </section>
  );
}
