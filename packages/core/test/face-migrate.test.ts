import { describe, expect, it } from 'vitest';
import { STORAGE_KEYS } from '../src/constants.js';
import { createStorage, memoryAdapter, migrateFace } from '../src/storage.js';
import { FACE_IDS } from '../src/types.js';

describe('face id migration', () => {
  it('keeps every Solar Green face id', () => {
    expect(FACE_IDS).toHaveLength(33);
    for (const id of FACE_IDS) expect(migrateFace(id)).toBe(id);
  });

  it('maps renamed Clear Night faces to their Solar Green face', () => {
    expect(migrateFace('word')).toBe('words');
    expect(migrateFace('matrix')).toBe('led');
    expect(migrateFace('analog', { analog: 'luxe' })).toBe('luxe');
    expect(migrateFace('analog', { analog: 'minimal' })).toBe('analog');
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
});
