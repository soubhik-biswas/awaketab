'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { FACE_IDS, faceName } from '@/components/face';
import { cn } from '@/lib/utils';
import type { TQaMessage } from '@/components/tool/qa-bridge';
import { VIBES } from '@/lib/tool/settings';
import { TOOL_LANGS, type TToolLang } from '@/lib/tool/strings';
import type { TBlockReason, TPanel } from '@/lib/tool/ui';
import type { TWakeState } from '@/lib/wake';

type TPayload = TQaMessage extends infer M ? (M extends { type: 'at-qa' } ? Omit<M, 'type'> : never) : never;

const DEVICES = [
  ['desktop', 'Desktop 1440', 1440, 900],
  ['tabletL', 'Tablet landscape 1194', 1194, 834],
  ['tabletP', 'Tablet portrait 834', 834, 1194],
  ['phone', 'Phone 390', 390, 844],
] as const;

const STATES: Array<[TWakeState, string]> = [
  ['idle', 'Idle'],
  ['starting', 'Starting'],
  ['running', 'Awake'],
  ['fallback', 'Fallback'],
  ['paused', 'Paused'],
  ['needsyou', 'Needs you'],
  ['blocked', 'Blocked'],
  ['unsupported', 'Unsupported'],
  ['ended', 'Time’s up'],
];

const PANELS: Array<[TPanel, string]> = [
  ['none', 'None'],
  ['faces', 'Faces'],
  ['recents', 'Recents'],
  ['settings', 'Settings'],
  ['help', 'Help & fixes'],
  ['studio', 'Face studio'],
  ['feedback', 'Feedback'],
  ['vibes', 'Vibe'],
  ['share', 'Share'],
  ['devices', 'Your screens'],
  ['sound', 'Ambient sound'],
  ['clear', 'Clear history'],
  ['language', 'Language'],
  ['pro', 'Pro offer'],
  ['proDone', 'Pro is on'],
  ['plan', 'Manage plan'],
  ['palette', '⌘K palette'],
];

const REASONS: TBlockReason[] = ['battery', 'unknown', 'insecure', 'policy'];

function Pill({ on, children, onClick }: { on?: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={cn(
        'h-9 cursor-pointer rounded-full border px-3 text-[13px] font-semibold',
        on ? 'border-lamp bg-accent text-lamp' : 'border-border bg-secondary text-foreground',
      )}
    >
      {children}
    </button>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="font-mono text-[12px] tracking-[.1em] text-muted-foreground-strong">{label}</span>
      <div className="flex max-w-[760px] flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

// Review tooling, not product UI: the design's "Prototype controls", driving the tool in a device-sized frame.
export function QaTray() {
  const frame = useRef<HTMLIFrameElement>(null);
  const [device, setDevice] = useState<(typeof DEVICES)[number][0]>('desktop');
  const [lang, setLang] = useState<TToolLang>('en');
  const [on, setOn] = useState<Record<string, string>>({});
  const [flags, setFlags] = useState({ boardTime: true, samples: true, empty: false, first: false, nudge: false });
  const [face, setFace] = useState('ring');
  const [ready, setReady] = useState(0);

  const send = useCallback((payload: TPayload) => {
    frame.current?.contentWindow?.postMessage({ type: 'at-qa', ...payload }, window.location.origin);
  }, []);

  useEffect(() => {
    const onMsg = (e: MessageEvent<{ type?: string } | null>) => {
      if (e.origin === window.location.origin && e.data?.type === 'at-qa-ready') setReady((n) => n + 1);
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, []);

  useEffect(() => {
    if (!ready) return;
    send({ action: 'boardTime', on: flags.boardTime });
    send({
      action: 'qa',
      patch: { samples: flags.samples, empty: flags.empty, first: flags.first, nudge: flags.nudge || undefined },
    });
  }, [ready, flags, send]);

  const pick = (group: string, key: string, payload: TPayload) => {
    setOn((o) => ({ ...o, [group]: key }));
    send(payload);
  };
  const flag = (k: keyof typeof flags) => setFlags((f) => ({ ...f, [k]: !f[k] }));
  const dv = DEVICES.find((d) => d[0] === device) ?? DEVICES[0];

  return (
    <div className="dark flex min-h-dvh flex-col bg-background text-foreground">
      <div
        aria-label="Prototype controls (not part of the product)"
        className="box-border flex flex-col gap-3.5 border-b-2 border-dashed border-border px-6 py-[18px] font-sans"
      >
        <div className="flex flex-wrap items-baseline gap-3">
          <strong className="text-[16px]">Prototype controls</strong>
          <span className="text-[13px] text-muted-foreground-strong">
            Not part of the product. Jump to any state, panel, banner, theme, vibe and device; the clock ticks in real
            seconds.
          </span>
          <button
            type="button"
            onClick={() => send({ action: 'reset' })}
            className="ml-auto h-9 cursor-pointer rounded-full border border-input bg-transparent px-3.5 text-[13px] font-semibold text-foreground"
          >
            Reset to first visit
          </button>
        </div>
        <div className="flex flex-wrap items-start gap-[18px]">
          <Row label="DEVICE">
            {DEVICES.map(([k, label]) => (
              <Pill key={k} on={device === k} onClick={() => setDevice(k)}>
                {label}
              </Pill>
            ))}
          </Row>
          <Row label="LANGUAGE">
            {TOOL_LANGS.map((l) => (
              <Pill key={l} on={lang === l} onClick={() => setLang(l)}>
                {l.toUpperCase()}
              </Pill>
            ))}
          </Row>
          <Row label="STATE">
            {STATES.map(([k, label]) => (
              <Pill
                key={k}
                on={on.state === k}
                onClick={() => {
                  if (k === 'blocked') send({ action: 'qa', patch: { reason: 'battery' } });
                  pick('state', k, {
                    action: 'state',
                    state: k,
                    total: 3600,
                    remain: k === 'idle' || k === 'starting' ? 3600 : 2292,
                  });
                }}
              >
                {label}
              </Pill>
            ))}
          </Row>
          <Row label="BLOCKED REASON">
            {REASONS.map((r) => (
              <Pill
                key={r}
                on={on.reason === r}
                onClick={() => pick('reason', r, { action: 'qa', patch: { reason: r } })}
              >
                {r}
              </Pill>
            ))}
          </Row>
          <Row label="BANNER">
            {(['none', 'conflict', 'offline', 'update'] as const).map((k) => (
              <Pill
                key={k}
                on={on.banner === k}
                onClick={() => pick('banner', k, { action: 'qa', patch: { banner: k } })}
              >
                {k === 'none'
                  ? 'None'
                  : k === 'offline'
                    ? 'Offline'
                    : k === 'conflict'
                      ? 'Another tab'
                      : 'Update ready'}
              </Pill>
            ))}
          </Row>
          <Row label="THEME">
            {(['system', 'light', 'dark', 'oled'] as const).map((k) => (
              <Pill key={k} on={on.theme === k} onClick={() => pick('theme', k, { action: 'theme', theme: k })}>
                {k === 'system' ? 'System' : k === 'oled' ? 'OLED' : k.charAt(0).toUpperCase() + k.slice(1)}
              </Pill>
            ))}
          </Row>
          <Row label="VIBE">
            {VIBES.map((k) => (
              <Pill key={k} on={on.vibe === k} onClick={() => pick('vibe', k, { action: 'vibe', vibe: k })}>
                {k}
              </Pill>
            ))}
            {(['still', 'calm', 'lively'] as const).map((k) => (
              <Pill key={k} on={on.motion === k} onClick={() => pick('motion', k, { action: 'motion', motion: k })}>
                Motion: {k}
              </Pill>
            ))}
          </Row>
          <Row label="PANEL">
            {PANELS.map(([k, label]) => (
              <Pill key={k} on={on.panel === k} onClick={() => pick('panel', k, { action: 'panel', panel: k })}>
                {label}
              </Pill>
            ))}
          </Row>
          <Row label="CONTROLS AND MOMENTS">
            {(['shown', 'hidden'] as const).map((k) => (
              <Pill
                key={k}
                on={on.controls === k}
                onClick={() => pick('controls', k, { action: 'qa', patch: { controls: k } })}
              >
                Controls {k}
              </Pill>
            ))}
            <Pill onClick={() => send({ action: 'extend' })}>Extended toast</Pill>
            <Pill on={flags.first} onClick={() => flag('first')}>
              First session card
            </Pill>
            <Pill on={flags.nudge} onClick={() => flag('nudge')}>
              Pro nudge
            </Pill>
          </Row>
          <Row label="SAMPLE DATA">
            <Pill on={flags.boardTime} onClick={() => flag('boardTime')}>
              Board time 11:23 AM
            </Pill>
            <Pill on={flags.samples} onClick={() => flag('samples')}>
              Sample presets, history and screens
            </Pill>
            <Pill on={flags.empty} onClick={() => flag('empty')}>
              No presets
            </Pill>
            <label className="flex items-center gap-2 text-[13px]">
              Face
              <select
                value={face}
                onChange={(e) => {
                  setFace(e.target.value);
                  send({ action: 'face', face: e.target.value });
                }}
                className="h-9 rounded-full border border-border bg-secondary px-3 text-[13px] text-foreground"
              >
                {FACE_IDS.map((id) => (
                  <option key={id} value={id}>
                    {faceName(id)}
                  </option>
                ))}
              </select>
            </label>
          </Row>
        </div>
      </div>
      <div className="overflow-auto p-6">
        <iframe
          ref={frame}
          key={lang}
          title={`The tool at ${dv[1]}`}
          src={`/dev/tool?frame=1&lang=${lang}`}
          allow="screen-wake-lock; fullscreen"
          className="block rounded-[18px] border-0 shadow-e3"
          style={{ width: dv[2], height: dv[3] }}
        />
      </div>
    </div>
  );
}
