import type { TLayer, TMix } from '@/lib/tool/sound-mix';

type TNoise = 'white' | 'pink' | 'brown';
type TTexture = TNoise | 'drops' | 'crackle' | 'clack';
type TStereo = [Float32Array, Float32Array];

const rand = (lo: number, hi: number) => lo + Math.random() * (hi - lo);
const pick = <T>(xs: readonly [T, ...T[]]): T => xs[Math.floor(Math.random() * xs.length)] ?? xs[0];
const hz = (midi: number) => 440 * 2 ** ((midi - 69) / 12);
const add = (data: Float32Array, i: number, v: number) => {
  data[i] = (data[i] ?? 0) + v;
};

function level(data: Float32Array, rms: number) {
  let sum = 0;
  for (const v of data) sum += v * v;
  const k = rms / (Math.sqrt(sum / data.length) || 1);
  for (let i = 0; i < data.length; i += 1) data[i] = (data[i] ?? 0) * k;
  return data;
}

// The end of each noise loop is folded into its start, so the loop point cannot be heard.
function noise(kind: TNoise, sr: number, len: number) {
  const fade = Math.floor(sr * 0.3);
  const raw = new Float32Array(len + fade);
  const leak = 1 - (2 * Math.PI * 60) / sr;
  let b0 = 0;
  let b1 = 0;
  let b2 = 0;
  let b3 = 0;
  let b4 = 0;
  let b5 = 0;
  let b6 = 0;
  let last = 0;
  for (let i = 0; i < raw.length; i += 1) {
    const w = Math.random() * 2 - 1;
    if (kind === 'white') raw[i] = w;
    else if (kind === 'pink') {
      b0 = 0.99886 * b0 + w * 0.0555179;
      b1 = 0.99332 * b1 + w * 0.0750759;
      b2 = 0.969 * b2 + w * 0.153852;
      b3 = 0.8665 * b3 + w * 0.3104856;
      b4 = 0.55 * b4 + w * 0.5329522;
      b5 = -0.7616 * b5 - w * 0.016898;
      raw[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362;
      b6 = w * 0.115926;
    } else {
      last = last * leak + w;
      raw[i] = last;
    }
  }
  const out = new Float32Array(len);
  for (let i = 0; i < len; i += 1) {
    const v = raw[i] ?? 0;
    const a = (i / fade) * (Math.PI / 2);
    out[i] = i < fade ? v * Math.sin(a) + (raw[len + i] ?? 0) * Math.cos(a) : v;
  }
  return level(out, 0.2);
}

function burst(
  out: TStereo,
  at: number,
  amp: number,
  tau: number,
  soft: number,
  pan: number,
  shape?: (t: number) => number,
) {
  const [l, r] = out;
  const span = Math.floor(tau * 7);
  let lp = 0;
  for (let j = 0; j < span; j += 1) {
    lp += soft * (Math.random() * 2 - 1 - lp);
    const v = (lp + (shape ? shape(j) : 0)) * amp * Math.exp(-j / tau);
    const i = (at + j) % l.length;
    add(l, i, v * (1 - 0.7 * pan));
    add(r, i, v * (0.3 + 0.7 * pan));
  }
}

function drops(sr: number, len: number): TStereo {
  const out: TStereo = [new Float32Array(len), new Float32Array(len)];
  const count = Math.floor((len / sr) * 130);
  for (let n = 0; n < count; n += 1)
    burst(
      out,
      Math.floor(Math.random() * len),
      0.04 + Math.random() ** 3 * 0.6,
      sr * rand(0.0005, 0.003),
      1,
      Math.random(),
    );
  return out;
}

function crackle(sr: number, len: number): TStereo {
  const out: TStereo = [new Float32Array(len), new Float32Array(len)];
  const count = Math.floor((len / sr) * 11);
  for (let n = 0; n < count; n += 1) {
    const big = Math.random() < 0.08;
    burst(
      out,
      Math.floor(Math.random() * len),
      big ? rand(0.5, 1) : 0.05 + Math.random() ** 4 * 0.6,
      sr * (big ? rand(0.004, 0.011) : rand(0.0003, 0.002)),
      big ? rand(0.08, 0.3) : rand(0.4, 1),
      rand(0.2, 0.8),
    );
  }
  return out;
}

const BAR = 1.18;
const WHEELS: ReadonlyArray<readonly [number, number]> = [
  [0, 1],
  [0.115, 0.8],
  [0.43, 0.9],
  [0.545, 0.7],
];

// Eight bars of wheels over rail joints, each bar a little different.
function clack(sr: number): TStereo {
  const len = Math.floor(BAR * 8 * sr);
  const out: TStereo = [new Float32Array(len), new Float32Array(len)];
  for (let bar = 0; bar < 8; bar += 1)
    for (const [beat, weight] of WHEELS) {
      const f = rand(58, 84);
      burst(
        out,
        Math.floor((bar * BAR + beat + rand(0, 0.008)) * sr),
        weight * rand(0.8, 1.15),
        sr * 0.05,
        0.12,
        0.5,
        (j) => 0.9 * Math.sin((2 * Math.PI * f * j) / sr),
      );
    }
  return out;
}

// Loops of different lengths, long enough that no repeat can be picked out.
const SECONDS: Record<TNoise, number> = { white: 6, pink: 8, brown: 10 };

function bank(ac: BaseAudioContext) {
  const made = new Map<TTexture, AudioBuffer>();
  return (name: TTexture): AudioBuffer => {
    const hit = made.get(name);
    if (hit) return hit;
    const sr = ac.sampleRate;
    const len = (seconds: number) => Math.floor(sr * seconds);
    const data: TStereo =
      name === 'drops'
        ? drops(sr, len(9))
        : name === 'crackle'
          ? crackle(sr, len(7))
          : name === 'clack'
            ? clack(sr)
            : [noise(name, sr, len(SECONDS[name])), noise(name, sr, len(SECONDS[name]))];
    const buf = ac.createBuffer(2, data[0].length, sr);
    buf.getChannelData(0).set(data[0]);
    buf.getChannelData(1).set(data[1]);
    made.set(name, buf);
    return buf;
  };
}

// The music beds share one key (D major), one pulse and one slow walk through related chords, so they never clash.
const BEAT = 1;

interface IChord {
  bass: number;
  notes: readonly number[];
}

interface ISegment {
  at: number;
  end: number;
  chord: IChord;
}

const HOME: IChord = { bass: 38, notes: [50, 57, 64, 66] };
const CHORDS: readonly [IChord, ...IChord[]] = [
  HOME,
  { bass: 43, notes: [55, 59, 62, 66] },
  { bass: 47, notes: [57, 59, 62, 66] },
  { bass: 40, notes: [55, 59, 62, 64] },
  { bass: 45, notes: [57, 62, 64, 67] },
];
const SCALE: readonly number[] = [57, 59, 62, 64, 66, 69, 71, 74, 76, 78, 81];

interface IHarmony {
  at: (t: number) => ISegment;
  grid: (t: number) => number;
}

function harmony(origin: number): IHarmony {
  let segs: ISegment[] = [{ at: origin, end: origin + BEAT * 16, chord: HOME }];
  let tail = segs[0] ?? { at: origin, end: origin + BEAT * 16, chord: HOME };
  return {
    at(t) {
      while (tail.end <= t) {
        const from = tail.chord;
        let chord = pick(CHORDS);
        while (chord === from) chord = pick(CHORDS);
        if (from !== HOME && Math.random() < 0.35) chord = HOME;
        tail = { at: tail.end, end: tail.end + BEAT * pick([16, 20, 24, 28]), chord };
        segs.push(tail);
      }
      // Every layer asks about times from now to a few minutes ahead, so older chords can go.
      if (segs.length > 64) segs = segs.filter((s) => s.end > t - 300);
      for (let i = segs.length - 1; i >= 0; i -= 1) {
        const seg = segs[i];
        if (seg && seg.at <= t) return seg;
      }
      return tail;
    },
    grid: (t) => origin + Math.ceil((t - origin) / (BEAT / 2)) * (BEAT / 2),
  };
}

// The nearest step of the melody scale that belongs to the chord.
function settle(step: number, chord: IChord, lo: number, hi: number) {
  const tones = new Set([chord.bass, ...chord.notes].map((n) => n % 12));
  let best = Math.min(hi, Math.max(lo, step));
  let gap = Infinity;
  for (let i = lo; i <= hi; i += 1) {
    const d = Math.abs(i - step) + Math.random() * 0.5;
    if (tones.has((SCALE[i] ?? 0) % 12) && d < gap) {
      best = i;
      gap = d;
    }
  }
  return best;
}

interface IRig {
  ac: BaseAudioContext;
  out: GainNode;
  loop: (name: TTexture, rate?: number) => AudioBufferSourceNode;
  cycle: (data: Float32Array) => AudioBufferSourceNode;
  osc: (freq: number, type?: OscillatorType) => OscillatorNode;
  gain: (value: number) => GainNode;
  filter: (type: BiquadFilterType, freq: number, q?: number) => BiquadFilterNode;
  pan: (side: number) => StereoPannerNode;
  chain: (...nodes: [AudioNode, ...AudioNode[]]) => void;
  lfo: (freq: number, depth: number, param: AudioParam) => void;
  voice: (node: AudioScheduledSourceNode, start: number, end: number) => void;
  ping: (to: AudioNode, t: number, freq: number, peak: number, decay: number, type?: OscillatorType) => void;
  every: (first: number, run: (t: number) => number) => void;
  tick: (now: number, to: number) => void;
  stop: () => void;
}

function rig(ac: BaseAudioContext, tex: (name: TTexture) => AudioBuffer, to: AudioNode, trim: number): IRig {
  const out = ac.createGain();
  out.gain.value = trim;
  out.connect(to);
  const held: AudioScheduledSourceNode[] = [];
  let timed: Array<{ node: AudioScheduledSourceNode; end: number }> = [];
  const jobs: Array<{ at: number; run: (t: number) => number }> = [];
  const r: IRig = {
    ac,
    out,
    loop(name, rate = 1) {
      const src = ac.createBufferSource();
      const buf = tex(name);
      src.buffer = buf;
      src.loop = true;
      src.playbackRate.value = rate;
      src.start(0, Math.random() * buf.duration);
      held.push(src);
      return src;
    },
    cycle(data) {
      const buf = ac.createBuffer(1, data.length, ac.sampleRate);
      buf.getChannelData(0).set(data);
      const src = ac.createBufferSource();
      src.buffer = buf;
      src.loop = true;
      src.start();
      held.push(src);
      return src;
    },
    osc(freq, type = 'sine') {
      const o = ac.createOscillator();
      o.type = type;
      o.frequency.value = freq;
      o.start();
      held.push(o);
      return o;
    },
    gain(value) {
      const g = ac.createGain();
      g.gain.value = value;
      return g;
    },
    filter(type, freq, q = 0.7) {
      const f = ac.createBiquadFilter();
      f.type = type;
      f.frequency.value = freq;
      f.Q.value = q;
      return f;
    },
    pan(side) {
      const p = ac.createStereoPanner();
      p.pan.value = side;
      return p;
    },
    chain(...nodes) {
      nodes.reduce((a, b) => a.connect(b));
    },
    lfo(freq, depth, param) {
      r.osc(freq).connect(r.gain(depth)).connect(param);
    },
    voice(node, start, end) {
      node.start(start);
      node.stop(end);
      timed.push({ node, end });
    },
    // A struck tone: a few milliseconds of rise so it cannot click, then a natural decay.
    ping(dest, t, freq, peak, decay, type = 'sine') {
      const o = ac.createOscillator();
      o.type = type;
      o.frequency.value = freq;
      const g = r.gain(0);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(peak, t + 0.012);
      g.gain.setTargetAtTime(0, t + 0.012, decay);
      o.connect(g).connect(dest);
      r.voice(o, t, t + 0.012 + decay * 7);
    },
    every(first, run) {
      jobs.push({ at: ac.currentTime + first, run });
    },
    // Events are written onto the audio clock well ahead of time, so a hidden tab's slow timers cannot starve them.
    tick(now, until) {
      for (const job of jobs)
        while (job.at < until) {
          const t = Math.max(job.at, now + 0.05);
          job.at = t + Math.max(0.05, job.run(t));
        }
      timed = timed.filter((v) => v.end > now);
    },
    stop() {
      for (const node of [...held, ...timed.map((v) => v.node)]) {
        try {
          node.stop();
        } catch {
          // Already ended.
        }
      }
      out.disconnect();
    },
  };
  return r;
}

type TBuild = (r: IRig, song: () => IHarmony) => void;

function shore(r: IRig, side: number, first: number) {
  const body = r.filter('lowpass', 380);
  const swell = r.gain(0.07);
  const foam = r.gain(0.01);
  const boom = r.gain(0.15);
  const place = r.pan(side);
  r.chain(r.loop('pink'), body, swell, place, r.out);
  r.chain(r.loop('white'), r.filter('highpass', 2400), r.filter('lowpass', 6500), foam, place);
  r.chain(r.loop('brown'), r.filter('lowpass', 150), boom, place);
  r.every(first, (t) => {
    const rise = rand(2.6, 4.2);
    const fall = rand(5, 8.5);
    const peak = rand(0.6, 1);
    const crest = t + rise;
    swell.gain.setTargetAtTime(peak, t, rise / 3);
    body.frequency.setTargetAtTime(900 + 1500 * peak, t, rise / 3);
    boom.gain.setTargetAtTime(0.9 * peak, t + rise * 0.4, rise / 4);
    foam.gain.setTargetAtTime(0.5 * peak, t + rise * 0.7, 0.5);
    swell.gain.setTargetAtTime(0.07, crest, fall / 3);
    body.frequency.setTargetAtTime(380, crest, fall / 3);
    boom.gain.setTargetAtTime(0.15, crest + 0.4, fall / 5);
    foam.gain.setTargetAtTime(0.01, crest + 1, fall / 2.2);
    return rise + fall * rand(0.55, 0.9);
  });
}

// One chirp of a cricket: a few short pulses, then quiet until the loop comes round.
function chirp(sr: number, period: number, pulses: number) {
  const data = new Float32Array(Math.floor(sr * period));
  const on = Math.floor(sr * 0.016);
  const gap = Math.floor(sr * 0.014);
  for (let p = 0; p < pulses; p += 1)
    for (let j = 0; j < on; j += 1) data[p * (on + gap) + j] = 0.5 - 0.5 * Math.cos((2 * Math.PI * j) / on);
  return data;
}

const CRICKETS: ReadonlyArray<readonly [number, number, number, number]> = [
  [4150, 0.57, 3, -0.6],
  [4480, 0.66, 4, 0.5],
  [3820, 0.49, 3, 0.1],
];

const PAD_VOICE: ReadonlyArray<readonly [OscillatorType, number, number]> = [
  ['sine', 0, 1],
  ['triangle', 7, 0.6],
  ['sawtooth', -7, 0.12],
];
const PAD_SIDES: readonly number[] = [-0.45, 0.3, -0.15, 0.45];

const BELL: ReadonlyArray<readonly [number, number, number]> = [
  [1, 1, 1],
  [2, 0.32, 0.5],
  [2.76, 0.12, 0.3],
  [4.07, 0.05, 0.18],
];

const BUILD: Record<TLayer, TBuild> = {
  rain(r) {
    const body = r.gain(1);
    r.lfo(0.07, 0.1, body.gain);
    r.lfo(0.113, 0.07, body.gain);
    r.chain(r.loop('pink'), r.filter('highpass', 420), r.filter('lowpass', 6800), r.gain(0.8), body, r.out);
    r.chain(r.loop('brown'), r.filter('bandpass', 190, 0.6), r.gain(0.9), body);
    r.chain(r.loop('drops'), r.filter('bandpass', 2800, 0.5), r.gain(1.4), body);
    r.chain(r.loop('drops', 0.77), r.filter('highpass', 900), r.gain(0.6), body);
  },
  ocean(r) {
    shore(r, -0.45, 0.2);
    shore(r, 0.45, rand(3, 6));
  },
  stream(r) {
    r.chain(r.loop('pink'), r.filter('highpass', 350), r.filter('lowpass', 4500), r.gain(0.35), r.out);
    for (const f of [620, 1050, 1700, 2700]) {
      const band = r.filter('bandpass', f, 7);
      const vol = r.gain(0.9);
      r.loop('brown', rand(0.03, 0.07)).connect(r.gain(1800)).connect(band.detune);
      r.loop('brown', rand(0.02, 0.05)).connect(r.gain(2.2)).connect(vol.gain);
      r.chain(r.loop('white'), band, vol, r.pan(rand(-0.5, 0.5)), r.out);
    }
  },
  wind(r) {
    const body = r.filter('bandpass', 420, 0.8);
    const gust = r.gain(0.4);
    const reed = r.filter('bandpass', 1100, 8);
    const sing = r.gain(0.02);
    r.chain(r.loop('pink'), body, gust, r.out);
    r.chain(r.loop('brown'), r.filter('lowpass', 170), r.gain(0.5), gust);
    r.chain(r.loop('pink', 0.9), reed, sing, r.out);
    r.every(0.3, (t) => {
      const u = Math.random();
      const tc = rand(0.9, 2.2);
      body.frequency.setTargetAtTime(260 + 560 * u, t, tc);
      gust.gain.setTargetAtTime(0.25 + 0.75 * u * u, t, tc);
      reed.frequency.setTargetAtTime(850 + 800 * u, t, tc);
      sing.gain.setTargetAtTime(0.25 * u ** 3, t, tc);
      return rand(2.2, 5.5);
    });
  },
  crickets(r) {
    for (const [freq, period, pulses, side] of CRICKETS) {
      const am = r.gain(0);
      const near = r.gain(1);
      r.cycle(chirp(r.ac.sampleRate, period, pulses)).connect(am.gain);
      r.chain(r.osc(freq), am, near, r.pan(side), r.out);
      r.every(rand(4, 12), (t) => {
        near.gain.setTargetAtTime(Math.random() < 0.72 ? rand(0.5, 1) : 0, t, 0.2);
        return rand(5, 18);
      });
    }
    for (const [freq, rate, amp] of [
      [2900, 41, 0.05],
      [3150, 37, 0.035],
    ] as const) {
      const am = r.gain(0.5);
      r.lfo(rate, 0.5, am.gain);
      r.chain(r.osc(freq), am, r.gain(amp), r.out);
    }
    r.chain(r.loop('pink'), r.filter('bandpass', 500, 0.5), r.gain(0.12), r.out);
  },
  thunder(r) {
    const tone = r.filter('lowpass', 140);
    const roll = r.gain(0);
    const air = r.gain(0);
    r.chain(r.loop('brown'), tone, roll, r.out);
    r.chain(r.loop('pink'), r.filter('bandpass', 260, 0.6), air, r.out);
    r.every(rand(1.5, 3), (t) => {
      const peak = rand(0.45, 1);
      let at = t;
      tone.frequency.setTargetAtTime(rand(260, 420), t, 0.15);
      roll.gain.setTargetAtTime(peak, t, rand(0.12, 0.45));
      air.gain.setTargetAtTime(peak * 0.35, t, 0.2);
      tone.frequency.setTargetAtTime(110, t + 0.7, 1.4);
      air.gain.setTargetAtTime(0, t + 0.9, 0.8);
      const rolls = 2 + Math.floor(Math.random() * 4);
      for (let i = 0; i < rolls; i += 1) {
        at += rand(0.5, 1.5);
        roll.gain.setTargetAtTime(peak * rand(0.3, 0.9) * 0.8 ** i, at, rand(0.12, 0.4));
      }
      at += rand(0.6, 1.2);
      roll.gain.setTargetAtTime(0, at, rand(1.4, 2.6));
      return at - t + rand(16, 45);
    });
  },
  cafe(r) {
    const room = r.gain(1);
    room.connect(r.out);
    for (const [freq, amp] of [
      [300, 1],
      [480, 0.9],
      [760, 0.65],
      [1150, 0.4],
      [1750, 0.2],
      [2600, 0.08],
    ] as const) {
      const voice = r.gain(0.5);
      r.lfo(rand(1.6, 3.2), 0.2, voice.gain);
      r.lfo(rand(3.4, 6.1), 0.14, voice.gain);
      r.lfo(rand(0.11, 0.37), 0.16, voice.gain);
      r.chain(
        r.loop('pink', rand(0.85, 1.15)),
        r.filter('bandpass', freq * rand(0.94, 1.06), 2.4),
        voice,
        r.gain(amp),
        r.pan(rand(-0.7, 0.7)),
        room,
      );
    }
    r.chain(r.loop('brown'), r.filter('lowpass', 240), r.gain(0.3), room);
    const china = r.filter('lowpass', 5200);
    china.connect(r.out);
    r.every(rand(2, 6), (t) => {
      const place = r.pan(rand(-0.8, 0.8));
      place.connect(china);
      const freq = rand(2100, 3400);
      const peak = rand(0.012, 0.035);
      const twice = Math.random() < 0.4 ? rand(0.08, 0.16) : 0;
      for (const at of twice ? [t, t + twice] : [t]) {
        r.ping(place, at, freq, peak, rand(0.05, 0.11));
        r.ping(place, at, freq * 2.31, peak * 0.4, 0.04);
      }
      return rand(5, 16);
    });
  },
  fire(r) {
    const roar = r.gain(0.65);
    r.lfo(0.29, 0.09, roar.gain);
    r.lfo(0.77, 0.07, roar.gain);
    r.lfo(2.1, 0.04, roar.gain);
    r.chain(r.loop('brown'), r.filter('lowpass', 420), roar, r.out);
    r.chain(r.loop('pink'), r.filter('bandpass', 2200, 0.5), r.gain(0.1), r.out);
    const snap = r.filter('lowpass', 7000);
    snap.connect(r.out);
    r.chain(r.loop('crackle'), r.filter('highpass', 700), snap);
    r.chain(r.loop('crackle', 0.71), r.filter('highpass', 350), r.gain(0.7), snap);
  },
  train(r) {
    const sway = r.gain(0.85);
    r.lfo(0.09, 0.1, sway.gain);
    r.lfo(0.23, 0.05, sway.gain);
    r.chain(r.loop('brown'), r.filter('lowpass', 190), sway, r.out);
    r.chain(r.loop('brown', 0.8), r.filter('bandpass', 96, 5), r.gain(0.6), sway);
    r.chain(r.loop('pink'), r.filter('bandpass', 1300, 0.4), r.gain(0.07), r.out);
    const wheels = r.loop('clack');
    r.chain(wheels, r.filter('lowpass', 1500), r.gain(0.6), r.out);
    r.every(4, (t) => {
      wheels.playbackRate.setTargetAtTime(rand(0.93, 1.07), t, 4);
      return rand(9, 24);
    });
  },
  fan(r) {
    r.chain(r.loop('pink'), r.filter('highpass', 70), r.filter('lowpass', 1000), r.out);
    r.chain(r.loop('pink', 0.8), r.filter('bandpass', 430, 3), r.gain(0.25), r.out);
    const blade = r.gain(0.85);
    r.lfo(6.3, 0.15, blade.gain);
    blade.connect(r.out);
    r.chain(r.osc(94), r.gain(0.05), blade);
    r.chain(r.osc(188), r.gain(0.022), blade);
    r.chain(r.osc(282), r.gain(0.008), blade);
  },
  brown(r) {
    r.chain(r.loop('brown'), r.out);
  },
  pink(r) {
    r.chain(r.loop('pink'), r.filter('lowpass', 11000), r.out);
  },
  white(r) {
    const shelf = r.filter('highshelf', 6500);
    shelf.gain.value = -6;
    r.chain(r.loop('white'), shelf, r.filter('lowpass', 12000), r.out);
  },
  // Each chord swells in over a few seconds while the last one lets go, so the pad never restarts.
  pad(r, song) {
    const tone = r.filter('lowpass', 900, 0.4);
    r.lfo(0.019, 260, tone.frequency);
    r.lfo(0.047, 120, tone.frequency);
    tone.connect(r.out);
    r.every(0, (t) => {
      const seg = song().at(t + 0.001);
      const release = Math.max(t + 2, seg.end - 0.5);
      const voice = (midi: number, amp: number, side: number) => {
        const env = r.gain(0);
        env.gain.setValueAtTime(0, t);
        env.gain.setTargetAtTime(amp, t, 1.7);
        env.gain.setTargetAtTime(0, release, 2.3);
        r.chain(env, r.pan(side), tone);
        for (const [type, cents, amount] of PAD_VOICE) {
          const o = r.ac.createOscillator();
          o.type = type;
          o.frequency.value = hz(midi);
          o.detune.value = cents;
          r.chain(o, r.gain(amount), env);
          r.voice(o, t, release + 15);
        }
      };
      seg.chord.notes.forEach((n, i) => voice(n, 0.16, PAD_SIDES[i] ?? 0));
      voice(seg.chord.bass, 0.22, 0);
      return Math.max(0.5, seg.end - t);
    });
  },
  // Short phrases that walk the pentatonic scale, then rest; an echo on the beat carries each tail.
  keys(r, song) {
    const tone = r.filter('lowpass', 2300, 0.3);
    const echo = r.ac.createDelay(2);
    echo.delayTime.value = BEAT * 0.75;
    const damp = r.filter('lowpass', 1300);
    tone.connect(r.out);
    r.chain(tone, echo, damp, r.gain(0.36), echo);
    r.chain(damp, r.gain(0.55), r.out);
    let step = 5;
    const note = (t: number, at: number, vel: number) => {
      const midi = SCALE[at] ?? 62;
      const tau = 1.9 - (midi - 57) * 0.03;
      const place = r.pan(rand(-0.35, 0.35));
      place.connect(tone);
      r.ping(place, t, hz(midi), vel * 0.5, tau);
      r.ping(place, t, hz(midi) * 2, vel * 0.13, tau * 0.3);
      r.ping(place, t, hz(midi), vel * 0.08, tau * 0.6, 'triangle');
    };
    r.every(rand(0.4, 1.5), (t0) => {
      const start = song().grid(t0);
      const count = 2 + Math.floor(Math.random() * 4);
      let at = start;
      step = settle(step, song().at(start).chord, 1, SCALE.length - 2);
      for (let n = 0; n < count; n += 1) {
        const vel = rand(0.5, 1) * (1 - 0.1 * Math.abs(n - (count - 1) / 2));
        note(at + rand(0, 0.02), step, vel);
        if (Math.random() < 0.22 && step >= 2) note(at + rand(0.03, 0.06), step - 2, vel * 0.55);
        step = Math.min(SCALE.length - 1, Math.max(0, step + pick([-2, -1, -1, 1, 1, 2])));
        at += BEAT * pick([0.5, 1, 1, 1.5, 2]);
      }
      return at - t0 + BEAT * rand(2.5, 7);
    });
  },
  drone(r) {
    const root = hz(38);
    const partial = (freq: number, amp: number, rate: number, type: OscillatorType = 'sine') => {
      const g = r.gain(amp);
      r.lfo(rate, amp * 0.35, g.gain);
      r.chain(r.osc(freq, type), g, r.out);
    };
    partial(root, 0.5, 0.021);
    partial(hz(45), 0.26, 0.034);
    partial(root * 2 + 0.3, 0.2, 0.047);
    partial(root * 2 - 0.27, 0.2, 0.027);
    partial(hz(57), 0.06, 0.013, 'triangle');
    const grit = r.filter('lowpass', 240);
    r.lfo(0.011, 90, grit.frequency);
    r.chain(r.osc(root, 'sawtooth'), grit, r.gain(0.16), r.out);
  },
  bells(r, song) {
    const tone = r.filter('lowpass', 4200);
    tone.connect(r.out);
    r.every(rand(1, 3), (t0) => {
      const start = song().grid(t0);
      const count = pick([1, 1, 2, 2, 3]);
      let step = settle(Math.floor(rand(5, 11)), song().at(start).chord, 5, SCALE.length - 1);
      for (let n = 0; n < count; n += 1) {
        const at = start + n * BEAT * 0.5 + rand(0, 0.015);
        const vel = rand(0.45, 1) * 0.85 ** n;
        const place = r.pan(rand(-0.6, 0.6));
        place.connect(tone);
        for (const [ratio, amp, hold] of BELL)
          r.ping(place, at, hz(SCALE[step] ?? 74) * ratio, vel * amp * 0.4, 2.6 * hold);
        step = Math.min(SCALE.length - 1, Math.max(5, step + pick([-1, 1, 2])));
      }
      return BEAT * rand(5, 12);
    });
  },
};

const KEYS = Object.keys(BUILD) as TLayer[];

// Each layer is trimmed towards the same loudness at full level, about -18 dBFS before the master: tones near 4 kHz
// and white noise sit lower because the ear hears them as louder, deep layers a little higher.
const TRIM: Record<TLayer, number> = {
  rain: 1,
  ocean: 1.1,
  stream: 2,
  wind: 2.2,
  crickets: 0.3,
  thunder: 1,
  cafe: 1.6,
  fire: 1,
  train: 0.65,
  fan: 1,
  brown: 0.85,
  pink: 0.65,
  white: 0.7,
  pad: 0.4,
  keys: 0.6,
  drone: 0.32,
  bells: 0.8,
};

// How much of each music bed is sent to the shared hall.
const WET: Partial<Record<TLayer, number>> = { pad: 0.35, keys: 0.6, drone: 0.2, bells: 0.8 };

// The compressor adds about 5.5 dB of make-up gain of its own at these settings; this keeps 3 dB of it.
const MAKEUP = 0.75;

const curve = (v: number) => (Math.min(100, Math.max(0, v)) / 100) ** 1.7;

// A dark hall: filtered noise that fades over about three seconds.
function hall(ac: BaseAudioContext) {
  const sr = ac.sampleRate;
  const len = Math.floor(sr * 3.4);
  const pre = Math.floor(sr * 0.018);
  const buf = ac.createBuffer(2, len, sr);
  for (let c = 0; c < 2; c += 1) {
    const data = new Float32Array(len);
    let lp = 0;
    for (let i = pre; i < len; i += 1) {
      const t = (i - pre) / sr;
      lp += (0.06 + 0.5 * Math.exp(-t * 1.6)) * (Math.random() * 2 - 1 - lp);
      data[i] = lp * Math.exp(-t * 2.1);
    }
    buf.getChannelData(c).set(level(data, 1 / Math.sqrt(len)));
  }
  return buf;
}

// Past 0.7 the output bends towards 0.98 and never reaches full scale, whatever is stacked behind it.
function guardCurve() {
  const data = new Float32Array(4097);
  for (let i = 0; i < data.length; i += 1) {
    const x = (i / 2048 - 1) * 2;
    const a = Math.abs(x);
    data[i] = Math.sign(x) * (a <= 0.7 ? a : 0.7 + 0.28 * Math.tanh((a - 0.7) / 0.28));
  }
  return data;
}

interface ILayer {
  level: GainNode;
  rig: IRig;
  dieAt: number;
}

export interface IEngine {
  set: (mix: TMix, master: number, playing: boolean) => void;
  tick: (until?: number) => void;
  active: () => boolean;
}

export function createEngine(ac: BaseAudioContext, to: AudioNode, onIdle?: () => void): IEngine {
  const tex = bank(ac);
  const bus = ac.createGain();
  bus.gain.value = 0;
  const cut = ac.createBiquadFilter();
  cut.type = 'highpass';
  cut.frequency.value = 28;
  const comp = ac.createDynamicsCompressor();
  comp.threshold.value = -16;
  comp.knee.value = 10;
  comp.ratio.value = 5;
  comp.attack.value = 0.012;
  comp.release.value = 0.3;
  const even = ac.createGain();
  even.gain.value = MAKEUP * 0.5;
  const guard = ac.createWaveShaper();
  guard.curve = guardCurve();
  guard.oversample = '2x';
  bus.connect(cut).connect(comp).connect(even).connect(guard).connect(to);

  const live = new Map<TLayer, ILayer>();
  let chords: IHarmony | null = null;
  let room: GainNode | null = null;
  let playing = false;
  let quietAt = 0;
  let timer: ReturnType<typeof setInterval> | null = null;

  const song = () => (chords ??= harmony(ac.currentTime));
  const hidden = () => typeof document !== 'undefined' && document.visibilityState === 'hidden';

  const reverb = () => {
    if (room) return room;
    room = ac.createGain();
    const conv = ac.createConvolver();
    conv.normalize = false;
    conv.buffer = hall(ac);
    const back = ac.createGain();
    // The hall's energy sits below a few kHz, so a tone in that band comes back several dB louder than it went in.
    back.gain.value = 0.35;
    room.connect(conv).connect(back).connect(bus);
    return room;
  };

  const make = (key: TLayer): ILayer => {
    const lvl = ac.createGain();
    lvl.gain.value = 0;
    lvl.connect(bus);
    const wet = WET[key];
    if (wet) {
      const send = ac.createGain();
      send.gain.value = wet;
      lvl.connect(send).connect(reverb());
    }
    const r = rig(ac, tex, lvl, TRIM[key]);
    BUILD[key](r, song);
    const layer = { level: lvl, rig: r, dieAt: Infinity };
    live.set(key, layer);
    return layer;
  };

  const drop = (key: TLayer, layer: ILayer) => {
    layer.rig.stop();
    layer.level.disconnect();
    live.delete(key);
  };

  const tick = (until?: number) => {
    const now = ac.currentTime;
    const ahead = until ?? now + (hidden() ? 150 : 14);
    for (const [key, layer] of live) {
      if (layer.dieAt <= now || (!playing && now >= quietAt)) drop(key, layer);
      else layer.rig.tick(now, ahead);
    }
    if (live.size || !timer) return;
    clearInterval(timer);
    timer = null;
    document.removeEventListener('visibilitychange', onVisibility);
    onIdle?.();
  };
  const onVisibility = () => tick();

  return {
    set(mix, master, on) {
      const t = ac.currentTime;
      const fresh = on && !playing;
      playing = on;
      bus.gain.cancelScheduledValues(t);
      bus.gain.setTargetAtTime(on ? curve(master) : 0, t, fresh ? 0.8 : on ? 0.12 : 0.7);
      if (!on) quietAt = t + 6;
      else
        for (const key of KEYS) {
          const target = curve(mix[key]);
          const layer = live.get(key) ?? (target > 0 ? make(key) : null);
          if (!layer) continue;
          layer.level.gain.cancelScheduledValues(t);
          layer.level.gain.setTargetAtTime(target, t, 0.3);
          layer.dieAt = target > 0 ? Infinity : t + 2.5;
        }
      tick();
      if (timer || !live.size || typeof document === 'undefined') return;
      timer = setInterval(tick, 1000);
      document.addEventListener('visibilitychange', onVisibility);
    },
    tick,
    active: () => live.size > 0,
  };
}
