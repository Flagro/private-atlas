import { auth } from "@/auth";
import {
  findVisitsPage,
  getVisitRollupTotals,
  getVisitGeoSummary,
} from "@/features/visits";
import { getVisitInsights } from "@/features/visits/insights";
import { getCountriesWithVisitStatus, getCountryStats } from "@/features/places";
import { VisitsDashboard } from "./visits-dashboard";
import type { VisitWithRelations } from "@/types";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { mapVisitDates } from "@/lib/serialize-visit";
import { DEFAULT_VISIT_PAGE_SIZE } from "@/constants/visits";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId)
    redirect("/login");

  const [visitsPage, totals, geo, insights, countries, countryStats] =
    await Promise.all([
      findVisitsPage(userId, { limit: DEFAULT_VISIT_PAGE_SIZE, offset: 0 }),
      getVisitRollupTotals(userId),
      getVisitGeoSummary(userId),
      getVisitInsights(userId),
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
    <VisitsDashboard
      initialVisits={visits}
      visitsPageSize={visitsPage.limit}
      initialMeta={initialMeta}
      initialTotals={totals}
      initialGeo={geo}
      initialInsights={insights}
      countries={countries}
      countryStats={countryStats}
    />
  );
}
