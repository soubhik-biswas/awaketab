import { act, createElement, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { STAGE_ID } from '@/lib/tool/stage-id';
import { useIdle } from './hooks';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let idle = false;

function Probe({ steady }: { steady: boolean }) {
  const [root, setRoot] = useState<HTMLDivElement | null>(null);
  idle = useIdle(true, { root, steady }).idle;
  return createElement(
    'div',
    { ref: setRoot },
    createElement('main', { id: STAGE_ID, tabIndex: -1 }),
    createElement('div', { 'data-rests': '' }, createElement('button', { id: 'dock' })),
    createElement('button', { id: 'start' }),
  );
}

describe('resting the controls', () => {
  let host: HTMLDivElement;
  let root: Root;
  const run = (step: () => void): void => {
    act(() => {
      step();
    });
  };
  const wait = (ms: number) => run(() => vi.advanceTimersByTime(ms));
  const focus = (id: string) => run(() => document.getElementById(id)?.focus());
  const fire = (type: string) => run(() => window.dispatchEvent(new Event(type)));
  const mount = (steady = false) => run(() => root.render(createElement(Probe, { steady })));

  beforeEach(() => {
    vi.useFakeTimers();
    host = document.body.appendChild(document.createElement('div'));
    root = createRoot(host);
  });

  afterEach(() => {
    run(() => root.unmount());
    host.remove();
    vi.useRealTimers();
  });

  it('rests after five quiet seconds and comes back on any key', () => {
    mount();
    wait(4900);
    expect(idle).toBe(false);
    wait(200);
    expect(idle).toBe(true);
    fire('keydown');
    expect(idle).toBe(false);
  });

  it('counts a focus move inside the tool as activity', () => {
    mount();
    wait(4000);
    focus('start');
    wait(4000);
    expect(idle).toBe(false);
    wait(1100);
    expect(idle).toBe(true);
  });

  it('never rests while keyboard focus is on the controls', () => {
    mount();
    focus('dock');
    wait(60_000);
    expect(idle).toBe(false);
    focus('start');
    wait(5100);
    expect(idle).toBe(true);
  });

  it('still rests after a click that left focus on a control', () => {
    mount();
    fire('pointerdown');
    focus('dock');
    wait(5100);
    expect(idle).toBe(true);
  });

  it('holds again once a key is used on the clicked control', () => {
    mount();
    fire('pointerdown');
    focus('dock');
    fire('keydown');
    wait(60_000);
    expect(idle).toBe(false);
  });

  it('does not take its own move of focus to the stage for activity', () => {
    mount();
    wait(5100);
    expect(idle).toBe(true);
    focus(STAGE_ID);
    expect(idle).toBe(true);
  });

  it('with reduced motion, keeps the controls while focus is anywhere in the tool', () => {
    mount(true);
    focus('start');
    wait(60_000);
    expect(idle).toBe(false);
  });
});
