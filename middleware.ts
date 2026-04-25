import { NextResponse } from "next/server";
import { auth } from "@/auth";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isAuthPage =
    req.nextUrl.pathname.startsWith("/login") ||
    req.nextUrl.pathname.startsWith("/register");

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
  matcher: ["/dashboard/:path*", "/login", "/register"],
};
