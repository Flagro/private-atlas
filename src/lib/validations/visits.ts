import { z } from "zod";

function parseStrictDateOnly(value: string): Date | null {
  const [yearString, monthString, dayString] = value.split("-");
  const year = Number(yearString);
  const month = Number(monthString);
  const day = Number(dayString);

  const parsed = new Date(year, month - 1, day);
  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return null;
  }

  parsed.setHours(0, 0, 0, 0);
  return parsed;
}

const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD format")
  .refine((val) => parseStrictDateOnly(val) !== null, "Invalid calendar date")
  .refine((val) => {
    const date = parseStrictDateOnly(val);
    if (!date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date <= today;
  }, "Visit date cannot be in the future");

const notes = z.string().trim().max(1000).optional();

export const createVisitSchema = z
  .object({
    countryId: z.string().min(1).optional(),
    cityId: z.string().min(1).optional(),
    visitedAt: dateString,
    notes,
  })
  .refine((data) => data.countryId || data.cityId, {
    message: "At least a country or city must be selected",
  });

export const updateVisitSchema = z.object({
  countryId: z.string().min(1).nullable().optional(),
  cityId: z.string().min(1).nullable().optional(),
  visitedAt: dateString.optional(),
  notes: notes.nullable(),
});

export type CreateVisitInput = z.infer<typeof createVisitSchema>;
export type UpdateVisitInput = z.infer<typeof updateVisitSchema>;
