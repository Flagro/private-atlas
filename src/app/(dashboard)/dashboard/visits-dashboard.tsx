"use client";

import { useState, useMemo, useEffect } from "react";
import dynamic from "next/dynamic";
import type { CountryOption, VisitWithRelations } from "@/types";
import type { CountryStat, CityMarker } from "@/components/map/world-map";
import { countryCodeToFlag, formatVisitDate } from "@/lib/utils";
import { AddVisitDialog } from "./add-visit-dialog";
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

  const countriesVisited = new Set(
    visits.filter((v) => v.countryId).map((v) => v.countryId)
  ).size;
  const citiesVisited = new Set(
    visits.filter((v) => v.cityId).map((v) => v.cityId)
  ).size;

  const visitedCountries = countries.filter((c) =>
    visits.some((v) => v.countryId === c.id)
  );

  const effectiveFilterId =
    filterCountryId && visitedCountries.some((c) => c.id === filterCountryId)
      ? filterCountryId
      : "";

  const filtered = effectiveFilterId
    ? visits.filter((v) => v.countryId === effectiveFilterId)
    : visits;

  // Map-specific derived data
  const visitedCodes = useMemo(
    () => new Set(visits.filter((v) => v.country).map((v) => v.country!.code)),
    [visits]
  );

  const cityMarkers = useMemo<CityMarker[]>(() => {
    const seen = new Set<string>();
    const markers: CityMarker[] = [];
    for (const v of visits) {
      if (!v.city?.lat || !v.city?.lng || !v.country) continue;
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
    const updated = visits.filter((v) => v.id !== id);
    setVisits(updated);
    refreshStats(updated);
  }

  return (
    <>
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard value={countriesVisited} label="Countries" />
        <StatCard value={citiesVisited} label="Cities" />
        <StatCard value={visits.length} label="Visits" />
      </div>

      {/* View toggle */}
      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <div className="flex rounded-lg border border-zinc-200 bg-zinc-100 p-0.5 dark:border-zinc-800 dark:bg-zinc-800/50">
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
        )}

        <Button onClick={() => setDialogOpen(true)}>+ Add Visit</Button>
      </div>

      {/* Map view */}
      {view === "map" && (
        <div className="mt-4 space-y-4">
          <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
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
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
        active
          ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-zinc-100"
          : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
      }`}
    >
      {children}
    </button>
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
      <p className="text-zinc-500 dark:text-zinc-400">No visits logged yet.</p>
      <button
        onClick={onAdd}
        className="mt-3 text-sm font-medium text-zinc-900 underline-offset-2 hover:underline dark:text-zinc-100"
      >
        Log your first visit →
      </button>
    </div>
  );
}

function MapSkeleton() {
  return (
    <div className="flex h-64 items-center justify-center text-sm text-zinc-400 dark:text-zinc-500">
      Loading map…
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
