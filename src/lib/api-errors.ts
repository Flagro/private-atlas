import { NextResponse } from "next/server";
import { logApiUnexpected } from "@/lib/logger";

/** Machine-readable codes for API clients; keep lowercase snake via SCREAMING const names mapped to stable strings */
export const ApiErrorCode = {
  UNAUTHORIZED: "UNAUTHORIZED",
  INVALID_JSON: "INVALID_JSON",
  VALIDATION_FAILED: "VALIDATION_FAILED",
  NOT_FOUND: "NOT_FOUND",
  CONFLICT: "CONFLICT",
  INVALID_VISIT_PLACE: "INVALID_VISIT_PLACE",
  INTERNAL: "INTERNAL",
  MISSING_QUERY: "MISSING_QUERY",
  UNKNOWN: "UNKNOWN",
  RATE_LIMITED: "RATE_LIMITED",
} as const;

export type ApiErrorCodeType = (typeof ApiErrorCode)[keyof typeof ApiErrorCode];

export type ApiProblem = {
  message: string;
  code: ApiErrorCodeType;
  details?: unknown;
  /** Present on some 500 responses for support correlation (safe to show users) */
  correlationId?: string;
};

export function problemResponse(problem: ApiProblem, status: number) {
  return NextResponse.json({ error: problem }, { status });
}

/** Parses JSON error envelopes from fetch (new shape + legacy `error` string). */
export function messageFromUnknownApiBody(body: unknown): string | null {
  if (!body || typeof body !== "object") return null;
  const o = body as Record<string, unknown>;
  const err = o.error;
  if (err && typeof err === "object" && typeof (err as ApiProblem).message === "string") {
    return (err as ApiProblem).message;
  }
  if (typeof o.error === "string") return o.error;
  if (typeof o.message === "string") return o.message;
  return null;
}

export function fallbackMessage(body: unknown, fallback = "Something went wrong") {
  return messageFromUnknownApiBody(body) ?? fallback;
}

/** Appends a short ref suffix when the API returned `error.correlationId` (e.g. 500 responses). */
export function correlationSuffixFromApiBody(body: unknown): string {
  if (!body || typeof body !== "object") return "";
  const err = (body as { error?: unknown }).error;
  if (!err || typeof err !== "object") return "";
  const id = (err as { correlationId?: unknown }).correlationId;
  if (typeof id !== "string" || id.length === 0) return "";
  return ` (ref: ${id})`;
}

/** 500 handlers: never expose stack/ORM details in production. Always log server-side. */
export function problemUnexpected(
  err: unknown,
  logLabel = "unexpected"
): ReturnType<typeof problemResponse> {
  const correlationId = logApiUnexpected(logLabel, err);
  const isProd = process.env.NODE_ENV === "production";
  if (isProd) {
    return problemResponse(
      {
        message:
          "Something went wrong on our side. Please try again in a moment.",
        code: ApiErrorCode.INTERNAL,
        correlationId,
      },
      500
    );
  }
  const detail =
    err instanceof Error ? err.message : typeof err === "string" ? err : "Unknown error";
  return problemResponse(
    { message: detail, code: ApiErrorCode.INTERNAL, correlationId },
    500
  );
}
