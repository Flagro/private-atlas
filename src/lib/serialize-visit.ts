/** Map Prisma visit rows to client-safe ISO date strings */
export function mapVisitDates<
  V extends {
    visitedAt: Date | string;
    createdAt: Date | string;
    updatedAt: Date | string;
    [key: string]: unknown;
  },
>(v: V) {
  return {
    ...v,
    visitedAt:
      typeof v.visitedAt === "string" ? v.visitedAt : v.visitedAt.toISOString(),
    createdAt:
      typeof v.createdAt === "string" ? v.createdAt : v.createdAt.toISOString(),
    updatedAt:
      typeof v.updatedAt === "string" ? v.updatedAt : v.updatedAt.toISOString(),
  };
}
