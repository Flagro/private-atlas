import { randomUUID } from "node:crypto";

export type JsonLogLine = {
  ts: string;
  level: "error" | "warn" | "info";
  event: string;
  /** Unique id for a single error occurrence; include in API 500 bodies when applicable */
  correlationId?: string;
  requestId?: string;
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

type ApiHandlerArgs = unknown[];

/** Logs API completion metadata without recording URLs, query values, bodies, or user data. */
export function withApiLogging<TRequest extends Request, TArgs extends ApiHandlerArgs>(
  route: string,
  handler: (request: TRequest, ...args: TArgs) => Response | Promise<Response>
) {
  return async (request: TRequest, ...args: TArgs): Promise<Response> => {
    const startedAt = performance.now();
    const incomingId = request.headers.get("x-request-id");
    const requestId =
      incomingId && /^[A-Za-z0-9._-]{1,100}$/.test(incomingId)
        ? incomingId
        : randomUUID();
    let status = 500;

    try {
      const response = await handler(request, ...args);
      status = response.status;
      try {
        response.headers.set("x-request-id", requestId);
        return response;
      } catch {
        const headers = new Headers(response.headers);
        headers.set("x-request-id", requestId);
        return new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers,
        });
      }
    } finally {
      logStructured({
        level: status >= 500 ? "error" : status >= 400 ? "warn" : "info",
        event: "api.request",
        requestId,
        route,
        method: request.method,
        status,
        durationMs: Math.round((performance.now() - startedAt) * 10) / 10,
      });
    }
  };
}
