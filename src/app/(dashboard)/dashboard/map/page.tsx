import { auth } from "@/auth";
import { getVisitsWithRelations } from "@/features/visits";
import { getCountriesWithVisitStatus, getCountryStats } from "@/features/places";
import { MapView } from "./map-view";
import type { VisitWithRelations } from "@/types";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Map",
};

export default async function MapPage() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/login");

  const [rawVisits, countries, countryStats] = await Promise.all([
    getVisitsWithRelations(userId),
    getCountriesWithVisitStatus(userId),
    getCountryStats(userId),
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
