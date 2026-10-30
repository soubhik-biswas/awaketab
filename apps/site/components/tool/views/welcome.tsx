'use client';

import { Play } from 'lucide-react';
import { Scene } from '@/components/scene/scene';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTool } from '@/components/tool/context';
import { LINK_BTN } from '@/components/tool/kit';

export default function WelcomeView() {
  const { device, night, a } = useTool();
  const phone = device === 'phone';
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <Scene scene="welcome" theme={night ? 'dark' : 'light'} width={phone ? 260 : 300} decorative />
      <strong className="font-sans text-[30px] leading-[1.1] tracking-[-0.025em]">Keep this screen awake.</strong>
      <span className="max-w-[380px] text-[15px] leading-[1.55] text-muted-foreground-strong">
        One button, right here in the browser. No install and no account — your settings stay on this device.
      </span>
      <Button
        type="button"
        onClick={() => {
          a.close();
          a.start(3600);
        }}
        className={cn(
          'gap-2 font-bold shadow-[0_12px_32px_var(--primary-glow)] [&_svg:not([class*=size-])]:size-5',
          phone ? 'h-14 w-full rounded-[18px] px-[22px] text-[17px]' : 'h-16 rounded-[20px] px-[30px] text-[18px]',
        )}
      >
        <Play strokeWidth={2} aria-hidden="true" />
        Keep awake for 1 hour
      </Button>
      <button type="button" className={LINK_BTN} onClick={a.close}>
        Choose another length
      </button>
    </div>
  );
}
