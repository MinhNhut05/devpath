import * as React from 'react';

import { cn } from '../../lib/utils';

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('skeleton animate-shimmer rounded-md-dp', className)} {...props} />;
}

export { Skeleton };
