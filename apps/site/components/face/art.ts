import type { CSSProperties } from 'react';
import { alpha } from './geometry';
import type { TFaceTheme } from './model';

export type TThemed<T> = Readonly<Record<TFaceTheme, T>>;

// Fixed art colours shared by several faces. Each face's own art colours sit at the top of its module.
export const SNOW = '#EEF2FA';
// The sub-dial and digital-window ground of Chronograph and Pilot.
export const SUB_DIAL: TThemed<string> = { light: '#EFEFF6', dark: '#0A0B10', oled: '#05070C' };
export const WHITE = (a: number): string => `rgba(255,255,255,${a})`;
export const BLACK = (a: number): string => `rgba(0,0,0,${a})`;
export const NAVY = (a: number): string => `rgba(11,16,32,${a})`;

// The dial plate (graphite v2 at night): top sheen, an accent glow at the bottom edge, inner highlight, two-ring bezel.
export const plate = (theme: TFaceTheme, accent: string): CSSProperties =>
  theme === 'light'
    ? {
        background:
          'radial-gradient(120% 90% at 50% 0%, #FFFFFF, transparent 50%), radial-gradient(circle at 50% 30%, #FFFFFF 0%, #F4F4FA 62%, #E8E8F1 100%)',
        boxShadow: `inset 0 1px 0 #FFFFFF, inset 0 -12px 28px ${NAVY(0.06)}, 0 22px 44px ${NAVY(0.12)}, 0 0 0 1px #D4D4E2, 0 0 0 7px #F7F7FB, 0 0 0 8px #DCDCE8`,
      }
    : theme === 'oled'
      ? { background: '#000000', boxShadow: '0 0 0 1px #1A2236, inset 0 0 0 10px #03050A' }
      : {
          background: `radial-gradient(120% 90% at 50% 0%, ${WHITE(0.075)}, transparent 46%), radial-gradient(70% 42% at 50% 104%, ${alpha(accent, 0x26)}, transparent 70%), radial-gradient(circle at 50% 30%, #1B1E28 0%, #0E1016 60%, #08090D 100%)`,
          boxShadow: `inset 0 1px 0 ${WHITE(0.1)}, inset 0 0 0 1px ${WHITE(0.035)}, inset 0 0 0 10px ${WHITE(0.012)}, inset 0 -18px 40px ${BLACK(0.5)}, 0 28px 60px ${BLACK(0.55)}, 0 0 0 1px #262A35, 0 0 0 7px ${WHITE(0.018)}, 0 0 0 8px #1E212B`,
        };

export const CARD_SHADOW: TThemed<string> = {
  light: `0 22px 44px ${NAVY(0.12)}, 0 0 0 1px #D4D4E2, inset 0 1px 0 #FFFFFF`,
  dark: `0 28px 60px ${BLACK(0.55)}, 0 0 0 1px #262A35, inset 0 1px 0 ${WHITE(0.08)}`,
  oled: '0 0 0 1px #1A2236',
};

// The watch-glass case a gallery may draw around a face (the framed prop).
export const CASE: TThemed<CSSProperties> = {
  light: {
    background: 'linear-gradient(160deg, #FFFFFF 0%, #F1F1F8 100%)',
    boxShadow: `inset 0 1px 0 #FFFFFF, 0 0 0 1px #DCDCE8, 0 18px 40px ${NAVY(0.08)}`,
  },
  dark: {
    background: `radial-gradient(120% 80% at 30% 0%, ${WHITE(0.06)}, transparent 50%), linear-gradient(160deg, #121419 0%, #0B0C11 100%)`,
    boxShadow: `inset 0 1px 0 ${WHITE(0.08)}, 0 0 0 1px #1F222C, 0 24px 50px ${BLACK(0.45)}`,
  },
  oled: {
    background: '#000000',
    boxShadow: `inset 0 1px 0 ${WHITE(0.08)}, 0 0 0 1px #1F222C, 0 24px 50px ${BLACK(0.45)}`,
  },
};

// Light, dark and OLED values of one art colour, picked by the face's theme.
export const themed = <T>(theme: TFaceTheme, v: TThemed<T>): T => v[theme];

// The light-theme ink and its secondary tone on faces that draw their own sky or glass (fxInk, fxInk2).
export const fxInk = (light: boolean): string => (light ? '#0B1020' : '#FFFFFF');
export const fxInk2 = (light: boolean): string => (light ? '#4B5165' : '#B9C2D6');
