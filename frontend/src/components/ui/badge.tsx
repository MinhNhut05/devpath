import * as React from 'react';

import { cn } from '../../lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'success' | 'warning' | 'destructive';
}

const badgeVariants: Record<NonNullable<BadgeProps['variant']>, string> = {
  default: 'bg-dp-secondary/15 text-dp-secondary border border-dp-secondary/30',
  secondary: 'bg-white/[0.06] text-dp-text-secondary border border-dp-border',
  outline: 'border border-dp-border bg-transparent text-dp-text-primary',
  success: 'border border-dp-success/30 bg-dp-success/15 text-dp-success',
  warning: 'border border-dp-warning/30 bg-dp-warning/15 text-dp-warning',
  destructive: 'border border-dp-error/30 bg-dp-error/15 text-dp-error',
};

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', ...props }, ref) => (
    <span
      ref={ref}
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-caption font-medium transition-colors',
        badgeVariants[variant],
        className,
      )}
      {...props}
    />
  ),
);

Badge.displayName = 'Badge';

export { Badge };
