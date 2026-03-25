import * as React from 'react';

import { cn } from '../../lib/utils';

const RadioGroup = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} role="radiogroup" className={cn('grid gap-2', className)} {...props} />
  ),
);
RadioGroup.displayName = 'RadioGroup';

export interface RadioGroupItemProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {}

const RadioGroupItem = React.forwardRef<HTMLInputElement, RadioGroupItemProps>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      type="radio"
      className={cn(
        'h-4 w-4 shrink-0 appearance-none rounded-full border border-dp-border bg-transparent text-dp-secondary',
        'checked:border-dp-secondary checked:bg-dp-secondary checked:shadow-dp-glow',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dp-secondary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-dp-deep',
        className,
      )}
      {...props}
    />
  ),
);
RadioGroupItem.displayName = 'RadioGroupItem';

export { RadioGroup, RadioGroupItem };
