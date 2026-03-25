import * as React from 'react';

import { cn } from '../../lib/utils';

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value = 0, ...props }, ref) => {
    const normalizedValue = Math.max(0, Math.min(100, value));

    return (
      <div
        ref={ref}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={normalizedValue}
        className={cn('relative h-2 w-full overflow-hidden rounded-full bg-white/[0.06]', className)}
        {...props}
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-dp-secondary to-dp-accent transition-all duration-slow ease-smooth"
          style={{ width: `${normalizedValue}%` }}
        />
      </div>
    );
  },
);

Progress.displayName = 'Progress';

export { Progress };
