import { Archivo, Bricolage_Grotesque, Geist_Mono, Instrument_Serif, Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', axes: ['opsz'] });
const bricolage = Bricolage_Grotesque({ subsets: ['latin'], variable: '--font-bricolage', axes: ['opsz', 'wdth'] });
// Only the headline and text faces are preloaded; the accent and the mono swap in when they arrive.
const serif = Instrument_Serif({
  subsets: ['latin'],
  variable: '--font-serif',
  weight: '400',
  style: 'italic',
  preload: false,
});
const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
  weight: ['400', '500', '700'],
  preload: false,
});
// Neon, Bauhaus, Poster and HUD keep Archivo, their own character type.
const archivo = Archivo({ subsets: ['latin'], variable: '--font-archivo', axes: ['wdth'], preload: false });

export const FONT_VARIABLES = [inter, bricolage, serif, geistMono, archivo].map((f) => f.variable).join(' ');
