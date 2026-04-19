"use client";

import { useState, useMemo, useEffect } from "react";
import dynamic from "next/dynamic";
import type { CountryOption, VisitWithRelations } from "@/types";
import type { CountryStat, CityMarker } from "@/components/map/world-map";
import { countryCodeToFlag, formatVisitDate } from "@/lib/utils";
import { AddVisitDialog } from "./add-visit-dialog";
import { EditVisitDialog } from "./edit-visit-dialog";
import { useToast } from "@/components/providers/toast-provider";
import { Button } from "@/components/ui/button";

const WorldMap = dynamic(
  () => import("@/components/map/world-map").then((m) => m.WorldMap),
  { ssr: false, loading: () => <MapSkeleton /> }
);

type View = "list" | "map";

interface VisitsDashboardProps {
  initialVisits: VisitWithRelations[];
  countries: CountryOption[];
  countryStats: CountryStat[];
}

export function VisitsDashboard({
  initialVisits,
  countries,
  countryStats: initialStats,
}: VisitsDashboardProps) {
  const [visits, setVisits] = useState<VisitWithRelations[]>(initialVisits);
  const [filterCountryId, setFilterCountryId] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [editingVisit, setEditingVisit] = useState<VisitWithRelations | null>(null);
  const [view, setView] = useState<View>(() => {
    if (typeof window === "undefined") return "list";
    const saved = localStorage.getItem("atlas-view");
    return saved === "map" || saved === "list" ? saved : "list";
  });
  const [mapFilterCode, setMapFilterCode] = useState<string | null>(null);
  const [countryStats, setCountryStats] =
    useState<CountryStat[]>(initialStats);
  const { toast } = useToast();

  // Persist view preference
  useEffect(() => {
    localStorage.setItem("atlas-view", view);
  }, [view]);

  const countriesVisited = useMemo(
    () => new Set(visits.filter((v) => v.countryId).map((v) => v.countryId)).size,
    [visits]
  );
  const citiesVisited = useMemo(
    () => new Set(visits.filter((v) => v.cityId).map((v) => v.cityId)).size,
    [visits]
  );

  const visitedCountryIds = useMemo(
    () => new Set(visits.map((v) => v.countryId).filter(Boolean)),
    [visits]
  );
  const visitedCountries = useMemo(
    () => countries.filter((c) => visitedCountryIds.has(c.id)),
    [countries, visitedCountryIds]
  );

  const effectiveFilterId =
    filterCountryId && visitedCountryIds.has(filterCountryId)
      ? filterCountryId
      : "";

  const filtered = useMemo(
    () =>
      effectiveFilterId
        ? visits.filter((v) => v.countryId === effectiveFilterId)
        : visits,
    [visits, effectiveFilterId]
  );

  // Map-specific derived data
  const visitedCodes = useMemo(
    () => new Set(visits.filter((v) => v.country).map((v) => v.country!.code)),
    [visits]
  );

  const cityMarkers = useMemo<CityMarker[]>(() => {
    const seen = new Set<string>();
    const markers: CityMarker[] = [];
    for (const v of visits) {
      if (v.city?.lat == null || v.city?.lng == null || !v.country) continue;
      const key = `${v.city.lat},${v.city.lng}`;
      if (seen.has(key)) continue;
      seen.add(key);
      markers.push({
        name: v.city.name,
        countryName: v.country.name,
        lat: v.city.lat,
        lng: v.city.lng,
      });
    }
    return markers;
  }, [visits]);

  const mapFilteredVisits = mapFilterCode
    ? visits.filter((v) => v.country?.code === mapFilterCode)
    : visits;

  function refreshStats(updatedVisits: VisitWithRelations[]) {
    const statsMap = new Map<string, { visitCount: number; lastVisited: string }>();
    for (const v of updatedVisits) {
      const code = v.country?.code;
      if (!code) continue;
      const existing = statsMap.get(code);
      if (!existing) {
        statsMap.set(code, { visitCount: 1, lastVisited: v.visitedAt });
      } else {
        existing.visitCount += 1;
        if (v.visitedAt > existing.lastVisited) {
          existing.lastVisited = v.visitedAt;
        }
      }
    }
    setCountryStats(
      Array.from(statsMap.entries()).map(([code, s]) => ({
        code,
        visitCount: s.visitCount,
        lastVisited: s.lastVisited,
      }))
    );
  }

  function handleAdd(visit: VisitWithRelations) {
    const updated = [visit, ...visits];
    setVisits(updated);
    refreshStats(updated);
    toast("Visit added!", "success");
  }

  function handleEdit(updated: VisitWithRelations) {
    const next = visits.map((v) => (v.id === updated.id ? updated : v));
    setVisits(next);
    refreshStats(next);
    toast("Visit updated!", "success");
  }

  async function handleDelete(id: string) {
    setDeletingIds((prev) => new Set([...prev, id]));
    let res: Response;
    try {
      res = await fetch(`/api/visits/${id}`, { method: "DELETE" });
    } catch {
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      toast("Network error. Could not delete visit.", "error");
      return;
    }
    setDeletingIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    if (!res.ok) {
      toast("Failed to delete visit. Please try again.", "error");
      return;
    }
    const updated = visits.filter((v) => v.id !== id);
    setVisits(updated);
    refreshStats(updated);
  }

  return (
    <>
      <header className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Your travels
        </h1>
        <p className="mt-1 max-w-lg text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
          Countries, cities, and notes you&apos;ve logged—switch to the map to
          explore visually.
        </p>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        <StatCard
          value={countriesVisited}
          label="Countries"
          tone="teal"
        />
        <StatCard value={citiesVisited} label="Cities" tone="sky" />
        <StatCard value={visits.length} label="Visits" tone="violet" />
      </div>

      {/* View toggle */}
      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-full border border-zinc-200/90 bg-zinc-100/80 p-1 shadow-inner dark:border-zinc-700 dark:bg-zinc-800/60">
          <ToggleButton active={view === "list"} onClick={() => setView("list")}>
            <ListIcon /> List
          </ToggleButton>
          <ToggleButton active={view === "map"} onClick={() => setView("map")}>
            <MapIcon /> Map
          </ToggleButton>
        </div>

        {view === "list" && (
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
              className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm transition-shadow focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
            >
              <option value="">All countries</option>
              {visitedCountries.map((c) => (
                <option key={c.id} value={c.id}>
                  {countryCodeToFlag(c.code)} {c.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <Button variant="accent" onClick={() => setDialogOpen(true)}>
          + Add visit
        </Button>
      </div>

      {/* Map view */}
      {view === "map" && (
        <div className="mt-4 space-y-4">
          <div className="overflow-hidden rounded-2xl border border-zinc-200/90 bg-white shadow-lg shadow-zinc-900/5 ring-1 ring-zinc-900/5 dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-black/20 dark:ring-white/5">
            <WorldMap
              visitedCodes={visitedCodes}
              countryStats={countryStats}
              cityMarkers={cityMarkers}
              highlightCode={mapFilterCode ?? undefined}
              onCountryClick={setMapFilterCode}
            />
          </div>

          {mapFilterCode && (
            <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
              <span>
                Filtered by{" "}
                <span className="font-medium text-zinc-900 dark:text-zinc-100">
                  {(() => {
                    const c = countries.find((c) => c.code === mapFilterCode);
                    return c ? `${countryCodeToFlag(c.code)} ${c.name}` : mapFilterCode;
                  })()}
                </span>
              </span>
              <button
                onClick={() => setMapFilterCode(null)}
                className="ml-1 rounded px-1.5 py-0.5 text-xs font-medium text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
              >
                Clear ×
              </button>
            </div>
          )}

          <div className="space-y-3">
            {mapFilteredVisits.length === 0 ? (
              <EmptyState hasVisits={visits.length > 0} onAdd={() => setDialogOpen(true)} />
            ) : (
              mapFilteredVisits.map((visit) => (
                <VisitCard
                  key={visit.id}
                  visit={visit}
                  onDelete={handleDelete}
                  onEdit={setEditingVisit}
                  deleting={deletingIds.has(visit.id)}
                />
              ))
            )}
          </div>
        </div>
      )}

      {/* List view */}
      {view === "list" && (
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
                onEdit={setEditingVisit}
                deleting={deletingIds.has(visit.id)}
              />
            ))
          )}
        </div>
      )}

      <AddVisitDialog
        isOpen={dialogOpen}
        countries={countries}
        onClose={() => setDialogOpen(false)}
        onAdd={handleAdd}
      />

      <EditVisitDialog
        visit={editingVisit}
        countries={countries}
        onClose={() => setEditingVisit(null)}
        onEdit={handleEdit}
      />
    </>
  );
}

function ToggleButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
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

function StatCard({
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

function VisitCard({
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

  const flag = visit.country ? countryCodeToFlag(visit.country.code) : "🌍";
  const place = [visit.country?.name, visit.city?.name]
    .filter(Boolean)
    .join(" · ");

  function handleDeleteClick() {
    setConfirming(true);
  }

  function handleConfirm() {
    setConfirming(false);
    onDelete(visit.id);
  }

  function handleCancel() {
    setConfirming(false);
  }

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
          <>
            <span className="mr-1 text-xs text-zinc-500 dark:text-zinc-400">
              Delete?
            </span>
            <button
              onClick={handleCancel}
              className="rounded px-2 py-1 text-xs font-medium text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={deleting}
              className="rounded bg-red-50 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-40 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40"
            >
              {deleting ? (
                <span className="block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                "Delete"
              )}
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => onEdit(visit)}
              aria-label="Edit visit"
              className="rounded p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
            >
              <PencilIcon />
            </button>
            <button
              onClick={handleDeleteClick}
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

function EmptyState({
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
          No visits match this filter.
        </p>
        <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
          Try choosing &quot;All countries&quot; or another destination.
        </p>
      </div>
    );
  }
  return (
    <div className="rounded-2xl border border-dashed border-zinc-300/90 bg-zinc-50/50 py-16 text-center dark:border-zinc-700 dark:bg-zinc-900/40">
      <p className="text-4xl" aria-hidden>
        ✈️
      </p>
      <p className="mt-3 text-zinc-600 dark:text-zinc-400">
        No visits logged yet.
      </p>
      <button
        type="button"
        onClick={onAdd}
        className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-teal-700 underline-offset-4 hover:underline dark:text-teal-400"
      >
        Log your first visit →
      </button>
    </div>
  );
}

function MapSkeleton() {
  return (
    <div className="flex h-72 flex-col items-center justify-center gap-3 rounded-xl bg-gradient-to-b from-zinc-100 to-zinc-50 dark:from-zinc-800 dark:to-zinc-900">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal-600 border-t-transparent dark:border-teal-400" />
      <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading map…</p>
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

function PencilIcon() {
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
      aria-hidden="true"
    >
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  );
}

function MapIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="15"
      height="15"
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
