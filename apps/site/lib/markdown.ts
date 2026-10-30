const READ_KEYS = [
  'lead',
  'steps',
  'stepsDone',
  'pills',
  'checklist',
  'matrix',
  'rows',
  'compare',
  'picks',
  'notes',
  'lifecycle',
  'toolNote',
  'faq',
  'honestLimit',
] as const;
const SKIP_KEYS = new Set([
  'src',
  'shotSrc',
  'href',
  'state',
  'result',
  'frame',
  'width',
  'height',
  'shotWidth',
  'shotHeight',
  'us',
  'same',
]);
const WORDS_PER_MINUTE = 220;

function countWords(value: unknown): number {
  if (typeof value === 'string') return value.split(/\s+/u).filter((word) => /[\p{L}\p{N}]/u.test(word)).length;
  if (Array.isArray(value)) return value.reduce<number>((sum, item) => sum + countWords(item), 0);
  if (value !== null && typeof value === 'object') {
    return Object.entries(value).reduce<number>(
      (sum, [key, item]) => (SKIP_KEYS.has(key) ? sum : sum + countWords(item)),
      0,
    );
  }
  return 0;
}

export function readingMinutes(body: string, data: Readonly<Record<string, unknown>>): number {
  const prose = body.replace(/^::.*$/gmu, ' ');
  const words = countWords(prose) + READ_KEYS.reduce((sum, key) => sum + countWords(data[key]), 0);
  return words === 0 ? 0 : Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}

export const escapeHtml = (text: string): string =>
  text.replace(/&/gu, '&amp;').replace(/</gu, '&lt;').replace(/>/gu, '&gt;').replace(/"/gu, '&quot;');

export const stripTags = (html: string): string =>
  html
    .replace(/<[^>]+>/gu, '')
    .replace(/&#x([0-9a-f]+);/giu, (_, hex: string) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/gu, (_, dec: string) => String.fromCodePoint(Number(dec)))
    .replace(/&lt;/gu, '<')
    .replace(/&gt;/gu, '>')
    .replace(/&quot;/gu, '"')
    .replace(/&amp;/gu, '&')
    .trim();

// Inline code may break after a dot (`navigator.wakeLock.request()`), never mid-identifier.
export const breakCode = (html: string): string =>
  html.replace(/<code>([^<]*)<\/code>/gu, (_, code: string) => `<code>${code.replace(/\.(?=\w)/gu, '.<wbr>')}</code>`);

export function inline(text: string): string {
  const out: string[] = [];
  const re = /`([^`]+)`|\*\*([^*]+)\*\*|\[([^\]]+)\]\(([^)\s]+)\)/gu;
  let i = 0;
  for (const m of text.matchAll(re)) {
    out.push(escapeHtml(text.slice(i, m.index)));
    if (m[1] !== undefined) out.push(breakCode(`<code>${escapeHtml(m[1])}</code>`));
    else if (m[2] !== undefined) out.push(`<strong>${escapeHtml(m[2])}</strong>`);
    else {
      const href = m[4] ?? '';
      const external = /^https?:/u.test(href);
      out.push(`<a href="${escapeHtml(href)}"${external ? ' rel="noopener"' : ''}>${escapeHtml(m[3] ?? '')}</a>`);
    }
    i = m.index + m[0].length;
  }
  out.push(escapeHtml(text.slice(i)));
  return out.join('');
}

export const plain = (text: string): string =>
  text
    .replace(/`([^`]+)`/gu, '$1')
    .replace(/\*\*([^*]+)\*\*/gu, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/gu, '$1');

// The same ids GitHub and Astro give headings, so existing #anchors and frontmatter `toc` keys keep working.
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\s_-]/gu, '')
    .replace(/\s/gu, '-');
}

export function headingIds(html: string): string {
  const seen = new Map<string, number>();
  return html.replace(/<(h[23])>([\s\S]*?)<\/\1>/gu, (_, tag: string, inner: string) => {
    const base = slugify(stripTags(inner));
    const n = seen.get(base) ?? 0;
    seen.set(base, n + 1);
    const id = n === 0 ? base : `${base}-${String(n)}`;
    return `<${tag} id="${id}">${inner}</${tag}>`;
  });
}

const cells = (line: string): string[] =>
  line
    .trim()
    .replace(/^\||\|$/gu, '')
    .split(/(?<!\\)\|/u)
    .map((cell) => cell.trim().replace(/\\\|/gu, '|'));

// GitHub pipe tables as HTML, so the plain CommonMark compiler keeps them; cells take inline Markdown.
export function pipeTables(markdown: string): string {
  const lines = markdown.split('\n');
  const out: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    const head = lines[i] ?? '';
    const rule = lines[i + 1] ?? '';
    if (!head.trim().startsWith('|') || !/^\s*\|?\s*:?-{3,}/u.test(rule)) {
      out.push(head);
      continue;
    }
    const rows: string[][] = [];
    let j = i + 2;
    while (j < lines.length && (lines[j] ?? '').trim().startsWith('|')) rows.push(cells(lines[j++] ?? ''));
    const labels = cells(head).map((c) => escapeHtml(plain(c)));
    const th = cells(head)
      .map((c) => `<th>${inline(c)}</th>`)
      .join('');
    const body = rows
      .map((r) => `<tr>${r.map((c, k) => `<td data-label="${labels[k] ?? ''}">${inline(c)}</td>`).join('')}</tr>`)
      .join('');
    // A table scrolls inside a named, focusable region (WCAG 2.1.1); phones restack each row.
    out.push(
      '',
      `<div class="site-table" role="region" tabindex="0" aria-label="${labels.join(', ')}"><table><thead><tr>${th}</tr></thead><tbody>${body}</tbody></table></div>`,
      '',
    );
    i = j - 1;
  }
  return out.join('\n');
}

const BLOCKS = [
  'steps',
  'figures',
  'pills',
  'checklist',
  'matrix',
  'rows',
  'compare',
  'picks',
  'code',
  'note',
  'lifecycle',
] as const;
export type TBlockName = (typeof BLOCKS)[number];

export type TSectionPart = { kind: 'html'; html: string } | { kind: 'block'; name: TBlockName; arg: string };
export interface ISection {
  id?: string;
  title?: string;
  parts: TSectionPart[];
}

const MARKER = /<p>::([a-z]+)(?:\s+([\w.-]+))?<\/p>/gu;
const H2 = /<h2\b[^>]*>[\s\S]*?<\/h2>/gu;

// The rendered body cut at each h2 into sections, with `::block` lines as placed blocks. `::ad` only splits: the
// page's one ad slot sits below the tool.
export function splitArticle(html: string): ISection[] {
  const sections: ISection[] = [];
  let current: ISection | null = null;
  const open = (): ISection => {
    if (!current) {
      current = { parts: [] };
      sections.push(current);
    }
    return current;
  };
  const tokens: Array<{ at: number; end: number; h2?: string; name?: string; arg?: string }> = [];
  for (const m of html.matchAll(H2)) tokens.push({ at: m.index, end: m.index + m[0].length, h2: m[0] });
  for (const m of html.matchAll(MARKER))
    tokens.push({ at: m.index, end: m.index + m[0].length, name: m[1] ?? '', arg: m[2] ?? '' });
  tokens.sort((a, b) => a.at - b.at);
  let cursor = 0;
  const pushHtml = (chunk: string): void => {
    if (chunk.replace(/<p>\s*<\/p>/gu, '').trim()) open().parts.push({ kind: 'html', html: breakCode(chunk) });
  };
  for (const token of tokens) {
    pushHtml(html.slice(cursor, token.at));
    cursor = token.end;
    if (token.h2) {
      const id = /\bid="([^"]+)"/u.exec(token.h2)?.[1];
      current = { title: stripTags(token.h2), parts: [], ...(id ? { id } : {}) };
      sections.push(current);
      continue;
    }
    const name = token.name ?? '';
    if (name === 'ad') continue;
    if (!(BLOCKS as readonly string[]).includes(name)) throw new Error(`Unknown article block "::${name}"`);
    open().parts.push({ kind: 'block', name: name as TBlockName, arg: token.arg ?? '' });
  }
  pushHtml(html.slice(cursor));
  return sections.filter((s) => s.parts.length > 0 || s.title);
}

export type TToken = [kind: 'kw' | 'fn' | 'id' | 'str' | 'com' | 'pun' | 'tag' | 'attr', text: string];
const KW = new Set([
  'let',
  'const',
  'async',
  'await',
  'function',
  'if',
  'return',
  'try',
  'catch',
  'new',
  'null',
  'true',
  'false',
  'in',
  'of',
  'else',
]);

export function tokenize(line: string, lang: string): TToken[] {
  const out: TToken[] = [];
  const re =
    lang === 'html'
      ? /(<\/?[\w-]+|\/?>)|("[^"]*")|([\w-]+)(?==)/gu
      : lang === 'text' || lang === 'sh'
        ? /(#.*$)/gu
        : /(\/\/.*$)|('[^']*'|"[^"]*"|`[^`]*`)|([A-Za-z_$][\w$]*)/gu;
  let i = 0;
  for (const m of line.matchAll(re)) {
    if (m.index > i) out.push(['pun', line.slice(i, m.index)]);
    if (lang === 'html') out.push([m[1] ? 'tag' : m[2] ? 'str' : 'attr', m[0]]);
    else if (m[1]) out.push(['com', m[0]]);
    else if (m[2]) out.push(['str', m[0]]);
    else {
      const rest = line.slice(m.index + m[0].length);
      out.push([KW.has(m[0]) ? 'kw' : /^\s*\(/u.test(rest) ? 'fn' : 'id', m[0]]);
    }
    i = m.index + m[0].length;
  }
  if (i < line.length) out.push([lang === 'text' || lang === 'sh' ? 'id' : 'pun', line.slice(i)]);
  return out;
}
