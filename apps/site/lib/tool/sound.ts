import type { TChimeKind } from '@/lib/tool/settings';
import type { TSoundMix } from '@/lib/tool/pro';
import type { IEngine } from '@/lib/tool/sound-engine';
import { getSound, subscribeSound, type TMix } from '@/lib/tool/sound-mix';

type TWindowAudio = { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext };

let ctx: AudioContext | null = null;
let engine: IEngine | null = null;
let loading = false;
let chimeUntil = 0;

function audio(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const w = window as TWindowAudio;
    const Ctor = w.AudioContext ?? w.webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  if (ctx.state !== 'running' && ctx.state !== 'closed') void ctx.resume();
  return ctx;
}

// With nothing left to play the audio clock is stopped, so a silent tab does no audio work at all.
function rest() {
  if (!ctx || ctx.state !== 'running' || engine?.active() || performance.now() < chimeUntil) return;
  void ctx.suspend();
}

const TONES: Record<Exclude<TChimeKind, 'off'>, Array<[number, number, number]>> = {
  two: [
    [660, 0, 0.3],
    [880, 0.3, 0.3],
  ],
  bell: [
    [1046.5, 0, 1.4],
    [1568, 0, 0.9],
  ],
};

// Synthesised, so there is no audio file to load (docs/04 §10).
export function playChime(kind: TChimeKind, volume = 0.6) {
  if (kind === 'off') return;
  const ac = audio();
  if (!ac) return;
  const t0 = ac.currentTime;
  for (const [freq, at, len] of TONES[kind]) {
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, t0 + at);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, volume * 0.4), t0 + at + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + at + len);
    osc.connect(gain).connect(ac.destination);
    osc.start(t0 + at);
    osc.stop(t0 + at + len + 0.05);
  }
  chimeUntil = performance.now() + 2500;
  setTimeout(rest, 2600);
}

let mix: TMix | null = null;
let wanted = false;
let previewTimer: ReturnType<typeof setTimeout> | null = null;
let listening = false;
let unlocking = false;

// A browser may hold audio back until the page is touched; the first tap or key then lets it through.
function unlock() {
  if (unlocking) return;
  unlocking = true;
  const go = () => {
    unlocking = false;
    window.removeEventListener('pointerdown', go, true);
    window.removeEventListener('keydown', go, true);
    if (wanted || previewTimer) audio();
  };
  window.addEventListener('pointerdown', go, true);
  window.addEventListener('keydown', go, true);
}

function sync() {
  const playing = wanted || previewTimer !== null;
  if (!playing && !engine) return;
  const ac = playing ? audio() : ctx;
  if (!ac) return;
  if (!engine) {
    if (loading) return;
    loading = true;
    // The synthesiser is fetched the first time sound is wanted, so a silent visit never pays for it.
    void import('@/lib/tool/sound-engine').then(
      (m) => {
        engine = m.createEngine(ac, ac.destination, rest);
        sync();
      },
      () => {
        loading = false;
      },
    );
    return;
  }
  if (playing && ac.state !== 'running') unlock();
  engine.set(mix ?? getSound().mix, getSound().master, playing);
  if (!engine.active()) rest();
}

function listen() {
  if (listening) return;
  listening = true;
  subscribeSound(() => {
    mix = getSound().mix;
    sync();
  });
}

// The ambient mix plays while a session runs (awake, or a hidden tab waiting for its tap) and fades out otherwise.
export function setAmbient(next: TSoundMix, playing: boolean) {
  listen();
  mix = { ...getSound().mix, ...next };
  wanted = playing;
  sync();
}

// A short listen while no session is running; it ends by itself.
export function previewAmbient(next: TSoundMix, seconds = 5) {
  listen();
  mix = { ...getSound().mix, ...next };
  if (previewTimer) clearTimeout(previewTimer);
  previewTimer = setTimeout(() => {
    previewTimer = null;
    sync();
  }, seconds * 1000);
  sync();
}
