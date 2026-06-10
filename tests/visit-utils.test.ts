import assert from "node:assert/strict";
import test from "node:test";
import { computeMonthStreak } from "../src/features/visits/insights";
import { mapVisitDates } from "../src/lib/serialize-visit";

test("mapVisitDates serializes Date fields and preserves other values", () => {
  const result = mapVisitDates({
    id: "visit-1",
    visitedAt: new Date("2024-01-02T00:00:00.000Z"),
    createdAt: new Date("2024-01-03T00:00:00.000Z"),
    updatedAt: "2024-01-04T00:00:00.000Z",
  });

  assert.deepEqual(result, {
    id: "visit-1",
    visitedAt: "2024-01-02T00:00:00.000Z",
    createdAt: "2024-01-03T00:00:00.000Z",
    updatedAt: "2024-01-04T00:00:00.000Z",
  });
});

test("computeMonthStreak counts consecutive months through the current month", () => {
  const streak = computeMonthStreak(
    [
      new Date(2026, 2, 10),
      new Date(2026, 3, 5),
      new Date(2026, 4, 20),
      new Date(2026, 5, 1),
    ],
    new Date(2026, 5, 10)
  );

  assert.equal(streak, 4);
});

test("computeMonthStreak may end in the previous month", () => {
  const streak = computeMonthStreak(
    [new Date(2026, 2, 10), new Date(2026, 3, 5), new Date(2026, 4, 20)],
    new Date(2026, 5, 10)
  );

  assert.equal(streak, 3);
});
