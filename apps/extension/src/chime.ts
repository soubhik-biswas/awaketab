type TChime = 'two' | 'bell' | 'off';

// The web tool's synthesised chimes (frequency, start, length in seconds), so there is no audio file to ship.
const TONES: Record<Exclude<TChime, 'off'>, ReadonlyArray<readonly [number, number, number]>> = {
  two: [
    [660, 0, 0.3],
    [880, 0.3, 0.3],
  ],
  bell: [
    [1046.5, 0, 1.4],
    [1568, 0, 0.9],
  ],
};

export function chimeTones(kind: Exclude<TChime, 'off'>): ReadonlyArray<readonly [number, number, number]> {
  return TONES[kind];
}

export function readChime(search: string): { kind: TChime; volume: number } {
  const q = new URLSearchParams(search);
  const raw = q.get('kind');
  const kind: TChime = raw === 'bell' || raw === 'two' ? raw : 'off';
  const level = q.get('volume');
  const v = level === null ? Number.NaN : Number(level);
  return { kind, volume: Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : 0.6 };
}
