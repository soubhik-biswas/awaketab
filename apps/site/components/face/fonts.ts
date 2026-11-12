import { IBM_Plex_Serif } from 'next/font/google';

// Loaded only by the faces that draw with it (Analog luxe, Words and E-ink), never by the page. E-ink's italic line is
// regular weight; everything else is light.
const plexSerif = IBM_Plex_Serif({
  weight: ['300', '400'],
  style: ['normal', 'italic'],
  subsets: ['latin'],
  display: 'swap',
  preload: false,
});

export const SERIF = `${plexSerif.style.fontFamily}, Georgia, serif`;
