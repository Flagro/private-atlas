import { NextResponse } from "next/server";

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
} as const;

export type ApiErrorCodeType = (typeof ApiErrorCode)[keyof typeof ApiErrorCode];

export type ApiProblem = {
  message: string;
  code: ApiErrorCodeType;
  details?: unknown;
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
