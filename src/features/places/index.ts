// Phase 2: countries & cities data access

import { prisma } from "@/lib/db";

export async function getCountriesWithVisitStatus(userId: string) {
  const [countries, visitedRows] = await Promise.all([
    prisma.country.findMany({
      select: { id: true, name: true, code: true },
      orderBy: { name: "asc" },
    }),
    prisma.visit.findMany({
      where: { userId, countryId: { not: null } },
      select: { countryId: true },
      distinct: ["countryId"],
    }),
  ]);

  const visitedSet = new Set(visitedRows.map((v) => v.countryId));
  return countries.map((c) => ({ ...c, visited: visitedSet.has(c.id) }));
}

export async function getCountryStats(userId: string) {
  const visits = await prisma.visit.findMany({
    where: { userId, countryId: { not: null } },
    select: { countryId: true, visitedAt: true, country: { select: { code: true } } },
    orderBy: { visitedAt: "desc" },
  });

  const statsMap = new Map<string, { visitCount: number; lastVisited: Date }>();
  for (const v of visits) {
    const code = v.country?.code;
    if (!code) continue;
    if (!statsMap.has(code)) {
      statsMap.set(code, { visitCount: 0, lastVisited: v.visitedAt });
    }
    statsMap.get(code)!.visitCount += 1;
  }

  return Array.from(statsMap.entries()).map(([code, s]) => ({
    code,
    visitCount: s.visitCount,
    lastVisited: s.lastVisited.toISOString(),
  }));
}

export async function getCitiesByCountry(countryId?: string) {
  return prisma.city.findMany({
    where: countryId ? { countryId } : undefined,
    select: { id: true, name: true, countryId: true },
    orderBy: { name: "asc" },
  });
}
