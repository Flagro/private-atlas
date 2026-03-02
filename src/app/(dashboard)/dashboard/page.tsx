import { auth } from "@/auth";
import { getVisitsWithRelations } from "@/features/visits";
import { getCountriesWithVisitStatus } from "@/features/places";
import { VisitsDashboard } from "./visits-dashboard";
import type { VisitWithRelations } from "@/types";

export default async function DashboardPage() {
  const session = await auth();

  const [rawVisits, countries] = await Promise.all([
    getVisitsWithRelations(session!.user.id),
    getCountriesWithVisitStatus(session!.user.id),
  ]);

  // Serialize Prisma Date objects to ISO strings before passing to client component
  const visits: VisitWithRelations[] = rawVisits.map((v) => ({
    ...v,
    visitedAt: v.visitedAt.toISOString(),
    createdAt: v.createdAt.toISOString(),
    updatedAt: v.updatedAt.toISOString(),
  }));

  return <VisitsDashboard initialVisits={visits} countries={countries} />;
}
