"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CountryStat } from "@/components/map/world-map";
import { useToast } from "@/components/providers/toast-provider";
import type { VisitGeoSummary, VisitRollupTotals } from "@/features/visits";
import type { VisitInsights } from "@/features/visits/insights";
import { fallbackMessage } from "@/lib/api-errors";
import type { CountryOption, VisitWithRelations } from "@/types";
import type { VisitsMeta } from "@/types/visits";
import { fetchVisitsList, refetchVisitAggregates } from "./visit-queries";

export type DashboardView = "list" | "map";

type InitialDashboardState = {
  visits: VisitWithRelations[];
  visitsPageSize: number;
  meta: VisitsMeta;
  totals: VisitRollupTotals;
  geo: VisitGeoSummary;
  insights: VisitInsights;
  countries: CountryOption[];
  countryStats: CountryStat[];
};

function readUrlState() {
  const params = new URLSearchParams(window.location.search);
  const view = params.get("view") === "map" ? "map" : "list";
  const countryCode = params.get("country")?.toUpperCase() ?? "";
  const mapCountry = params.get("mapCountry")?.toUpperCase() ?? null;
  const parsedPage = Number.parseInt(params.get("page") ?? "1", 10);
  return {
    view: view as DashboardView,
    countryCode,
    mapCountry,
    page: Number.isFinite(parsedPage) ? Math.min(20, Math.max(1, parsedPage)) : 1,
  };
}

function writeUrlState(state: {
  view: DashboardView;
  countryCode: string;
  mapCountry: string | null;
  page: number;
}) {
  const url = new URL(window.location.href);
  url.searchParams.set("view", state.view);
  if (state.countryCode) url.searchParams.set("country", state.countryCode);
  else url.searchParams.delete("country");
  if (state.mapCountry) url.searchParams.set("mapCountry", state.mapCountry);
  else url.searchParams.delete("mapCountry");
  if (state.page > 1) url.searchParams.set("page", String(state.page));
  else url.searchParams.delete("page");
  window.history.replaceState(null, "", url);
}

export function useVisitsDashboard(initial: InitialDashboardState) {
  const [visits, setVisits] = useState(initial.visits);
  const [visitsMeta, setVisitsMeta] = useState(initial.meta);
  const [rollup, setRollup] = useState(initial.totals);
  const [geo, setGeo] = useState(initial.geo);
  const [insights, setInsights] = useState(initial.insights);
  const [countriesCatalog, setCountriesCatalog] = useState(initial.countries);
  const [countryStats, setCountryStats] = useState(initial.countryStats);
  const [filterCountryId, setFilterCountryId] = useState("");
  const [view, setViewState] = useState<DashboardView>("list");
  const [mapFilterCode, setMapFilterCodeState] = useState<string | null>(null);
  const [filterListLoading, setFilterListLoading] = useState(false);
  const [listLoadingMore, setListLoadingMore] = useState(false);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const retryRef = useRef<() => Promise<void>>(async () => {});
  const restoreRef = useRef<() => Promise<void>>(async () => {});
  const hydratedRef = useRef(false);
  const restoringRef = useRef(false);
  const { toast } = useToast();

  const visitedCountryOptions = useMemo(
    () => countriesCatalog.filter((country) => country.visited),
    [countriesCatalog]
  );
  const effectiveFilterId = visitedCountryOptions.some(
    (country) => country.id === filterCountryId
  )
    ? filterCountryId
    : "";
  const page = Math.max(1, Math.ceil(visits.length / initial.visitsPageSize));
  const effectiveCountryCode =
    visitedCountryOptions.find((country) => country.id === effectiveFilterId)?.code ??
    "";

  const showError = useCallback((message: string, retry: () => Promise<void>) => {
    retryRef.current = retry;
    setErrorMessage(message);
  }, []);

  const loadVisits = useCallback(
    async (countryId: string, pages = 1) => {
      setFilterListLoading(true);
      const loaded: VisitWithRelations[] = [];
      let meta = initial.meta;
      for (let current = 0; current < pages; current++) {
        const result = await fetchVisitsList({
          offset: loaded.length,
          limit: initial.visitsPageSize,
          ...(countryId ? { countryId } : {}),
        });
        if (!result.ok) {
          setFilterListLoading(false);
          showError(result.message, () => loadVisits(countryId, pages).then(() => {}));
          return false;
        }
        loaded.push(...result.data.visits);
        meta = result.data.meta;
        if (!meta.hasMore) break;
      }
      setVisits(loaded);
      setVisitsMeta(meta);
      setFilterListLoading(false);
      setErrorMessage(null);
      return true;
    },
    [initial.meta, initial.visitsPageSize, showError]
  );

  const restoreFromUrl = useCallback(async () => {
    restoringRef.current = true;
    const urlState = readUrlState();
    const countryId =
      visitedCountryOptions.find((country) => country.code === urlState.countryCode)
        ?.id ?? "";
    const mapCountry = countriesCatalog.some(
      (country) => country.code === urlState.mapCountry
    )
      ? urlState.mapCountry
      : null;
    setViewState(urlState.view);
    setFilterCountryId(countryId);
    setMapFilterCodeState(mapCountry);
    await loadVisits(countryId, urlState.page);
    restoringRef.current = false;
  }, [countriesCatalog, loadVisits, visitedCountryOptions]);

  useEffect(() => {
    restoreRef.current = restoreFromUrl;
  }, [restoreFromUrl]);

  useEffect(() => {
    if (hydratedRef.current) return;
    hydratedRef.current = true;
    void restoreRef.current();
    const onPopState = () => void restoreRef.current();
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    if (!hydratedRef.current || restoringRef.current) return;
    writeUrlState({
      view,
      countryCode: effectiveCountryCode,
      mapCountry: mapFilterCode,
      page,
    });
  }, [effectiveCountryCode, mapFilterCode, page, view]);

  const setView = useCallback((next: DashboardView) => setViewState(next), []);
  const setMapFilterCode = useCallback(
    (code: string | null) => setMapFilterCodeState(code),
    []
  );

  const applyCountryFilter = useCallback(
    async (raw: string) => {
      const next = visitedCountryOptions.some((country) => country.id === raw)
        ? raw
        : "";
      setFilterCountryId(next);
      await loadVisits(next);
    },
    [loadVisits, visitedCountryOptions]
  );

  const refreshAfterMutation = useCallback(async function refreshAfterMutation() {
    const aggregateResult = await refetchVisitAggregates();
    if (!aggregateResult.ok) {
      showError(aggregateResult.message, refreshAfterMutation);
      return;
    }
    const snapshot = aggregateResult.snapshot;
    setRollup(snapshot.totals);
    setGeo(snapshot.geo);
    setInsights(snapshot.insights);
    setCountryStats(snapshot.countryStats);
    setCountriesCatalog(snapshot.countries);
    const countryId = snapshot.countries.some(
      (country) => country.visited && country.id === filterCountryId
    )
      ? filterCountryId
      : "";
    setFilterCountryId(countryId);
    await loadVisits(countryId, page);
  }, [filterCountryId, loadVisits, page, showError]);

  const handleLoadMore = useCallback(async function handleLoadMore() {
    if (!visitsMeta.hasMore || listLoadingMore || filterListLoading) return;
    setListLoadingMore(true);
    const result = await fetchVisitsList({
      offset: visits.length,
      limit: visitsMeta.limit,
      ...(effectiveFilterId ? { countryId: effectiveFilterId } : {}),
    });
    setListLoadingMore(false);
    if (!result.ok) {
      showError(result.message, handleLoadMore);
      return;
    }
    const seen = new Set(visits.map((visit) => visit.id));
    setVisits((current) => [
      ...current,
      ...result.data.visits.filter((visit) => !seen.has(visit.id)),
    ]);
    setVisitsMeta(result.data.meta);
    setErrorMessage(null);
  }, [
    effectiveFilterId,
    filterListLoading,
    listLoadingMore,
    showError,
    visits,
    visitsMeta,
  ]);

  const handleDelete = useCallback(
    async function handleDelete(id: string) {
      setDeletingIds((current) => new Set(current).add(id));
      try {
        const response = await fetch(`/api/visits/${id}`, {
          method: "DELETE",
          credentials: "include",
        });
        if (!response.ok) {
          const body = await response.json().catch(() => null);
          const message = fallbackMessage(body, "Could not remove visit.");
          showError(message, () => handleDelete(id));
          return;
        }
        await refreshAfterMutation();
      } catch {
        showError("Network error. Could not delete visit.", () => handleDelete(id));
      } finally {
        setDeletingIds((current) => {
          const next = new Set(current);
          next.delete(id);
          return next;
        });
      }
    },
    [refreshAfterMutation, showError]
  );

  const afterAdd = useCallback(async () => {
    toast("Visit added!", "success");
    await refreshAfterMutation();
  }, [refreshAfterMutation, toast]);

  const afterEdit = useCallback(async () => {
    toast("Visit updated!", "success");
    await refreshAfterMutation();
  }, [refreshAfterMutation, toast]);

  const retry = useCallback(async () => {
    setErrorMessage(null);
    await retryRef.current();
  }, []);

  return {
    visits,
    visitsMeta,
    rollup,
    geo,
    insights,
    countriesCatalog,
    countryStats,
    visitedCountryOptions,
    effectiveFilterId,
    view,
    mapFilterCode,
    filterListLoading,
    listLoadingMore,
    deletingIds,
    errorMessage,
    setView,
    setMapFilterCode,
    applyCountryFilter,
    handleLoadMore,
    handleDelete,
    afterAdd,
    afterEdit,
    retry,
  };
}
