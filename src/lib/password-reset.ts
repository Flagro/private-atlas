import { createHash, randomBytes } from "node:crypto";

const RESET_TOKEN_BYTES = 32;
const RESET_TTL_MS = 60 * 60 * 1000; // 1 hour

export function createPasswordResetToken(): { token: string; tokenHash: string; expiresAt: Date } {
  const token = randomBytes(RESET_TOKEN_BYTES).toString("base64url");
  const tokenHash = hashResetToken(token);
  const expiresAt = new Date(Date.now() + RESET_TTL_MS);
  return { token, tokenHash, expiresAt };
}

export function hashResetToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function buildResetPasswordUrl(token: string): string {
  const base =
    process.env.AUTH_URL?.trim() ||
    process.env.NEXTAUTH_URL?.trim() ||
    "http://localhost:3000";
  const url = new URL("/reset-password", base.replace(/\/$/, ""));
  url.searchParams.set("token", token);
  return url.toString();
}
