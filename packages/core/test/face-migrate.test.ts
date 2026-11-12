import { describe, expect, it } from 'vitest';
import { STORAGE_KEYS } from '../src/constants.js';
import { createStorage, memoryAdapter, migrateFace } from '../src/storage.js';
import { FACE_IDS } from '../src/types.js';

describe('face id migration', () => {
  it('keeps every Glance face id', () => {
    expect(FACE_IDS).toHaveLength(46);
    for (const id of FACE_IDS) expect(migrateFace(id)).toBe(id);
  });

  it('maps renamed faces to their Glance face', () => {
    expect(migrateFace('word')).toBe('words');
    expect(migrateFace('matrix')).toBe('lcd');
    expect(migrateFace('analog', { analog: 'luxe' })).toBe('luxe');
    expect(migrateFace('analog', { analog: 'minimal' })).toBe('analog');
  });

  it('moves the retired LED, Terminal and Pulse faces to the closest face that stays', () => {
    expect(migrateFace('led')).toBe('lcd');
    expect(migrateFace('terminal')).toBe('lcd');
    expect(migrateFace('pulse')).toBe('waveform');
    for (const id of ['led', 'terminal', 'pulse']) expect(FACE_IDS as readonly string[]).not.toContain(id);
  });

  it('reads unknown or broken values as Ring', () => {
    expect(migrateFace('sundial')).toBe('ring');
    expect(migrateFace(7)).toBe('ring');
    expect(migrateFace(null)).toBe('ring');
  });

  it('migrates the stored settings record and drops the old face styles', () => {
    const mem = memoryAdapter();
    mem.set(STORAGE_KEYS.settings, JSON.stringify({ v: 1, face: 'analog', faceStyles: { analog: 'luxe' } }));
    const s = createStorage(mem).settings();
    expect(s.face).toBe('luxe');
    expect('faceStyles' in s).toBe(false);
  });

  it('migrates a stored retired face on read', () => {
    const mem = memoryAdapter();
    mem.set(STORAGE_KEYS.settings, JSON.stringify({ v: 1, face: 'pulse' }));
    expect(createStorage(mem).settings().face).toBe('waveform');
  });
});
