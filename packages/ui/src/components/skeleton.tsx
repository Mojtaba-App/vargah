import * as React from 'react';

import { cn } from '../lib/utils';

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-shimmer rounded-md bg-muted', className)}
      aria-hidden="true"
      {...props}
    />
  );
}

function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn('space-y-2', className)} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn('h-4', i === lines - 1 ? 'w-3/4' : 'w-full')}
        />
      ))}
    </div>
  );
}

function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('overflow-hidden rounded-xl border border-border bg-card', className)} aria-hidden="true">
      <Skeleton className="aspect-[16/10] rounded-none" />
      <div className="space-y-3 p-4">
        <Skeleton className="h-5 w-2/3" />
        <SkeletonText lines={2} />
        <div className="flex justify-between pt-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
    </div>
  );
}

function SkeletonIssueCard({ className }: { className?: string }) {
  return (
    <div className={cn('overflow-hidden rounded-xl border border-border bg-card', className)} aria-hidden="true">
      <Skeleton className="aspect-[3/4] rounded-none" />
      <div className="space-y-2 p-4">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
}

function SkeletonPageHeader({ className }: { className?: string }) {
  return (
    <div className={cn('content-under-header border-b border-border bg-muted/30', className)} aria-hidden="true">
      <div className="clear-site-header mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <Skeleton className="mb-3 h-9 w-1/2 max-w-md" />
        <Skeleton className="h-5 w-2/3 max-w-lg" />
      </div>
    </div>
  );
}

export { Skeleton, SkeletonText, SkeletonCard, SkeletonIssueCard, SkeletonPageHeader };
