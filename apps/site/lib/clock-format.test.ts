import { describe, expect, it } from 'vitest';
import { clockDial, clockText, hindiDayPeriod, localeDial } from './clock-format';
import { formatTime } from './format';
import { clockTime } from './tool/clock';

const at = (h: number, m: number) => new Date(2026, 10, 14, h, m).getTime();

const HINDI: Array<[number, number, string]> = [
  [0, 30, 'रात 12:30'],
  [5, 0, 'सुबह 5:00'],
  [11, 59, 'सुबह 11:59'],
  [12, 0, 'दोपहर 12:00'],
  [15, 59, 'दोपहर 3:59'],
  [16, 0, 'शाम 4:00'],
  [19, 59, 'शाम 7:59'],
  [20, 0, 'रात 8:00'],
  [23, 42, 'रात 11:42'],
];

describe('Hindi day periods', () => {
  it.each(HINDI)('%i:%i reads %s', (h, m, text) => {
    expect(clockText(h, m, 'hi', 12)).toBe(text);
    expect(clockTime(at(h, m), 'hi', 12)).toBe(text);
    expect(formatTime(at(h, m), 'hi', 12)).toBe(text);
    expect(formatTime(at(h, m), 'hi')).toBe(text);
  });

  it('changes period at 4, 12, 16 and 20', () => {
    expect([3, 4, 11, 12, 15, 16, 19, 20, 23, 0].map(hindiDayPeriod)).toEqual([
      'रात',
      'सुबह',
      'सुबह',
      'दोपहर',
      'दोपहर',
      'शाम',
      'शाम',
      'रात',
      'रात',
      'रात',
    ]);
  });

  it('drops the period on the 24-hour dial', () => {
    expect(clockTime(at(23, 42), 'hi', 24)).toBe('23:42');
    expect(formatTime(at(23, 42), 'hi', 24)).not.toMatch(/रात|दोपहर|सुबह|शाम/u);
  });
});

describe('Japanese and Chinese keep their clock', () => {
  it.each([
    [0, 30, '午前12:30', '上午12:30'],
    [11, 42, '午前11:42', '上午11:42'],
    [12, 0, '午後12:00', '下午12:00'],
    [14, 5, '午後2:05', '下午2:05'],
    [23, 42, '午後11:42', '下午11:42'],
  ])('%i:%i', (h, m, ja, zh) => {
    expect(clockTime(at(h, m), 'ja', 12)).toBe(ja);
    expect(clockTime(at(h, m), 'zh', 12)).toBe(zh);
  });

  it('on the 24-hour dial', () => {
    expect(clockTime(at(9, 5), 'ja', 24)).toBe('9:05');
    expect(clockTime(at(14, 5), 'zh', 24)).toBe('14:05');
  });
});

describe('the 12-hour and 24-hour setting', () => {
  it.each(['de', 'es', 'fr', 'pt-br'] as const)('%s follows it', (lang) => {
    expect(clockTime(at(14, 5), lang, 24)).toBe('14:05');
    expect(clockTime(at(14, 5), lang, 12)).toBe('2:05 PM');
    expect(clockTime(at(0, 5), lang, 12)).toBe('12:05 AM');
  });

  it('English pads the 24-hour clock and reads AM and PM', () => {
    expect(clockTime(at(9, 5), 'en', 24)).toBe('09:05');
    expect(clockTime(at(9, 5), 'en', 12)).toBe('9:05 AM');
    expect(clockTime(at(12, 0), 'en', 12)).toBe('12:00 PM');
  });

  it('follows the language until a dial is picked', () => {
    expect(['en', 'ja', 'zh', 'hi'].map(localeDial)).toEqual([12, 12, 12, 12]);
    expect(['de', 'es', 'fr', 'pt-br'].map(localeDial)).toEqual([24, 24, 24, 24]);
    expect(clockDial('de', null)).toBe(24);
    expect(clockDial('de', false)).toBe(12);
    expect(clockDial('en', null)).toBe(12);
    expect(clockDial('en', true)).toBe(24);
  });
});
