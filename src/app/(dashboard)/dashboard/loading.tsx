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
      {/* Match visits-dashboard header */}
      <header className="mb-8">
        <Skeleton className="h-8 w-48 max-w-[90%]" />
        <Skeleton className="mt-3 h-4 w-full max-w-lg" />
        <Skeleton className="mt-2 h-4 w-2/3 max-w-md" />
      </header>

      {/* Stats — same grid + card shape as StatCard */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="relative overflow-hidden rounded-2xl border border-zinc-200/90 bg-white p-5 text-center shadow-sm shadow-zinc-900/5 dark:border-zinc-800 dark:bg-zinc-900/80 dark:shadow-black/20"
          >
            <div
              className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${
                i === 0
                  ? "from-teal-400/70 to-emerald-400/50"
                  : i === 1
                    ? "from-sky-400/70 to-blue-400/50"
                    : "from-violet-400/70 to-purple-400/50"
              }`}
              aria-hidden
            />
            <Skeleton className="mx-auto h-9 w-12" />
            <Skeleton className="mx-auto mt-2 h-4 w-20" />
          </div>
        ))}
      </div>

      {/* Toolbar: list/map pill + filter + add (matches flex-wrap row) */}
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <Skeleton className="h-10 w-full max-w-[220px] rounded-full sm:w-[220px]" />
        <div className="flex flex-1 flex-wrap items-center justify-end gap-2 sm:gap-3">
          <Skeleton className="h-9 w-24 rounded-xl" />
          <Skeleton className="h-9 w-28 rounded-lg sm:w-32" />
        </div>
      </div>

      {/* Visit cards */}
      <div className="mt-4 space-y-3">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-2xl border border-zinc-200/90 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/80"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Skeleton className="h-7 w-7 shrink-0 rounded-full" />
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-4 w-full max-w-md" />
              </div>
              <div className="flex shrink-0 gap-1">
                <Skeleton className="h-8 w-8 rounded-lg" />
                <Skeleton className="h-8 w-8 rounded-lg" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
