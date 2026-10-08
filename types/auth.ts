/**
 * Centralized authentication and authorization types.
 *
 * These types are the single source of truth for role definitions,
 * session shapes, and authorization result types used across:
 *   - JWT token signing/verification (lib/auth.ts)
 *   - RBAC guard utilities (lib/rbac.ts)
 *   - Edge middleware (proxy.ts)
 *   - Server Actions and API routes
 */

// ---------------------------------------------------------------------------
// Role definitions
// ---------------------------------------------------------------------------

/**
 * Mirrors the Prisma `Role` enum.
 * Kept as a separate TS type so edge/middleware code can use it without
 * importing the heavy Prisma client.
 */
export type Role = "SUPER_ADMIN" | "ADMIN" | "USER";

/**
 * Numeric weight for role hierarchy comparisons.
 * Higher number = more privileged.
 */
export const ROLE_HIERARCHY: Record<Role, number> = {
  USER: 0,
  ADMIN: 1,
  SUPER_ADMIN: 2,
} as const;

/**
 * Returns true if `userRole` is at least as privileged as `requiredRole`.
 */
export function hasMinimumRole(userRole?: Role | null, requiredRole: Role = "USER"): boolean {
  const currentWeight = userRole ? (ROLE_HIERARCHY[userRole] ?? 0) : 0;
  const targetWeight = ROLE_HIERARCHY[requiredRole] ?? 0;
  return currentWeight >= targetWeight;
}

// ---------------------------------------------------------------------------
// Session types
// ---------------------------------------------------------------------------

/**
 * Shape of the JWT payload stored in the `avadi_session` cookie.
 * This is the contract between sign and verify — every field here
 * is embedded in the token and available without a DB round-trip.
 */
export interface AuthSession {
  userId: string;
  email: string;
  name: string;
  wardNumber: number;
  role: Role;
}

// ---------------------------------------------------------------------------
// Authorization result types
// ---------------------------------------------------------------------------

/** Returned by guard utilities to communicate success/failure. */
export type AuthResult<T = AuthSession> =
  | { authorized: true; session: T }
  | { authorized: false; reason: string; status: 401 | 403 };
