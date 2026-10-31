import type { TAdviceCode } from '@awaketab/wake';
import { clockTime, dateLine, endTime, secondsOfDay, type TClockFmt } from '@/lib/tool/clock';
import type { IToolSettings } from '@/lib/tool/settings';
import { CHROME, type IToolChrome } from '@/lib/tool/chrome';
import { FACE_TOP, STRINGS, type IToolStrings, type TToolLang } from '@/lib/tool/strings';
import type { TDevice } from '@/lib/tool/ui';
import { elapsedSec, remainSec, type IWakeSnapshot, type TWakeState } from '@/lib/wake';

export type TFaceTheme = 'light' | 'dark' | 'oled';
type TFaceStateName = 'idle' | 'starting' | 'running' | 'fallback' | 'paused' | 'blocked' | 'unsupported' | 'up';

// Face, header and control-bar sizes per device; the stage sits between the header and the bar.
export const DEVICE_SIZES: Record<TDevice, { face: number; top: number; bar: number }> = {
  desktop: { face: 480, top: 64, bar: 112 },
  tabletL: { face: 440, top: 64, bar: 112 },
  tabletP: { face: 600, top: 64, bar: 112 },
  phone: { face: 336, top: 56, bar: 168 },
};

const FACE_STATE: Record<TWakeState, TFaceStateName> = {
  idle: 'idle',
  starting: 'starting',
  running: 'running',
  fallback: 'fallback',
  paused: 'paused',
  needsyou: 'unsupported',
  blocked: 'blocked',
  unsupported: 'unsupported',
  ended: 'up',
};

const BLOCK_REASON: Partial<Record<TAdviceCode, string>> = {
  hidden_document: 'tab hidden',
  permissions_policy: 'not allowed here',
  iframe_no_allow: 'not allowed here',
  insecure_context: 'needs a secure page',
};

export interface IToolModel {
  lang: TToolLang;
  s: IToolStrings;
  c: IToolChrome;
  fmt: TClockFmt;
  state: TWakeState;
  indef: boolean;
  now: number;
  remain: number;
  elapsed: number;
  total: number;
  endsAt: number;
  endT: string;
  endedT: string;
  nowSec: number;
  dateText: string;
  pillLabel: string;
  faceState: TFaceStateName;
  lblTop: string;
  lblEnd: string;
  note: string;
  endsText: string;
}

// Everything the screen shows, derived from the wake snapshot, the settings and the display clock.
export function deriveModel(snap: IWakeSnapshot, settings: IToolSettings, lang: TToolLang, offsetMs = 0): IToolModel {
  const s = STRINGS[lang];
  const c = CHROME[lang];
  const fmt: TClockFmt = settings.h12 ? 12 : 24;
  const now = (snap.now || Date.now()) + offsetMs;
  const st = snap.state;
  const live = st !== 'idle' && st !== 'unsupported' && st !== 'ended';
  const indef = live ? snap.endsAt === null : snap.totalSec === 0;
  const total = live || st === 'ended' ? snap.totalSec : settings.totalSec;
  const remain = live ? remainSec(snap) : st === 'ended' ? 0 : total;
  const elapsed = elapsedSec(snap);
  const endsAt = now + remain * 1000;
  const endT = endTime(endsAt, now, lang, fmt);
  const endedT = clockTime((snap.endedAt ?? snap.now) + offsetMs, lang, fmt);
  const awakeLabel =
    lang === 'zh'
      ? s.awakeUntil + endT
      : lang === 'ja'
        ? `${s.awakeUntil}${endT}まで`
        : lang === 'hi'
          ? `${s.awakeUntil}${endT} तक`
          : s.awakeUntil + endT;
  const pausedLabel =
    snap.pauseReason === 'hidden' ? c.pausedHidden : `${s.paused} · ${Math.floor(remain / 60)}${s.min} ${s.left}`;
  const blockedLabel =
    lang === 'en' && snap.advice && BLOCK_REASON[snap.advice] ? `Blocked · ${BLOCK_REASON[snap.advice]}` : s.blocked;
  const pillLabel: Record<TWakeState, string> = {
    idle: s.idle,
    starting: s.starting,
    running: indef ? s.awakeFor : awakeLabel,
    fallback: s.fb,
    paused: pausedLabel,
    needsyou: s.needs,
    blocked: blockedLabel,
    unsupported: s.unsup,
    ended: s.ended + endedT,
  };
  const top = lang === 'en' ? (st === 'needsyou' ? 'needs you' : '') : (FACE_TOP[lang][st] ?? s.left);
  const lblEnd =
    lang === 'en'
      ? ''
      : st === 'idle'
        ? s.wouldEnd + endT
        : st === 'ended'
          ? s.ended + endedT
          : lang === 'de' || lang === 'zh'
            ? s.until + endT
            : `${endT} ${s.until.trim()}`;
  const lenText = total === 3600 ? s.hour : `${Math.round(total / 60)}${s.min}`;
  const idleNote = indef ? c.noEndNote : lang === 'en' ? `${lenText}${s.forLen}${endT}` : s.wouldEnd + endT;
  const notes: Partial<Record<TWakeState, string>> = {
    idle: idleNote,
    fallback: snap.supported
      ? 'Using the video fallback because the browser refused the wake lock.'
      : 'Using the video fallback because this browser has no wake lock.',
    unsupported: 'This browser has no wake lock. A silent looping video keeps most screens on.',
    starting: 'Asking the browser to keep the screen on…',
  };
  const endsText =
    st === 'idle' || st === 'unsupported'
      ? `${s.wouldEnd}${endT}${lang === 'en' ? ' if you start now.' : ''}`
      : indef
        ? c.noEndNote
        : s.endsAt + endT;
  return {
    lang,
    s,
    c,
    fmt,
    state: st,
    indef,
    now,
    remain,
    elapsed,
    total,
    endsAt,
    endT,
    endedT,
    nowSec: secondsOfDay(now),
    dateText: dateLine(now, lang, fmt),
    pillLabel: pillLabel[st],
    faceState: FACE_STATE[st],
    lblTop: top,
    lblEnd,
    note: notes[st] ?? '',
    endsText,
  };
}

// The face counts up from zero for a session with no end.
export function faceRemain(m: IToolModel): number {
  if (!m.indef) return m.remain;
  return m.state === 'idle' ? 0 : m.elapsed;
}
