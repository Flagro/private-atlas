"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import type { MouseEvent } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  ZoomableGroup,
} from "react-simple-maps";
import type { GeographyFeature } from "react-simple-maps";
import { numericToAlpha2 } from "@/lib/iso-codes";

const GEO_URL = "/countries-110m.json";

export interface CountryStat {
  code: string;
  visitCount: number;
  lastVisited: string;
}

export interface CityMarker {
  name: string;
  countryName: string;
  lat: number;
  lng: number;
}

interface TooltipState {
  x: number;
  y: number;
  content: string;
}

interface WorldMapProps {
  visitedCodes: Set<string>;
  countryStats: CountryStat[];
  cityMarkers: CityMarker[];
  /** When set, the map highlights a single country (ISO alpha-2) */
  highlightCode?: string;
  /** Called when user clicks a country — passes ISO alpha-2 code (or null to clear) */
  onCountryClick?: (code: string | null) => void;
}

export function WorldMap({
  visitedCodes,
  countryStats,
  cityMarkers,
  highlightCode,
  onCountryClick,
}: WorldMapProps) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [geography, setGeography] = useState<object | null>(null);
  const [geographyError, setGeographyError] = useState(false);
  const [geographyAttempt, setGeographyAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    fetch(GEO_URL, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`Map request failed: ${response.status}`);
        return response.json() as Promise<object>;
      })
      .then(setGeography)
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setGeographyError(true);
      });
    return () => controller.abort();
  }, [geographyAttempt]);

  const statsMap = useMemo(
    () => new Map(countryStats.map((s) => [s.code, s])),
    [countryStats]
  );

  const handleMouseEnter = useCallback(
    (event: MouseEvent, content: string) => {
      setTooltip({ x: event.clientX, y: event.clientY, content });
    },
    []
  );

  const handleMouseMove = useCallback((event: MouseEvent) => {
    setTooltip((prev) => (prev ? { ...prev, x: event.clientX, y: event.clientY } : prev));
  }, []);

  const handleMouseLeave = useCallback(() => {
    setTooltip(null);
  }, []);

  if (geographyError) {
    return (
      <div
        role="alert"
        className="flex h-72 flex-col items-center justify-center gap-3 bg-zinc-50 px-4 text-center dark:bg-zinc-900"
      >
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          The map could not be loaded.
        </p>
        <button
          type="button"
          onClick={() => {
            setGeographyError(false);
            setGeography(null);
            setGeographyAttempt((attempt) => attempt + 1);
          }}
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-800 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!geography) {
    return (
      <div className="flex h-72 flex-col items-center justify-center gap-3 bg-zinc-50 dark:bg-zinc-900">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal-600 border-t-transparent dark:border-teal-400" />
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading map…</p>
      </div>
    );
  }

  return (
    <div className="relative w-full select-none">
      <ComposableMap
        projectionConfig={{ scale: 147, center: [10, 10] }}
        className="w-full"
        style={{ height: "auto" }}
      >
        <ZoomableGroup zoom={1} minZoom={1} maxZoom={6}>
          <Geographies geography={geography}>
            {({ geographies }: { geographies: GeographyFeature[] }) =>
              geographies.map((geo: GeographyFeature) => {
                const alpha2 = numericToAlpha2(geo.id as number);
                const visited = alpha2 ? visitedCodes.has(alpha2) : false;
                const isHighlighted = alpha2 && highlightCode === alpha2;
                const stat = alpha2 ? statsMap.get(alpha2) : undefined;

                let fill = "#d4d4d8"; // zinc-300 — unvisited
                if (isHighlighted) {
                  fill = "#2563eb"; // blue-600 — filtered country
                } else if (visited) {
                  fill = "#18181b"; // zinc-900 — visited
                }

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={fill}
                    stroke="#ffffff"
                    strokeWidth={0.5}
                    style={{
                      default: { outline: "none", cursor: visited ? "pointer" : "default" },
                      hover: {
                        outline: "none",
                        fill: isHighlighted
                          ? "#1d4ed8"
                          : visited
                          ? "#3f3f46"
                          : "#a1a1aa",
                        cursor: visited ? "pointer" : "default",
                      },
                      pressed: { outline: "none" },
                    }}
                    onMouseEnter={(e: MouseEvent<SVGPathElement>) => {
                      if (!alpha2) return;
                      const name = (geo.properties?.name as string | undefined) ?? alpha2;
                      const label = stat
                        ? `${name} · ${stat.visitCount} visit${stat.visitCount !== 1 ? "s" : ""}`
                        : name;
                      handleMouseEnter(e as unknown as MouseEvent, label);
                    }}
                    onMouseMove={(e: MouseEvent<SVGPathElement>) =>
                      handleMouseMove(e as unknown as MouseEvent)
                    }
                    onMouseLeave={handleMouseLeave}
                    onClick={() => {
                      if (!alpha2 || !onCountryClick) return;
                      if (visited) {
                        onCountryClick(isHighlighted ? null : alpha2);
                      }
                    }}
                  />
                );
              })
            }
          </Geographies>

          {/* City markers */}
          {cityMarkers.map((city) => (
            <Marker
              key={`${city.lat},${city.lng}`}
              coordinates={[city.lng, city.lat]}
              onMouseEnter={(e: MouseEvent<SVGGElement>) =>
                handleMouseEnter(
                  e as unknown as MouseEvent,
                  `${city.name} · ${city.countryName}`
                )
              }
              onMouseMove={(e: MouseEvent<SVGGElement>) =>
                handleMouseMove(e as unknown as MouseEvent)
              }
              onMouseLeave={handleMouseLeave}
            >
              <circle
                r={3}
                fill="#f59e0b"
                stroke="#ffffff"
                strokeWidth={1}
                className="cursor-default"
              />
            </Marker>
          ))}
        </ZoomableGroup>
      </ComposableMap>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="pointer-events-none fixed z-50 rounded-md border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-900 shadow-md dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          style={{ left: tooltip.x + 12, top: tooltip.y - 28 }}
        >
          {tooltip.content}
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-3 left-3 flex flex-col gap-1.5 rounded-lg border border-zinc-200 bg-white/90 p-2.5 text-xs backdrop-blur dark:border-zinc-700 dark:bg-zinc-900/90">
        <LegendItem swatchClass="bg-zinc-900 dark:bg-zinc-700" label="Visited" />
        <LegendItem swatchClass="bg-blue-600" label="Filtered" />
        <LegendItem swatchClass="bg-amber-400" label="City" isCircle />
        <LegendItem swatchClass="bg-zinc-300 dark:bg-zinc-600" label="Not visited" />
      </div>
    </div>
  );
}

function LegendItem({
  swatchClass,
  label,
  isCircle = false,
}: {
  swatchClass: string;
  label: string;
  isCircle?: boolean;
}) {
  return (
    <div className="flex items-center gap-1.5">
      {isCircle ? (
        <span
          className={`inline-block h-2.5 w-2.5 rounded-full border border-white dark:border-zinc-700 ${swatchClass}`}
        />
      ) : (
        <span className={`inline-block h-2.5 w-3 rounded-sm ${swatchClass}`} />
      )}
      <span className="text-zinc-600 dark:text-zinc-400">{label}</span>
    </div>
  );
}
