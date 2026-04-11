import Link from "next/link";
import { auth } from "@/auth";

export default async function HomePage() {
  const session = await auth();

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-zinc-50 via-white to-teal-50/30 px-4 dark:from-zinc-950 dark:via-zinc-900 dark:to-teal-950/20">
      <div
        className="pointer-events-none absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-teal-400/25 blur-3xl dark:bg-teal-600/15"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute bottom-0 right-0 h-64 w-64 rounded-full bg-emerald-400/20 blur-3xl dark:bg-emerald-700/10"
        aria-hidden
      />

      <main className="relative flex max-w-2xl flex-col items-center gap-10 text-center">
        <div className="space-y-4">
          <p className="text-5xl drop-shadow-sm" aria-hidden>
            🌍
          </p>
          <h1 className="bg-gradient-to-br from-zinc-900 to-zinc-600 bg-clip-text text-4xl font-bold tracking-tight text-transparent dark:from-zinc-100 dark:to-zinc-400 sm:text-5xl">
            Private Atlas
          </h1>
          <p className="mx-auto max-w-md text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
            Track the countries and cities you&apos;ve visited—your personal
            travel log, kept private.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
          {session?.user ? (
            <Link
              href="/dashboard"
              className="flex h-12 items-center justify-center rounded-full bg-teal-600 px-8 font-semibold text-white shadow-lg shadow-teal-900/20 transition hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-950"
            >
              Go to dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="flex h-12 items-center justify-center rounded-full bg-teal-600 px-8 font-semibold text-white shadow-lg shadow-teal-900/20 transition hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-950"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="flex h-12 items-center justify-center rounded-full border border-zinc-300 bg-white/80 px-8 font-semibold text-zinc-900 shadow-sm backdrop-blur transition hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900/80 dark:text-zinc-100 dark:hover:bg-zinc-800"
              >
                Create account
              </Link>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
