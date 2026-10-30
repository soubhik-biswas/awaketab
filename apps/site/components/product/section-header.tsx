import * as React from 'react';
import { cn } from 'cn';
import { X } from 'lucide-react';

import { Button } from '@/components/ui/button';

export function SectionLabel({ className, ...props }: React.ComponentProps<'span'>) {
  return (
    <span
      data-slot="section-label"
      className={cn(
        'font-mono text-[12px] leading-[1.4] tracking-[.08em] text-muted-foreground-strong uppercase',
        className,
      )}
      {...props}
    />
  );
}

export interface ISectionHeaderProps extends Omit<React.ComponentProps<'div'>, 'title'> {
  label: React.ReactNode;
  action?: React.ReactNode;
}

export function SectionHeader({ label, action, className, ...props }: ISectionHeaderProps) {
  return (
    <div data-slot="section-header" className={cn('flex items-baseline justify-between gap-3', className)} {...props}>
      <SectionLabel>{label}</SectionLabel>
      {action}
    </div>
  );
}

export function SectionLink({ className, type = 'button', ...props }: React.ComponentProps<'button'>) {
  return (
    <button
      type={type}
      data-slot="section-link"
      className={cn(
        'min-h-11 cursor-pointer border-0 bg-transparent px-0.5 text-[14px] font-semibold text-lamp underline underline-offset-3 outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
        className,
      )}
      {...props}
    />
  );
}

export interface IPanelHeaderProps extends Omit<React.ComponentProps<'div'>, 'title'> {
  title: React.ReactNode;
  onClose?: () => void;
  closeLabel?: string;
  size?: 'default' | 'setup';
  headingLevel?: 'h2' | 'h3';
}

export function PanelHeader({
  title,
  onClose,
  closeLabel,
  size = 'default',
  headingLevel = 'h2',
  className,
  ...props
}: IPanelHeaderProps) {
  const Heading = headingLevel;
  return (
    <div
      data-slot="panel-header"
      className={cn('flex shrink-0 items-center justify-between gap-3', className)}
      {...props}
    >
      <Heading
        className={cn(
          'm-0 font-extrabold tracking-[-0.02em] text-foreground',
          size === 'setup' ? 'text-[20px]' : 'text-[22px]',
        )}
      >
        {title}
      </Heading>
      {onClose ? (
        <Button
          variant="ghost"
          size="icon"
          className="-mr-2 text-muted-foreground-strong"
          onClick={onClose}
          aria-label={closeLabel ?? (typeof title === 'string' ? `Close ${title}` : 'Close')}
        >
          <X strokeWidth={2} aria-hidden="true" />
        </Button>
      ) : null}
    </div>
  );
}
