import * as React from 'react';
import { cn } from 'cn';
import { CircleCheck, EyeOff, Info, TriangleAlert, type LucideIcon } from 'lucide-react';

import { Alert, AlertAction, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

export type TStatusAlertVariant = 'info' | 'success' | 'paused' | 'refused';

export interface IStatusAlertAction {
  label: React.ReactNode;
  onClick: () => void;
}

export interface IStatusAlertProps extends Omit<React.ComponentProps<'div'>, 'title'> {
  variant: TStatusAlertVariant;
  title: React.ReactNode;
  icon?: LucideIcon;
  action?: IStatusAlertAction;
}

const ICON: Record<TStatusAlertVariant, LucideIcon> = {
  info: Info,
  success: CircleCheck,
  paused: EyeOff,
  refused: TriangleAlert,
};

export const alertActionClasses =
  'h-9 border-current bg-transparent px-3 text-[13px] text-current hover:border-current hover:bg-card active:border-current active:bg-card';

export function StatusAlert({ variant, title, icon, action, children, className, ...props }: IStatusAlertProps) {
  const Icon = icon ?? ICON[variant];
  return (
    <Alert variant={variant} className={className} {...props}>
      <Icon aria-hidden="true" />
      <AlertTitle>{title}</AlertTitle>
      {children ? <AlertDescription>{children}</AlertDescription> : null}
      {action ? (
        <AlertAction>
          <Button variant="outline" className={cn(alertActionClasses)} onClick={action.onClick}>
            {action.label}
          </Button>
        </AlertAction>
      ) : null}
    </Alert>
  );
}
