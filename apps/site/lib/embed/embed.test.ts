import { describe, expect, it } from 'vitest';
import { planEnd, untilWall } from './engine';
import { embedLoader, loaderConfig } from './loader';
import { embedPath, parseEmbedQuery, parsePageMessage, reservedHeight } from './protocol';
import { iframeSnippet, loaderSnippet, DEFAULT_SNIPPET } from './snippet';
import { addTimer, settleTimers } from './timers';

describe('embed protocol', () => {
  it('validates the iframe query', () => {
    const p = parseEmbedQuery('?mode=clock&theme=oled&lang=de&size=full&preset=p60&host=example.com');
    expect(p).toMatchObject({
      mode: 'clock',
      theme: 'oled',
      lang: 'de',
      size: 'full',
      preset: 'p60',
      host: 'example.com',
    });
    expect(parseEmbedQuery('?mode=evil&host=bad host')).toMatchObject({ mode: 'cook', host: null });
  });

  it('puts other languages under their prefix', () => {
    expect(embedPath('en')).toBe('/embed/cook');
    expect(embedPath('pt-br')).toBe('/pt-br/embed/cook');
  });

  it('drops malformed page commands', () => {
    expect(parsePageMessage({ type: 'awaketab:start', ms: 10 })).toBeNull();
    expect(parsePageMessage({ type: 'awaketab:start', until: '18:30' })).toEqual({
      type: 'awaketab:start',
      until: '18:30',
    });
    expect(parsePageMessage({ type: 'awaketab:theme', theme: 'pink' })).toBeNull();
  });

  it('reserves the taller box in a narrow column', () => {
    expect(reservedHeight({ size: 'compact', mode: 'cook' }, 280)).toBe(116);
    expect(reservedHeight({ size: 'full', mode: 'cook' }, 500)).toBe(420);
    expect(reservedHeight({ size: 'full', mode: 'clock' }, 500)).toBe(240);
  });

  it('writes a one-line snippet and an iframe fallback with the credit line', () => {
    expect(loaderSnippet(DEFAULT_SNIPPET)).toBe(
      '<script async src="https://awaketab.com/embed.js" data-mode="cook" data-theme="auto" data-size="compact"></script>',
    );
    expect(iframeSnippet(DEFAULT_SNIPPET, 'Keep screen awake')).toContain('allow="screen-wake-lock"');
  });
});

describe('embed engine plans', () => {
  const now = new Date(2026, 9, 31, 17, 0).getTime();
  it('prefers ms, then until, then preset', () => {
    const params = { preset: 'p60' as const, until: null };
    expect(planEnd(params, now, { type: 'awaketab:start', ms: 120_000 })).toBe(now + 120_000);
    expect(planEnd(params, now, { type: 'awaketab:start', until: '18:30' })).toBe(untilWall('18:30', now));
    expect(planEnd(params, now)).toBe(now + 3_600_000);
    expect(planEnd({ preset: 'pinf', until: null }, now)).toBeNull();
  });

  it('rolls an until time that has passed to tomorrow', () => {
    expect(untilWall('16:00', now)).toBe(new Date(2026, 10, 1, 16, 0).getTime());
  });
});

describe('kitchen timers', () => {
  it('holds up to three and marks the finished ones', () => {
    let list = addTimer([], 5, 'A', 0, 'a');
    list = addTimer(list, 10, 'B', 0, 'b');
    list = addTimer(list, 15, 'C', 0, 'c');
    expect(addTimer(list, 30, 'D', 0, 'd')).toHaveLength(3);
    const { done } = settleTimers(list, 6 * 60_000);
    expect(done.map((t) => t.id)).toEqual(['a']);
  });
});

describe('embed loader', () => {
  it('stays self-contained so it can be served as its own source', () => {
    const src = embedLoader.toString();
    expect(src).not.toMatch(/\b(?:EMBED_|SNIPPET_|import\()/u);
  });

  it('replaces its tag with the iframe and the credit line', () => {
    document.body.innerHTML = '<p><script data-mode="clock" data-size="full" data-lang="de"></script></p>';
    const tag = document.querySelector('script') as HTMLScriptElement;
    Object.defineProperty(tag, 'src', { value: 'https://awaketab.com/embed.js' });
    embedLoader(
      window,
      tag,
      loaderConfig({ en: 'Keep screen awake', de: 'Bildschirm wach halten' }, { en: 'Keep awake by AwakeTab' }),
    );
    const frame = document.querySelector('iframe');
    expect(frame?.src).toContain('https://awaketab.com/de/embed/cook?mode=clock');
    expect(frame?.getAttribute('allow')).toBe('screen-wake-lock');
    expect(frame?.title).toBe('Bildschirm wach halten');
    expect(document.querySelector('.awaketab-credit a')?.textContent).toBe('Keep awake by AwakeTab');
  });
});
