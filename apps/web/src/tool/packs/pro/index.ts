import type { IToolCtx } from '../../ctx.js';
import { mountAccount, mountDevices } from './account.js';
import { mountSound } from './sound.js';
import { mountStudio } from './studio.js';
import href from './pro.css?url';

export type TProView = 'studio' | 'sound' | 'devices' | 'account';
export { exportHistoryCsv, exportMyData } from './account.js';

let css: Promise<void> | null = null;

function stylesheet(): Promise<void> {
  css ??= new Promise<void>((resolve) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.onload = link.onerror = () => {
      resolve();
    };
    document.head.append(link);
  });
  return css;
}

// The tool's panel or sheet hands over an empty host; the view fills it and cleans up on destroy().
export function mountProView(
  ctx: IToolCtx,
  host: HTMLElement,
  view: TProView,
  go: (next: TProView) => void = () => undefined,
): { ready: Promise<void>; destroy(): void } {
  const ready = stylesheet();
  const stop =
    view === 'studio'
      ? mountStudio(ctx, host)
      : view === 'sound'
        ? mountSound(ctx, host)
        : view === 'devices'
          ? mountDevices(ctx, host)
          : mountAccount(ctx, host, go);
  return {
    ready,
    destroy() {
      stop();
      host.replaceChildren();
    },
  };
}
