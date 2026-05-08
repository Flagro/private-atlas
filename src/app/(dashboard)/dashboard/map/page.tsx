import { auth } from "@/auth";
import {
  findVisitsPage,
  getVisitGeoSummary,
  getVisitRollupTotals,
} from "@/features/visits";
import { getCountriesWithVisitStatus, getCountryStats } from "@/features/places";
import { MapView } from "./map-view";
import type { VisitWithRelations } from "@/types";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { mapVisitDates } from "@/lib/serialize-visit";
import { DEFAULT_VISIT_PAGE_SIZE } from "@/constants/visits";

export const metadata: Metadata = {
  title: "Map",
};

export default async function MapPage() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId)
    redirect("/login");

  const [visitsPage, geo, rollup, countries, countryStats] = await Promise.all([
    findVisitsPage(userId, { limit: DEFAULT_VISIT_PAGE_SIZE, offset: 0 }),
    getVisitGeoSummary(userId),
    getVisitRollupTotals(userId),
    getCountriesWithVisitStatus(userId),
    getCountryStats(userId),
  ]);

  const visits: VisitWithRelations[] = visitsPage.visits.map((v) =>
    mapVisitDates(v) as VisitWithRelations
  );

  const initialMeta = {
    total: visitsPage.total,
    limit: visitsPage.limit,
    offset: visitsPage.offset,
    hasMore: visitsPage.hasMore,
  };

  return (
    <MapView
      initialVisits={visits}
      visitsPageSize={visitsPage.limit}
      initialMeta={initialMeta}
      initialGeo={geo}
      initialRollup={rollup}
      countries={countries}
      countryStats={countryStats}
    />
  );
}
