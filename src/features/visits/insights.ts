import { prisma } from "@/lib/db";

export type VisitInsights = {
  currentYear: number;
  visitsThisYear: number;
  visitsLastYear: number;
  visitsByYear: { year: number; count: number }[];
  newCountriesThisYear: {
    code: string;
    name: string;
    firstVisitedAt: string;
  }[];
  /** Consecutive calendar months with at least one visit, ending at the latest active month */
  visitStreakMonths: number;
};

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}`;
}

function computeMonthStreak(visitDates: Date[], now: Date): number {
  if (visitDates.length === 0) return 0;

  const monthsWithVisits = new Set(visitDates.map(monthKey));

  let cursor = new Date(now.getFullYear(), now.getMonth(), 1);
  if (!monthsWithVisits.has(monthKey(cursor))) {
    cursor = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  }

  let streak = 0;
  while (monthsWithVisits.has(monthKey(cursor))) {
    streak++;
    cursor = new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1);
  }

  return streak;
}

export async function getVisitInsights(userId: string): Promise<VisitInsights> {
  const now = new Date();
  const currentYear = now.getFullYear();

  const visits = await prisma.visit.findMany({
    where: { userId },
    select: {
      visitedAt: true,
      countryId: true,
      country: { select: { code: true, name: true } },
    },
    orderBy: { visitedAt: "asc" },
  });

  const yearCounts = new Map<number, number>();
  let visitsThisYear = 0;
  let visitsLastYear = 0;

  for (const v of visits) {
    const y = v.visitedAt.getFullYear();
    yearCounts.set(y, (yearCounts.get(y) ?? 0) + 1);
    if (y === currentYear) visitsThisYear++;
    if (y === currentYear - 1) visitsLastYear++;
  }

  const visitsByYear = [...yearCounts.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([year, count]) => ({ year, count }));

  const firstByCountry = new Map<
    string,
    { code: string; name: string; first: Date }
  >();

  for (const v of visits) {
    if (!v.countryId || !v.country) continue;
    const existing = firstByCountry.get(v.countryId);
    if (!existing || v.visitedAt < existing.first) {
      firstByCountry.set(v.countryId, {
        code: v.country.code,
        name: v.country.name,
        first: v.visitedAt,
      });
    }
  }

  const newCountriesThisYear = [...firstByCountry.values()]
    .filter((c) => c.first.getFullYear() === currentYear)
    .map((c) => ({
      code: c.code,
      name: c.name,
      firstVisitedAt: c.first.toISOString().slice(0, 10),
    }))
    .sort((a, b) => a.firstVisitedAt.localeCompare(b.firstVisitedAt));

  const visitStreakMonths = computeMonthStreak(
    visits.map((v) => v.visitedAt),
    now
  );

  return {
    currentYear,
    visitsThisYear,
    visitsLastYear,
    visitsByYear,
    newCountriesThisYear,
    visitStreakMonths,
  };
}
