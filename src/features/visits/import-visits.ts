import { prisma } from "@/lib/db";
import { NUMERIC_TO_ALPHA2 } from "@/lib/iso-codes";
import type { VisitImportRow } from "@/lib/validations/visit-import";
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
};

export type ImportVisitsResult = {
  dryRun: boolean;
  totalRows: number;
  created: number;
  skipped: number;
  issues: ImportRowIssue[];
  preview?: ImportPreviewRow[];
};

async function resolveRowToCreateInput(
  row: VisitImportRow,
  countryByCode: Map<string, { id: string }>,
  cityLookup: Map<string, string>
): Promise<{ input: CreateVisitInput } | { error: string }> {
  let countryId: string | undefined;
  let cityId: string | undefined;

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
  };
}

/**
 * Imports validated visit rows. Uses Prisma only (parameterized queries).
 * Never trusts file ids, names for country matching, or coordinates for place resolution.
 */
export async function importVisitsForUser(
  userId: string,
  rows: VisitImportRow[],
  options: { dryRun: boolean }
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
  const cityNamesLower = new Set(
    rows
      .filter((r) => r.city?.name && r.country?.code)
      .map((r) => r.city!.name.toLowerCase())
  );

  const cities =
    countryIds.length > 0 && cityNamesLower.size > 0
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

  const issues: ImportRowIssue[] = [];
  const preview: ImportPreviewRow[] = [];
  const toCreate: { index: number; input: CreateVisitInput }[] = [];

  for (let index = 0; index < rows.length; index++) {
    const row = rows[index]!;
    const resolved = await resolveRowToCreateInput(row, countryByCode, cityLookup);
    if ("error" in resolved) {
      issues.push({ index, message: resolved.error });
      continue;
    }

    preview.push({
      index,
      visitedAt: row.visitedAt,
      countryCode: row.country?.code ?? null,
      cityName: row.city?.name ?? null,
      notes: row.notes ?? null,
    });
    toCreate.push({ index, input: resolved.input });
  }

  if (options.dryRun) {
    return {
      dryRun: true,
      totalRows: rows.length,
      created: 0,
      skipped: issues.length,
      issues,
      preview,
    };
  }

  const { createVisit } = await import("@/features/visits");

  let created = 0;
  for (const item of toCreate) {
    try {
      await createVisit(userId, item.input);
      created++;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not create visit";
      issues.push({ index: item.index, message });
    }
  }

  return {
    dryRun: false,
    totalRows: rows.length,
    created,
    skipped: rows.length - created,
    issues,
  };
}
