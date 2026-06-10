import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/auth";
import { enforceAuthApiRateLimit } from "@/lib/rate-limit-edge";

export default auth((req) => {
  const limited = enforceAuthApiRateLimit(req as NextRequest);
  if (limited) return limited;

  const isLoggedIn = !!req.auth;
  const isAuthPage =
    req.nextUrl.pathname.startsWith("/login") ||
    req.nextUrl.pathname.startsWith("/register") ||
    req.nextUrl.pathname.startsWith("/forgot-password") ||
    req.nextUrl.pathname.startsWith("/reset-password");

  if (isAuthPage && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  if (
    !isAuthPage &&
    !isLoggedIn &&
    req.nextUrl.pathname.startsWith("/dashboard")
  ) {
    const login = new URL("/login", req.url);
    const destination = `${req.nextUrl.pathname}${req.nextUrl.search}`;
    login.searchParams.set("callbackUrl", destination);
    return NextResponse.redirect(login);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/api/auth/:path*",
  ],
};
