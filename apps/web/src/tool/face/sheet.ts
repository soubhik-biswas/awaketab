import { type FaceId, type FaceTheme, FACES, faceSvg, loadAllFaces } from './index.js';

export interface FaceGridOptions {
  selected: FaceId;
  theme: FaceTheme;
  onPick(id: FaceId): void;
  // Thumbnail size in px: 92 desktop, 84 tablet landscape, 96 phone (the faces sheet on the boards).
  size?: number;
  // 3 columns, 5 on tablet portrait.
  columns?: number;
  ids?: readonly FaceId[];
  labels?: boolean;
  names?: Partial<Record<FaceId, string>>;
  label?: string;
}

// The faces sheet's picker: every face as a live compact thumbnail, the selected one ringed in the lamp colour.
export function renderFaceGrid(
  container: HTMLElement,
  opts: FaceGridOptions,
): { select(id: FaceId): void; setTheme(theme: FaceTheme): void } {
  const ids = opts.ids ?? FACES.map((f) => f.id);
  const size = opts.size ?? 92;
  const cols = opts.columns ?? 3;
  const name = (id: FaceId) => opts.names?.[id] ?? FACES.find((f) => f.id === id)?.name ?? id;
  let selected = opts.selected;
  let theme = opts.theme;
  let ready = false;

  const grid = document.createElement('div');
  grid.className = `af-grid${opts.labels === false ? ' af-grid-mini' : ''}`;
  grid.setAttribute('role', 'radiogroup');
  grid.setAttribute('aria-label', opts.label ?? 'Clock face');
  grid.style.setProperty('--af-cols', String(cols));
  grid.style.setProperty('--af-size', `${size}px`);

  const cells = ids.map((id) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'af-cell';
    b.dataset.face = id;
    b.setAttribute('role', 'radio');
    const thumb = document.createElement('span');
    thumb.className = 'af-thumb';
    thumb.setAttribute('aria-hidden', 'true');
    b.append(thumb);
    if (opts.labels === false) b.setAttribute('aria-label', name(id));
    else {
      const lab = document.createElement('span');
      lab.className = 'af-name';
      lab.textContent = name(id);
      b.append(lab);
    }
    return b;
  });
  grid.append(...cells);

  const draw = () => {
    grid.classList.toggle('af-grid-night', theme !== 'light');
    if (!ready) return;
    cells.forEach((b, i) => {
      const id = ids[i];
      const thumb = b.firstElementChild;
      if (!id || !thumb) return;
      thumb.innerHTML = faceSvg({
        face: id,
        theme,
        state: 'running',
        remain: 2538,
        total: 3600,
        nowSec: 38_862,
        size,
        bare: true,
      });
    });
  };

  const mark = () => {
    for (const b of cells) {
      const on = b.dataset.face === selected;
      b.setAttribute('aria-checked', String(on));
      b.tabIndex = on ? 0 : -1;
    }
    if (!cells.some((b) => b.tabIndex === 0) && cells[0]) cells[0].tabIndex = 0;
  };

  const pick = (id: FaceId, focus: boolean) => {
    selected = id;
    mark();
    if (focus) cells.find((b) => b.dataset.face === id)?.focus();
    opts.onPick(id);
  };

  grid.addEventListener('click', (e) => {
    const b = (e.target as Element).closest<HTMLElement>('.af-cell');
    if (b?.dataset.face) pick(b.dataset.face as FaceId, false);
  });

  // Radio-group keys: arrows move and pick (Up and Down by a row), Home and End jump to the ends.
  grid.addEventListener('keydown', (e) => {
    const i = cells.indexOf(document.activeElement as HTMLButtonElement);
    if (i < 0) return;
    const rtl = getComputedStyle(grid).direction === 'rtl' ? -1 : 1;
    const step: Record<string, number> = {
      ArrowRight: rtl,
      ArrowLeft: -rtl,
      ArrowDown: cols,
      ArrowUp: -cols,
      Home: -i,
      End: cells.length - 1 - i,
    };
    const by = step[e.key];
    if (by === undefined) return;
    e.preventDefault();
    const to = Math.min(cells.length - 1, Math.max(0, i + by));
    const id = cells[to]?.dataset.face as FaceId | undefined;
    if (id) pick(id, true);
  });

  mark();
  draw();
  container.replaceChildren(grid);
  // A group that fails to load leaves its thumbnails empty; the rest still draw.
  const done = () => {
    ready = true;
    draw();
  };
  void loadAllFaces().then(done, done);

  return {
    select(id) {
      selected = id;
      mark();
    },
    setTheme(next) {
      theme = next;
      draw();
    },
  };
}
