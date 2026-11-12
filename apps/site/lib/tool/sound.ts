import type { TChimeKind } from '@/lib/tool/settings';
import type { TSoundMix, TMixKey } from '@/lib/tool/pro';

type TWindowAudio = { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext };

let ctx: AudioContext | null = null;

function audio(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const w = window as TWindowAudio;
    const Ctor = w.AudioContext ?? w.webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
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
}

interface ILayer {
  gain: GainNode;
  stop: () => void;
}

const layers = new Map<TMixKey, ILayer>();
let bus: GainNode | null = null;

function noiseBuffer(ac: AudioContext, brown: boolean): AudioBuffer {
  const len = ac.sampleRate * 4;
  const buf = ac.createBuffer(1, len, ac.sampleRate);
  const data = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < len; i += 1) {
    const white = Math.random() * 2 - 1;
    if (brown) {
      last = (last + 0.02 * white) / 1.02;
      data[i] = last * 3.5;
    } else data[i] = white;
  }
  return buf;
}

function makeLayer(ac: AudioContext, out: AudioNode, key: TMixKey): ILayer {
  const gain = ac.createGain();
  gain.gain.value = 0;
  gain.connect(out);
  const src = ac.createBufferSource();
  src.buffer = noiseBuffer(ac, key === 'brown' || key === 'cafe');
  src.loop = true;
  const filter = ac.createBiquadFilter();
  const lfo = ac.createOscillator();
  const lfoGain = ac.createGain();
  if (key === 'rain') {
    filter.type = 'highpass';
    filter.frequency.value = 900;
  } else if (key === 'cafe') {
    filter.type = 'bandpass';
    filter.frequency.value = 500;
    filter.Q.value = 0.7;
  } else if (key === 'fire') {
    filter.type = 'lowpass';
    filter.frequency.value = 1200;
  } else {
    filter.type = 'lowpass';
    filter.frequency.value = 600;
  }
  lfo.frequency.value = key === 'fire' ? 7 : 0.2;
  lfoGain.gain.value = key === 'fire' ? 0.25 : 0.1;
  const swell = ac.createGain();
  swell.gain.value = 0.8;
  lfo.connect(lfoGain).connect(swell.gain);
  src.connect(filter).connect(swell).connect(gain);
  src.start();
  lfo.start();
  return {
    gain,
    stop: () => {
      src.stop();
      lfo.stop();
      gain.disconnect();
    },
  };
}

// The ambient mix plays only while the screen is awake and fades out the moment it is not.
export function setAmbient(mix: TSoundMix, playing: boolean) {
  const ac = playing ? audio() : ctx;
  if (!ac) return;
  if (!bus) {
    bus = ac.createGain();
    bus.connect(ac.destination);
  }
  const t = ac.currentTime;
  for (const key of Object.keys(mix) as TMixKey[]) {
    const level = playing ? (mix[key] / 100) ** 2 * 0.5 : 0;
    let layer = layers.get(key);
    if (!layer && level > 0) {
      layer = makeLayer(ac, bus, key);
      layers.set(key, layer);
    }
    if (!layer) continue;
    layer.gain.gain.cancelScheduledValues(t);
    layer.gain.gain.setTargetAtTime(level, t, playing ? 0.4 : 0.6);
  }
}

let previewTimer: ReturnType<typeof setTimeout> | null = null;

export function previewAmbient(mix: TSoundMix, seconds = 5) {
  setAmbient(mix, true);
  if (previewTimer) clearTimeout(previewTimer);
  previewTimer = setTimeout(() => {
    previewTimer = null;
    setAmbient(mix, false);
  }, seconds * 1000);
}
