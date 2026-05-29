import { z } from "zod";
import { MAX_IMPORT_VISITS } from "@/constants/visits";

const CONTROL_CHARS = /[\x00-\x08\x0b\x0c\x0e-\x1f]/;

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

/** Normalizes export ISO timestamps to YYYY-MM-DD for visit rows. */
export const importVisitedAtSchema = z
  .string()
  .trim()
  .min(10)
  .max(40)
  .transform((raw) => {
    const datePart = raw.includes("T") ? raw.slice(0, 10) : raw.slice(0, 10);
    return datePart;
  })
  .refine((val) => /^\d{4}-\d{2}-\d{2}$/.test(val), "Expected YYYY-MM-DD date")
  .refine((val) => parseStrictDateOnly(val) !== null, "Invalid calendar date")
  .refine((val) => {
    const date = parseStrictDateOnly(val);
    if (!date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date <= today;
  }, "Visit date cannot be in the future");

const safeNotes = z
  .string()
  .trim()
  .max(1000)
  .refine((s) => !CONTROL_CHARS.test(s), "Notes contain invalid characters")
  .optional()
  .nullable()
  .transform((v) => (v === "" || v == null ? undefined : v));

/** Only ISO alpha-2 codes; names from file are ignored for matching. */
const importCountrySchema = z
  .object({
    code: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z]{2}$/, "Country code must be ISO 3166-1 alpha-2"),
    name: z.string().max(200).optional(),
  })
  .strip();

/** City resolved by canonical DB name under the country; lat/lng in file are ignored. */
const importCitySchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1)
      .max(120)
      .refine((s) => !CONTROL_CHARS.test(s), "City name contains invalid characters"),
    lat: z.number().optional(),
    lng: z.number().optional(),
  })
  .strip();

export const visitImportRowSchema = z
  .object({
    /** Ignored on import — never written to the database */
    id: z.string().max(64).optional(),
    visitedAt: importVisitedAtSchema,
    notes: safeNotes,
    country: importCountrySchema.nullable().optional(),
    city: importCitySchema.nullable().optional(),
  })
  .strip()
  .refine((row) => row.country?.code || row.city?.name, {
    message: "Each visit needs a country code or city name",
  });

export const visitImportFileSchema = z
  .object({
    exportedAt: z.string().trim().max(50).optional(),
    visits: z.array(visitImportRowSchema).min(1).max(MAX_IMPORT_VISITS),
  })
  .strip();

export const importMergeModeSchema = z.enum(["add", "replace"]);

export type VisitImportRow = z.infer<typeof visitImportRowSchema>;
export type VisitImportFile = z.infer<typeof visitImportFileSchema>;
export type ImportMergeMode = z.infer<typeof importMergeModeSchema>;
