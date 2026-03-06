"use client";

import { useState } from "react";
import type { CountryOption, VisitWithRelations } from "@/types";
import { countryCodeToFlag, formatVisitDate } from "@/lib/utils";
import { AddVisitDialog } from "./add-visit-dialog";
import { useToast } from "@/components/providers/toast-provider";
import { Button } from "@/components/ui/button";

interface VisitsDashboardProps {
  initialVisits: VisitWithRelations[];
  countries: CountryOption[];
}

export function VisitsDashboard({ initialVisits, countries }: VisitsDashboardProps) {
  const [visits, setVisits] = useState<VisitWithRelations[]>(initialVisits);
  const [filterCountryId, setFilterCountryId] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const countriesVisited = new Set(
    visits.filter((v) => v.countryId).map((v) => v.countryId)
  ).size;
  const citiesVisited = new Set(
    visits.filter((v) => v.cityId).map((v) => v.cityId)
  ).size;

  const visitedCountries = countries.filter((c) =>
    visits.some((v) => v.countryId === c.id)
  );

  // If the selected filter country no longer has any visits (e.g. last one was
  // deleted), treat it as "all" so the list doesn't get stuck in an empty state.
  const effectiveFilterId =
    filterCountryId && visitedCountries.some((c) => c.id === filterCountryId)
      ? filterCountryId
      : "";

  const filtered = effectiveFilterId
    ? visits.filter((v) => v.countryId === effectiveFilterId)
    : visits;

  function handleAdd(visit: VisitWithRelations) {
    setVisits((prev) => [visit, ...prev]);
    toast("Visit added!", "success");
  }

  async function handleDelete(id: string) {
    setDeletingIds((prev) => new Set([...prev, id]));
    const res = await fetch(`/api/visits/${id}`, { method: "DELETE" });
    setDeletingIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    if (!res.ok) {
      toast("Failed to delete visit. Please try again.", "error");
      return;
    }
    setVisits((prev) => prev.filter((v) => v.id !== id));
  }

  return (
    <>
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard value={countriesVisited} label="Countries" />
        <StatCard value={citiesVisited} label="Cities" />
        <StatCard value={visits.length} label="Visits" />
      </div>

      {/* Controls */}
      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <label
            htmlFor="country-filter"
            className="text-sm font-medium text-zinc-600 dark:text-zinc-400"
          >
            Filter
          </label>
          <select
            id="country-filter"
            value={effectiveFilterId}
            onChange={(e) => setFilterCountryId(e.target.value)}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
          >
            <option value="">All countries</option>
            {visitedCountries.map((c) => (
              <option key={c.id} value={c.id}>
                {countryCodeToFlag(c.code)} {c.name}
              </option>
            ))}
          </select>
        </div>

        <Button onClick={() => setDialogOpen(true)}>+ Add Visit</Button>
      </div>

      {/* Visits list */}
      <div className="mt-4 space-y-3">
        {filtered.length === 0 ? (
          <EmptyState
            hasVisits={visits.length > 0}
            onAdd={() => setDialogOpen(true)}
          />
        ) : (
          filtered.map((visit) => (
            <VisitCard
              key={visit.id}
              visit={visit}
              onDelete={handleDelete}
              deleting={deletingIds.has(visit.id)}
            />
          ))
        )}
      </div>

      <AddVisitDialog
        isOpen={dialogOpen}
        countries={countries}
        onClose={() => setDialogOpen(false)}
        onAdd={handleAdd}
      />
    </>
  );
}

function StatCard({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 text-center dark:border-zinc-800 dark:bg-zinc-900">
      <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
        {value}
      </p>
      <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">{label}</p>
    </div>
  );
}

function VisitCard({
  visit,
  onDelete,
  deleting,
}: {
  visit: VisitWithRelations;
  onDelete: (id: string) => void;
  deleting: boolean;
}) {
  const flag = visit.country ? countryCodeToFlag(visit.country.code) : "🌍";
  const place = [visit.country?.name, visit.city?.name]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
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
      <button
        onClick={() => onDelete(visit.id)}
        disabled={deleting}
        aria-label="Delete visit"
        className="shrink-0 rounded p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-red-600 disabled:opacity-40 dark:hover:bg-zinc-800 dark:hover:text-red-400"
      >
        {deleting ? (
          <span className="block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : (
          <TrashIcon />
        )}
      </button>
    </div>
  );
}

function EmptyState({
  hasVisits,
  onAdd,
}: {
  hasVisits: boolean;
  onAdd: () => void;
}) {
  if (hasVisits) {
    return (
      <p className="py-8 text-center text-sm text-zinc-400 dark:text-zinc-500">
        No visits match this filter.
      </p>
    );
  }
  return (
    <div className="rounded-xl border border-dashed border-zinc-300 py-16 text-center dark:border-zinc-700">
      <p className="text-zinc-500 dark:text-zinc-400">
        No visits logged yet.
      </p>
      <button
        onClick={onAdd}
        className="mt-3 text-sm font-medium text-zinc-900 underline-offset-2 hover:underline dark:text-zinc-100"
      >
        Log your first visit →
      </button>
    </div>
  );
}

function TrashIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}
