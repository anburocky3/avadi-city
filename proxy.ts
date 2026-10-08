import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import type { Role } from "@/types/auth";

// ---------------------------------------------------------------------------
// Secret for edge-compatible JWT verification (same key as lib/auth.ts)
// ---------------------------------------------------------------------------
const SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET || "fallback-secret-key-for-local-dev-only",
);

// ---------------------------------------------------------------------------
// Lightweight session extractor for edge runtime
// ---------------------------------------------------------------------------
interface EdgeSession {
  userId: string;
  role: Role;
  wardNumber: number;
}

async function getEdgeSession(req: NextRequest): Promise<EdgeSession | null> {
  const token = req.cookies.get("avadi_session")?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);

    console.log("JWT payload:", payload);
    return {
      userId: payload.userId as string,
      role: (payload.role as Role) ?? "USER",
      wardNumber: (payload.wardNumber as number) ?? 0,
    };
  } catch (error) {
    console.log("JWT verification failed:", error);
    return null; // Expired or tampered
  }
}

// ---------------------------------------------------------------------------
// Middleware entry point
// ---------------------------------------------------------------------------
export function proxy(req: NextRequest) {
  return handleProxy(req);
}

async function handleProxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Skip system files, Next.js internals, static assets, and API routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Normalize path by stripping trailing slashes for clean matching
  const cleanPath =
    pathname.length > 1 && pathname.endsWith("/")
      ? pathname.replace(/\/+$/, "")
      : pathname;

  // 2. Resolve session (lightweight edge-compatible JWT check)
  const session = await getEdgeSession(req);

  // 3. Redirect legacy /super-admin to /admin/super-admin
  if (cleanPath === "/super-admin" || cleanPath.startsWith("/super-admin/")) {
    return NextResponse.redirect(new URL("/admin/super-admin", req.url));
  }

  // 4. Dedicated Admin Login handling (/admin/login)
  if (cleanPath === "/admin/login") {
    // If an administrator is already logged in, redirect them to their dashboard
    if (session) {
      if (session.role === "SUPER_ADMIN") {
        return NextResponse.redirect(new URL("/admin/super-admin", req.url));
      }
      if (session.role === "ADMIN") {
        return NextResponse.redirect(new URL("/admin/dashboard", req.url));
      }
    }
    // Allow unauthenticated guests and standard citizens to view the admin login page
    return NextResponse.next();
  }

  // 5. Root /admin redirect to /admin/dashboard or /admin/super-admin
  if (cleanPath === "/admin") {
    if (!session) {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }
    if (session.role === "SUPER_ADMIN") {
      return NextResponse.redirect(new URL("/admin/super-admin", req.url));
    }
    if (session.role === "ADMIN") {
      return NextResponse.redirect(new URL("/admin/dashboard", req.url));
    }
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // 6. Admin portal routes (/admin/dashboard, /admin/complaints, /admin/super-admin, etc.)
  if (cleanPath.startsWith("/admin")) {
    // Unauthenticated -> bounce to dedicated admin login
    if (!session) {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }

    // Normal citizens have no admin permissions -> redirect to citizen dashboard
    if (session.role === "USER") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // Super Admin route requires SUPER_ADMIN role
    if (
      cleanPath.startsWith("/admin/super-admin") &&
      session.role !== "SUPER_ADMIN"
    ) {
      return NextResponse.redirect(new URL("/admin/dashboard", req.url));
    }

    // Authorized admin user
    const response = NextResponse.next();
    response.headers.set("x-user-role", session.role);
    response.headers.set("x-user-id", session.userId);
    return response;
  }

  // 7. Public/Citizen auth routes (/login, /get-started, /forgot-password)
  const isCitizenAuthRoute =
    cleanPath.startsWith("/login") ||
    cleanPath.startsWith("/get-started") ||
    cleanPath.startsWith("/forgot-password");

  if (session && isCitizenAuthRoute) {
    if (session.role === "SUPER_ADMIN") {
      return NextResponse.redirect(new URL("/admin/super-admin", req.url));
    }
    if (session.role === "ADMIN") {
      return NextResponse.redirect(new URL("/admin/dashboard", req.url));
    }
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // 8. Protected Citizen routes
  const isCitizenProtectedRoute =
    cleanPath.startsWith("/dashboard") ||
    cleanPath.startsWith("/complaints") ||
    cleanPath.startsWith("/feed") ||
    cleanPath.startsWith("/profile");

  if (!session && isCitizenProtectedRoute) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // 9. Inject headers for all other authenticated requests
  const response = NextResponse.next();
  if (session) {
    response.headers.set("x-user-role", session.role);
    response.headers.set("x-user-id", session.userId);
  }

  return response;
}

// Config matcher ensures it only runs on page routes, skipping asset overhead
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
