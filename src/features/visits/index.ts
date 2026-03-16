// Phase 2: visits data access

import { prisma } from "@/lib/db";
import type { CreateVisitInput, UpdateVisitInput } from "@/lib/validations/visits";
import { emitVisitEvent, buildVisitEvent } from "@/features/integrations";

const visitRelations = {
  country: { select: { id: true, name: true, code: true } },
  city: { select: { id: true, name: true, lat: true, lng: true } },
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

  const visit = await prisma.visit.create({
    data: {
      userId,
      countryId: countryId ?? null,
      cityId: cityId ?? null,
      visitedAt: new Date(data.visitedAt),
      notes: data.notes ?? null,
    },
    include: visitRelations,
  });

  // Fire-and-forget — never blocks the response
  void emitVisitEvent(
    buildVisitEvent("VisitCreated", {
      visitId: visit.id,
      userId,
      countryCode: visit.country?.code,
      countryName: visit.country?.name,
      cityName: visit.city?.name,
      visitedAt: visit.visitedAt.toISOString(),
      notes: visit.notes,
    })
  );

  return visit;
}

export async function updateVisit(
  visitId: string,
  userId: string,
  data: UpdateVisitInput
) {
  const existing = await prisma.visit.findFirst({ where: { id: visitId, userId } });
  if (!existing) return null;

  const visit = await prisma.visit.update({
    where: { id: visitId },
    data: {
      ...(data.countryId !== undefined ? { countryId: data.countryId } : {}),
      ...(data.cityId !== undefined ? { cityId: data.cityId } : {}),
      ...(data.visitedAt ? { visitedAt: new Date(data.visitedAt) } : {}),
      ...(data.notes !== undefined ? { notes: data.notes } : {}),
    },
    include: visitRelations,
  });

  void emitVisitEvent(
    buildVisitEvent("VisitUpdated", {
      visitId: visit.id,
      userId,
      countryCode: visit.country?.code,
      countryName: visit.country?.name,
      cityName: visit.city?.name,
      visitedAt: visit.visitedAt.toISOString(),
      notes: visit.notes,
    })
  );

  return visit;
}

export async function deleteVisit(visitId: string, userId: string) {
  const existing = await prisma.visit.findFirst({
    where: { id: visitId, userId },
    include: visitRelations,
  });
  if (!existing) return false;

  await prisma.visit.delete({ where: { id: visitId } });

  void emitVisitEvent(
    buildVisitEvent("VisitDeleted", {
      visitId,
      userId,
      countryCode: existing.country?.code,
      countryName: existing.country?.name,
      cityName: existing.city?.name,
      visitedAt: existing.visitedAt.toISOString(),
      notes: existing.notes,
    })
  );

  return true;
}
