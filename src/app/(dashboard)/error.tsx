"use client";

import { useEffect } from "react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[dashboard]", error);
  }, [error]);

  return (
    <div className="flex min-h-[min(60vh,28rem)] flex-col items-center justify-center gap-5 px-4 text-center">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Something went wrong
        </h2>
        <p className="mx-auto max-w-md text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          We couldn&apos;t load this screen. Your log is still there—try again
          in a moment.
        </p>
      </div>
      {process.env.NODE_ENV === "development" && error.message ? (
        <pre className="max-h-32 max-w-full overflow-auto rounded-lg border border-red-200 bg-red-50/80 p-3 text-left text-xs text-red-900 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
          {error.message}
        </pre>
      ) : null}
      <button
        type="button"
        onClick={() => reset()}
        className="rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-950"
      >
        Try again
      </button>
    </div>
  );
}
