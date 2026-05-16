import { randomUUID } from "node:crypto";

export type JsonLogLine = {
  ts: string;
  level: "error" | "warn" | "info";
  event: string;
  /** Unique id for a single error occurrence; include in API 500 bodies when applicable */
  correlationId: string;
} & Record<string, unknown>;

export function logStructured(line: Omit<JsonLogLine, "ts"> & Partial<Pick<JsonLogLine, "ts">>) {
  const row: JsonLogLine = {
    ts: new Date().toISOString(),
    ...line,
  };
  console.log(JSON.stringify(row));
}

/**
 * Logs an unexpected API error as one JSON line. Returns correlationId for client/support.
 */
export function logApiUnexpected(scope: string, err: unknown): string {
  const correlationId = randomUUID();
  const error =
    err instanceof Error
      ? { name: err.name, message: err.message, stack: err.stack }
      : { kind: typeof err, value: err };

  logStructured({
    level: "error",
    event: "api.unexpected",
    correlationId,
    scope,
    error,
  });

  return correlationId;
}
