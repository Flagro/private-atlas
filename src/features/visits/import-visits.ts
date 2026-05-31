import { prisma } from "@/lib/db";
import { NUMERIC_TO_ALPHA2 } from "@/lib/iso-codes";
import type { ImportMergeMode, VisitImportRow } from "@/lib/validations/visit-import";
import type { CreateVisitInput } from "@/lib/validations/visits";

const KNOWN_ALPHA2 = new Set(Object.values(NUMERIC_TO_ALPHA2));

export type ImportRowIssue = {
  index: number;
  message: string;
};

export type ImportPreviewRow = {
  index: number;
  visitedAt: string;
  countryCode: string | null;
  cityName: string | null;
  notes: string | null;
  status: "ready" | "duplicate" | "error";
};

export type ImportVisitsResult = {
  dryRun: boolean;
  mergeMode: ImportMergeMode;
  totalRows: number;
  created: number;
  skipped: number;
  duplicatesSkipped: number;
  existingVisitsDeleted?: number;
  issues: ImportRowIssue[];
  preview?: ImportPreviewRow[];
};

function dedupeKey(
  countryId: string | null | undefined,
  cityId: string | null | undefined,
  visitedAt: string
): string {
  return `${countryId ?? ""}|${cityId ?? ""}|${visitedAt}`;
}

async function resolveRowToCreateInput(
  row: VisitImportRow,
  countryByCode: Map<string, { id: string }>,
  cityLookup: Map<string, string>
): Promise<
  | { input: CreateVisitInput; countryId: string | null; cityId: string | null }
  | { error: string }
> {
  let countryId: string | null = null;
  let cityId: string | null = null;

  if (row.country?.code) {
    if (!KNOWN_ALPHA2.has(row.country.code)) {
      return { error: `Unknown country code "${row.country.code}"` };
    }
    const country = countryByCode.get(row.country.code);
    if (!country) {
      return { error: `Country "${row.country.code}" is not in the catalog` };
    }
    countryId = country.id;
  }

  if (row.city?.name) {
    const code = row.country?.code;
    if (!code) {
      return { error: "City import requires a country code in the same row" };
    }
    const country = countryByCode.get(code);
    if (!country) {
      return { error: `Country "${code}" is not in the catalog` };
    }
    const key = `${country.id}\0${row.city.name.toLowerCase()}`;
    const resolvedCityId = cityLookup.get(key);
    if (!resolvedCityId) {
      return {
        error: `City "${row.city.name}" was not found for ${code}`,
      };
    }
    cityId = resolvedCityId;
    countryId = country.id;
  }

  if (!countryId && !cityId) {
    return { error: "Could not resolve country or city" };
  }

  return {
    input: {
      ...(countryId ? { countryId } : {}),
      ...(cityId ? { cityId } : {}),
      visitedAt: row.visitedAt,
      ...(row.notes !== undefined ? { notes: row.notes } : {}),
    },
    countryId,
    cityId,
  };
}

async function loadExistingDedupeKeys(userId: string): Promise<Set<string>> {
  const existing = await prisma.visit.findMany({
    where: { userId },
    select: { countryId: true, cityId: true, visitedAt: true },
  });

  const keys = new Set<string>();
  for (const v of existing) {
    const date = v.visitedAt.toISOString().slice(0, 10);
    keys.add(dedupeKey(v.countryId, v.cityId, date));
  }
  return keys;
}

/**
 * Imports validated visit rows. Uses Prisma only (parameterized queries).
 * Never trusts file ids, names for country matching, or coordinates for place resolution.
 */
export async function importVisitsForUser(
  userId: string,
  rows: VisitImportRow[],
  options: { dryRun: boolean; mergeMode: ImportMergeMode }
): Promise<ImportVisitsResult> {
  const codesInFile = new Set<string>();
  for (const row of rows) {
    if (row.country?.code) codesInFile.add(row.country.code);
    if (row.city?.name && row.country?.code) codesInFile.add(row.country.code);
  }

  const countries = await prisma.country.findMany({
    where: { code: { in: [...codesInFile] } },
    select: { id: true, code: true },
  });
  const countryByCode = new Map(countries.map((c) => [c.code, { id: c.id }]));

  const countryIds = countries.map((c) => c.id);

  const cities =
    countryIds.length > 0
      ? await prisma.city.findMany({
          where: {
            countryId: { in: countryIds },
            name: {
              in: [...new Set(rows.filter((r) => r.city?.name).map((r) => r.city!.name))],
            },
          },
          select: { id: true, name: true, countryId: true },
        })
      : [];

  const cityLookup = new Map<string, string>();
  for (const city of cities) {
    cityLookup.set(`${city.countryId}\0${city.name.toLowerCase()}`, city.id);
  }

  let existingKeys = await loadExistingDedupeKeys(userId);
  const existingCount = existingKeys.size;

  let existingVisitsDeleted = 0;
  if (options.mergeMode === "replace" && !options.dryRun) {
    const deleted = await prisma.visit.deleteMany({ where: { userId } });
    existingVisitsDeleted = deleted.count;
    existingKeys = new Set();
  }

  const issues: ImportRowIssue[] = [];
  const preview: ImportPreviewRow[] = [];
  const toCreate: {
    index: number;
    input: CreateVisitInput;
    key: string;
  }[] = [];

  const batchKeys = new Set<string>();
  let duplicatesSkipped = 0;

  for (let index = 0; index < rows.length; index++) {
    const row = rows[index]!;
    const resolved = await resolveRowToCreateInput(row, countryByCode, cityLookup);
    if ("error" in resolved) {
      issues.push({ index, message: resolved.error });
      preview.push({
        index,
        visitedAt: row.visitedAt,
        countryCode: row.country?.code ?? null,
        cityName: row.city?.name ?? null,
        notes: row.notes ?? null,
        status: "error",
      });
      continue;
    }

    const key = dedupeKey(resolved.countryId, resolved.cityId, row.visitedAt);

    if (existingKeys.has(key) || batchKeys.has(key)) {
      duplicatesSkipped++;
      issues.push({
        index,
        message: "Duplicate visit (same country, city, and date already exists)",
      });
      preview.push({
        index,
        visitedAt: row.visitedAt,
        countryCode: row.country?.code ?? null,
        cityName: row.city?.name ?? null,
        notes: row.notes ?? null,
        status: "duplicate",
      });
      continue;
    }

    batchKeys.add(key);
    preview.push({
      index,
      visitedAt: row.visitedAt,
      countryCode: row.country?.code ?? null,
      cityName: row.city?.name ?? null,
      notes: row.notes ?? null,
      status: "ready",
    });
    toCreate.push({ index, input: resolved.input, key });
  }

  if (options.dryRun) {
    return {
      dryRun: true,
      mergeMode: options.mergeMode,
      totalRows: rows.length,
      created: 0,
      skipped: issues.length,
      duplicatesSkipped,
      existingVisitsDeleted:
        options.mergeMode === "replace" ? existingCount : undefined,
      issues,
      preview,
    };
  }

  const { createVisit } = await import("@/features/visits");

  let created = 0;
  const appliedKeys = new Set(existingKeys);

  for (const item of toCreate) {
    if (appliedKeys.has(item.key)) {
      duplicatesSkipped++;
      issues.push({
        index: item.index,
        message: "Duplicate visit (same country, city, and date already exists)",
      });
      continue;
    }

    try {
      await createVisit(userId, item.input);
      appliedKeys.add(item.key);
      created++;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not create visit";
      issues.push({ index: item.index, message });
    }
  }

  return {
    dryRun: false,
    mergeMode: options.mergeMode,
    totalRows: rows.length,
    created,
    skipped: rows.length - created,
    duplicatesSkipped,
    existingVisitsDeleted:
      options.mergeMode === "replace" ? existingVisitsDeleted : undefined,
    issues,
  };
}
