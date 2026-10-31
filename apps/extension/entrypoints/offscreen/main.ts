import { chimeTones, readChime } from '../../src/chime';

// The worker opens this page with ?kind=&volume= when a session ends and closes it a few seconds later.
const { kind, volume } = readChime(location.search);
const Ctor = window.AudioContext as typeof AudioContext | undefined;
if (Ctor && kind !== 'off') {
  const ac = new Ctor();
  const t0 = ac.currentTime;
  for (const [freq, at, len] of chimeTones(kind)) {
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
