function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800 ${className ?? ""}`}
    />
  );
}

export default function MapLoading() {
  return (
    <div className="space-y-8">
      <header>
        <Skeleton className="h-8 w-40" />
        <Skeleton className="mt-3 h-4 w-full max-w-lg" />
        <Skeleton className="mt-2 h-4 w-5/6 max-w-md" />
      </header>

      <div className="overflow-hidden rounded-2xl border border-zinc-200/90 bg-white shadow-lg shadow-zinc-900/5 ring-1 ring-zinc-900/5 dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-black/20 dark:ring-white/5">
        <div className="flex h-[min(420px,55vh)] flex-col items-center justify-center gap-3 bg-gradient-to-b from-zinc-100 to-zinc-50 dark:from-zinc-800 dark:to-zinc-900">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal-600 border-t-transparent dark:border-teal-400" />
          <Skeleton className="h-4 w-32 rounded" />
        </div>
      </div>

      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="flex flex-wrap items-center gap-2">
              <Skeleton className="h-6 w-6 rounded-full" />
              <Skeleton className="h-5 w-44" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="mt-2 h-4 w-full max-w-md" />
          </div>
        ))}
      </div>
    </div>
  );
}
