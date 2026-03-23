import { Skeleton } from '../feedback/Skeleton';

/**
 * Skeleton shell shown during auth bootstrap inside AppLayout.
 * Approximates the dashboard card-grid layout so the app
 * feels like it's loading content, not loading itself.
 * Sidebar and main shell are already visible via AppLayout.
 */
export function ProtectedAppSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="bento-card lg:col-span-2">
          <div className="flex items-center gap-4">
            <Skeleton className="h-14 w-14 rounded-xl-dp" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-6 w-2/3" />
              <Skeleton className="h-4 w-1/3" />
            </div>
          </div>
          <div className="mt-5 space-y-2">
            <Skeleton className="h-3 w-1/4" />
            <Skeleton className="h-2 w-full rounded-full" />
          </div>
        </div>
        <div className="bento-card flex flex-col items-center justify-center">
          <Skeleton className="mb-3 h-16 w-16 rounded-full" />
          <Skeleton className="mb-2 h-8 w-12" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="bento-card space-y-4 lg:col-span-2">
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-2 w-full rounded-full" />
          <Skeleton className="h-11 w-full rounded-xl-dp" />
        </div>
        <div className="bento-card space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-8" />
          ))}
        </div>
      </div>
    </div>
  );
}
