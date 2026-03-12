import { auth } from "@/auth";
import { getVisitsWithRelations } from "@/features/visits";
import { getCountriesWithVisitStatus, getCountryStats } from "@/features/places";
import { MapView } from "./map-view";
import type { VisitWithRelations } from "@/types";

export default async function MapPage() {
  const session = await auth();

  const [rawVisits, countries, countryStats] = await Promise.all([
    getVisitsWithRelations(session!.user.id),
    getCountriesWithVisitStatus(session!.user.id),
    getCountryStats(session!.user.id),
  ]);

  const visits: VisitWithRelations[] = rawVisits.map((v) => ({
    ...v,
    visitedAt: v.visitedAt.toISOString(),
    createdAt: v.createdAt.toISOString(),
    updatedAt: v.updatedAt.toISOString(),
  }));

  return (
    <MapView
      visits={visits}
      countries={countries}
      countryStats={countryStats}
    />
  );
}
