import type { CSSProperties } from 'react';
import type { TFaceTheme } from './model';

export type TThemed<T> = Readonly<Record<TFaceTheme, T>>;

// Fixed art colours shared by several faces. Each face's own art colours sit at the top of its module.
export const SNOW = '#EEF2FA';
export const FLIP_CARD: TThemed<string> = { light: '#1D273F', dark: '#1D273F', oled: '#0E1424' };
// The sub-dial and digital-window ground of Chronograph and Pilot.
export const SUB_DIAL: TThemed<string> = { light: '#EFEFF6', dark: '#0A0F1C', oled: '#05070C' };
export const LCD_GROUND: TThemed<string> = { light: 'var(--accent)', dark: '#06180D', oled: '#030D07' };
export const WHITE = (a: number): string => `rgba(255,255,255,${a})`;
export const BLACK = (a: number): string => `rgba(0,0,0,${a})`;
export const NAVY = (a: number): string => `rgba(11,16,32,${a})`;

export const PLATE: TThemed<CSSProperties> = {
  light: {
    background:
      'radial-gradient(120% 90% at 50% 0%, #FFFFFF, transparent 50%), radial-gradient(circle at 50% 30%, #FFFFFF 0%, #F4F4FA 62%, #E8E8F1 100%)',
    boxShadow: `inset 0 1px 0 #FFFFFF, inset 0 -12px 28px ${NAVY(0.06)}, 0 22px 44px ${NAVY(0.12)}, 0 0 0 1px #D4D4E2, 0 0 0 7px #F7F7FB, 0 0 0 8px #DCDCE8`,
  },
  dark: {
    background: `radial-gradient(120% 90% at 50% 0%, ${WHITE(0.07)}, transparent 46%), radial-gradient(circle at 50% 30%, #1A2442 0%, #0D1323 60%, #080C18 100%)`,
    boxShadow: `inset 0 1px 0 ${WHITE(0.1)}, inset 0 0 0 1px ${WHITE(0.035)}, inset 0 0 0 10px ${WHITE(0.012)}, inset 0 -18px 40px ${BLACK(0.5)}, 0 28px 60px ${BLACK(0.55)}, 0 0 0 1px #222C44, 0 0 0 7px ${WHITE(0.018)}, 0 0 0 8px #1B2338`,
  },
  oled: { background: '#000000', boxShadow: '0 0 0 1px #1A2236, inset 0 0 0 10px #03050A' },
};

export const CARD_SHADOW: TThemed<string> = {
  light: `0 22px 44px ${NAVY(0.12)}, 0 0 0 1px #D4D4E2, inset 0 1px 0 #FFFFFF`,
  dark: `0 28px 60px ${BLACK(0.55)}, 0 0 0 1px #222C44, inset 0 1px 0 ${WHITE(0.08)}`,
  oled: '0 0 0 1px #1A2236',
};

// The watch-glass case every gallery draws around a face (the framed prop).
export const CASE: TThemed<CSSProperties> = {
  light: {
    background: 'linear-gradient(160deg, #FFFFFF 0%, #F1F1F8 100%)',
    boxShadow: `inset 0 1px 0 #FFFFFF, 0 0 0 1px #DCDCE8, 0 18px 40px ${NAVY(0.08)}`,
  },
  dark: {
    background: `radial-gradient(120% 80% at 30% 0%, ${WHITE(0.06)}, transparent 50%), linear-gradient(160deg, #111830 0%, #0A0F1E 100%)`,
    boxShadow: `inset 0 1px 0 ${WHITE(0.08)}, 0 0 0 1px #1D2640, 0 24px 50px ${BLACK(0.45)}`,
  },
  oled: {
    background: '#000000',
    boxShadow: `inset 0 1px 0 ${WHITE(0.08)}, 0 0 0 1px #1D2640, 0 24px 50px ${BLACK(0.45)}`,
  },
};

// Light, dark and OLED values of one art colour, picked by the face's theme.
export const themed = <T>(theme: TFaceTheme, v: TThemed<T>): T => v[theme];

// The faces sheet's tile ground at night (the dark page ground, kept in OLED too).
export const NIGHT_TILE = '#070B16';
