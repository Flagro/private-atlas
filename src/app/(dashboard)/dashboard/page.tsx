import { auth } from "@/auth";
import { getVisitsWithRelations } from "@/features/visits";
import { getCountriesWithVisitStatus, getCountryStats } from "@/features/places";
import { VisitsDashboard } from "./visits-dashboard";
import type { VisitWithRelations } from "@/types";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/login");

  const [rawVisits, countries, countryStats] = await Promise.all([
    getVisitsWithRelations(userId),
    getCountriesWithVisitStatus(userId),
    getCountryStats(userId),
  ]);

  // Serialize Prisma Date objects to ISO strings before passing to client component
  const visits: VisitWithRelations[] = rawVisits.map((v) => ({
    ...v,
    visitedAt: v.visitedAt.toISOString(),
    createdAt: v.createdAt.toISOString(),
    updatedAt: v.updatedAt.toISOString(),
  }));

  return (
    <VisitsDashboard
      initialVisits={visits}
      countries={countries}
      countryStats={countryStats}
    />
  );
}
