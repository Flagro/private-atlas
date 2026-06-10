import assert from "node:assert/strict";
import test from "node:test";
import {
  importVisitedAtSchema,
  visitImportRowSchema,
} from "../src/lib/validations/visit-import";
import {
  createVisitSchema,
  updateVisitSchema,
} from "../src/lib/validations/visits";

test("create visit requires a place and a valid non-future date", () => {
  assert.equal(
    createVisitSchema.safeParse({ visitedAt: "2024-02-29" }).success,
    false
  );
  assert.equal(
    createVisitSchema.safeParse({ countryId: "country-1", visitedAt: "2024-02-30" })
      .success,
    false
  );
  assert.equal(
    createVisitSchema.safeParse({ countryId: "country-1", visitedAt: "2024-02-29" })
      .success,
    true
  );
});

test("update visit accepts explicit null place fields", () => {
  const result = updateVisitSchema.safeParse({ countryId: null, cityId: null });
  assert.equal(result.success, true);
});

test("import dates normalize exported ISO timestamps", () => {
  assert.equal(
    importVisitedAtSchema.parse("2024-03-12T18:30:00.000Z"),
    "2024-03-12"
  );
});

test("import rows normalize country codes and discard untrusted fields", () => {
  const row = visitImportRowSchema.parse({
    id: "external-id",
    visitedAt: "2024-03-12",
    country: { code: "es", name: "Ignored", unexpected: true },
    city: { name: " Madrid ", lat: 1, lng: 2, unexpected: true },
    unexpected: true,
  });

  assert.equal(row.country?.code, "ES");
  assert.equal(row.city?.name, "Madrid");
  assert.equal("unexpected" in row, false);
  assert.equal("unexpected" in (row.country ?? {}), false);
});
