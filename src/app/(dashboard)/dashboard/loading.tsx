function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800 ${className ?? ""}`}
    />
  );
}

export default function DashboardLoading() {
  return (
    <div>
      {/* Stats skeleton */}
      <div className="grid grid-cols-3 gap-4">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="rounded-xl border border-zinc-200 bg-white p-4 text-center dark:border-zinc-800 dark:bg-zinc-900"
          >
            <Skeleton className="mx-auto h-8 w-10" />
            <Skeleton className="mx-auto mt-2 h-4 w-16" />
          </div>
        ))}
      </div>

      {/* Controls skeleton */}
      <div className="mt-8 flex items-center justify-between">
        <Skeleton className="h-8 w-44" />
        <Skeleton className="h-8 w-24" />
      </div>

      {/* Visit cards skeleton */}
      <div className="mt-4 space-y-3">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="flex items-center gap-3">
              <Skeleton className="h-6 w-6 rounded-full" />
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-4 w-28" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
