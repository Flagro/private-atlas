"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";

interface DashboardShellProps {
  user: { name?: string | null; email: string };
  children: React.ReactNode;
}

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", Icon: HomeIcon },
  { href: "/dashboard/map", label: "Map", Icon: MapIcon },
] as const;

export function DashboardShell({ user, children }: DashboardShellProps) {
  const pathname = usePathname();
  const displayName = user.name ?? user.email;

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname === href || pathname.startsWith(href + "/");
  }

  function handleSignOut() {
    signOut({ callbackUrl: "/" });
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-b from-zinc-50 to-zinc-100/80 dark:from-zinc-950 dark:to-zinc-950">
      {/* ── Desktop sidebar ── */}
      <aside className="hidden lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-60 lg:shrink-0 lg:flex-col border-r border-zinc-200/80 bg-white/90 shadow-sm shadow-zinc-900/5 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/95 dark:shadow-none">
        {/* Branding */}
        <div className="flex h-14 items-center border-b border-zinc-200/80 px-5 dark:border-zinc-800">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 font-semibold tracking-tight text-zinc-900 dark:text-zinc-100"
          >
            <span
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-emerald-600 text-sm shadow-sm"
              aria-hidden
            >
              🌍
            </span>
            Private Atlas
          </Link>
        </div>

        {/* Nav links */}
        <nav className="flex-1 space-y-1 p-3">
          {NAV_ITEMS.map(({ href, label, Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                isActive(href)
                  ? "bg-teal-50 text-teal-900 shadow-sm dark:bg-teal-950/50 dark:text-teal-100"
                  : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/80 dark:hover:text-zinc-100"
              )}
            >
              <Icon />
              {label}
            </Link>
          ))}
        </nav>

        {/* User + sign out */}
        <div className="border-t border-zinc-200/80 p-4 dark:border-zinc-800">
          <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
            {displayName}
          </p>
          <button
            type="button"
            onClick={handleSignOut}
            className="mt-1.5 text-sm text-zinc-500 transition-colors hover:text-teal-700 dark:text-zinc-400 dark:hover:text-teal-300"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Mobile + main content column ── */}
      <div className="flex flex-1 flex-col">
        {/* Mobile top header */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-zinc-200/80 bg-white/95 px-4 backdrop-blur-sm lg:hidden dark:border-zinc-800 dark:bg-zinc-900/95">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 font-semibold tracking-tight text-zinc-900 dark:text-zinc-100"
          >
            <span
              className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-teal-500 to-emerald-600 text-xs shadow-sm"
              aria-hidden
            >
              🌍
            </span>
            Atlas
          </Link>
          <button
            onClick={handleSignOut}
            className="text-sm text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            Sign out
          </button>
        </header>

        {/* Page content */}
        <main
          id="main-content"
          tabIndex={-1}
          className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 pb-24 outline-none lg:px-8 lg:py-10 lg:pb-8"
        >
          {children}
        </main>

        {/* Mobile bottom nav */}
        <nav className="fixed bottom-0 left-0 right-0 z-40 flex border-t border-zinc-200/80 bg-white/95 px-2 py-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur-md lg:hidden dark:border-zinc-800 dark:bg-zinc-900/95">
          {NAV_ITEMS.map(({ href, label, Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 rounded-xl py-2 text-xs font-medium transition-colors",
                isActive(href)
                  ? "text-teal-700 dark:text-teal-300"
                  : "text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
              )}
            >
              <Icon />
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}

function HomeIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function MapIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
      <line x1="9" y1="3" x2="9" y2="18" />
      <line x1="15" y1="6" x2="15" y2="21" />
    </svg>
  );
}
