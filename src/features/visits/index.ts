// Phase 2: visits data access

import { prisma } from "@/lib/db";

/** Thrown when countryId / cityId are missing, unknown, or inconsistent. */
export class InvalidVisitPlaceError extends Error {
  constructor(message = "Invalid country or city selection") {
    super(message);
    this.name = "InvalidVisitPlaceError";
  }
}
import type { CreateVisitInput, UpdateVisitInput } from "@/lib/validations/visits";
import { emitVisitEvent, buildVisitEvent } from "@/features/integrations";

const visitRelations = {
  country: { select: { id: true, name: true, code: true } },
  city: { select: { id: true, name: true, lat: true, lng: true } },
} as const;

/** Ensures city exists and matches country when both are set; fills country from city when omitted. */
async function resolveCountryAndCityIds(
  countryId: string | null,
  cityId: string | null
): Promise<{ countryId: string | null; cityId: string | null } | null> {
  if (cityId) {
    const city = await prisma.city.findUnique({
      where: { id: cityId },
      select: { countryId: true },
    });
    if (!city) return null;
    if (countryId !== null && countryId !== city.countryId) return null;
    return { countryId: city.countryId, cityId };
  }
  if (countryId) {
    const country = await prisma.country.findUnique({
      where: { id: countryId },
      select: { id: true },
    });
    if (!country) return null;
  }
  return { countryId, cityId };
}

export async function getVisitsWithRelations(userId: string, countryId?: string) {
  return prisma.visit.findMany({
    where: { userId, ...(countryId ? { countryId } : {}) },
    include: visitRelations,
    orderBy: { visitedAt: "desc" },
  });
}

export async function createVisit(userId: string, data: CreateVisitInput) {
  const resolved = await resolveCountryAndCityIds(
    data.countryId ?? null,
    data.cityId ?? null
  );
  if (!resolved) throw new InvalidVisitPlaceError();

  const { countryId, cityId } = resolved;

  const visit = await prisma.visit.create({
    data: {
      userId,
      countryId,
      cityId,
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

  const mergedCountryId =
    data.countryId !== undefined ? data.countryId : existing.countryId;
  const mergedCityId =
    data.cityId !== undefined ? data.cityId : existing.cityId;

  const resolved = await resolveCountryAndCityIds(mergedCountryId, mergedCityId);
  if (!resolved) throw new InvalidVisitPlaceError();

  const updatingPlace =
    data.countryId !== undefined || data.cityId !== undefined;

  const visit = await prisma.visit.update({
    where: { id: visitId },
    data: {
      ...(updatingPlace
        ? { countryId: resolved.countryId, cityId: resolved.cityId }
        : {}),
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
