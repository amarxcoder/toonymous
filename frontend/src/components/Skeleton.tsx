// Skeletons mirror the exact shape of the content they stand in for, so the
// layout does not shift when real data lands (05-ui-styleguide.md: motion is
// purposeful, never decorative). The whole group is announced once by its
// container's aria-busy, not per-element.

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton ${className}`} />;
}

export function PostCardSkeleton() {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-bg-surface p-4 shadow-card">
      <div className="flex items-center gap-2.5">
        <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
        <div className="flex flex-1 flex-col gap-1.5">
          <Skeleton className="h-3 w-28 rounded-pill" />
          <Skeleton className="h-2.5 w-36 rounded-pill" />
        </div>
        <Skeleton className="h-7 w-16 shrink-0 rounded-pill" />
      </div>
      <Skeleton className="aspect-square w-full rounded-xl" />
      <div className="flex gap-2">
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
      <Skeleton className="h-3 w-4/5 rounded-pill" />
      <Skeleton className="h-3 w-2/5 rounded-pill" />
    </div>
  );
}

export function CommentSkeleton() {
  return (
    <div className="flex gap-3 px-1 py-2">
      <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
      <div className="flex flex-1 flex-col gap-1.5">
        <Skeleton className="h-2.5 w-24 rounded-pill" />
        <Skeleton className="h-3 w-3/4 rounded-pill" />
      </div>
    </div>
  );
}

export function RowSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-bg-surface p-3.5">
      <div className="flex flex-1 flex-col gap-2">
        <Skeleton className="h-3 w-1/3 rounded-pill" />
        <Skeleton className="h-2.5 w-3/4 rounded-pill" />
      </div>
      <Skeleton className="h-8 w-20 shrink-0 rounded-md" />
    </div>
  );
}
