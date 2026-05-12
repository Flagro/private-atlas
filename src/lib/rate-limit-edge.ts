import { NextResponse, type NextRequest } from "next/server";
import {
  ApiErrorCode,
  problemResponse,
} from "@/lib/api-errors";

/** Sliding timestamps per Edge isolate (resets cold starts; combine with Redis/Upstash at scale). */

const g = globalThis as typeof globalThis & {
  __privateAtlasRateBuckets?: Map<string, number[]>;
};

if (!g.__privateAtlasRateBuckets) {
  g.__privateAtlasRateBuckets = new Map<string, number[]>();
}

const buckets = g.__privateAtlasRateBuckets;

function pruneTimestamps(times: number[], now: number, windowMs: number) {
  return times.filter((t) => now - t < windowMs);
}

/** Returns ok when allowed; sliding window rejects without recording the hit. */
function allowSliding(
  compositeKey: string,
  limit: number,
  windowMs: number
): { ok: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  let entries = pruneTimestamps(buckets.get(compositeKey) ?? [], now, windowMs);
  if (entries.length >= limit) {
    const oldest = entries[0]!;
    const retryMs = Math.max(1000, windowMs - (now - oldest));
    return { ok: false, retryAfterSeconds: Math.ceil(retryMs / 1000) };
  }
  entries = [...entries, now];
  buckets.set(compositeKey, entries);
  return { ok: true, retryAfterSeconds: 0 };
}

export function clientIp(req: NextRequest): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first)
      return first;
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp?.trim())
    return realIp.trim();
  return "unknown";
}

const REGISTER_LIMIT = 8;
const REGISTER_WINDOW_MS = 60 * 60 * 1000;

const CREDENTIALS_LIMIT = 40;
const CREDENTIALS_WINDOW_MS = 15 * 60 * 1000;

/** Other Auth.js POSTs (CSRF/session/OAuth redirects) — generous but bounded */
const GENERAL_AUTH_POST_LIMIT = 180;
const GENERAL_AUTH_POST_WINDOW_MS = 60 * 1000;

/**
 * Early return 429 JSON for abusive POST bursts on `/api/auth/*`.
 * Prefer running before heavier NextAuth/session work where possible (outer middleware wrapper).
 */
export function enforceAuthApiRateLimit(req: NextRequest): NextResponse | null {
  if (!req.nextUrl.pathname.startsWith("/api/auth"))
    return null;
  if (req.method !== "POST")
    return null;

  const ip = clientIp(req);
  const path = req.nextUrl.pathname;
  let label: string;
  let limit: number;
  let windowMs: number;

  if (path === "/api/auth/register") {
    label = "register";
    limit = REGISTER_LIMIT;
    windowMs = REGISTER_WINDOW_MS;
  } else if (path.includes("credentials")) {
    label = "credentials";
    limit = CREDENTIALS_LIMIT;
    windowMs = CREDENTIALS_WINDOW_MS;
  } else {
    label = "auth_post";
    limit = GENERAL_AUTH_POST_LIMIT;
    windowMs = GENERAL_AUTH_POST_WINDOW_MS;
  }

  const key = `${ip}:${label}`;
  const { ok, retryAfterSeconds } = allowSliding(key, limit, windowMs);
  if (ok)
    return null;

  const res = problemResponse(
    {
      message:
        "Too many requests. Please wait briefly and try again.",
      code: ApiErrorCode.RATE_LIMITED,
    },
    429
  );
  res.headers.set("Retry-After", String(retryAfterSeconds));
  return res;
}
