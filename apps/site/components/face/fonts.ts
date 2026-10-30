import { DotGothic16, IBM_Plex_Serif } from 'next/font/google';

// Loaded only by the faces that draw with them (Luxe and Words, LED), never by the page.
const plexSerif = IBM_Plex_Serif({
  weight: '300',
  style: ['normal', 'italic'],
  subsets: ['latin'],
  display: 'swap',
  preload: false,
});
const dotGothic = DotGothic16({ weight: '400', subsets: ['latin'], display: 'swap', preload: false });

export const SERIF = `${plexSerif.style.fontFamily}, Georgia, serif`;
export const DOT = `${dotGothic.style.fontFamily}, var(--font-geist-mono), monospace`;
