import { describe, expect, it } from 'vitest';

import { endsAt, parseSetup, setupCode, setupFromPath, setupToolHref } from '../../src/lib/share-setup';

describe('shared setup links', () => {
  it('reads face, length and chime from the code', () => {
    expect(parseSetup('flip-45-chime')).toEqual({ face: 'flip', minutes: 45, chime: true });
    expect(parseSetup('ring-0-quiet')).toEqual({ face: 'ring', minutes: 0, chime: false });
  });

  it('refuses unknown faces, lengths and anything extra', () => {
    expect(parseSetup('removed')).toBeNull();
    expect(parseSetup('flip-44-chime')).toBeNull();
    expect(parseSetup('nope-45-chime')).toBeNull();
    expect(parseSetup('flip-45-chime-label')).toBeNull();
  });

  it('round-trips a code and reads it from the path', () => {
    const setup = { face: 'disc', minutes: 120, chime: false } as const;
    expect(setupFromPath(`/s/${setupCode(setup)}`)).toEqual(setup);
    expect(setupFromPath('/s/removed')).toBeNull();
    expect(setupFromPath('/s')).toBeNull();
  });

  it('opens the tool with the preset, face and chime, and holds the start when asked', () => {
    const setup = { face: 'flip', minutes: 45, chime: true } as const;
    expect(setupToolHref(setup, true)).toBe('/?preset=p45&face=flip&chime=on');
    expect(setupToolHref(setup, false)).toBe('/?preset=p45&face=flip&chime=on&autostart=0');
  });

  it('says tomorrow when the end crosses midnight', () => {
    expect(endsAt(new Date(2026, 9, 30, 10, 47), 45, '{time} tomorrow')).toBe('11:32 AM');
    expect(endsAt(new Date(2026, 9, 30, 23, 30), 45, '{time} tomorrow')).toBe('12:15 AM tomorrow');
  });
});
