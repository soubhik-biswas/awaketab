'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { FACE_IDS, faceName } from '@/components/face';
import { cn } from '@/lib/utils';
import type { TQaMessage } from '@/components/tool/qa-bridge';
import { TOOL_LANGS, type TToolLang } from '@/lib/tool/strings';
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
  ['ended', 'Ended'],
];

const VIEWS: Array<[string, string, TPayload]> = [
  ['welcome', 'First visit', { action: 'view', view: 'welcome' }],
  ['timer', 'Timer', { action: 'view', view: 'timer' }],
  ['faces', 'Faces', { action: 'view', view: 'faces' }],
  ['presets', 'Presets', { action: 'view', view: 'presets' }],
  ['presetsEmpty', 'No presets', { action: 'view', view: 'presets', emptyPresets: true }],
  ['history', 'History', { action: 'view', view: 'history' }],
  ['clear', 'Clear history', { action: 'view', view: 'clear' }],
  ['settings', 'Settings', { action: 'view', view: 'settings' }],
  ['devices', 'Devices', { action: 'view', view: 'devices' }],
  ['fix', 'Fix', { action: 'view', view: 'fix' }],
  ['share', 'Share', { action: 'view', view: 'share' }],
  ['extend', 'Extend', { action: 'view', view: 'extend' }],
  ['more', 'More', { action: 'view', view: 'more' }],
  ['studio', 'Face studio', { action: 'view', view: 'studio' }],
  ['sound', 'Sound', { action: 'view', view: 'sound' }],
  ['account', 'Account', { action: 'view', view: 'account' }],
  ['palette', '⌘K palette', { action: 'view', view: 'palette' }],
  ['paletteExt', '⌘K · “ext”', { action: 'view', view: 'palette', query: 'ext' }],
  ['paletteFace', '⌘K · “face”', { action: 'view', view: 'palette', query: 'face' }],
  ['paletteNone', '⌘K · no match', { action: 'view', view: 'palette', query: 'zzz' }],
  ['focus', 'Fullscreen', { action: 'view', view: 'focus' }],
];

const TIMES: Array<[string, TPayload]> = [
  ['5 min left', { action: 'time', remain: 302 }],
  ['3 s left', { action: 'time', remain: 3 }],
  ['Extend toast', { action: 'extend' }],
  ['No end', { action: 'state', state: 'running', total: 0, remain: 1335 }],
];

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

// Review tooling, not product UI: the design's dashed "Prototype controls" tray, driving the tool in a device-sized frame.
export function QaTray() {
  const frame = useRef<HTMLIFrameElement>(null);
  const [device, setDevice] = useState<(typeof DEVICES)[number][0]>('desktop');
  const [lang, setLang] = useState<TToolLang>('en');
  const [on, setOn] = useState<Record<string, string>>({});
  const [flags, setFlags] = useState({ boardTime: true, samples: true });
  const [face, setFace] = useState('ring');
  const [ready, setReady] = useState(0);

  const send = useCallback((payload: TPayload) => {
    frame.current?.contentWindow?.postMessage({ type: 'at-qa', ...payload }, window.location.origin);
  }, []);

  useEffect(() => {
    const onMsg = (e: MessageEvent<{ type?: string }>) => {
      if (e.origin === window.location.origin && e.data?.type === 'at-qa-ready') setReady((n) => n + 1);
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, []);

  useEffect(() => {
    if (!ready) return;
    send({ action: 'boardTime', on: flags.boardTime });
    send({ action: 'samples', on: flags.samples });
  }, [ready, flags, send]);

  const pick = (group: string, key: string, payload: TPayload) => {
    setOn((o) => ({ ...o, [group]: key }));
    send(payload);
  };
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
            Not part of the product. Jump to any state, view, device, banner or theme; the clock ticks in real seconds.
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
                onClick={() =>
                  pick('state', k, { action: 'state', state: k, total: 3600, remain: k === 'idle' ? 3600 : 2292 })
                }
              >
                {label}
              </Pill>
            ))}
          </Row>
          <Row label="BANNER">
            {(['none', 'offline', 'conflict'] as const).map((k) => (
              <Pill key={k} on={on.banner === k} onClick={() => pick('banner', k, { action: 'banner', banner: k })}>
                {k === 'none' ? 'None' : k === 'offline' ? 'Offline' : 'Other tab'}
              </Pill>
            ))}
          </Row>
          <Row label="THEME">
            {(['system', 'light', 'dark', 'oled'] as const).map((k) => (
              <Pill key={k} on={on.theme === k} onClick={() => pick('theme', k, { action: 'theme', theme: k })}>
                {k === 'system' ? 'Auto' : k === 'oled' ? 'OLED' : k[0]?.toUpperCase() + k.slice(1)}
              </Pill>
            ))}
          </Row>
          <Row label="VIEW">
            {VIEWS.map(([k, label, payload]) => (
              <Pill key={k} on={on.view === k} onClick={() => pick('view', k, payload)}>
                {label}
              </Pill>
            ))}
          </Row>
          <Row label="TIME">
            {TIMES.map(([label, payload]) => (
              <Pill key={label} onClick={() => send(payload)}>
                {label}
              </Pill>
            ))}
          </Row>
          <Row label="SAMPLE DATA">
            <Pill on={flags.boardTime} onClick={() => setFlags((f) => ({ ...f, boardTime: !f.boardTime }))}>
              Board time 11:03 AM
            </Pill>
            <Pill on={flags.samples} onClick={() => setFlags((f) => ({ ...f, samples: !f.samples }))}>
              Sample presets and history
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
          className="block rounded-[18px] border-0 shadow-e3"
          style={{ width: dv[2], height: dv[3] }}
        />
      </div>
    </div>
  );
}
