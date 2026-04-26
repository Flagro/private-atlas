import Link from "next/link";

export default function DashboardNotFound() {
  return (
    <div className="flex min-h-[min(50vh,24rem)] flex-col items-center justify-center gap-4 px-4 text-center">
      <h2 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        Page not found
      </h2>
      <p className="max-w-md text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
        This URL isn&apos;t part of your atlas. Head back to the dashboard or
        map.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/dashboard"
          className="rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-950"
        >
          Dashboard
        </Link>
        <Link
          href="/dashboard/map"
          className="rounded-lg border border-zinc-300 px-4 py-2.5 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2 dark:border-zinc-600 dark:text-zinc-100 dark:hover:bg-zinc-800 dark:focus:ring-offset-zinc-950"
        >
          Map
        </Link>
      </div>
    </div>
  );
}
