import * as React from 'react';

import { cn } from '../../lib/utils';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    type="checkbox"
    className={cn(
      'h-4 w-4 shrink-0 appearance-none rounded border border-dp-border bg-transparent text-dp-secondary',
      'checked:border-dp-secondary checked:bg-dp-secondary checked:shadow-dp-glow',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dp-secondary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-dp-deep',
      className,
    )}
    {...props}
  />
));

Checkbox.displayName = 'Checkbox';

export { Checkbox };
