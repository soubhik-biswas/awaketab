import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ROUTES, toolHref } from '@/lib/routes';
import { cn } from '@/lib/utils';
import * as s from './styles';

interface IPlan {
  name: string;
  price: string;
  line: string;
  features: readonly string[];
  cta: string;
  href: string;
  pro: boolean;
}

const PLANS: readonly IPlan[] = [
  {
    name: 'Free',
    price: 'No charge',
    line: 'Everything you need to keep one screen awake.',
    features: [
      'Keep awake for any length, or no end',
      'All 33 faces',
      'Presets and the ⌘K palette',
      'Light, dark and OLED themes',
      'Video fallback for older browsers',
    ],
    cta: 'Open the timer',
    href: toolHref(),
    pro: false,
  },
  {
    name: 'Pro',
    price: '[PRICE] / year',
    line: 'Or [PRICE] / month. Cancel any time from Settings.',
    features: [
      'Sync up to 5 devices',
      'Full history with export',
      'Sound mixer: rain, café, brown noise',
      'Face studio: your own accent colour',
      'Several notes per session',
      'Supports an independent tool',
    ],
    cta: 'Get Pro',
    href: `${ROUTES.pro}/checkout`,
    pro: true,
  },
];

// The Pro board's two plans; the Pro flow replaces this block with live prices and checkout.
export function ProPlans() {
  return (
    <div data-pro-plans="" className={s.grid[2]}>
      {PLANS.map((plan) => (
        <div
          key={plan.name}
          className={cn(
            'flex flex-col gap-[14px] rounded-[24px] bg-card p-[26px]',
            plan.pro ? 'border-2 border-primary shadow-[0_20px_50px_var(--site-pro-glow)]' : 'border border-border',
          )}
        >
          <span className="flex items-center justify-between">
            <strong className={s.h3}>{plan.name}</strong>
            {plan.pro && (
              <span className="rounded-full bg-primary-soft px-2.5 py-[3px] text-[13px] font-bold text-primary">Pro</span>
            )}
          </span>
          <span className="text-[30px] font-extrabold tracking-[-0.03em] min-[700px]:text-[36px]">{plan.price}</span>
          <span className={s.body}>{plan.line}</span>
          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {plan.features.map((f) => (
              <li key={f} className="flex items-start gap-2.5 text-[15px] leading-[1.45]">
                <Check className="mt-0.5 size-[18px] flex-none text-lamp" strokeWidth={2.25} aria-hidden="true" />
                {f}
              </li>
            ))}
          </ul>
          <Button
            asChild
            variant={null}
            size={null}
            className={cn(
              s.btn,
              'mt-auto h-[52px]',
              plan.pro
                ? 'border-primary bg-primary text-primary-foreground hover:bg-primary/90'
                : 'border-input bg-transparent text-foreground hover:bg-secondary',
            )}
          >
            <a href={plan.href}>{plan.cta}</a>
          </Button>
        </div>
      ))}
    </div>
  );
}
