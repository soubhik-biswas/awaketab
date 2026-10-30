export interface IHelpEntry {
  title: string;
  href: string;
  words: string;
}

// Every word of the query must appear in the title or the keywords; "batt" also finds the dark-screen topic,
// because battery saver is the usual reason a screen still goes dark.
export function searchHelp(entries: readonly IHelpEntry[], query: string): IHelpEntry[] {
  const words = query.trim().toLowerCase().split(/\s+/u).filter(Boolean);
  if (words.length === 0) return [];
  return entries.filter((entry) => {
    const hay = `${entry.title} ${entry.words}`.toLowerCase();
    return words.every((w) => hay.includes(w));
  });
}

export function initHelpSearch(): void {
  const box = document.querySelector<HTMLElement>('[data-help]');
  const input = box?.querySelector<HTMLInputElement>('input[type="search"]');
  const count = box?.querySelector<HTMLElement>('[data-help-count]');
  const list = box?.querySelector<HTMLElement>('[data-help-results]');
  const data = document.getElementById('at-help-index')?.textContent;
  if (!box || !input || !count || !list || !data) return;
  const entries = JSON.parse(data) as IHelpEntry[];
  const d = box.dataset;
  const idle = count.textContent ?? '';
  const render = (): void => {
    const q = input.value.trim();
    const hits = searchHelp(entries, q);
    list.replaceChildren(
      ...hits.slice(0, 8).map((hit) => {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.className = 'at-sp-chip';
        a.href = hit.href;
        a.textContent = hit.title;
        li.append(a);
        return li;
      }),
    );
    list.hidden = hits.length === 0;
    if (!q) count.textContent = idle;
    else if (hits.length === 0) count.textContent = (d.none ?? '').replace('{q}', q);
    else count.textContent = (hits.length === 1 ? (d.one ?? '') : (d.many ?? '')).replace('{n}', String(hits.length)).replace('{q}', q);
  };
  input.addEventListener('input', render);
  box.querySelector('form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const first = list.querySelector('a');
    if (first) first.focus();
  });
  const asked = new URLSearchParams(location.search).get('q');
  if (asked) input.value = asked.slice(0, 80);
  if (input.value) render();
}
