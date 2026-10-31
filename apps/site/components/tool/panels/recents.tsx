'use client';

import { Plus } from 'lucide-react';
import { Bar, BarChart, Cell, XAxis } from 'recharts';
import { Face } from '@/components/face';
import { Scene } from '@/components/scene/scene';
import { ChartContainer, type ChartConfig } from '@/components/ui/chart';
import { cn } from '@/lib/utils';
import { dayDate, dayDiff, dayStart, weekLetters, weekStart } from '@/lib/tool/clock';
import { faceLabel, glanceFace } from '@/lib/tool/collections';
import { groupByDay, sampleHistory, type IHistoryItem } from '@/lib/tool/history';
import { SAMPLE_PRESETS } from '@/lib/tool/presets';
import { isLive } from '@/lib/wake';
import { useGlance, type IGlance } from '../context';
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

function WeekCard({ g, items }: { g: IGlance; items: IHistoryItem[] }) {
  const w = week(items, g.now);
  const letters = weekLetters(g.lang);
  const data = w.hours.map((h, i) => ({ day: letters[i], h: Math.round(h * 100) / 100, i }));
  const config: ChartConfig = { h: { label: g.t('recents.hours'), color: 'var(--tg-bar)' } };
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
      <ChartContainer config={config} className="aspect-auto h-[86px] w-full" aria-label={g.t('recents.chart')}>
        <BarChart data={data} margin={{ top: 0, right: 0, bottom: 0, left: 0 }} barCategoryGap={8}>
          <XAxis
            dataKey="day"
            tickLine={false}
            axisLine={false}
            height={18}
            interval={0}
            tick={(p: { x?: number | string; y?: number | string; payload?: { value?: string }; index?: number }) => (
              <text
                x={Number(p.x)}
                y={Number(p.y) + 10}
                textAnchor="middle"
                className="font-mono text-[12px]"
                style={{ fill: p.index === w.today ? 'var(--tg-text)' : 'var(--tg-t2)' }}
              >
                {p.payload?.value}
              </text>
            )}
          />
          <Bar dataKey="h" radius={8} maxBarSize={26} minPointSize={4} isAnimationActive={false}>
            {data.map((d) => (
              <Cell
                key={d.i}
                style={{
                  fill: d.h === 0 ? 'var(--tg-s2)' : d.i === w.today ? 'var(--tg-volt)' : 'var(--tg-bar)',
                  filter:
                    d.i === w.today && d.h > 0
                      ? 'drop-shadow(0 0 8px color-mix(in srgb, var(--tg-volt) 33%, transparent))'
                      : undefined,
                }}
              />
            ))}
          </Bar>
        </BarChart>
      </ChartContainer>
    </div>
  );
}

export function RecentsPanel() {
  const g = useGlance();
  const { t, ui, phone } = g;
  const presets = ui.qa.empty ? [] : ui.qa.samples && g.presets.length === 0 ? SAMPLE_PRESETS : g.presets;
  const items = ui.qa.samples && g.history.length === 0 ? sampleHistory(g.now) : g.history;
  const live = isLive(g.st);
  const days = groupByDay(items);
  return (
    <PanelBody>
      <WeekCard g={g} items={items} />
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
                  {p.totalSec ? g.dur(p.totalSec) : t('set.noEndCap')} · {faceLabel(p.face)}
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
          {live && g.snap.startedAt !== null ? (
            <HistoryDay g={g} at={g.now}>
              <HistoryRow
                g={g}
                name={t('recents.this')}
                when={t('recents.sinceNow', { time: g.time(g.snap.startedAt) })}
                badge={
                  g.st === 'running' || g.st === 'fallback'
                    ? t('recents.awakeBadge')
                    : g.dur(Math.max(60, g.total - g.remain))
                }
                current
              />
            </HistoryDay>
          ) : null}
          {days.map((d) => (
            <HistoryDay key={d.key} g={g} at={d.at}>
              {d.items.map((it) => (
                <HistoryRow
                  key={it.id}
                  g={g}
                  name={it.label || t('recents.untitled', { face: faceLabel(it.face) })}
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

function HistoryDay({ g, at, children }: { g: IGlance; at: number; children: React.ReactNode }) {
  const diff = dayDiff(at, g.now);
  const date = dayDate(at, g.lang);
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
    <div className="flex min-h-[77px] items-center gap-3.5 border-b border-(--tg-border) px-1 py-2">
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
