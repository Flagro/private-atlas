import type { VisitWithRelations } from "@/types";
import type { VisitRollupTotals, VisitGeoSummary } from "@/features/visits";
import type { VisitInsights } from "@/features/visits/insights";
import type { VisitsListPayload } from "@/types/visits";
import type { CountryOption } from "@/types";
import type { CountryStat } from "@/components/map/world-map";
import { fallbackMessage } from "@/lib/api-errors";

function isRollupTotals(x: unknown): x is VisitRollupTotals {
  if (!x || typeof x !== "object") return false;
  const r = x as Record<string, unknown>;
  return (
    typeof r.countriesVisited === "number" &&
    typeof r.citiesVisited === "number" &&
    typeof r.visitsCount === "number"
  );
}

function assertVisitsPayload(body: unknown): VisitsListPayload | null {
  if (!body || typeof body !== "object") return null;
  const o = body as Record<string, unknown>;
  if (!Array.isArray(o.visits) || !o.meta || typeof o.meta !== "object")
    return null;
  const m = o.meta as Record<string, unknown>;
  const total = m.total,
    limit = m.limit,
    offset = m.offset,
    hasMore = m.hasMore;
  if (
    typeof total !== "number" ||
    typeof limit !== "number" ||
    typeof offset !== "number" ||
    typeof hasMore !== "boolean"
  ) {
    return null;
  }
  return {
    visits: o.visits as VisitWithRelations[],
    meta: { total, limit, offset, hasMore },
  };
}

/** Used by dashboards for pagination + filter resets. */
export async function fetchVisitsList(opts: {
  /** Skip N visits (sorted by date desc); use `loadedCount` pattern: pass current list length when appending */
  offset: number;
  limit?: number;
  countryId?: string;
}) {
  const q = new URLSearchParams({
    offset: String(opts.offset),
  });
  if (opts.limit != null)
    q.set("limit", String(opts.limit));
  if (opts.countryId)
    q.set("countryId", opts.countryId);

  const res = await fetch(`/api/visits?${q.toString()}`, {
    credentials: "include",
    cache: "no-store",
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    return { ok: false as const, message: fallbackMessage(body) };
  }

  const data = assertVisitsPayload(body);
  if (!data) {
    return {
      ok: false as const,
      message: "Invalid response loading visits.",
    };
  }
  return { ok: true as const, data };
}

export type AggregateSnapshot = {
  totals: VisitRollupTotals;
  geo: VisitGeoSummary;
  insights: VisitInsights;
  countryStats: CountryStat[];
  countries: CountryOption[];
};

function isVisitInsights(x: unknown): x is VisitInsights {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return (
    typeof o.currentYear === "number" &&
    typeof o.visitsThisYear === "number" &&
    typeof o.visitStreakMonths === "number" &&
    Array.isArray(o.visitsByYear) &&
    Array.isArray(o.newCountriesThisYear)
  );
}

async function parseJsonSafe(res: Response) {
  return res.json().catch(() => null);
}

/** Refetches DB-backed rollup, map overlay, breakdown stats, and country flags after mutations */
export async function refetchVisitAggregates(): Promise<
  { ok: true; snapshot: AggregateSnapshot } | { ok: false; message: string }
> {
  try {
    const [ovRes, statsRes, cRes] = await Promise.all([
      fetch("/api/visits/overview", { credentials: "include", cache: "no-store" }),
      fetch("/api/places/countries/stats", {
        credentials: "include",
        cache: "no-store",
      }),
      fetch("/api/places/countries", {
        credentials: "include",
        cache: "no-store",
      }),
    ]);

    const ovBody = await parseJsonSafe(ovRes);
    const statsBody = await parseJsonSafe(statsRes);
    const countriesBody = await parseJsonSafe(cRes);

    if (
      !ovRes.ok ||
      !statsRes.ok ||
      !cRes.ok ||
      !isRollupTotals(ovBody?.totals) ||
      !isVisitInsights(ovBody?.insights) ||
      !Array.isArray(ovBody.geo?.countryCodes) ||
      !Array.isArray(ovBody.geo?.markers) ||
      !Array.isArray(statsBody) ||
      !Array.isArray(countriesBody)
    ) {
      return {
        ok: false as const,
        message: fallbackMessage(countriesBody ?? statsBody ?? ovBody),
      };
    }

    return {
      ok: true as const,
      snapshot: {
        totals: ovBody.totals,
        geo: ovBody.geo as VisitGeoSummary,
        insights: ovBody.insights,
        countryStats: statsBody as CountryStat[],
        countries: countriesBody as CountryOption[],
      },
    };
  } catch {
    return {
      ok: false as const,
      message: "Network error while refreshing summaries.",
    };
  }
}
