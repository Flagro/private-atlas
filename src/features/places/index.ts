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
  const groups = await prisma.visit.groupBy({
    by: ["countryId"],
    where: { userId, countryId: { not: null } },
    _count: { id: true },
    _max: { visitedAt: true },
  });

  const countryIds = groups
    .map((g) => g.countryId)
    .filter((id): id is string => id !== null);

  if (countryIds.length === 0) return [];

  const countries = await prisma.country.findMany({
    where: { id: { in: countryIds } },
    select: { id: true, code: true },
  });

  const countryCodeById = new Map(countries.map((c) => [c.id, c.code]));

  return groups.flatMap((g) => {
    if (g.countryId === null || g._max.visitedAt === null) return [];
    const code = countryCodeById.get(g.countryId);
    if (!code) return [];
    return [
      {
        code,
        visitCount: g._count.id,
        lastVisited: g._max.visitedAt.toISOString(),
      },
    ];
  });
}

export async function getCitiesByCountry(countryId: string) {
  return prisma.city.findMany({
    where: { countryId },
    select: { id: true, name: true, countryId: true },
    orderBy: { name: "asc" },
  });
}
