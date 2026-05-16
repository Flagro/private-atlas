import { z } from "zod";

const productionSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  AUTH_SECRET: z.string().min(1, "AUTH_SECRET is required"),
});

/**
 * Validates required server secrets when NODE_ENV=production.
 * Called from instrumentation on Node.js startup (see root `instrumentation.ts`).
 */
export function assertProductionEnv(): void {
  if (process.env.NODE_ENV !== "production") {
    return;
  }

  const result = productionSchema.safeParse(process.env);
  if (!result.success) {
    const msg = result.error.issues
      .map((e) => `${e.path.join(".")}: ${e.message}`)
      .join("; ");
    console.error("[env] Production configuration invalid:", msg);
    throw new Error(
      `Missing or invalid environment variables for production: ${msg}`
    );
  }
}
