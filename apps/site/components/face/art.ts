import type { CSSProperties } from 'react';
import type { TFaceTheme } from './model';

export type TThemed<T> = Readonly<Record<TFaceTheme, T>>;

// Fixed art colours shared by several faces. Each face's own art colours sit at the top of its module.
export const SNOW = '#EEF2FA';
export const FLIP_CARD: TThemed<string> = { light: '#1D273F', dark: '#1D273F', oled: '#0E1424' };
// The sub-dial and digital-window ground of Chronograph and Pilot.
export const SUB_DIAL: TThemed<string> = { light: '#F1EEE7', dark: '#0A0F1C', oled: '#05070C' };
export const LCD_GROUND: TThemed<string> = { light: 'var(--accent)', dark: '#06180D', oled: '#030D07' };
export const WHITE = (a: number): string => `rgba(255,255,255,${a})`;
export const BLACK = (a: number): string => `rgba(0,0,0,${a})`;
export const NAVY = (a: number): string => `rgba(11,16,32,${a})`;

export const PLATE: TThemed<CSSProperties> = {
  light: {
    background: 'radial-gradient(circle at 50% 28%, #FFFFFF 0%, #F5F2EB 62%, #ECE8DF 100%)',
    boxShadow: `inset 0 1px 0 #FFFFFF, inset 0 -10px 24px ${NAVY(0.06)}, 0 18px 36px ${NAVY(0.12)}, 0 0 0 1px #DCD7CC`,
  },
  dark: {
    background: 'radial-gradient(circle at 50% 28%, #1B2540 0%, #0E1424 58%, #0A0F1C 100%)',
    boxShadow: `inset 0 1px 0 ${WHITE(0.07)}, inset 0 -14px 34px ${BLACK(0.45)}, 0 22px 44px ${BLACK(0.5)}, 0 0 0 1px #26314A`,
  },
  oled: { background: '#000000', boxShadow: '0 0 0 1px #151D31' },
};

export const CARD_SHADOW: TThemed<string> = {
  light: `0 16px 34px ${NAVY(0.12)}, 0 0 0 1px #DCD7CC`,
  dark: `0 20px 44px ${BLACK(0.5)}, 0 0 0 1px #26314A`,
  oled: '0 0 0 1px #151D31',
};

// Light, dark and OLED values of one art colour, picked by the face's theme.
export const themed = <T>(theme: TFaceTheme, v: TThemed<T>): T => v[theme];

// The faces sheet's tile ground at night (the dark page ground, kept in OLED too).
export const NIGHT_TILE = '#070B16';
