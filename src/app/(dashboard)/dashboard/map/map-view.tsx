"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useState, useMemo } from "react";
import type { CountryOption, VisitWithRelations } from "@/types";
import type { CountryStat, CityMarker } from "@/components/map/world-map";
import { countryCodeToFlag, formatVisitDate } from "@/lib/utils";

const WorldMap = dynamic(
  () => import("@/components/map/world-map").then((m) => m.WorldMap),
  { ssr: false, loading: () => <MapSkeleton /> }
);

interface MapViewProps {
  visits: VisitWithRelations[];
  countries: CountryOption[];
  countryStats: CountryStat[];
}

export function MapView({ visits, countries, countryStats }: MapViewProps) {
  const [highlightCode, setHighlightCode] = useState<string | null>(null);

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

  const filteredVisits = highlightCode
    ? visits.filter((v) => v.country?.code === highlightCode)
    : visits;

  const highlightedCountry = highlightCode
    ? countries.find((c) => c.code === highlightCode)
    : null;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          World map
        </h1>
        <p className="mt-1 max-w-lg text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
          Tap a country you&apos;ve visited to filter the list below. Zoom and
          explore city markers.
        </p>
      </header>

      {/* Map */}
      <div className="overflow-hidden rounded-2xl border border-zinc-200/90 bg-white shadow-lg shadow-zinc-900/5 ring-1 ring-zinc-900/5 dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-black/20 dark:ring-white/5">
        <WorldMap
          visitedCodes={visitedCodes}
          countryStats={countryStats}
          cityMarkers={cityMarkers}
          highlightCode={highlightCode ?? undefined}
          onCountryClick={setHighlightCode}
        />
      </div>

      {/* Filter indicator */}
      {highlightedCountry && (
        <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
          <span>
            Showing visits for{" "}
            <span className="font-medium text-zinc-900 dark:text-zinc-100">
              {countryCodeToFlag(highlightedCountry.code)} {highlightedCountry.name}
            </span>
          </span>
          <button
            onClick={() => setHighlightCode(null)}
            className="ml-1 rounded px-1.5 py-0.5 text-xs font-medium text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          >
            Clear ×
          </button>
        </div>
      )}

      {/* Visit list */}
      <div className="space-y-3">
        {filteredVisits.length === 0 ? (
          highlightCode ? (
            <p className="py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
              No visits for this country.
            </p>
          ) : (
            <MapPageEmptyState />
          )
        ) : (
          filteredVisits.map((v) => {
            const flag = v.country ? countryCodeToFlag(v.country.code) : "🌍";
            const place = [v.country?.name, v.city?.name].filter(Boolean).join(" · ");
            const date = formatVisitDate(v.visitedAt);
            return (
              <div
                key={v.id}
                className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xl leading-none">{flag}</span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">
                    {place}
                  </span>
                  <span className="text-sm text-zinc-400 dark:text-zinc-500">{date}</span>
                </div>
                {v.notes && (
                  <p className="mt-1.5 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">
                    {v.notes}
                  </p>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function MapPageEmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-zinc-300/90 bg-zinc-50/50 py-10 text-center dark:border-zinc-700 dark:bg-zinc-900/40 sm:py-12">
      <p className="text-3xl" aria-hidden>
        📍
      </p>
      <h2 className="mt-3 text-base font-semibold text-zinc-900 dark:text-zinc-100">
        No trips on the map yet
      </h2>
      <p className="mt-2 mx-auto max-w-md px-2 text-sm text-zinc-600 dark:text-zinc-400">
        Log a visit from the dashboard—then countries and cities show up here.
        Your data stays private to your account.
      </p>
      <div className="mt-5">
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm shadow-teal-900/10 transition hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 dark:hover:bg-teal-500 dark:focus:ring-offset-zinc-950"
        >
          Add your first visit
        </Link>
      </div>
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
