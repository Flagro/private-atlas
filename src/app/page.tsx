import Link from "next/link";
import { auth } from "@/auth";

export default async function HomePage() {
  const session = await auth();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <main className="flex max-w-2xl flex-col items-center gap-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Private Atlas
        </h1>
        <p className="text-lg text-zinc-600 dark:text-zinc-400">
          Track the countries and cities you&apos;ve visited. Your personal
          travel log.
        </p>

        <div className="flex flex-col gap-4 sm:flex-row">
          {session?.user ? (
            <>
              <Link
                href="/dashboard"
                className="flex h-12 items-center justify-center rounded-full bg-zinc-900 px-6 font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                Go to Dashboard
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="flex h-12 items-center justify-center rounded-full bg-zinc-900 px-6 font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="flex h-12 items-center justify-center rounded-full border border-zinc-300 px-6 font-medium transition-colors hover:bg-zinc-100 dark:border-zinc-600 dark:hover:bg-zinc-800"
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
