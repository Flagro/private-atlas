"use client";

import {
  useState,
  useMemo,
  useEffect,
  useCallback,
} from "react";
import dynamic from "next/dynamic";
import type { CountryOption, VisitWithRelations } from "@/types";
import type { VisitsMeta } from "@/types/visits";
import type {
  VisitGeoSummary,
  VisitRollupTotals,
} from "@/features/visits";
import type { VisitInsights } from "@/features/visits/insights";
import { VisitInsightsPanel } from "@/components/dashboard/visit-insights-panel";
import type { CountryStat } from "@/components/map/world-map";
import { countryCodeToFlag } from "@/lib/utils";
import { AddVisitDialog } from "./add-visit-dialog";
import { EditVisitDialog } from "./edit-visit-dialog";
import { useToast } from "@/components/providers/toast-provider";
import { Button } from "@/components/ui/button";
import { MapGeoNotice } from "@/components/map/map-geo-notice";
import { fallbackMessage } from "@/lib/api-errors";
import { fetchVisitsList, refetchVisitAggregates } from "./visit-queries";
import {
  EmptyState,
  ListIcon,
  MapIcon,
  MapSkeleton,
  StatCard,
  ToggleButton,
  VisitCard,
} from "./visit-dashboard-components";

const WorldMap = dynamic(
  () => import("@/components/map/world-map").then((m) => m.WorldMap),
  { ssr: false, loading: () => <MapSkeleton /> }
);

type View = "list" | "map";

interface VisitsDashboardProps {
  initialVisits: VisitWithRelations[];
  visitsPageSize: number;
  initialMeta: VisitsMeta;
  initialTotals: VisitRollupTotals;
  initialGeo: VisitGeoSummary;
  initialInsights: VisitInsights;
  countries: CountryOption[];
  countryStats: CountryStat[];
}

export function VisitsDashboard({
  initialVisits,
  visitsPageSize,
  initialMeta,
  initialTotals,
  initialGeo,
  initialInsights,
  countries: countriesInitial,
  countryStats: initialStats,
}: VisitsDashboardProps) {
  const [visits, setVisits] = useState<VisitWithRelations[]>(initialVisits);
  const [visitsMeta, setVisitsMeta] = useState<VisitsMeta>(initialMeta);
  const [rollup, setRollup] = useState<VisitRollupTotals>(initialTotals);
  const [geo, setGeo] = useState<VisitGeoSummary>(initialGeo);
  const [insights, setInsights] = useState<VisitInsights>(initialInsights);
  const [countriesCatalog, setCountriesCatalog] =
    useState<CountryOption[]>(countriesInitial);

  const [filterCountryId, setFilterCountryId] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [editingVisit, setEditingVisit] =
    useState<VisitWithRelations | null>(null);
  const [view, setView] = useState<View>(() => {
    if (typeof window === "undefined") return "list";
    const saved = localStorage.getItem("atlas-view");
    return saved === "map" || saved === "list" ? saved : "list";
  });
  const [mapFilterCode, setMapFilterCode] = useState<string | null>(null);
  const [countryStats, setCountryStats] =
    useState<CountryStat[]>(initialStats);

  const [filterListLoading, setFilterListLoading] = useState(false);
  const [listLoadingMore, setListLoadingMore] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    localStorage.setItem("atlas-view", view);
  }, [view]);

  const visitedCountryOptions = useMemo(
    () => countriesCatalog.filter((c) => c.visited),
    [countriesCatalog]
  );

  const effectiveFilterId =
    filterCountryId &&
    visitedCountryOptions.some((c) => c.id === filterCountryId)
      ? filterCountryId
      : "";

  const resolveCountryQueryId = useCallback(() => effectiveFilterId, [effectiveFilterId]);

  const reloadVisitsReplace = useCallback(
    async (countryIdOpt?: string) => {
      setFilterListLoading(true);
      const r = await fetchVisitsList({
        offset: 0,
        limit: visitsPageSize,
        countryId: countryIdOpt,
      });
      setFilterListLoading(false);
      if (!r.ok) {
        toast(r.message, "error");
        return false;
      }
      setVisits(r.data.visits);
      setVisitsMeta(r.data.meta);
      return true;
    },
    [toast, visitsPageSize]
  );

  const applyCountryFilter = useCallback(
    async (raw: string) => {
      setFilterCountryId(raw);
      const next =
        raw && visitedCountryOptions.some((c) => c.id === raw) ? raw : undefined;
      await reloadVisitsReplace(next);
    },
    [reloadVisitsReplace, visitedCountryOptions]
  );

  const afterVisitMutation = useCallback(async () => {
    const agg = await refetchVisitAggregates();
    if (!agg.ok) {
      toast(agg.message, "error");
      return;
    }

    const {
      totals,
      geo: geoNext,
      insights: insightsNext,
      countryStats: statsNext,
      countries: cNext,
    } = agg.snapshot;
    setRollup(totals);
    setGeo(geoNext);
    setInsights(insightsNext);
    setCountryStats(statsNext);
    setCountriesCatalog(cNext);

    const visitedOpts = cNext.filter((c) => c.visited);
    const cid =
      filterCountryId && visitedOpts.some((c) => c.id === filterCountryId)
        ? filterCountryId
        : undefined;

    await fetchVisitsList({
      offset: 0,
      limit: visitsPageSize,
      countryId: cid,
    }).then((r) => {
      if (r.ok) {
        setVisits(r.data.visits);
        setVisitsMeta(r.data.meta);
      }
    });
  }, [filterCountryId, toast, visitsPageSize]);

  const handleLoadMore = useCallback(async () => {
    if (!visitsMeta.hasMore || listLoadingMore || filterListLoading)
      return;
    setListLoadingMore(true);
    const countryIdOpt = resolveCountryQueryId();
    const r = await fetchVisitsList({
      offset: visits.length,
      limit: visitsMeta.limit,
      ...(countryIdOpt ? { countryId: countryIdOpt } : {}),
    });
    setListLoadingMore(false);
    if (!r.ok) {
      toast(r.message, "error");
      return;
    }
    const seen = new Set(visits.map((v) => v.id));
    const appended = r.data.visits.filter((v) => !seen.has(v.id));
    setVisits((prev) => [...prev, ...appended]);
    setVisitsMeta(r.data.meta);
  }, [
    filterListLoading,
    listLoadingMore,
    visits.length,
    visitsMeta.hasMore,
    visitsMeta.limit,
    resolveCountryQueryId,
    toast,
  ]);

  const visitedCodes = useMemo(() => new Set(geo.countryCodes), [geo.countryCodes]);
  const cityMarkers = geo.markers;

  const mapFilteredVisits = mapFilterCode
    ? visits.filter((v) => v.country?.code === mapFilterCode)
    : visits;

  const emptyFilterHasGlobeVisits = effectiveFilterId
    ? visitsMeta.total > 0
    : rollup.visitsCount > 0;

  async function handleAdd(_visit: VisitWithRelations) {
    toast("Visit added!", "success");
    await afterVisitMutation();
  }

  async function handleEdit(_updated: VisitWithRelations) {
    toast("Visit updated!", "success");
    await afterVisitMutation();
  }

  async function handleDelete(id: string) {
    setDeletingIds((prev) => new Set([...prev, id]));
    let res: Response;
    try {
      res = await fetch(`/api/visits/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
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
      const body = await res.json().catch(() => null);
      toast(fallbackMessage(body, "Could not remove visit."), "error");
      return;
    }

    await afterVisitMutation();
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
          value={rollup.countriesVisited}
          label="Countries"
          tone="teal"
        />
        <StatCard value={rollup.citiesVisited} label="Cities" tone="sky" />
        <StatCard value={rollup.visitsCount} label="Visits" tone="violet" />
      </div>

      {rollup.visitsCount > 0 ? <VisitInsightsPanel insights={insights} /> : null}

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
              disabled={filterListLoading}
              onChange={(e) => void applyCountryFilter(e.target.value)}
              className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm transition-shadow focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
            >
              <option value="">All countries</option>
              {visitedCountryOptions.map((c) => (
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
          <div className="space-y-2">
            <div className="overflow-hidden rounded-2xl border border-zinc-200/90 bg-white shadow-lg shadow-zinc-900/5 ring-1 ring-zinc-900/5 dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-black/20 dark:ring-white/5">
              <WorldMap
                visitedCodes={visitedCodes}
                countryStats={countryStats}
                cityMarkers={cityMarkers}
                highlightCode={mapFilterCode ?? undefined}
                onCountryClick={setMapFilterCode}
              />
            </div>
            <MapGeoNotice markersTruncated={geo.markersTruncated} />
          </div>

          {mapFilterCode && (
            <div className="flex flex-wrap items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
              <span>
                Filtered by{" "}
                <span className="font-medium text-zinc-900 dark:text-zinc-100">
                  {(() => {
                    const c = countriesCatalog.find((c) => c.code === mapFilterCode);
                    return c ? `${countryCodeToFlag(c.code)} ${c.name}` : mapFilterCode;
                  })()}
                </span>
              </span>
              <button
                type="button"
                onClick={() => setMapFilterCode(null)}
                className="ml-1 rounded px-1.5 py-0.5 text-xs font-medium text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
              >
                Clear ×
              </button>
              {rollup.visitsCount > visits.length &&
                mapFilteredVisits.length === 0 && (
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">
                    More visits aren&apos;t shown on this page—use list view or{" "}
                    <span className="font-medium text-zinc-700 dark:text-zinc-300">
                      Load more
                    </span>{" "}
                    below.
                  </span>
                )}
            </div>
          )}

          <div className="space-y-3">
            {mapFilteredVisits.length === 0 ? (
              <EmptyState
                hasVisits={emptyFilterHasGlobeVisits}
                onAdd={() => setDialogOpen(true)}
              />
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

          {visitsMeta.hasMore && (
            <div className="flex justify-center pt-2">
              <Button
                variant="secondary"
                loading={listLoadingMore}
                onClick={() => void handleLoadMore()}
              >
                Load more visits
              </Button>
            </div>
          )}
        </div>
      )}

      {/* List view */}
      {view === "list" && (
        <>
          <div className="mt-4 space-y-3">
            {visits.length === 0 ? (
              <EmptyState
                hasVisits={emptyFilterHasGlobeVisits}
                onAdd={() => setDialogOpen(true)}
              />
            ) : (
              visits.map((visit) => (
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
          {visitsMeta.hasMore && visits.length > 0 && (
            <div className="flex justify-center pt-4">
              <Button
                variant="secondary"
                loading={listLoadingMore}
                onClick={() => void handleLoadMore()}
              >
                Load more visits
              </Button>
            </div>
          )}
        </>
      )}

      <AddVisitDialog
        isOpen={dialogOpen}
        countries={countriesCatalog}
        onClose={() => setDialogOpen(false)}
        onAdd={handleAdd}
      />

      <EditVisitDialog
        visit={editingVisit}
        countries={countriesCatalog}
        onClose={() => setEditingVisit(null)}
        onEdit={handleEdit}
      />
    </>
  );
}
