import * as React from 'react';

import { cn } from '../../lib/utils';

type ButtonVariant = 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive';
type ButtonSize = 'default' | 'sm' | 'lg' | 'icon';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantClasses: Record<ButtonVariant, string> = {
  default:
    'bg-gradient-to-r from-dp-secondary to-dp-accent text-white shadow-dp-glow hover:opacity-90 hover:shadow-dp-glow-accent',
  secondary:
    'glass glass-hover text-dp-text-primary hover:bg-dp-glass-hover',
  outline:
    'border border-dp-border bg-dp-surface/70 text-dp-text-primary hover:border-dp-border-hover hover:bg-dp-elevated',
  ghost: 'text-dp-text-secondary hover:bg-dp-glass-hover hover:text-dp-text-primary',
  destructive: 'bg-dp-error/15 text-dp-error hover:bg-dp-error/25 border border-dp-error/30',
};

const sizeClasses: Record<ButtonSize, string> = {
  default: 'h-12 px-4 py-2',
  sm: 'h-10 rounded-md-dp px-3 text-body-sm',
  lg: 'h-14 rounded-lg-dp px-6 text-body',
  icon: 'h-12 w-12',
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', type = 'button', ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg-dp text-body-sm font-medium transition-all duration-base ease-smooth disabled:pointer-events-none disabled:opacity-50',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dp-secondary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-dp-deep',
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        {...props}
      />
    );
  },
);

Button.displayName = 'Button';

export { Button };
