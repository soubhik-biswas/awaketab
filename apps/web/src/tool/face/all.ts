import classic from './faces/classic.js';
import dials from './faces/dials.js';
import orbits from './faces/orbits.js';
import retro from './faces/retro.js';
import words from './faces/words.js';
import { registerFaces } from './index.js';

// Every face drawn at once, for build-time previews (content pages); the tool loads them lazily instead.
registerFaces({ ...classic, ...retro, ...dials, ...orbits, ...words });

export { FACES, faceSvg } from './index.js';
