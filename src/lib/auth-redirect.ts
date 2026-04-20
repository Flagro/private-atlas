const DEFAULT_LOGIN_REDIRECT = "/dashboard";

/**
 * Restricts open redirects: only same-origin paths under /dashboard.
 */
export function sanitizePostLoginRedirect(
  callbackUrl: string | null | undefined
): string {
  if (!callbackUrl || typeof callbackUrl !== "string") {
    return DEFAULT_LOGIN_REDIRECT;
  }
  const path = callbackUrl.trim();
  if (!path.startsWith("/") || path.startsWith("//")) {
    return DEFAULT_LOGIN_REDIRECT;
  }
  if (path.includes("://")) {
    return DEFAULT_LOGIN_REDIRECT;
  }
  if (path === "/dashboard" || path.startsWith("/dashboard/")) {
    return path;
  }
  return DEFAULT_LOGIN_REDIRECT;
}
