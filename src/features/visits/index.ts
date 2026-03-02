// Phase 2: visits data access

import { prisma } from "@/lib/db";
import type { CreateVisitInput, UpdateVisitInput } from "@/lib/validations/visits";

const visitRelations = {
  country: { select: { id: true, name: true, code: true } },
  city: { select: { id: true, name: true } },
} as const;

export async function getVisitsWithRelations(userId: string, countryId?: string) {
  return prisma.visit.findMany({
    where: { userId, ...(countryId ? { countryId } : {}) },
    include: visitRelations,
    orderBy: { visitedAt: "desc" },
  });
}

export async function createVisit(userId: string, data: CreateVisitInput) {
  let { countryId, cityId } = data;

  // Auto-populate countryId from city when omitted
  if (cityId && !countryId) {
    const city = await prisma.city.findUnique({
      where: { id: cityId },
      select: { countryId: true },
    });
    if (city) countryId = city.countryId;
  }

  return prisma.visit.create({
    data: {
      userId,
      countryId: countryId ?? null,
      cityId: cityId ?? null,
      visitedAt: new Date(data.visitedAt),
      notes: data.notes ?? null,
    },
    include: visitRelations,
  });
}

export async function updateVisit(
  visitId: string,
  userId: string,
  data: UpdateVisitInput
) {
  const existing = await prisma.visit.findFirst({ where: { id: visitId, userId } });
  if (!existing) return null;

  return prisma.visit.update({
    where: { id: visitId },
    data: {
      ...(data.countryId !== undefined ? { countryId: data.countryId } : {}),
      ...(data.cityId !== undefined ? { cityId: data.cityId } : {}),
      ...(data.visitedAt ? { visitedAt: new Date(data.visitedAt) } : {}),
      ...(data.notes !== undefined ? { notes: data.notes } : {}),
    },
    include: visitRelations,
  });
}

export async function deleteVisit(visitId: string, userId: string) {
  const existing = await prisma.visit.findFirst({ where: { id: visitId, userId } });
  if (!existing) return false;
  await prisma.visit.delete({ where: { id: visitId } });
  return true;
}
