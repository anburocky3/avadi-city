import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const session = req.cookies.get("avadi_session")?.value;

  // 1. Skip system files, Next.js internals, static assets, and API routes to avoid loops
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // 2. Prevent logged-in users from visiting guest-only pages (/login or /get-started)
  const isAuthRoute =
    pathname.startsWith("/login") || pathname.startsWith("/get-started");
  if (session && isAuthRoute) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // 3. Protect private routes (/dashboard) from unauthenticated users
  const isProtectedRoute = pathname.startsWith("/dashboard");
  if (!session && isProtectedRoute) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

// Config matcher ensures it only runs on page routes, skipping asset overhead
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
