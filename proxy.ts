import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyAuthToken } from "@/lib/auth";

// Define your public guest routes
const guestRoutes = ["/", "/credits", "/contact", "/login", "/get-started"];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Check if the requested path matches any guest route exactly or starts with it
  const isGuestRoute = guestRoutes.some(
    (route) =>
      pathname === route || (route !== "/" && pathname.startsWith(`${route}/`)),
  );

  // 2. Retrieve session token from HTTP-only cookies
  const token = req.cookies.get("avadi_session")?.value;
  const session = token ? await verifyAuthToken(token) : null;

  // 3. ZERO-FLICKER GUARD: If accessing a protected route without a valid session -> redirect to /login
  if (!isGuestRoute && !session) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname); // Save intended destination
    return NextResponse.redirect(loginUrl);
  }

  // 4. If logged-in user tries to visit the login/login page -> redirect to /feed
  if (pathname.startsWith("/login") && session) {
    return NextResponse.redirect(new URL("/feed", req.url));
  }

  return NextResponse.next();
}

// Ensure middleware only runs on page routes, skipping Next.js static assets, images, and APIs
export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|certificates|img|.*\\..*).*)",
  ],
};
