import { z } from "zod";

const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD format")
  .refine((val) => {
    const date = new Date(val);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return !isNaN(date.getTime()) && date <= today;
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
