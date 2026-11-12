'use client';

import { Plus } from 'lucide-react';
import { Face } from '@/components/face';
import { Scene } from '@/components/scene/scene';
import { cn } from '@/lib/utils';
import { dayDate, dayDiff, dayStart, weekDays, weekLetters, weekStart } from '@/lib/tool/clock';
import { glanceFace } from '@/lib/tool/collections';
import { groupByDay, sampleHistory, type IHistoryItem } from '@/lib/tool/history';
import { SAMPLE_PRESETS } from '@/lib/tool/presets';
import { elapsedSec, isLive } from '@/lib/wake';
import { useGlance, useTickValue, type IGlance } from '../context';
import { GHOST_BTN, Note, SecLabel } from '../kit';
import { PanelBody } from './shell';

const DAY = 86_400_000;

interface IWeek {
  hours: number[];
  today: number;
  totalSec: number;
  streak: number;
  longest: boolean;
}

// The week from local history only: hours awake per day (Monday first), the total and the run of days in a row.
function week(items: IHistoryItem[], now: number): IWeek {
  const start = weekStart(now);
  const hours = [0, 0, 0, 0, 0, 0, 0];
  let totalSec = 0;
  const days = new Set<number>();
  for (const it of items) {
    days.add(dayStart(it.startedAt));
    if (it.startedAt < start || it.startedAt >= start + 7 * DAY) continue;
    const i = Math.floor((dayStart(it.startedAt) - start) / DAY);
    if (i < 0 || i > 6) continue;
    hours[i] = (hours[i] ?? 0) + it.awakeSec / 3600;
    totalSec += it.awakeSec;
  }
  const runs: number[] = [];
  const sorted = [...days].sort((a, b) => a - b);
  let run = 0;
  let prev = 0;
  for (const d of sorted) {
    run = prev && dayDiff(prev, d) === 1 ? run + 1 : 1;
    runs.push(run);
    prev = d;
  }
  const last = sorted[sorted.length - 1];
  const streak = last !== undefined && dayDiff(last, now) <= 1 ? (runs[runs.length - 1] ?? 0) : 0;
  return {
    hours,
    today: Math.floor((dayStart(now) - start) / DAY),
    totalSec,
    streak,
    longest: streak > 1 && streak >= Math.max(...runs),
  };
}

const PLOT_H = 68;
const CHART_H = 86;
const BAR_W = 26;
const BARS = [0, 1, 2, 3, 4, 5, 6] as const;

// The top of the scale: four even steps that clear the tallest day, so a full bar stops just short of the top.
function scaleTop(max: number): number {
  if (max <= 0) return 4;
  const rough = max / 4;
  const digits = Math.floor(Math.log10(rough)) + 1;
  const unit = 10 ** (digits - 1);
  const grain = digits === 1 ? 0.1 : 0.05;
  return Math.ceil(rough / unit / grain - 1e-9) * grain * unit * 4;
}

// Seven bars, Monday first: an empty day keeps a 4 px stub, today is volt and glows.
function WeekChart({
  hours,
  today,
  letters,
  label,
}: {
  hours: number[];
  today: number;
  letters: string[];
  label: string;
}) {
  const top = scaleTop(Math.max(...hours));
  return (
    <svg role="img" aria-label={label} width="100%" height={CHART_H} className="block flex-none">
      {BARS.map((i) => {
        const h = hours[i] ?? 0;
        const tall = Math.max(4, (h / top) * PLOT_H);
        const lit = i === today && h > 0;
        return (
          <svg key={i} x={`${(i * 100) / 7}%`} width={`${100 / 7}%`} height={CHART_H} overflow="visible">
            <rect
              x="50%"
              y={PLOT_H - tall}
              width={BAR_W}
              height={tall}
              rx={Math.min(8, tall / 2)}
              style={{
                transform: `translateX(${-BAR_W / 2}px)`,
                fill: h === 0 ? 'var(--tg-s2)' : i === today ? 'var(--tg-volt)' : 'var(--tg-bar)',
                filter: lit ? 'drop-shadow(0 0 8px color-mix(in srgb, var(--tg-volt) 33%, transparent))' : undefined,
              }}
            />
            <text
              x="50%"
              y={CHART_H}
              textAnchor="middle"
              className="font-mono text-[12px]"
              style={{ fill: i === today ? 'var(--tg-text)' : 'var(--tg-t2)' }}
            >
              {letters[i]}
            </text>
          </svg>
        );
      })}
    </svg>
  );
}

function WeekCard({ g, now, items }: { g: IGlance; now: number; items: IHistoryItem[] }) {
  const w = week(items, now);
  const hours = w.hours.map((h) => Math.round(h * 100) / 100);
  const days = weekDays(g.lang);
  // Read out in full: "Hours awake each day this week: Monday 1 hour 20 minutes, …".
  const summary = `${g.t('recents.chart')}: ${hours.map((h, i) => `${days[i]} ${g.durLong(Math.round(h * 3600))}`).join(', ')}`;
  const line =
    w.streak > 0
      ? `${g.t('recents.streak', { n: w.streak })}${w.longest ? ` · ${g.t('recents.longest')}` : ''}`
      : g.t('recents.noStreak');
  return (
    <div
      className="flex flex-col gap-4 rounded-[22px] border border-(--tg-border) p-[18px]"
      style={{ background: 'var(--tg-week)' }}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="flex flex-col gap-1">
          <span className="font-mono text-[12px] tracking-[.14em] text-(--tg-t2)">{g.t('recents.week')}</span>
          <strong className="font-display text-[26px] font-bold tracking-[-0.03em]">
            {g.t('recents.awake', { dur: g.dur(w.totalSec) })}
          </strong>
          <span className="text-[13px] leading-[1.45] text-(--tg-t2)">{line}</span>
        </span>
        {w.streak > 0 ? (
          <span
            className="inline-flex h-9 flex-none items-center gap-1.5 rounded-full px-3 text-[15px] font-bold text-(--tg-amber)"
            style={{ background: 'var(--tg-streak-soft)' }}
            aria-label={g.t('recents.streak', { n: w.streak })}
          >
            <span aria-hidden="true">🔥</span> {w.streak}
          </span>
        ) : null}
      </div>
      <WeekChart hours={hours} today={w.today} letters={weekLetters(g.lang)} label={summary} />
    </div>
  );
}

export function RecentsPanel() {
  const g = useGlance();
  const { t, ui, phone } = g;
  const presets = ui.qa.empty ? [] : ui.qa.samples && g.presets.length === 0 ? SAMPLE_PRESETS : g.presets;
  // The panel follows the clock by the minute, which is as fine as anything in it reads.
  const now = useTickValue((tick) => Math.floor(tick.now / 60_000)) * 60_000;
  const ran = useTickValue((tick) => g.dur(Math.max(60, elapsedSec(tick.snap))));
  const items = ui.qa.samples && g.history.length === 0 ? sampleHistory(now) : g.history;
  const live = isLive(g.st);
  const days = groupByDay(items);
  return (
    <PanelBody>
      <WeekCard g={g} now={now} items={items} />
      <SecLabel>{t('recents.presets')}</SecLabel>
      {presets.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-[20px] border-[1.5px] border-dashed border-(--tg-border-hi) bg-(--tg-s1) p-[18px] text-center">
          <Scene scene="noitems" theme={g.night ? 'dark' : 'light'} width={200} decorative />
          <strong className="text-[15px] font-semibold">{t('recents.emptyH')}</strong>
          <span className="text-[13px] leading-[1.45] text-(--tg-t2)">{t('recents.emptyD')}</span>
          <button type="button" onClick={() => g.a.savePreset()} className={GHOST_BTN}>
            {t('recents.save')}
          </button>
        </div>
      ) : (
        <div className={cn('grid gap-2.5', phone ? 'grid-cols-1' : 'grid-cols-2')}>
          {presets.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => g.a.applyPreset(p)}
              className="tg-btn tg-tile flex min-w-0 items-center gap-3 rounded-[18px] border border-(--tg-border) bg-(--tg-s1) py-2.5 pr-3 pl-2.5 text-left text-(--tg-text)"
            >
              <span className="flex h-14 w-16 flex-none items-center justify-center overflow-hidden rounded-[14px] bg-(--tg-well)">
                <Face
                  face={glanceFace(p.face)}
                  theme={g.faceTheme}
                  state="running"
                  remain={2292}
                  total={3600}
                  nowSec={39828}
                  size={64}
                  bare
                  motion="off"
                />
              </span>
              <span className="flex min-w-0 flex-col gap-0.5">
                <strong className="overflow-hidden text-[15px] font-bold text-ellipsis whitespace-nowrap">
                  {p.label}
                </strong>
                <span className="overflow-hidden text-[13px] text-ellipsis whitespace-nowrap text-(--tg-t2)">
                  {p.totalSec ? g.dur(p.totalSec) : t('set.noEndCap')} · {g.faceName(p.face)}
                </span>
              </span>
            </button>
          ))}
          <button
            type="button"
            onClick={() => g.a.savePreset()}
            className={cn(
              'tg-btn flex h-[52px] items-center justify-center gap-2 rounded-[16px] border-[1.5px] border-dashed border-(--tg-border-hi) bg-transparent text-[15px] font-semibold text-(--tg-text)',
              !phone && 'col-span-2',
            )}
          >
            <Plus className="size-[18px]" strokeWidth={2} aria-hidden="true" />
            {t('recents.save')}
          </button>
        </div>
      )}
      <SecLabel>{t('recents.history')}</SecLabel>
      {live || days.length ? (
        <>
          {live && g.startedAt !== null ? (
            <HistoryDay g={g} now={now} at={now}>
              <HistoryRow
                g={g}
                name={t('recents.this')}
                when={t('recents.sinceNow', { time: g.time(g.startedAt) })}
                badge={g.st === 'running' || g.st === 'fallback' ? t('recents.awakeBadge') : ran}
                current
              />
            </HistoryDay>
          ) : null}
          {days.map((d) => (
            <HistoryDay key={d.key} g={g} now={now} at={d.at}>
              {d.items.map((it) => (
                <HistoryRow
                  key={it.id}
                  g={g}
                  name={it.label || t('recents.untitled', { face: g.faceName(it.face) })}
                  when={`${g.time(it.startedAt)} – ${g.time(it.endedAt)}`}
                  badge={g.dur(Math.max(60, it.awakeSec))}
                />
              ))}
            </HistoryDay>
          ))}
        </>
      ) : null}
      <Note>{t('recents.note')}</Note>
    </PanelBody>
  );
}

function HistoryDay({ g, now, at, children }: { g: IGlance; now: number; at: number; children: React.ReactNode }) {
  const diff = dayDiff(at, now);
  const date = dayDate(at, g.lang, new Date(at).getFullYear() !== new Date(now).getFullYear());
  const head = diff === 0 ? g.t('recents.today', { date }) : diff === 1 ? g.t('recents.yesterday', { date }) : date;
  return (
    <div className="flex flex-col gap-0.5">
      <span className="pt-2.5 pb-1 font-mono text-[12px] tracking-[.1em] text-(--tg-t2) uppercase">{head}</span>
      {children}
    </div>
  );
}

function HistoryRow({
  g,
  name,
  when,
  badge,
  current = false,
}: {
  g: IGlance;
  name: string;
  when: string;
  badge: string;
  current?: boolean;
}) {
  return (
    <div className="flex min-h-[60px] items-center gap-3.5 border-b border-(--tg-border) px-1 py-2">
      <span
        aria-hidden="true"
        className={cn(
          'size-2.5 flex-none rounded-full',
          current
            ? 'bg-(--tg-volt) shadow-[0_0_0_4px_color-mix(in_srgb,var(--tg-volt)_13%,transparent)]'
            : 'border-2 border-(--tg-t3)',
        )}
      />
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <strong className="text-[15px] font-semibold">{name}</strong>
        <span className="text-[13px] text-(--tg-t2)">{when}</span>
      </span>
      <span
        className={cn(
          'rounded-full px-2.5 py-1 font-mono text-[12px] font-medium whitespace-nowrap',
          current ? 'bg-(--tg-volt-soft) text-(--tg-volt)' : 'bg-(--tg-s2) text-(--tg-t2)',
        )}
      >
        {current ? <span className="sr-only">{g.t('recents.this')}: </span> : null}
        {badge}
      </span>
    </div>
  );
}
