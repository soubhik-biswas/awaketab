'use client';

import { motion } from 'motion/react';
import { LoaderCircle, Play } from 'lucide-react';
import { RadioGroup } from 'radix-ui';
import { BorderBeam } from '@/components/ui-effects/border-beam';
import { ShineSweep } from '@/components/ui-effects/shine-sweep';
import { cn } from '@/lib/utils';
import { useGlance, useTickValue } from './context';
import { EASE } from './kit';

export const LENGTHS = [900, 1800, 3600, 7200, 0] as const;

// The text face has no ∞, and a fallback font draws it small and thin, so the phone's "no end" cell draws its own:
// 13.4 px wide at the cell's 15 px, in the weight of the words beside it.
function NoEndMark({ bold }: { bold: boolean }) {
  return (
    <svg
      viewBox="0.5 6.5 23 11"
      width="0.893em"
      height="0.427em"
      fill="none"
      stroke="currentColor"
      strokeWidth={bold ? 2.9 : 2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="inline-block align-middle"
    >
      <path d="M6 16c5 0 7-8 12-8a4 4 0 0 1 0 8c-5 0-7-8-12-8a4 4 0 1 0 0 8" />
    </svg>
  );
}

// The length control: five cells and one thumb that slides between them (Motion layoutId, 350 ms).
function Lengths() {
  const g = useGlance();
  const { t, phone, lang } = g;
  const sel = LENGTHS.find((l) => l === g.settings.totalSec) ?? null;
  const segW = phone ? 350 : 520;
  const segH = phone ? 54 : 56;
  const hShort = t('unit.h').replace('.', '');
  const short = lang === 'en' ? ['15m', '30m', '1h', '2h'] : ['15', '30', `1${hShort}`, `2${hShort}`];
  return (
    <RadioGroup.Root
      value={sel === null ? '' : String(sel)}
      onValueChange={(v) => g.a.setLength(Number(v))}
      aria-label={t('set.howLong')}
      orientation="horizontal"
      className="tg-glass relative flex max-w-full rounded-full p-[5px]"
      style={{ width: segW, height: segH }}
    >
      {LENGTHS.map((sec, i) => {
        const on = sec === sel;
        return (
          <RadioGroup.Item
            key={sec}
            value={String(sec)}
            aria-label={phone ? t(`len.${i}`) : undefined}
            className={cn(
              'tg-btn relative z-[1] min-w-0 flex-1 basis-0 rounded-full border-0 bg-transparent',
              on ? 'font-bold text-(--tg-text)' : 'font-semibold text-(--tg-t2)',
            )}
            style={{ height: segH - 10, fontSize: phone ? 15 : 16 }}
          >
            {on ? (
              <motion.span
                layoutId="tg-length-thumb"
                aria-hidden="true"
                className="absolute inset-0 rounded-full"
                style={{
                  background: 'var(--tg-thumb)',
                  boxShadow: `inset 0 1px 0 var(--tg-thumb-hi), 0 6px 16px var(--tg-thumb-drop), 0 0 0 1px var(--tg-border)`,
                }}
                transition={{ duration: 0.35, ease: EASE }}
              />
            ) : null}
            <span className="relative">{!phone ? t(`len.${i}`) : sec === 0 ? <NoEndMark bold={on} /> : short[i]}</span>
          </RadioGroup.Item>
        );
      })}
    </RadioGroup.Root>
  );
}

// One violet pill per screen: shine sweep and a border beam (Magic UI), spinner while the browser is asked. The
// frame paints the pill and the button inside it is clear, so the beam's 1.5 px rim is the pill's own edge and no
// seam shows. The frame clips, so it carries the focus ring for the button; the button is the full 350 px on phone.
function Cta() {
  const g = useGlance();
  const { t, phone } = g;
  const starting = g.st === 'starting';
  const len = g.settings.totalSec;
  const label = starting ? t('set.starting') : t('set.cta', { len: len === 0 ? t('set.noEnd') : g.dur(len) });
  return (
    <div
      className={cn('tg-field relative overflow-hidden rounded-full p-[1.5px]', phone && 'w-[353px] max-w-full')}
      style={{
        background: 'linear-gradient(180deg, var(--tg-cta-top) 0%, var(--tg-violet) 45%, var(--tg-violet2) 100%)',
        boxShadow: '0 18px 50px var(--tg-cta-glow), inset 0 1px 0 rgba(255,255,255,.4), inset 0 -2px 0 rgba(0,0,0,.12)',
      }}
    >
      <BorderBeam
        size={phone ? 140 : 120}
        duration={5}
        borderWidth={1.5}
        colorFrom="var(--tg-volt)"
        colorTo="var(--tg-violet)"
      />
      <button
        type="button"
        onClick={() => g.a.start()}
        aria-busy={starting || undefined}
        className={cn(
          'tg-btn relative inline-flex items-center justify-center gap-3 overflow-hidden rounded-full border-0 font-bold tracking-[-0.01em] text-(--tg-on-violet)',
          phone && 'w-full',
        )}
        style={{
          height: phone ? 60 : 64,
          paddingInline: phone ? 20 : 34,
          fontSize: phone ? 18 : 19,
          background: 'transparent',
        }}
      >
        <ShineSweep />
        {starting ? (
          <LoaderCircle className="relative size-[22px] animate-spinner" strokeWidth={2.5} aria-hidden="true" />
        ) : (
          <Play className="relative size-[22px]" fill="currentColor" strokeWidth={0} aria-hidden="true" />
        )}
        <span className="relative">{label}</span>
      </button>
    </div>
  );
}

function EndNote() {
  const g = useGlance();
  const len = g.settings.totalSec;
  const ends = useTickValue((tick) => (len === 0 ? '' : g.until(tick.now + len * 1000)));
  return (
    <span className="text-[14px] text-(--tg-t2)">
      {len === 0 ? g.t('set.noteOpen') : g.t('set.note', { time: ends })}
    </span>
  );
}

// A frame too short for the note drops it; the length control and the button always stay.
export function SetControls({ note = true }: { note?: boolean }) {
  const g = useGlance();
  return (
    <div className="flex w-full flex-col items-center" style={{ gap: g.phone ? 14 : 18 }}>
      <Lengths />
      <Cta />
      {note ? <EndNote /> : null}
    </div>
  );
}
