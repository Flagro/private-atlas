"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import type { VisitWithRelations } from "@/types";
import { Button } from "@/components/ui/button";
import { countryCodeToFlag, formatVisitDate } from "@/lib/utils";

export function ToggleButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all ${
        active
          ? "bg-white text-zinc-900 shadow-sm ring-1 ring-zinc-200/80 dark:bg-zinc-700 dark:text-zinc-100 dark:ring-zinc-600"
          : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
      }`}
    >
      {children}
    </button>
  );
}

const statTones = {
  teal: "from-teal-500 to-emerald-500",
  sky: "from-sky-500 to-blue-500",
  violet: "from-violet-500 to-purple-500",
} as const;

export function StatCard({
  value,
  label,
  tone,
}: {
  value: number;
  label: string;
  tone: keyof typeof statTones;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-zinc-200/90 bg-white p-5 text-center shadow-sm shadow-zinc-900/5 transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/80 dark:shadow-black/20">
      <div
        className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${statTones[tone]}`}
        aria-hidden
      />
      <p className="text-3xl font-bold tabular-nums tracking-tight text-zinc-900 dark:text-zinc-50">
        {value}
      </p>
      <p className="mt-1 text-sm font-medium text-zinc-500 dark:text-zinc-400">
        {label}
      </p>
    </div>
  );
}

export function VisitCard({
  visit,
  onDelete,
  onEdit,
  deleting,
}: {
  visit: VisitWithRelations;
  onDelete: (id: string) => void;
  onEdit: (visit: VisitWithRelations) => void;
  deleting: boolean;
}) {
  const [confirming, setConfirming] = useState(false);
  const cancelConfirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (confirming) cancelConfirmRef.current?.focus();
  }, [confirming]);

  useEffect(() => {
    if (!confirming) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setConfirming(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [confirming]);

  const flag = visit.country ? countryCodeToFlag(visit.country.code) : "🌍";
  const place = [visit.country?.name, visit.city?.name]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="group flex items-start justify-between gap-4 rounded-2xl border border-zinc-200/90 bg-white p-4 shadow-sm transition-all hover:border-zinc-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/80 dark:hover:border-zinc-700">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xl leading-none">{flag}</span>
          <span className="font-medium text-zinc-900 dark:text-zinc-100">
            {place}
          </span>
          <span className="text-sm text-zinc-400 dark:text-zinc-500">
            {formatVisitDate(visit.visitedAt)}
          </span>
        </div>
        {visit.notes && (
          <p className="mt-1.5 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">
            {visit.notes}
          </p>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-1">
        {confirming ? (
          <div
            role="group"
            aria-labelledby={`delete-offer-${visit.id}`}
            className="flex shrink-0 flex-wrap items-center justify-end gap-1.5"
          >
            <p
              id={`delete-offer-${visit.id}`}
              className="w-full basis-full text-xs text-zinc-600 dark:text-zinc-400 sm:w-auto sm:basis-auto sm:max-w-[10rem] sm:text-right md:max-w-none"
              aria-live="polite"
            >
              Remove this visit?
            </p>
            <button
              ref={cancelConfirmRef}
              type="button"
              onClick={() => setConfirming(false)}
              className="rounded px-2 py-1 text-xs font-medium text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                setConfirming(false);
                onDelete(visit.id);
              }}
              disabled={deleting}
              className="rounded bg-red-50 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-40 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40"
            >
              {deleting ? (
                <span className="block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                "Remove"
              )}
            </button>
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={() => onEdit(visit)}
              aria-label="Edit visit"
              className="rounded p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
            >
              <PencilIcon />
            </button>
            <button
              type="button"
              onClick={() => setConfirming(true)}
              disabled={deleting}
              aria-label="Delete visit"
              className="rounded p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-red-600 disabled:opacity-40 dark:hover:bg-zinc-800 dark:hover:text-red-400"
            >
              <TrashIcon />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export function EmptyState({
  hasVisits,
  onAdd,
}: {
  hasVisits: boolean;
  onAdd: () => void;
}) {
  if (hasVisits) {
    return (
      <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50/80 py-12 text-center dark:border-zinc-800 dark:bg-zinc-900/40">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          No visits match this filter on the loaded pages.
        </p>
        <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
          Try &quot;All countries&quot;, load more, or choose another destination.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-dashed border-zinc-300/90 bg-zinc-50/50 py-12 text-center dark:border-zinc-700 dark:bg-zinc-900/40 sm:py-16">
      <p className="text-4xl" aria-hidden>
        ✈️
      </p>
      <h2 className="mt-4 text-base font-semibold text-zinc-900 dark:text-zinc-100">
        Start your atlas
      </h2>
      <p className="mx-auto mt-2 max-w-sm text-sm text-zinc-600 dark:text-zinc-400">
        Add a country or city to see it here and on the map. Only you can see
        your log—it stays in your account.
      </p>
      <div className="mt-6">
        <Button variant="accent" size="md" onClick={onAdd}>
          Add your first visit
        </Button>
      </div>
    </div>
  );
}

export function MapSkeleton() {
  return (
    <div className="flex h-72 flex-col items-center justify-center gap-3 rounded-xl bg-gradient-to-b from-zinc-100 to-zinc-50 dark:from-zinc-800 dark:to-zinc-900">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal-600 border-t-transparent dark:border-teal-400" />
      <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading map…</p>
    </div>
  );
}

export function DashboardError({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div
      role="alert"
      className="my-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300"
    >
      <span>{message}</span>
      <Button variant="secondary" size="sm" onClick={onRetry}>
        Try again
      </Button>
    </div>
  );
}

function TrashIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

export function ListIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  );
}

export function MapIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
      <line x1="9" y1="3" x2="9" y2="18" />
      <line x1="15" y1="6" x2="15" y2="21" />
    </svg>
  );
}
